import * as z from 'zod';
import { sharedValidation } from '../../common/shared/validation';

export const createStoryValidation = {
  body: z.strictObject({
    content: z.string().optional(),
    attachments: z.array(sharedValidation.file),
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
