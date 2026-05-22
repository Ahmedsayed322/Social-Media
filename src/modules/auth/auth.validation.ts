import * as z from 'zod';
import { GenderEnum } from '../../common/utils/enums/gender.enum';
import { sharedValidation } from '../../common/shared/validation';
export const myProfileValidation = z.object({
  authorization: z.string(),
});
export const signupValidation = {
  body: z
    .strictObject({
      firstName: z
        .string()
        .min(3, 'firstName should be more than 3 and less tha 20')
        .max(20, 'firstName should be more than 3 and less tha 20'),
      lastName: z.string(),
      email: z.email('invalid email'),
      gender: z.enum(
        Object.values(GenderEnum),
        'gender should be male or female',
      ),
      password: sharedValidation.password,
      cPassword: sharedValidation.cPassword,
    })
    .superRefine((args, ctx) => {
      if (args.password !== args.cPassword) {
        console.log('here');
        ctx.addIssue('confirm password should match password');
      }
    }),
};
export const otpValidation = {
  body: z.strictObject({
    email: z.email('invalid email'),
    otp: sharedValidation.otp,
  }),
};
export const loginValidation = {
  body: z.strictObject({
    email: z.email('invalid email'),
    fcmToken: z.string('invalid Token').optional(),
    password: z.string('password is required in type string'),
  }),
};
export const emailValidation = {
  body: z.strictObject({
    email: z.email('invalid email'),
  }),
};
export const resetPasswordValidation = {
  body: z
    .strictObject({
      email: z.email('invalid email'),
      password: sharedValidation.password,
      cPassword: sharedValidation.cPassword,
      otp: sharedValidation.otp,
    })
    .superRefine((args, ctx) => {
      if (args.password !== args.cPassword) {
        console.log('here');
        ctx.addIssue('confirm password should match password');
      }
    }),
};
export const updatePasswordValidation = {
  body: z
    .strictObject({
      oldPassword: z.string(),
      newPassword: sharedValidation.password,
      cPassword: sharedValidation.cPassword,
    })
    .superRefine((args, ctx) => {
      if (args.newPassword !== args.cPassword) {
        console.log('here');
        ctx.addIssue('confirm password should match password');
      }
    }),
};
export const gmailAuthValidator = {
  body: z.object({
    idToken: z.jwt('invalid jwt'),
  }),
};
export const resendOTPValidation = {
  body: z.strictObject({
    email: z.email(),
  }),
};
export const addFriendValidation = {
  params: z.strictObject({
    id: sharedValidation.id,
  }),
};
export const removeFromGalleryValidation = {
  body: z.strictObject({
    key: z.string(),
  }),
};
