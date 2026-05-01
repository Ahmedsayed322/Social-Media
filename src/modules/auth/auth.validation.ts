import * as z from 'zod';
import { GenderEnum } from '../../common/utils/enums/gender.enum';

const sharedValidation = {
  otp: z.number('otp is required in type number').int().min(100000).max(999999),
  password: z
    .string()
    .min(6, 'password should be at least 6 characters')
    .regex(/[A-Z]/, 'must contain at least one uppercase letter')
    .regex(/[a-z]/, 'must contain at least one lowercase letter')
    .regex(/[0-9]/, 'must contain at least one number'),
  cPassword: z.string('confirm password is required and should be string'),
};
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
export const removeFromGalleryValidation = {
  body: z.strictObject({
    key: z.string(),
  }),
};
