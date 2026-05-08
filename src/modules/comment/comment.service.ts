import { Request } from 'express';
import { Types } from 'mongoose';
import { ApiError } from '../../common/utils/ApiError/ApiError';
import commentInstance, { CommentRepo } from '../../common/Repository/comment.repo';
import postInstance, { POSTRepo } from '../../common/Repository/post.repo';
import { AllowCommentEnum, AvailabilityEnum } from '../../common/utils/enums/post.enum';
import { IPost } from '../post/post.type';
import redisInstance,{ RedisService } from '../../common/service/redis/redis.service';
import notificationInstance,{ NotificationService } from '../../common/service/notification/firebase';

const canAccessPost = (post: IPost, userId: Types.ObjectId, friends: Types.ObjectId[] = []) => {
  if (post.availability === AvailabilityEnum.public) return true;
  if (post.createdBy?.equals?.(userId)) return true;
  if (post.tags?.some((t) => t.equals(userId))) return true;
  if (post.availability === AvailabilityEnum.friends) {
    return friends.some((f) => f.equals(post.createdBy));
  }
  return false;
};

class CommentService {
  constructor(
    private commentModel: CommentRepo,
    private postModel: POSTRepo,
    private redis: RedisService,
    private notification: NotificationService,
  ) {}

  createComment = async (req: Request) => {
    const postId = Types.ObjectId.createFromHexString(String(req.params.postId));
    const post = await this.postModel.findOne({ _id: postId });
    if (!post) throw new ApiError('post not found', 404);
    if (post.allowComment === AllowCommentEnum.deny) {
      throw new ApiError('comments are disabled for this post', 403);
    }
    if (!canAccessPost(post, req.user?._id!, req.user?.friends || [])) {
      throw new ApiError('post not found', 404);
    }

    const comment = await this.commentModel.create({
      content: req.body.content,
      createdBy: req.user?._id!,
      postId,
    });
    const fcm=await this.redis.getFCMs(post.createdBy as Types.ObjectId);
    console.log(fcm);
    if (fcm.length) {
      await this.notification.sendNotification({
        token: fcm[0]!,
        data: {
          title: 'new comment on your post',
          body: `${req.user?.firstName} ${req.user?.lastName} commented on your post`,
        },
      });
    }
    return comment;
  };

  listComments = async (req: Request) => {
    const postId = Types.ObjectId.createFromHexString(String(req.params.postId));
    const post = await this.postModel.findOne({ _id: postId });
    if (!post) throw new ApiError('post not found', 404);
    if (!canAccessPost(post, req.user?._id!, req.user?.friends || [])) {
      throw new ApiError('post not found', 404);
    }
    const page = req.query.page ? +req.query.page : 1;
    const limit = req.query.limit ? +req.query.limit : 10;
    const safePage = !page || page < 1 ? 1 : page;
    const safeLimit = !limit || limit < 1 ? 10 : Math.min(limit, 100);
    const skip = (safePage - 1) * safeLimit;

    const comments = await this.commentModel.find(
      { postId },
      undefined,
      {
        skip,
        limit: safeLimit,
        populate: { path: 'createdBy', select: 'firstName lastName pfp' },
      },
    );
    
    return { currentPage: safePage, limit: safeLimit, data: comments };
  };

  updateComment = async (req: Request) => {
    const id = Types.ObjectId.createFromHexString(String(req.params.id));
    const comment = await this.commentModel.findOne({
      _id: id,
      createdBy: req.user?._id!,
    });
    if (!comment) throw new ApiError('comment not found', 404);

    const post = await this.postModel.findOne({ _id: comment.postId });
    if (!post) throw new ApiError('post not found', 404);
    if (post.allowComment === AllowCommentEnum.deny) {
      throw new ApiError('comments are disabled for this post', 403);
    }

    comment.content = req.body.content;
    await comment.save();
    return comment;
  };

  removeComment = async (req: Request) => {
    const id = Types.ObjectId.createFromHexString(String(req.params.id));
    const hard = String((req.query as any)?.hard) === 'true';

    if (hard) {
      const comment = await this.commentModel.deleteOne({
        _id: id,
        createdBy: req.user?._id!,
        paranoid: false as any,
      } as any);
      if (!comment) throw new ApiError('comment not found', 404);
      return comment;
    }

    const comment = await this.commentModel.softDeleteOne({
      _id: id,
      createdBy: req.user?._id!,
    } as any);
    if (!comment) throw new ApiError('comment not found', 404);
    return comment;
  };
}

export default new CommentService(commentInstance, postInstance,redisInstance,notificationInstance);
