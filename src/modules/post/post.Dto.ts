import z from 'zod';
import { createPostValidation, updatePostValidation } from './post.validation';

export type createPostDto = z.infer<typeof createPostValidation.body>;
export type updatePostDto = z.infer<typeof updatePostValidation.body>;
export type updatePostIdDto = z.infer<typeof updatePostValidation.params>;
