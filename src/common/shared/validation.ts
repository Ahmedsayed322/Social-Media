import { Types } from 'mongoose';
import z from 'zod';

export const sharedValidation = {
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
