import BaseRepository from './base.repo';
import POST from '../../db/models/post.model';
import { Model } from 'mongoose';
import { IPost } from '../../modules/post/post.type';

export class POSTRepo extends BaseRepository<IPost> {
  constructor(protected readonly model: Model<IPost> = POST) {
    super(model);
  }
}
export default new POSTRepo();
