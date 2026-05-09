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
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    deletedAt: { type: Date, index: true },
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
  },
);

// TTL index for automatic deletion after expiration
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
