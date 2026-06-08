import { Router } from 'express';
import chatService from './chat.service';
import { successfulResponse } from '../../common/utils/response/successResponse';
import { Request, Response } from 'express';
import authentication from '../../common/middlewares/authentication/authentication';
console.log('here');

const chatRouter = Router({ mergeParams: true });
chatRouter.get(
  '/',
  authentication.authenticate,
  async (req: Request, res: Response) => {
    const chat = await chatService.getChat(req);
    successfulResponse(res, 200, 'chat retrieved successfully', { chat });
  },
);
export default chatRouter;
