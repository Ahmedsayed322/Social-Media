import { NextFunction, Request, Response, Router } from 'express';

import postInstance from './post.service';
import { successfulResponse } from '../../common/utils/response/successResponse';
import Validator from '../../common/middlewares/validator/validator';
import {
  createPostValidation,
  likePostValidation,
  removePostValidation,
  updatePostValidation,
} from './post.validation';
import multerCloud from '../../common/middlewares/upload/multer.cloud';
import authentication from '../../common/middlewares/authentication/authentication';

const postService = postInstance;
const router = Router();
router.post(
  '/',
  multerCloud(false).array('attachments'),
  Validator(createPostValidation),
  authentication.authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    const post = await postInstance.createPost(req);
    successfulResponse(res, 200, 'post created', { post });
  },
);
router.get(
  '/',
  authentication.authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    const posts = await postInstance.getPosts(req);
    successfulResponse(res, 200, 'post created', { posts });
  },
);
router.patch(
  '/like/:id',
  authentication.authenticate,
  Validator(likePostValidation),
  async (req: Request, res: Response, next: NextFunction) => {
    const post = await postInstance.likePost(req);
    successfulResponse(res, 201, 'done', { post });
  },
);
router.patch(
  '/:id',
  authentication.authenticate,
  multerCloud(false).array('attachments'),
  Validator(updatePostValidation),
  async (req: Request, res: Response, next: NextFunction) => {
    const post = await postInstance.updatePost(req);
    successfulResponse(res, 201, 'done', { post });
  },
);

router.delete(
  '/:id',
  authentication.authenticate,
  Validator(removePostValidation),
  async (req: Request, res: Response, next: NextFunction) => {
    const post = await postInstance.removePost(req);
    successfulResponse(res, 200, 'done', { post });
  },
);
export default router;
