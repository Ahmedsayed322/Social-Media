import { Request } from 'express';
import BcryptService from '../../common/utils/bcrypt/Bcrypt.service';
import { ApiError } from '../../common/utils/ApiError/ApiError';
import smtpService, { SMTPService } from '../../common/utils/smtp/smtp.service';
import logger from '../../common/utils/logger/logger.service';
import { randomInt, randomUUID } from 'node:crypto';
import { AuthRequest, IUser } from './auth.type';
import env from '../../config/config.service';
import userInstance, { UserRepo } from '../../common/Repository/user.repo';
import JWTService from '../../common/utils/JWT/JWT.service';
import { OAuth2Client } from 'google-auth-library';
import { ProviderEnum } from '../../common/utils/enums/providers.enum';
import { GenderEnum } from '../../common/utils/enums/gender.enum';
import redisService, {
  RedisService,
} from '../../common/service/redis/redis.service';
import { signupDTO } from './auth.Dto';

class AuthService {
  constructor(
    private readonly _userModel: UserRepo,
    private readonly redis: RedisService,
    private readonly smtp: SMTPService,
  ) {}

  idleOperations = async (fn: () => Promise<void> | void) => {
    try {
      await fn();
    } catch (e) {
      logger.error({
        message: `background task failed`,
        error: e,
      });
    }
  };

  generateCredentials = (user: IUser) => {
    const jti = randomUUID();
    const refreshToken = JWTService.generateRefreshToken(
      user._id,
      user.email,
      jti,
    );
    const accessToken = JWTService.generateAccessToken(
      user._id,
      user.email,
      jti,
    );
    return { refreshToken, accessToken };
  };
  generateOtp = async () => {
    const otp = randomInt(100000, 1000000);
    const hashedOtp = await BcryptService.hash(otp.toString());
    return { hashedOtp, otp };
  };

