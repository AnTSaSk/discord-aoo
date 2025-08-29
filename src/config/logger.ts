import 'dotenv/config';
import { type Logger, pino } from 'pino';

let logger: Logger;

export const getLogger = (): Logger => {
  if (!logger) {
    let target = 'pino-pretty';
    let options: Record<string, (boolean | string) | Record<string, boolean | string>> = {
      colorize: true,
      ignore: "pid,hostname",
      translateTime: "dd-mm-yyyy hh:MM:ss TT",
      levelFirst: true,
      minimumLevel: "trace",
    };

    if (process.env.APP_DEV_MODE == 'false') {
      target = '@logtail/pino';
      options = {
        sourceToken: String(process.env.APP_LOGTAIL_TOKEN),
        options: {
          endpoint: String(process.env.APP_LOGTAIL_ENDPOINT),
        }
      };
    }

    logger = pino({
      level: 'info',
      transport: {
        target: target,
        options: options,
      },
    });
  }

  return logger;
};
