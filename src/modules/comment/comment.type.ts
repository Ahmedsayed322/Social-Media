import { Types } from 'mongoose';

export interface IComment {
  content: string;
  createdBy: Types.ObjectId;
  postId: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
