import { model, Schema } from 'mongoose';
import { IUser } from '../../modules/auth/auth.type';
import { ProviderEnum } from '../../common/utils/enums/providers.enum';
import { GenderEnum } from '../../common/utils/enums/gender.enum';
import { RolesEnum } from '../../common/utils/enums/roles.enum';
import BcryptService from '../../common/utils/bcrypt/Bcrypt.service';

const schema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      trim: true,
      required: true,
      minlength: 3,
      maxlength: 20,
    },
    lastName: {
      trim: true,
      type: String,
      required: true,
      minlength: 3,
      maxLength: 20,
    },
    email: {
      trim: true,
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: Object.values(GenderEnum),
    },
    password: {
      required: function (): boolean {
        return this.provider === ProviderEnum.System;
      },
      type: String,
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/,
        'password must be at least 6 characters and include uppercase, lowercase, and number',
      ],
      minlength: 6,
      select: false,
    },
    provider: {
      required: true,
      type: String,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.System,
    },
    role: {
      type: String,
      enum: Object.values(RolesEnum),
      default: RolesEnum.user,
    },
    changeCredentials: {
      type: Date,
    },
  },

  {
    timestamps: true,
  },
);
schema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await BcryptService.hash(this.password);
  }
});
const USER = model('User', schema);
export default USER;
