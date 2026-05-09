import env from '../../config/config.service';
import { Request } from 'express';
import { createPostDto, updatePostDto } from './post.Dto';
import { Types } from 'mongoose';
import postInstance, { POSTRepo } from '../../common/Repository/post.repo';
import {
  AvailabilityEnum,
  ReactEnum,
} from '../../common/utils/enums/post.enum';
import userInstance, { UserRepo } from '../../common/Repository/user.repo';
import { ApiError } from '../../common/utils/ApiError/ApiError';
import notificationInstance, {
  NotificationService,
} from '../../common/service/notification/firebase';
import redisInstance, {
  RedisService,
} from '../../common/service/redis/redis.service';
import s3Instance, { S3Service } from '../../common/service/cloude/s3.service';
import { randomUUID } from 'node:crypto';
import { IPost } from './post.type';
const devLogging = (data: any) => {
  if (env.NODE_ENV === 'development') {
    console.log(data);
  }
};
const postAvailability = (req: Request) => [
  { availability: AvailabilityEnum.public },
  {
    availability: AvailabilityEnum.friends,
    createdBy: { $in: [...(req.user?.friends || []), req.user?._id] },
  },
  {
    availability: AvailabilityEnum.only_me,
    createdBy: req.user?._id as Types.ObjectId,
  },
  { tags: { $in: [req.user?._id] } },
];

