import { model, Schema, Types } from 'mongoose';
import { IPost } from '../../modules/post/post.type';
import {
  AllowCommentEnum,
  AvailabilityEnum,
  ReactEnum,
} from '../../common/utils/enums/post.enum';
import COMMENT from './comment.model';

const schema = new Schema<IPost>(
  {
    content: {
      type: String,
      min: 1,
      required: function (this) {
        return this.attachments?.length ? false : true;
      },
    },
    attachments: [String],
    createdBy: {
      type: Types.ObjectId,
      required: true,
      ref: 'user',
    },
    tags: [
      {
        type: Types.ObjectId,

        ref: 'user',
      },
    ],
    reactions: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'user',
          required: true,
        },
        react: {
          type: String,
          enum: ReactEnum,
          default: ReactEnum.like,
        },
      },
    ],
    allowComment: {
      type: String,
      enum: Object.keys(AllowCommentEnum),
      default: AllowCommentEnum.allow,
    },
    availability: {
      type: String,
      enum: Object.keys(AvailabilityEnum),
      default: AvailabilityEnum.public,
    },
    folderId: String,
    deletedAt: { type: Date, index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
  },
);
schema.virtual('comments', {
  localField: '_id',
  foreignField: 'refId',
  ref: 'comment',
});

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
      });
    }
  },
);

schema.pre('findOneAndUpdate', async function () {
  const update: any = this.getUpdate() || {};
  const deletedAt = update?.deletedAt ?? update?.$set?.deletedAt;
  if (!deletedAt) return;

  const query: any = this.getQuery();
  const postId = query?._id;
  if (!postId) return;

  await COMMENT.updateMany({ postId }, { deletedAt }, { strict: false });
});

schema.pre('findOneAndDelete', async function () {
  const query: any = this.getQuery();
  const postId = query?._id;
  if (!postId) return;
  await COMMENT.deleteMany({ postId });
});

const POST = model<IPost>('post', schema);
export default POST;
