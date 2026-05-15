import { Types } from 'mongoose';
import {
  AllowCommentEnum,
  AvailabilityEnum,
  ReactEnum,
} from '../../common/utils/enums/post.enum';

export interface IPost {
  content?: string;
  attachments?: string[];
  createdBy: Types.ObjectId;
  tags?: Types.ObjectId[];
  reactions?: Types.ObjectId[];
  allowComment?: AllowCommentEnum;
  availability?: AvailabilityEnum;
  folderId: string;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  comments?: any[];
}
export interface IReact {
  reactions: { userId: Types.ObjectId; react: ReactEnum }[];
}