const profilePostSearch = (req: Request, profileId: Types.ObjectId) => {
  const isOwner = req.user?._id?.equals(profileId);
  const isFriend = req.user?.friends?.some((friend) =>
    friend.equals(profileId),
  );

  if (isOwner) {
    return { createdBy: profileId };
  }

  const search: any = {
    createdBy: profileId,
    $or: [{ availability: AvailabilityEnum.public }],
  };

  if (isFriend) {
    search.$or.push({ availability: AvailabilityEnum.friends });
  }

  search.$or.push({ tags: req.user?._id });
  return search;
};
class postService {
  constructor(
    private postModel: POSTRepo,
    private userModel: UserRepo,
    private notification: NotificationService,
    private redis: RedisService,
    private s3: S3Service,
  ) {}
  createPost = async (req: Request) => {
    const { content, tags, availability, allowComment }: createPostDto =
      req.body;
    let mentions: Types.ObjectId[] = [];

    if (tags?.length) {
      const me = tags.filter((t) =>
        Types.ObjectId.createFromHexString(t).equals(req.user?._id!),
      );
      console.log(me);

      if (me.length) throw new ApiError('you cant mention yourself', 400);
      const mentionsTags = await this.userModel.find({
        _id: { $in: [...tags] },
      });
      if (tags.length != mentionsTags.length) {
        throw new ApiError('invalid tag id', 404);
      }

      mentions = mentionsTags.map((t) => {
        return t._id;
      });
    }

    let urls: string[] = [];
    let folderId = randomUUID();
    if (req.files) {
      urls = await this.s3.uploadFiles({
        key: `posts/${folderId}`,
        files: req.files as Express.Multer.File[],
        userId: req.user!._id,
      });
    }
    let post: IPost;
    try {
      post = await this.postModel.create({
        attachments: urls,
        content: content!,
        createdBy: req.user!._id,
        tags: mentions,
        availability,
        allowComment,
        folderId,
        reactions: [],
      });
    } catch (error) {
      await this.s3.deleteFiles(urls);
      throw new ApiError('failed to create a post', 400);
    }
    const res = await Promise.all(mentions.map((t) => this.redis.getFCMs(t)));
    const fcms = res.map((r) => r[0]);
    if (fcms.length) {
      await this.notification.sendNotifications({
        tokens: fcms as string[],
        data: {
          title: 'new post',
          body: `${req.user?.firstName} ${req.user?.lastName} add new Post and mention you`,
        },
      });
    }
    return post;
  };
  getPosts = async (req: Request) => {
    const searchQuery = req.query.search
      ? { content: { $regex: req.query.search, $options: 'i' } }
      : {};
    const posts = this.postModel.paginate({
      page: +req.query.page!,
      limit: +req.query.limit!,
      sort: { createdAt: -1 },
      search: {
        $or: [...postAvailability(req)],
        ...searchQuery,
      },
    });
    return posts;
  };
  getDashboard = async (req: Request) => {
    const [totalPosts, taggedPosts, feedSummary] = await Promise.all([
      this.postModel.count({ createdBy: req.user!._id }),
      this.postModel.count({ tags: req.user!._id }),
      this.postModel.paginate({
        page: 1,
        limit: 1,
        sort: { createdAt: -1 },
        search: { $or: [...postAvailability(req)] },
      }),
    ]);

    return {
      totalPosts,
      taggedPosts,
      friendsCount: req.user?.friends?.length || 0,
      feed: {
        currentPage: feedSummary.currentPage,
        totalPages: feedSummary.totalPages,
      },
    };
  };
  getProfilePosts = async (req: Request) => {
    const id = req.params.id as string;
    const profileId = Types.ObjectId.createFromHexString(id)
    const profileUser = await this.userModel.findOne({ _id: profileId });
    if (!profileUser) {
      throw new ApiError('profile not found', 404);
    }
    const posts = await this.postModel.paginate({
      page: +req.query.page! || 1,
      limit: +req.query.limit! || 10,
      sort: { createdAt: -1 },
      search: profilePostSearch(req, profileId),
    });
    return posts;
  };
  likePost = async (req: Request) => {
    const { flag } = req.query;
    const reactKey = (req.body.react as keyof typeof ReactEnum) ?? 'like';
    const reactEmoji = ReactEnum[reactKey];
    let op: 'add' | 'remove' = 'add';
    let updateQuery: any = {
      $addToSet: { reactions: { userId: req.user!._id, react: reactEmoji } },
    };
    if (flag && flag === 'disLike') {
      op = 'remove';
      updateQuery = { $pull: { reactions: { userId: req.user?._id } } };
    }
    if (op === 'add') {
      await this.postModel.updateOne(
        { _id: req.params.id },
        {
          $pull: {
            reactions: {
              userId: req.user!._id,
            },
          },
        },
      );
    }
    const post = await this.postModel.findOneAndUpdate(
      { _id: req.params.id, $or: [...postAvailability(req)] },
      { ...updateQuery },
    );
    if (!post) {
      throw new ApiError('post not found ', 404);
    }
    return post;
  };
  updatePost = async (req: Request) => {
    const { id } = req.params;
    const {
      content,
      tags,
      availability,
      removeTags,
      allowComment,
      removeFiles,
    }: updatePostDto = req.body;
    const post = await this.postModel.findOne({
      _id: id,
      createdBy: req.user?._id!,
    });
    if (!post) {
      throw new ApiError('post not found', 404);
    }
    if (removeFiles?.length) {
      const deletedFiles = removeFiles.filter((f) =>
        post.attachments?.includes(f),
      );
      if (!deletedFiles.length) {
        throw new ApiError('invalid path', 400);
      }
      await this.s3.deleteFiles(deletedFiles);
      post.attachments = post.attachments!.filter(
        (r) => !deletedFiles.includes(r),
      );
    }
    let updatedTags = new Set<string>(post.tags?.map((t) => t.toString()));

    if (removeTags?.length) {
      removeTags.forEach((e) => {
        updatedTags.delete(e);
      });
    }

    if (tags?.length) {
      const isMe = tags.some((t) =>
        Types.ObjectId.createFromHexString(t).equals(req.user?._id!),
      );

      if (isMe) throw new ApiError('you cant mention yourself', 400);
      const mentionsTags = await this.userModel.find({
        _id: { $in: [...tags] },
      });
      if (tags.length !== mentionsTags.length) {
        throw new ApiError('invalid tag id', 404);
      }

      mentionsTags.forEach((t) => {
        updatedTags.add(t._id.toString());
      });
    }
    post.tags = [...updatedTags].map((id) =>
      Types.ObjectId.createFromHexString(id),
    );

    if (req.files) {
      const urls = await this.s3.uploadFiles({
        key: `posts/${post.folderId}`,
        files: req.files as Express.Multer.File[],
        userId: req.user!._id,
      });
      post.attachments = [...(post.attachments as string[]), ...urls];
    }
    if (content) post.content = content;
    if (allowComment) post.allowComment = allowComment;
    if (availability) post.availability = availability;
    await post.save();
    const res = await Promise.all(
      [...updatedTags].map((t) =>
        this.redis.getFCMs(Types.ObjectId.createFromHexString(t)),
      ),
    );
    const fcms = res.map((r) => r[0]);
    if (fcms.length) {
      await this.notification.sendNotifications({
        tokens: fcms as string[],
        data: {
          title: 'new post',
          body: `${req.user?.firstName} ${req.user?.lastName} updated his post`,
        },
      });
    }
    return post;
  };
  removePost = async (req: Request) => {
    const { id } = req.params;
    const hard = String((req.query as any)?.hard) === 'true';

    const post = await this.postModel.findOne({
      _id: id,
      createdBy: req.user?._id!,
    });
    if (!post) {
      throw new ApiError('post not found', 404);
    }

    if (hard) {
      if (post.attachments?.length) {
        await this.s3.deleteFiles(post.attachments);
      }
      await this.postModel.deleteOne({
        _id: post._id,
        createdBy: req.user?._id!,
        paranoid: false as any,
      } as any);
      return post;
    }

    const softDeleted = await this.postModel.softDeleteOne({
      _id: post._id,
      createdBy: req.user?._id!,
    } as any);
    if (!softDeleted) throw new ApiError('post not found', 404);

    return softDeleted;
  };
}
export default new postService(
  postInstance,
  userInstance,
  notificationInstance,
  redisInstance,
  s3Instance,
);
