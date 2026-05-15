import { model, Schema, Types } from 'mongoose';
import { IComment } from '../../modules/comment/comment.type';
import { onModelEnum } from '../../common/utils/enums/onModel.enum';

const schema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: function () {
        if (!this.attachments?.length && !this.tags?.length) {
          return false;
        }
        return true;
      },
      minlength: 1,
      trim: true,
    },
    createdBy: {
      type: Types.ObjectId,
      required: true,
      ref: 'user',
    },
    refId: {
      type: Types.ObjectId,
      required: true,
      refPath: 'onModel',
      index: true,
    },
    onModel: {
      type: String,
      enum: Object.values(onModelEnum),
      required: true,
    },
    folderId: String,
    attachments: [{ type: String }],
    tags: [{ type: Types.ObjectId }],
    likes: [{ type: Types.ObjectId }],
    deletedAt: { type: Date, index: true },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery: true,
  },
);
schema.virtual('replies', {
  localField: '_id',
  foreignField: 'commentId',
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

const COMMENT = model<IComment>('comment', schema);
export default COMMENT;
