import { config } from 'dotenv';

const env =
    process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
        ? config({
              debug: true,
              path: `./.env.${process.env.NODE_ENV}`,
              encoding: 'utf-8',
              override: true,
          })
        : config({
              debug: false,
              quiet: true,
              path: '/usr/local/unraid-api/.env',
              encoding: 'utf-8',
          });

export default env;
