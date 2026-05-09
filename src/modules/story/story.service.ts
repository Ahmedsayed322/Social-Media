import { Request } from 'express';
import { randomUUID } from 'node:crypto';
import storyInstance, { StoryRepo } from '../../common/Repository/story.repo';
import s3Instance, { S3Service } from '../../common/service/cloude/s3.service';
import { ApiError } from '../../common/utils/ApiError/ApiError';
import { createStoryDto } from './story.Dto';
import { IStory } from './story.type';

class StoryService {
  constructor(
    private storyModel: StoryRepo,
    private s3: S3Service,
  ) {}

  createStory = async (req: Request) => {
    const { content }: createStoryDto = req.body;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    let urls: string[] = [];
    let folderId = randomUUID();
    if (req.files) {
      urls = await this.s3.uploadFiles({
        key: `stories/${folderId}`,
        files: req.files as Express.Multer.File[],
        userId: req.user!._id,
      });
    }
    if (!content && !urls.length) {
      throw new ApiError('story must have at least content or attachment', 400);
    }
    let story: IStory;
    try {
      const storyData: any = {
        attachments: urls,
        createdBy: req.user!._id,
        folderId,
        expiresAt,
      };
      if (content) {
        storyData.content = content;
      }
      story = await this.storyModel.create(storyData);
    } catch (error) {
      if (urls.length) await this.s3.deleteFiles(urls);
      throw new ApiError('failed to create story', 400);
    }
    return story;
  };
}

export default new StoryService(storyInstance, s3Instance);
