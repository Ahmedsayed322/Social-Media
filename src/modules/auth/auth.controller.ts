import { NextFunction, RequestHandler, Router } from 'express';
import {
  addFriendValidation,
  emailValidation,
  gmailAuthValidator,
  loginValidation,
  otpValidation,
  removeFromGalleryValidation,
  resendOTPValidation,
  resetPasswordValidation,
  signupValidation,
  updatePasswordValidation,
} from './auth.validation';
import { Request, Response } from 'express';
import authService from './auth.service';
import { successfulResponse } from '../../common/utils/response/successResponse';
import auth from '../../common/middlewares/authentication/authentication';
import multerCloud from '../../common/middlewares/upload/multer.cloud';
import Validator from '../../common/middlewares/validator/validator';
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
  auth.authenticate,
  Validator(updatePasswordValidation),
  async (req: Request, res: Response) => {
    await authServiceInst.updatePassword(req);
    return successfulResponse(res, 200, 'passwords has been updated');
  },
);
router.delete(
  '/logout',
  auth.authenticate,
  async (req: Request, res: Response) => {
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
router.post(
  '/re-send-otp',
  Validator(resendOTPValidation),
  async (req: Request, res: Response, next: NextFunction) => {
    await authServiceInst.reSendOtp(req);

    return successfulResponse(res, 200, 'otp re-sent successfully');
  },
);
router.post(
  '/friends/:id',
  auth.authenticate,
  Validator(addFriendValidation),
  async (req: Request, res: Response) => {
    const result = await authServiceInst.addFriend(req);
    return successfulResponse(res, 200, 'friend added successfully', result);
  },
);
router.post(
  '/upload/pfp',
  auth.authenticate,
  async (req: Request, res: Response) => {
    const url = await authServiceInst.uploadProfilePicture(req);
    return successfulResponse(
      res,
      200,
      'profile picture uploaded successfully',
      {
        url,
      },
    );
  },
);
router.post(
  '/upload/gallery',
  auth.authenticate,
  multerCloud(false).array('gallery'),
  async (req: Request, res: Response) => {
    const url = await authServiceInst.uploadGallery(req);
    return successfulResponse(
      res,
      200,
      'profile picture uploaded successfully',
      {
        url,
      },
    );
  },
);
router.delete(
  '/delete/gallery',
  auth.authenticate,
  Validator(removeFromGalleryValidation),
  async (req: Request, res: Response) => {
    await authServiceInst.removeFileFromGallery(req);
    return successfulResponse(
      res,
      200,
      'file removed from gallery successfully',
    );
  },
);

export default router;
