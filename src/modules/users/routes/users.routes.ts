import { ForbiddenException } from '@exceptions';
import { Routes } from '@interfaces';
import { validateData } from '@middlewares';
import { RequestWithIdentity, setIdentity } from '@modules/auth';
import { CreateUserDto, UsersController } from '@modules/users';
import { REGEX_GUID_PATTERN } from '@utils';
import express, { NextFunction, Response } from 'express';

export class UsersRoute implements Routes {
  public path = '/users';
  public deactivatePath = 'deactivate';
  public activatePath = 'activate';
  public router = express.Router();
  private readonly _usersController: UsersController;

  public constructor() {
    this._usersController = new UsersController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // this.router.get(`${this.path}`,verifyToken, this.usersController.getUsers);
    this.router.get(
      `${this.path}/:id(${REGEX_GUID_PATTERN})`,
      [setIdentity, this.checkPreviewUserProfilePermission],
      this._usersController.getUserProfile
    );
    this.router.post(`${this.path}`, [validateData(CreateUserDto), setIdentity, this.checkCreatePermission], this._usersController.create);
    this.router.post(
      `${this.path}/:id(${REGEX_GUID_PATTERN})/${this.deactivatePath}`,
      [setIdentity, this.checkDeactivatePermission],
      this._usersController.deactivate
    );
    this.router.post(
      `${this.path}/:id(${REGEX_GUID_PATTERN})/${this.activatePath}`,
      [setIdentity, this.checkActivatePermission],
      this._usersController.activate
    );
    // this.router.put(`${this.path}/:id(${REGEX_INT_PATTERN)`, ValidationMiddleware(UpdateUserDto, true),verifyToken, this._usersController.update);
    this.router.delete(`${this.path}/:id(${REGEX_GUID_PATTERN})`, [setIdentity, this.checkDeletePermission], this._usersController.delete);
  }

  private readonly checkPreviewUserProfilePermission = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity.hasPermissionToPreviewUserProfile()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  private readonly checkCreatePermission = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity.hasPermissionToAddUser()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  private readonly checkDeactivatePermission = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity.hasPermissionToDeactivateUser()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  private readonly checkActivatePermission = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity.hasPermissionToActivateUser()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  private readonly checkDeletePermission = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity.hasPermissionToDeleteUser()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };
}
