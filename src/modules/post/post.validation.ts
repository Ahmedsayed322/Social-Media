import * as z from 'zod';
import {
  AllowCommentEnum,
  AvailabilityEnum,
} from '../../common/utils/enums/post.enum';
import { Types } from 'mongoose';
import { sharedValidation } from '../../common/shared/validation';

export const createPostValidation = {
  body: z
    .strictObject({
      content: z.string().min(1).optional(),
      attachments: z.array(sharedValidation.file).optional(),
      tags: z.array(sharedValidation.id).optional(),
      availability: z.enum(AvailabilityEnum).default(AvailabilityEnum.public),
      allowComment: z.enum(AllowCommentEnum).default(AllowCommentEnum.allow),
    })
    .superRefine((schema, ctx) => {
      if (!schema.content && schema.attachments?.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['content'],
          message: 'post should have at least content or attachment',
        });
      }
      if (schema.tags) {
        const uniqueTags = new Set(schema.tags);
        if (uniqueTags.size !== schema.tags.length) {
          ctx.addIssue({
            code: 'custom',
            path: ['tags'],
            message: 'duplicated tag',
          });
        }
      }
    }),
};
export const likePostValidation = {
  params: z.strictObject({
    id: sharedValidation.id,
  }),
};
export const updatePostValidation = {
  params: z.strictObject({
    id: sharedValidation.id,
  }),
  body: z
    .strictObject({
      content: z.string().min(1).optional(),
      removeTags:z.array(sharedValidation.id).optional(),
      attachments: z.array(sharedValidation.file).optional(),
      removeFiles:z.array(z.string()).optional(),
      tags: z.array(sharedValidation.id).optional(),
      availability: z.enum(AvailabilityEnum).default(AvailabilityEnum.public),
      allowComment: z.enum(AllowCommentEnum).default(AllowCommentEnum.allow),
    })
    .superRefine((schema, ctx) => {
    
      if (schema.tags) {
        const uniqueTags = new Set(schema.tags);
        if (uniqueTags.size !== schema.tags.length) {
          ctx.addIssue({
            code: 'custom',
            path: ['tags'],
            message: 'duplicated tag',
          });
        }
      }
    }),
};

export const removePostValidation = {
  params: z.strictObject({
    id: sharedValidation.id,
  }),
  query: z.strictObject({
    hard: z.coerce.boolean().optional(),
  }),
};
