import { Server, Socket } from 'socket.io';
import chatService from './chat.service';

class chatEvents {
  constructor() {}
  sendMessage = async (socket: Socket, io: Server) => {
    socket.on('send_message', async (data: any) => {
      await chatService.sendMessage(data, socket, io);
    });
  };
}
export default new chatEvents();