  ///////////////////////////////////////////////
  signup = async (req: Request) => {
    const NODE_ENV = env.NODE_ENV;
    const { email, firstName, lastName, password, gender }: signupDTO =
      req.body;
    const isExist = await this._userModel.checkByEmail(email);
    if (isExist) {
      throw new ApiError('user already exists', 409);
    }
    const { hashedOtp, otp } = await this.generateOtp();

    await Promise.all([
      this.redis.setValue(
        this.redis.createAccountKey(email),
        {
          email,
          firstName,
          lastName,
          password,
          gender,
        },
        { EX: 15 * 60 },
      ),
      this.redis.setValue(this.redis.otpCodeKey(email), hashedOtp, {
        EX: 5 * 60,
      }),
    ]);

    if (NODE_ENV === 'development') {
      logger.info({ otp: otp });
    }
    this.idleOperations(() =>
      this.smtp.sendOTP(email, 'Confirm Email OTP', otp),
    );
  };
  confirmEmail = async (req: Request) => {
    const { email, otp } = req.body;
    const [data, hashedOtp, numOfTries = 0, blockTtl] = await Promise.all([
      this.redis.getValue(this.redis.createAccountKey(email)),
      this.redis.getValue(this.redis.otpCodeKey(email)),
      this.redis.getValue(this.redis.confirmEmailOtpTries(email)),
      this.redis.getTtl(this.redis.blockConfirmEmailOtp(email)),
    ]);
    if (blockTtl && blockTtl > 0) {
      throw new ApiError(
        `you exceeded max tries, try again after ${blockTtl} seconds`,
        400,
      );
    }
    if (!data || !hashedOtp) {
      throw new ApiError('invalid Otp or its expired', 400);
    }
    const isValid = await BcryptService.compare(
      otp.toString(),
      hashedOtp as string,
    );

    if (!isValid) {
      const tries = Number(numOfTries) + 1;
      if (tries >= 3) {
        await this.redis.setValue(
          this.redis.blockConfirmEmailOtp(email),
          true,
          { EX: 60 * 2 },
        );
        await this.redis.deleteKeys([this.redis.confirmEmailOtpTries(email)]);
      } else {
        await this.redis.setValue(
          this.redis.confirmEmailOtpTries(email),
          tries,
          { EX: 60 * 3 },
        );
      }
      throw new ApiError('invalid Otp or its expired', 400);
    }
    await this.redis.deleteKeys([
      this.redis.confirmEmailOtpTries(email),
      this.redis.blockConfirmEmailOtp(email),
    ]);
    const isExist = await this._userModel.checkByEmail(email);
    if (isExist) {
      throw new ApiError('user already exists', 409);
    }
    await this.redis.deleteKeys([
      this.redis.createAccountKey(email),
      this.redis.otpCodeKey(email),
    ]);
    const user = await this._userModel.create(data as IUser);
    const { accessToken, refreshToken } = this.generateCredentials(user);
    return { refreshToken, accessToken };
  };
  reSendOtp = async (req: Request) => {
    const { email } = req.body;
    const resendBlockKey = this.redis.resendOtpBlock(email);
    const [user, blockTtl] = await Promise.all([
      this.redis.getValue(this.redis.createAccountKey(email)),
      this.redis.getTtl(resendBlockKey),
    ]);
    if (!user) {
      throw new ApiError(
        'user not found or signup expired, please create account again',
        404,
      );
    }
    if (blockTtl && blockTtl > 0) {
      throw new ApiError(
        `please wait ${blockTtl} seconds before requesting a new OTP`,
        400,
      );
    }
    const { otp, hashedOtp } = await this.generateOtp();

    await Promise.all([
      this.redis.setValue(this.redis.otpCodeKey(email), hashedOtp, {
        EX: 60 * 5,
      }),
      this.redis.setValue(resendBlockKey, true, { EX: 60 }),
    ]);

    this.idleOperations(() =>
      this.smtp.sendOTP(email, 'Confirm Email OTP', otp),
    );
    if ((env.NODE_ENV = 'development')) {
      logger.info(otp);
    }
  };
  login = async (req: Request) => {
    const { email, password } = req.body;
    const user = await this._userModel.findOne({ email }, { password: 1 });
    if (!user || user.provider === ProviderEnum.Google) {
      throw new ApiError('invalid email or password', 404);
    }
    const isValid = await BcryptService.compare(password, user.password);
    if (!isValid) {
      throw new ApiError('invalid email or password', 404);
    }
    const { accessToken, refreshToken } = this.generateCredentials(user);
    return { accessToken, refreshToken };
  };
  forgetPassword = async (req: Request) => {
    const { email } = req.body;
    const isExist = await this._userModel.checkByEmail(email);
    if (!isExist) {
      throw new ApiError('user does not exist', 404);
    }
    const { hashedOtp, otp } = await this.generateOtp();
    await this.redis.setValue(this.redis.forgetPasswordKey(email), hashedOtp, {
      EX: 5 * 60,
    });
    this.idleOperations(
      async () => await this.smtp.sendOTP(email, 'Forget Password OTP', otp),
    );
    if (env.NODE_ENV === 'development') {
      logger.info({ otp });
    }
  };
  resetPassword = async (req: Request) => {
    const { otp, email, password } = req.body;
    const hashedOtp = await this.redis.getValue(
      this.redis.forgetPasswordKey(email),
    );
    if (!hashedOtp) {
      throw new ApiError('invalid Otp or its expired', 400);
    }
    const user = await this._userModel.findOne({ email });
    if (!user) {
      throw new ApiError('user is not exist', 404);
    }
    const isValid = await BcryptService.compare(otp.toString(), hashedOtp as string);
    if (!isValid) {
      throw new ApiError('invalid Otp or its expired', 400);
    }
    await this._userModel.updateOne(
      { email },
      { password: await BcryptService.hash(password) },
    );
    await this.redis.deleteKeys([this.redis.forgetPasswordKey(email)]);
  };
  updatePassword = async (req: AuthRequest) => {
    const { user } = req;
    const { oldPassword, newPassword } = req.body;
    const userPassword = await this._userModel.findById(user!._id, {
      select: ['+password'],
    });
    if (!userPassword) {
      throw new ApiError('user not found', 404);
    }
    const isValid = await BcryptService.compare(
      oldPassword,
      userPassword.password,
    );
    if (!isValid) {
      throw new ApiError('incorrect password', 400);
    }
    await this._userModel.updateOne(
      { _id: user!._id },
      { password: await BcryptService.hash(newPassword) },
    );
  };
  logout = async (req: AuthRequest) => {
    const { flag } = req.query;
    const { user, decoded } = req;
    if (flag === 'all') {
      user!.changeCredentials = new Date();
      await user!.save();
      await this.redis.deleteKeys(
        await this.redis.getKeys(this.redis.getRevokeTokenKeys(user!._id)),
      );
      return;
    }
    await this.redis.setValue(
      this.redis.revokedTokenKey(user!._id, decoded!.jti as string),
      `${decoded!.jti}`,
      { EX: (decoded!.exp as number) - Math.floor(Date.now() / 1000) },
    );
  };
  authViaGmail = async (req: Request) => {
    const { idToken } = req.body;
    const client = new OAuth2Client();
    let isNew = false;
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email_verified) {
      throw new ApiError('verification error', 403);
    }
    let user = await this._userModel.findOne({
      email: payload.email as string,
    });
    if (!user) {
      user = await this._userModel.create({
        email: payload.email as string,
        provider: ProviderEnum.Google,
        firstName: payload.given_name as string,
        lastName: payload.family_name as string,
        gender: GenderEnum.male,
      });
      isNew = true;
    }
    const { refreshToken, accessToken } = this.generateCredentials(user);
    return { refreshToken, accessToken, isNew };
  };
}
export default new AuthService(userInstance, redisService, smtpService);
