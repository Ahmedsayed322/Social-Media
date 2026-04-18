import { NextFunction, RequestHandler, Router } from 'express';
import Validator from '../../common/middlewares/validator/validator';
import {
  emailValidation,
  gmailAuthValidator,
  loginValidation,
  otpValidation,
  resetPasswordValidation,
  signupValidation,
  updatePasswordValidation,
} from './auth.validation';
import { Request, Response } from 'express';
import authService from './auth.service';
import { successfulResponse } from '../../common/utils/response/successResponse';
import auth from '../../common/middlewares/authentication/authentication';
import { AuthRequest } from './auth.type';
const generateRefreshToken = (res: Response, refreshToken: string) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};
const authServiceInst = authService;
const router = Router();
router.post(
  '/signup',
  Validator(signupValidation),
  async (req: Request, res: Response) => {
    await authServiceInst.signup(req);
    return successfulResponse(res, 200, 'OTP has been sent to Your mail');
  },
);
router.post(
  '/confirm-email',
  Validator(otpValidation),
  async (req: Request, res: Response) => {
    const { accessToken, refreshToken } =
      await authServiceInst.confirmEmail(req);
    generateRefreshToken(res, refreshToken);
    return successfulResponse(res, 200, 'email has been confirmed', {
      accessToken,
    });
  },
);
router.post(
  '/login',
  Validator(loginValidation),
  async (req: Request, res: Response) => {
    const { accessToken, refreshToken } = await authServiceInst.login(req);
    generateRefreshToken(res, refreshToken);
    return successfulResponse(res, 200, 'user logged in', { accessToken });
  },
);
router.post(
  '/forget-password',
  Validator(emailValidation),
  async (req: Request, res: Response) => {
    await authServiceInst.forgetPassword(req);

    return successfulResponse(res, 200, 'OTP has been sent to Your mail');
  },
);
router.patch(
  '/reset-password',
  Validator(resetPasswordValidation),
  async (req: Request, res: Response) => {
    await authServiceInst.resetPassword(req);

    return successfulResponse(res, 200, 'password has been reset successfully');
  },
);
router.patch(
  '/update-password',
  auth.authenticate as RequestHandler,
  Validator(updatePasswordValidation),
  async (req: AuthRequest, res: Response) => {
    await authServiceInst.updatePassword(req);
    return successfulResponse(res, 200, 'passwords has been updated');
  },
);
router.delete(
  '/logout',
  auth.authenticate as RequestHandler,
  async (req: AuthRequest, res: Response) => {
    await authServiceInst.logout(req);
    return successfulResponse(res, 200, 'user logged out');
  },
);
router.post(
  '/gmail',
  Validator(gmailAuthValidator),
  async (req: Request, res: Response, next: NextFunction) => {
    const { accessToken, refreshToken, isNew } =
      await authServiceInst.authViaGmail(req);
    generateRefreshToken(res, refreshToken);
    return successfulResponse(
      res,
      isNew ? 201 : 200,
      isNew ? 'account created' : 'user logged in',
      { accessToken },
    );
  },
);
export default router;
