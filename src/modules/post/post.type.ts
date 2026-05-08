import { Types } from "mongoose";
import { AllowCommentEnum, AvailabilityEnum } from "../../common/utils/enums/post.enum";

export interface IPost {
  content?: string;
  attachments?: string[];
  createdBy: Types.ObjectId;
  tags?: Types.ObjectId[];
  likes?: Types.ObjectId[];
  allowComment?: AllowCommentEnum;
  availability?: AvailabilityEnum;
  folderId: string;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
