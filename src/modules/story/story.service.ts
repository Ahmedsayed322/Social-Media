import { Request } from 'express';
import { randomUUID } from 'node:crypto';
import storyInstance, { StoryRepo } from '../../common/Repository/story.repo';
import s3Instance, { S3Service } from '../../common/service/cloud/s3.service';
import { ApiError } from '../../common/utils/ApiError/ApiError';
import { createStoryDto } from './story.Dto';
import { IStory } from './story.type';
import userInstance, { UserRepo } from '../../common/Repository/user.repo';
import { Types } from 'mongoose';

class StoryService {
  constructor(
    private storyModel: StoryRepo,
    private userModel: UserRepo,
    private s3: S3Service,
  ) {}
  createStory = async (req: Request) => {
    const { content, excludedUsers }: createStoryDto = req.body;
    let urls: string[] = [];
    let excludedUsersIds: Types.ObjectId[] = [];
    if (excludedUsers?.length) {
      const users = await this.userModel.find({ _id: { $in: excludedUsers } });

      if (users.length !== excludedUsers.length) {
        if (urls.length) await this.s3.deleteFiles(urls);
        throw new ApiError('some excluded users are invalid', 400);
      }
      if (users.some((user) => user._id.equals(req.user!._id))) {
        if (urls.length) await this.s3.deleteFiles(urls);
        throw new ApiError(
          'you cannot exclude yourself from viewing your story',
          400,
        );
      }
      excludedUsersIds = [...new Set(users.map((user) => user._id))];
    }
    let folderId = randomUUID();
    if (req.files) {
      urls = await this.s3.uploadFiles({
        key: `stories/${folderId}`,
        isLargeFiles: true,
        files: req.files as Express.Multer.File[],
        userId: req.user!._id,
        expires: true,
      });
    }
    let story: IStory;
    try {
      story = await this.storyModel.create({
        content: content!,
        attachments: urls,
        createdBy: req.user!._id,
        excludedUsers: excludedUsersIds,
        views: [],
        folderId,
      });
    } catch (error) {
      if (urls.length) await this.s3.deleteFiles(urls);
      throw new ApiError('failed to create story', 400);
    }
    return story;
  };
}

export default new StoryService(storyInstance, userInstance, s3Instance);
