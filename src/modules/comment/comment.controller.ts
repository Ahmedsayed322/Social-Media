import { NextFunction, Request, Response, Router } from 'express';
import { successfulResponse } from '../../common/utils/response/successResponse';
import {Validator} from '../../common/middlewares/validator/validator';
import authentication from '../../common/middlewares/authentication/authentication';
import commentInstance from './comment.service';
import {
  createCommentValidation,
  createReplayValidation,
  listCommentsValidation,
  removeCommentValidation,
  updateCommentValidation,
} from './comment.validation';
import multerCloud from '../../common/middlewares/upload/multer.cloud';

const router = Router({ mergeParams: true });

router.post(
  '/',
  authentication.authenticate,
  multerCloud(false).array('attachments'),
  Validator(createCommentValidation),
  async (req: Request, res: Response, next: NextFunction) => {
    const comment = await commentInstance.createComment(req);
    successfulResponse(res, 201, 'done', { comment });
  },
);

router.get(
  '/',
  authentication.authenticate,
  Validator(listCommentsValidation),
  async (req: Request, res: Response, next: NextFunction) => {
    const comments = await commentInstance.listComments(req);
    successfulResponse(res, 200, 'done', { comments });
  },
);

router.patch(
  '/:commentId',
  authentication.authenticate,
  multerCloud(false).array('attachments'),
  Validator(updateCommentValidation),
  async (req: Request, res: Response, next: NextFunction) => {
    const comment = await commentInstance.updateComment(req);
    successfulResponse(res, 200, 'done', { comment });
  },
);

router.delete(
  '/:id',
  authentication.authenticate,
  Validator(removeCommentValidation),
  async (req: Request, res: Response, next: NextFunction) => {
    const comment = await commentInstance.removeComment(req);
    successfulResponse(res, 200, 'done', { comment });
  },
);

export default router;
