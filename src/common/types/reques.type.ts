import { HydratedDocument } from 'mongoose';
import { IUser, TokenPayload } from '../../modules/auth/auth.type';


declare global {
  namespace Express {
    interface Request {
      user?: HydratedDocument<IUser>;
      decoded: TokenPayload;
    }
  }
}