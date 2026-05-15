import { Types } from 'mongoose';
import { IPost } from '../post/post.type';
import { onModelEnum } from '../../common/utils/enums/onModel.enum';

export interface IComment {
  content?: string;
  folderId: string;
  attachments?: string[];
  createdBy: Types.ObjectId;
  refId: Types.ObjectId;
  onModel: onModelEnum;
  tags?: Types.ObjectId[];
  likes: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
