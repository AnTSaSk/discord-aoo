import { type Logger, pino } from 'pino';
import { getSecret } from '../utils/secrets.js';

let logger: Logger;

export const getLogger = (): Logger => {
  if (!logger) {
    const isProduction = process.env.NODE_ENV === 'production';
    const useLogtail = process.env.APP_DEV_MODE === 'false';

    if (useLogtail) {
      // Production with Logtail: send to both Logtail AND stdout
      logger = pino({
        level: 'info',
        transport: {
          targets: [
            {
              target: '@logtail/pino',
              options: {
                sourceToken: String(getSecret('APP_LOGTAIL_TOKEN')),
                options: {
                  endpoint: String(getSecret('APP_LOGTAIL_ENDPOINT')),
                }
              },
              level: 'info',
            },
            {
              target: 'pino/file',
              options: { destination: 1 }, // 1 = stdout
              level: 'info',
            },
          ],
        },
      });
    } else if (isProduction) {
      // Production without Logtail: plain JSON to stdout
      logger = pino({ level: 'info' });
    } else {
      // Development: use pino-pretty for readable logs
      logger = pino({
        level: 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "dd-mm-yyyy hh:MM:ss TT",
            levelFirst: true,
            minimumLevel: "trace",
          },
        },
      });
    }
  }

  return logger;
};
