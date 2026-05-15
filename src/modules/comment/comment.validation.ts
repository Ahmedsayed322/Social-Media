import * as z from 'zod';
import { sharedValidation } from '../../common/shared/validation';
import { onModelEnum } from '../../common/utils/enums/onModel.enum';

export const createCommentValidation = {
  params: z.strictObject({
    postId: sharedValidation.id,
    commentId: sharedValidation.id.optional(),
  }),
  body: z
    .strictObject({
      content: z.string().min(1).optional(),
      tags: z.array(z.string()).optional(),
      attachments: z.array(sharedValidation.file).optional(),
      onModel: z.enum(onModelEnum),
    })
    .superRefine((args, ctx) => {
      if (!args.content && !args.attachments?.length && args.tags?.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['content', 'tags', 'attachments'],
          message: 'please provide a content',
        });
      }
    }),
};
export const createReplayValidation = {
  params: z.strictObject({
    postId: sharedValidation.id,
    id: sharedValidation.id,
  }),
  body: z
    .strictObject({
      content: z.string().min(1).optional(),
      tags: z.array(z.string()).optional(),
      attachments: z.array(sharedValidation.file).optional(),
    })
    .superRefine((args, ctx) => {
      if (!args.content && !args.attachments?.length && args.tags?.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['content', 'tags', 'attachments'],
          message: 'please provide a content',
        });
      }
    }),
};

export const updateCommentValidation = {
  params: z.strictObject({
    commentId: sharedValidation.id,
    postId: sharedValidation.id,
  }),
  body: z.strictObject({
    content: z.string().optional(),
    attachments: z.array(sharedValidation.file).optional(),
    tags: z.array(z.string()),
    removeFiles: z.array(z.string()),
  }),
};

export const removeCommentValidation = {
  params: z.strictObject({
    id: sharedValidation.id,
    postId: sharedValidation.id,
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
