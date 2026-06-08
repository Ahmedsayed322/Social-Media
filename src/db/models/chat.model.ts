import { model, Schema, Types } from 'mongoose';
export interface IMessage {
  sender: Types.ObjectId;
  content?: string;
  attachments?: string[];
  folderId?: string;
  createdAt?: Date;
}

export interface IChat {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  messages: IMessage[];
  folderId?: string;
  group?: string;
  groupImage?: string;
  roomId?: string;
  createdAt: Date;
  updatedAt: Date;
}
const messageSchema = new Schema<IMessage>({
  sender: {
    type: Types.ObjectId,
    required: true,
  },
  content: {
    type: String,
    required: function () {
      if (!this.attachments?.length) {
        return false;
      }
      return true;
    },
  },
  attachments: {
    type: [String],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const chatSchema = new Schema<IChat>(
  {
    participants: [
      {
        type: Types.ObjectId,
        required: true,
        ref: 'user',
      },
    ],
    messages: [messageSchema],
    folderId: String,
    group: String,
    groupImage: String,
    roomId: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
  },
);

const CHAT = model<IChat>('chat', chatSchema);
export default CHAT;
