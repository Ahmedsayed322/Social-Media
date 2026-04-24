import z from 'zod';
import { signupValidation } from './auth.validation';

export type signupDTO = z.infer<typeof signupValidation.body>;
