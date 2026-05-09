import { Types } from 'mongoose';
import z from 'zod';

export const sharedValidation = {
  otp: z.number('otp is required in type number').int().min(100000).max(999999),
  password: z
    .string()
    .min(6, 'password should be at least 6 characters')
    .regex(/[A-Z]/, 'must contain at least one uppercase letter')
    .regex(/[a-z]/, 'must contain at least one lowercase letter')
    .regex(/[0-9]/, 'must contain at least one number'),
  cPassword: z.string('confirm password is required and should be string'),
  id: z.string().refine(
    (val) => {
      return Types.ObjectId.isValid(val);
    },
    {
      message: 'invalid Id',
    },
  ),
  file: z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.string(),
    buffer: z.any().optional(),
    path: z.string().optional(),
    size: z.number(),
  }),
};
