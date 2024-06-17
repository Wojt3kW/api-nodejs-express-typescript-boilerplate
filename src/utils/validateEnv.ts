import { cleanEnv, port, str } from 'envalid';

export const ValidateEnv = (): void => {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    PORT: port(),
  });
};
