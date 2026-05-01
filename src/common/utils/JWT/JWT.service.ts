import jsonwebtoken, { TokenExpiredError } from 'jsonwebtoken';
import env from '../../../config/config.service';
import { IEnv } from '../../../config/env.type';
import { Types } from 'mongoose';
import { ApiError } from '../ApiError/ApiError';
import { TokenPayload } from '../../../modules/auth/auth.type';

class JwtService {
  constructor(
    private readonly jwt = jsonwebtoken,
    private readonly envVars: IEnv = env,
  ) {}
  generateAccessToken = (
    id: Types.ObjectId,
    email: string,
    jti: string,
  ): string => {
    return this.jwt.sign({ id, email }, this.envVars.JWT_ACCESS_KEY, {
      jwtid: jti,
      expiresIn: '30m',
    });
  };
  generateRefreshToken = (
    id: Types.ObjectId,
    email: string,
    jti: string,
  ): string => {
    return this.jwt.sign({ id, email }, this.envVars.JWT_REFRESH_KEY, {
      jwtid: jti,
      expiresIn: '7d',
    });
  };
  verifyAccessToken = (token: string): TokenPayload => {
    let payload;
    try {
      payload = this.jwt.verify(
        token,
        this.envVars.JWT_ACCESS_KEY,
      ) as TokenPayload;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new ApiError('Access token has expired', 401);
      }
      throw new ApiError('Invalid token payload', 400);
    }
    return payload;
  };
  verifyRefreshToken = (token: string): TokenPayload => {
    let payload;
    try {
      payload = this.jwt.verify(
        token,
        this.envVars.JWT_REFRESH_KEY,
      ) as TokenPayload;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new ApiError('Refresh token has expired', 401);
      }
      throw new ApiError('Invalid token payload', 400);
    }

    return payload;
  };
}

export default new JwtService();
