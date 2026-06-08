import BaseRepository from './base.repo';
import { Model } from 'mongoose';
import CHAT, { IChat } from '../../db/models/chat.model';

export class ChatRepo extends BaseRepository<IChat> {
  constructor(protected readonly model: Model<IChat> = CHAT) {
    super(model);
  }
}
export default new ChatRepo();
