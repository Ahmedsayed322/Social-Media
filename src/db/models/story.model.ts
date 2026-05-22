import { model, Schema, Types } from 'mongoose';
import { IStory } from '../../modules/story/story.type';

const schema = new Schema<IStory>(
  {
    content: {
      type: String,
    },
    attachments: [String],
    createdBy: {
      type: Types.ObjectId,
      required: true,
      ref: 'user',
    },

    folderId: String,
    excludedUsers: [
      {
        type: Types.ObjectId,
        ref: 'user',
      },
    ],
    views: [
      {
        type: Types.ObjectId,
        ref: 'user',
      },
    ],

    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: true,
    },
    deletedAt: { type: Date, index: true },
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
schema.pre(
  ['find', 'findOne', 'findOneAndUpdate', 'countDocuments'],
  function () {
    const query: any = this.getQuery();
    const { paranoid, ...rest } = query;
    if (paranoid === false) {
      this.setQuery(rest);
    } else {
      this.setQuery({
        ...rest,
        deletedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      });
    }
  },
);

const STORY = model<IStory>('story', schema);
export default STORY;
