import BaseRepository from './base.repo';
import COMMENT from '../../db/models/comment.model';
import { Model } from 'mongoose';
import { IComment } from '../../modules/comment/comment.type';

export class CommentRepo extends BaseRepository<IComment> {
  constructor(protected readonly model: Model<IComment> = COMMENT) {
    super(model);
  }
}

export default new CommentRepo();
