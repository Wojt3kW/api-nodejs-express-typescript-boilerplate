import { BASE_PATH, CREDENTIALS, LOG_FORMAT, NODE_ENV, ORIGIN, PORT } from '@config';
import { errorKeys } from '@exceptions';
import { Routes } from '@interfaces';
import { ErrorMiddleware } from '@middlewares';
import { AuthRoute } from '@modules/auth';
import { getFullUrl, logger, stream } from '@utils';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import 'reflect-metadata';

export class App {
  public app: express.Application;
  public env: string;
  public port: string | number;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = NODE_ENV ?? 'development';
    this.port = PORT ?? 5100;

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeErrorHandling();
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      logger.info('=================================');
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`App listening on the port ${this.port}`);
      logger.info('=================================');
    });
  }

  public getServer(): express.Application {
    return this.app;
  }

  private initializeMiddlewares(): void {
    this.app.use(morgan(LOG_FORMAT ?? 'combined', { stream }));
    this.app.use(cors({ origin: ORIGIN, credentials: CREDENTIALS }));
    this.app.disable('x-powered-by');
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
  }

  private initializeRoutes(routes: Routes[]): void {
    // auth rout is added always
    this.addAuthRoute();

    routes.forEach(route => {
      this.setRout(route);
    });

    this.app.use(function (req, res) {
      const url = getFullUrl(req);
      res.status(404).json({ message: errorKeys.general.Page_Does_Not_Exist, url });
    });
  }

  private addAuthRoute(): void {
    const authRoute = new AuthRoute();
    this.setRout(authRoute);
  }

  private initializeErrorHandling(): void {
    this.app.use(ErrorMiddleware);
  }

  private setRout(route: Routes): void {
    const path = BASE_PATH ?? '';
    this.app.use(path, route.router);
  }
}
