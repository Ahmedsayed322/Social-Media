import pino from 'pino';
import env from '../../../config/config.service';

const isDev = process.env.NODE_ENV !== 'production';

const devTransport: pino.TransportSingleOptions = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
  },
};

const logger = pino({
  level: isDev ? 'debug' : 'info',
  ...(isDev && { transport: devTransport }),
});

export default logger;
