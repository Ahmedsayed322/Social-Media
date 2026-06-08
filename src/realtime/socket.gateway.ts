import { Server, Socket } from 'socket.io';
import logger from '../common/utils/logger/logger.service';
import auth from '../common/middlewares/authentication/authentication';
import chatGateway from '../modules/chat/chat.gateway';
import redisService from '../common/service/redis/redis.service';

class socketGateway {
  constructor() {}
  socketInit = (server: any) => {
    const io = new Server(server, {
      cors: {
        origin: '*',
      },
    });
    io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.headers.token || socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }
        const user = await auth.authenticate_gql(token as string);

        socket.data.user = user;
        next();
      } catch (err) {
        return next(new Error('Authentication error'));
      }
    });
    io.on('connection', async (socket: Socket) => {
      await redisService.addSocket(socket.data.user._id, socket.id);

      await chatGateway.registerEvents(socket, io);

      // io.emit('connected_users',`${socket.data.user.id} has connected`);
      //
      // io.except(socket.id).emit(
      //   'connected_users',
      //   `${socket.data.user.id} has connected`,
      // )//==
      // socket.broadcast.emit(
      //   'connected_users',
      //   `${socket.data.user.id} has connected`,
      // );
      //
      // io.to(socket.id).emit(
      //   'connected_users',
      //   `${socket.data.user.id} has connected`,
      // );
      // socket.on('id', async () => {
      //   console.log('we here');

      //   const sockets = await redisService.getSockets(socket.data.user._id);
      //   console.log(sockets);
      // });
      socket.emit(
        'hi',
        `welcome user  ${socket.data.user.firstName} ${socket.data.user.lastName}`,
      );
      socket.on('disconnect', async () => {
        await redisService.removeSocket(socket.data.user._id, socket.id);
      });
    });
  };
}
export default new socketGateway();
