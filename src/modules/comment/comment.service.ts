import { Request } from 'express';
import { HydratedDocument, Types } from 'mongoose';
import { ApiError } from '../../common/utils/ApiError/ApiError';
import commentInstance, {
  CommentRepo,
} from '../../common/Repository/comment.repo';
import postInstance, { POSTRepo } from '../../common/Repository/post.repo';
import {
  AllowCommentEnum,
  AvailabilityEnum,
} from '../../common/utils/enums/post.enum';
import { IPost } from '../post/post.type';
import redisInstance, {
  RedisService,
} from '../../common/service/redis/redis.service';
import notificationInstance, {
  NotificationService,
} from '../../common/service/notification/firebase';
import { CreateCommentBodyDto } from './comment.Dto';
import s3Instance, { S3Service } from '../../common/service/cloude/s3.service';
import { Multer } from 'multer';
import { randomUUID } from 'node:crypto';
import { IComment } from './comment.type';
import userInstance, { UserRepo } from '../../common/Repository/user.repo';
import { postAvailability } from '../post/post.service';
import { onModelEnum } from '../../common/utils/enums/onModel.enum';
import logger from '../../common/utils/logger/logger.service';

class CommentService {
  constructor(
    private commentModel: CommentRepo,
    private postModel: POSTRepo,
    private redis: RedisService,
    private notification: NotificationService,
    private userModel: UserRepo,
    private s3: S3Service,
  ) {}

  createComment = async (req: Request) => {
    const { content, tags, onModel }: CreateCommentBodyDto = req.body;
    const postId = Types.ObjectId.createFromHexString(
      String(req.params.postId),
    );
    const commentId = req.params.commentId;
    let doc: any;
    const folderId = randomUUID();

    if (onModel === onModelEnum.post && !commentId) {
      doc = await this.postModel.findOne({
        _id: postId,
        $or: [...postAvailability(req)],
        allowComment: AllowCommentEnum.allow,
      });
      if (!doc) {
        throw new ApiError(
          'you are not allowed to comment on this post or its not found',
          400,
        );
      }
    } else if (onModel === onModelEnum.comment && commentId) {
      const hexId = Types.ObjectId.createFromHexString(String(commentId));
      doc = await this.commentModel.findOne(
        {
          _id: hexId,
          postId,
        },
        {},
        {
          populate: {
            path: 'refId',
            match: {
              $or: [...postAvailability(req)],
              allowComment: AllowCommentEnum.allow,
            },
          },
        },
      );
      if (!doc?.refId) {
        throw new ApiError(
          'you are not allowed to comment on this post or its not found',
          400,
        );
      }
    }

    let mentions: Types.ObjectId[] = [];
    if (tags?.length) {
      const uniqueTags = [...new Set(tags)];
      const mentionedUsers = await this.userModel.find({
        _id: { $in: uniqueTags },
      });

      if (mentionedUsers.length !== uniqueTags.length) {
        throw new ApiError('invalid tags', 400);
      }

      mentions = mentionedUsers.map((user) => user._id);
    }

    let urls: string[] = [];
    if (req.files?.length) {
      let key: string = `posts/${doc.folderId}/comments/${folderId}`;
      urls = await this.s3.uploadFiles({
        key,
        files: req.files as Express.Multer.File[],
        userId: req.user!._id,
      });
    }

    let comment: IComment;
    try {
      comment = await this.commentModel.create({
        content: content!,
        createdBy: req.user?._id!,
        folderId,
        tags: mentions,
        attachments: urls,
        refId: doc?._id!,
        onModel: onModel,
      });
    } catch (error) {
      try {
        await this.s3.deleteFiles(urls);
      } catch {
        logger.info('no files to delete');
      }

      throw new ApiError('failed to create a post', 400);
    }
    if (!(doc.createdBy as Types.ObjectId).equals(req.user?._id)) {
      const fcm = await this.redis.getFCMs(doc.createdBy as Types.ObjectId);
      if (fcm.length) {
        await this.notification.sendNotification({
          token: fcm[0]!,
          data: {
            title: 'new comment',
            body: `${req.user?.firstName} ${req.user?.lastName} ${
              onModel === onModelEnum.post
                ? 'commented on your post'
                : 'replied to your comment'
            }`,
          },
        });
      }
    }
    return comment;
  };

  listComments = async (req: Request) => {
    const postId = Types.ObjectId.createFromHexString(
      String(req.params.postId),
    );
    const post = await this.postModel.findOne({
      _id: postId,
      $or: [...postAvailability(req)],
    });
    if (!post) throw new ApiError('post not found', 404);

    const page = req.query.page ? +req.query.page : 1;
    const limit = req.query.limit ? +req.query.limit : 10;
    const safePage = !page || page < 1 ? 1 : page;
    const safeLimit = !limit || limit < 1 ? 10 : Math.min(limit, 100);
    const skip = (safePage - 1) * safeLimit;

    const comments = await this.commentModel.find({ postId }, undefined, {
      skip,
      limit: safeLimit,
      populate: { path: 'createdBy', select: 'firstName lastName pfp' },
    });

    return { currentPage: safePage, limit: safeLimit, data: comments };
  };

  updateComment = async (req: Request) => {
    const {
      tags,
      content,
      removeFiles,
    }: { tags?: string[]; content?: string; removeFiles?: string[] } = req.body;

    const id = Types.ObjectId.createFromHexString(
      req.params.commentId as string,
    );

    const postId = Types.ObjectId.createFromHexString(
      req.params.postId as string,
    );

    const comment = await this.commentModel.findOne(
      {
        _id: id,
        createdBy: req.user!._id,
      },
      {},
      {
        populate: {
          path: 'refId',
          match: {
            $or: [...postAvailability(req)],
            allowComment: AllowCommentEnum.allow,
          },
        },
      },
    );

    if (!comment) {
      throw new ApiError('comment not found', 404);
    }

    const post = await this.postModel.findOne({
      _id: postId,
      $or: [...postAvailability(req)],
    });

    if (!post) {
      throw new ApiError('post not found', 404);
    }

    let mentions: Types.ObjectId[] = comment.tags as Types.ObjectId[];

    if (tags?.length) {
      const uniqueTags = [...new Set(tags)];

      const mentionedUsers = await this.userModel.find({
        _id: { $in: uniqueTags },
      });

      if (mentionedUsers.length !== uniqueTags.length) {
        throw new ApiError('invalid tags', 400);
      }

      mentions = mentionedUsers.map((user) => user._id);
    }

    let uploadedFiles: string[] = [];

    if (req.files?.length) {
      uploadedFiles = await this.s3.uploadFiles({
        key: `posts/${post.folderId}/comments/${comment.folderId}`,
        files: req.files as Express.Multer.File[],
        userId: req.user!._id,
      });
    }

    try {
      if (content !== undefined) {
        comment.content = content;
      }

      if (mentions.length) {
        comment.tags = mentions;
      }

      if (removeFiles?.length && comment.attachments?.length) {
        comment.attachments = comment.attachments.filter(
          (file) => !removeFiles.includes(file),
        );

        await this.s3.deleteFiles(removeFiles);
      }

      if (uploadedFiles.length) {
        comment.attachments?.push(...uploadedFiles);
      }

      await comment.save();

      return comment;
    } catch (error) {
      if (uploadedFiles.length) {
        await this.s3.deleteFiles(uploadedFiles);
      }

      throw new ApiError('failed to update comment', 400);
    }
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

export default new CommentService(
  commentInstance,
  postInstance,
  redisInstance,
  notificationInstance,
  userInstance,
  s3Instance,
);
