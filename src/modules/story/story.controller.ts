import { NextFunction, Request, Response, Router } from 'express';
import storyInstance from './story.service';
import { successfulResponse } from '../../common/utils/response/successResponse';
import {Validator} from '../../common/middlewares/validator/validator';
import {
  createStoryValidation,

} from './story.validation';
import multerCloud from '../../common/middlewares/upload/multer.cloud';
import authentication from '../../common/middlewares/authentication/authentication';

const router = Router();

router.post(
  '/',
  multerCloud(true).array('attachments'),
  Validator(createStoryValidation),
  authentication.authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    const story = await storyInstance.createStory(req);
    successfulResponse(res, 201, 'story created', { story });
  },
);

export default router;
