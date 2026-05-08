import * as z from 'zod';
import { sharedValidation } from '../../common/shared/validation';

export const createCommentValidation = {
  params: z.strictObject({
    postId: sharedValidation.id,
  }),
  body: z.strictObject({
    content: z.string().min(1),
  }),
};

export const updateCommentValidation = {
  params: z.strictObject({
    id: sharedValidation.id,
  }),
  body: z.strictObject({
    content: z.string().min(1),
  }),
};

export const removeCommentValidation = {
  params: z.strictObject({
    id: sharedValidation.id,
  }),
  query: z.strictObject({
    hard: z.coerce.boolean().optional(),
  }),
};

export const listCommentsValidation = {
  params: z.strictObject({
    postId: sharedValidation.id,
  }),
  query: z.strictObject({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
};
