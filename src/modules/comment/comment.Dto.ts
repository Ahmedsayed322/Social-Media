import z from 'zod';
import {
  createCommentValidation,
  listCommentsValidation,
  removeCommentValidation,
  updateCommentValidation,
} from './comment.validation';

export type CreateCommentParamsDto = z.infer<typeof createCommentValidation.params>;
export type CreateCommentBodyDto = z.infer<typeof createCommentValidation.body>;
export type ListCommentsParamsDto = z.infer<typeof listCommentsValidation.params>;
export type ListCommentsQueryDto = z.infer<typeof listCommentsValidation.query>;
export type UpdateCommentParamsDto = z.infer<typeof updateCommentValidation.params>;
export type UpdateCommentBodyDto = z.infer<typeof updateCommentValidation.body>;
export type RemoveCommentParamsDto = z.infer<typeof removeCommentValidation.params>;
