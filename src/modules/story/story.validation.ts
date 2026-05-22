import * as z from 'zod';
import { sharedValidation } from '../../common/shared/validation';

export const createStoryValidation = {
  body: z
    .strictObject({
      content: z.string().optional(),
      attachments: z.array(sharedValidation.file).optional( ),
      excludedUsers: z.array(z.string()).optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.content && data.attachments?.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'story must have at least content or attachment',
        });
      }
    }),
};
export const deleteStoryValidation = {
  params: z.strictObject({
    id: z.string().min(1, 'story id is required'),
  }),
};
export const viewStoryValidation = {
  params: z.strictObject({
    id: z.string().min(1, 'story id is required'),
  }),
};
