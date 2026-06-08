import { Server, Socket } from 'socket.io';
import chatEvents from './chat.event';
class ChatGateway {
  constructor() {}
  async registerEvents(socket: Socket, io: Server) {
    chatEvents.sendMessage(socket, io);
  }
}
export default new ChatGateway();
