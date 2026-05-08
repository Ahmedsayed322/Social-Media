import { model, Schema, Types } from 'mongoose';
import { IComment } from '../../modules/comment/comment.type';

const schema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: true,
      minlength: 1,
      trim: true,
    },
    createdBy: {
      type: Types.ObjectId,
      required: true,
      ref: 'user',
    },
    postId: {
      type: Types.ObjectId,
      required: true,
      ref: 'post',
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

schema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function () {
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
});

const COMMENT = model<IComment>('comment', schema);
export default COMMENT;
