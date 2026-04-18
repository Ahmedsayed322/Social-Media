import { HydratedDocument, Types } from 'mongoose';
import { GenderEnum } from '../../common/utils/enums/gender.enum';
import { ProviderEnum } from '../../common/utils/enums/providers.enum';
import { RolesEnum } from '../../common/utils/enums/roles.enum';
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
export interface IUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  provider: ProviderEnum;

  gender: GenderEnum;
  createdAt: Date;
  updatedAt: Date;
  role: RolesEnum;
  changeCredentials?: Date;
}
export interface AuthRequest extends Request {
  user?: HydratedDocument<IUser>;
  decoded?: TokenPayload;
}

export interface TokenPayload extends JwtPayload {
  email: string;
  id: Types.ObjectId;
}
