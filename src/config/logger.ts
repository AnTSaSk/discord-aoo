import 'dotenv/config';
import { type Logger, pino } from 'pino';

let logger: Logger;

export const getLogger = (): Logger => {
  if (!logger) {
    logger = pino({
      level: 'info',
      transport: {
        target: process.env.APP_DEV_MODE ? 'pino-pretty' : '@logtail/pino',
        options: process.env.APP_DEV_MODE
          ? {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "dd-mm-yyyy hh:MM:ss TT",
            levelFirst: true,
            minimumLevel: "trace",
          }
          : {
            sourceToken: process.env.APP_LOGTAIL_TOKEN,
            options: {
              endpoint: 'https://s1462358.eu-nbg-2.betterstackdata.com',
            }
          },
      },
    });
  }

  return logger;
};
