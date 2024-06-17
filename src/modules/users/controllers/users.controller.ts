import { events } from '@events';
import { RequestWithIdentity } from '@modules/auth';
import { BaseController } from '@modules/common';
import {
  ActivateUserReqDto,
  CreateUserDto,
  CreateUserReqDto,
  DeactivateUserReqDto,
  DeleteUserReqDto,
  GetUserProfileReqDto,
  IUserProfile,
  UsersService,
} from '@modules/users';
import { isGuid } from '@utils';
import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';

export class UsersController extends BaseController {
  private readonly _userService: UsersService;

  public constructor() {
    super();
    this._userService = Container.get(UsersService);
  }

  public getUserProfile = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new GetUserProfileReqDto(this.getUserGuid(req), this.getCurrentUserId(req));
      const user: IUserProfile | null = await this._userService.get(reqDto);
      res.status(200).json({ data: user, message: events.users.userRetrieved });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: CreateUserDto = req.body;
      const reqDto = new CreateUserReqDto(userData, this.getCurrentUserId(req));
      const user = await this._userService.create(reqDto);
      res.status(201).json({ data: user, message: events.users.userCreated });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new DeleteUserReqDto(this.getUserGuid(req), this.getCurrentUserId(req));
      const data = await this._userService.delete(reqDto);
      res.status(200).json({ data, message: events.users.userDeleted });
    } catch (error) {
      next(error);
    }
  };

  public activate = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new ActivateUserReqDto(this.getUserGuid(req), this.getCurrentUserId(req));
      const data = await this._userService.activate(reqDto);
      res.status(200).json({ data, message: events.users.userActivated });
    } catch (error) {
      next(error);
    }
  };

  public deactivate = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new DeactivateUserReqDto(this.getUserGuid(req), this.getCurrentUserId(req));
      const data = await this._userService.deactivate(reqDto);
      res.status(200).json({ data, message: events.users.userDeactivated });
    } catch (error) {
      next(error);
    }
  };

  private getUserGuid(req: Request): string | undefined {
    return isGuid(req?.params?.id) ? req.params.id : undefined;
  }
}
