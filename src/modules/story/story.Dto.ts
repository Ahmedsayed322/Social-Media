import z from 'zod';
import {
  createStoryValidation,

} from './story.validation';

export type createStoryDto = z.infer<typeof createStoryValidation.body>;

