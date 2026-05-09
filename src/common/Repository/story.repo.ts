import BaseRepository from './base.repo';
import STORY from '../../db/models/story.model';
import { Model } from 'mongoose';
import { IStory } from '../../modules/story/story.type';

export class StoryRepo extends BaseRepository<IStory> {
  constructor(protected readonly model: Model<IStory> = STORY) {
    super(model);
  }
}
export default new StoryRepo();
