import { IUser } from '../../modules/auth/auth.type';
import BaseRepository from './base.repo';
import USER from '../../db/models/user.model';

export class UserRepo extends BaseRepository<IUser> {
  constructor() {
    super(USER);
  }

  checkByEmail = async (email: string): Promise<boolean> => {
    const exist = await this.model.exists({ email });
    return !!exist;
  };
}
export default new UserRepo();
