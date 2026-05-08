import { Types } from 'mongoose';
import { email } from 'zod';

export abstract class RedisKeys {
  createAccountKey = (email: string) => {
    return `create_account::${email}`;
  };
  otpCodeKey = (email: string) => {
    return `Otp::confirm_email::${email}`;
  };
  forgetPasswordKey = (email: string) => {
    return `Otp::forgetPassword::${email}`;
  };
  getRevokeTokenKeys(userId: Types.ObjectId) {
    return `revokeToken::${userId}::*`;
  }
  revokedTokenKey = (userId: Types.ObjectId, jti: string) => {
    return `revokeToken::${userId}::${jti}`;
  };
  confirmEmailOtpTries = (email: string) => {
    return `confirm_email_otp::Tries::${email}`;
  };
  blockConfirmEmailOtp = (email: string) => {
    return `block_confirm_email_otp::Tries::${email}`;
  };
  resendOtpBlock = (email: string) => {
    return `block_re-send_confirm_email_otp::Tries::${email}`;
  };
  fcmKey(userId: Types.ObjectId) {
    return `user::FCM::${userId}`;
  }
}
