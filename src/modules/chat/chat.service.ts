import chatInstance, { ChatRepo } from '../../common/Repository/chat.repo';
import userInstance, { UserRepo } from '../../common/Repository/user.repo';
import { Request, Response } from 'express';
import { ApiError } from '../../common/utils/ApiError/ApiError';
import logger from '../../common/utils/logger/logger.service';
import { Types } from 'mongoose';
import { Server, Socket } from 'socket.io';
import redisInstance, {
  RedisService,
} from '../../common/service/redis/redis.service';
class chatService {
  constructor(
    private _userModel: UserRepo,
    private _chatModel: ChatRepo,
    private readonly redis: RedisService,
  ) {}
  //rest
  getChat = async (req: Request) => {
    const { userId } = req.params;
    logger.info(`getting chat between ${req.user?._id} and ${userId}`);
    const chat = await this._chatModel.findOne(
      {
        participants: { $all: [userId, req.user?._id] },
        group: { $exists: false },
      },
      {},
      {
        populate: {
          path: 'participants',
          select: '_id firstName lastName pfp',
        },
      },
    );
    if (!chat) {
      throw new ApiError('chat not found', 400);
    }

    return chat;
  };
  //socket
  sendMessage = async (data: any, socket: Socket, io: Server) => {
    const { content, sendTo } = data;
    const userId = socket.data.user._id;
    const user = await this._userModel.findById(sendTo);
    if (!user) {
      throw new ApiError('user not found', 404);
    }

    const chat = await this._chatModel.findOneAndUpdate(
      {
        participants: { $all: [sendTo, userId] },
        group: { $exists: false },
      },
      {
        $push: {
          messages: {
            sender: userId,
            content,
          },
        },
      },
    );
    if (!chat) {
      await this._chatModel.create({
        participants: [sendTo, userId],
        messages: [{ sender: userId, content }],
      });
    }

    io.to(await this.redis.getSockets(userId)).emit('success_message', {
      content,
    });
    io.to(await this.redis.getSockets(sendTo)).emit('new_message', {
      content,
      from: socket.data.user,
    });
    return chat;
  };
}
export default new chatService(userInstance, chatInstance, redisInstance);
