import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV ?? 'development'}.local` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const { NODE_ENV, PORT, SECRET_KEY, SECRET_AUDIENCE, SECRET_ISSUER, LOG_FORMAT, LOG_DIR, ORIGIN, BASE_PATH } = process.env;
