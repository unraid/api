import { logger } from '@app/core/log';
import { config } from 'dotenv';

export const env =
    process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
        ? config({ debug: true, path: `./.env.${process.env.NODE_ENV}`, encoding: 'utf-8' })
        : config({
              path: '/usr/local/unraid-api/.env',
              encoding: 'utf-8',
          });
