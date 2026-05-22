import { Types } from 'mongoose';

export interface IStory {
  _id?: Types.ObjectId;
  content?: string;
  attachments?: string[];
  createdBy: Types.ObjectId;
  excludedUsers: Types.ObjectId[];
  views: Types.ObjectId[];
  folderId: string;
  expiresAt: Date;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
