import { events } from '@events';
import { RequestWithIdentity } from '@modules/auth';
import { BaseController } from '@modules/common';
import { AddPermissionReqDto, DeletePermissionsReqDto, PermissionsService } from '@modules/permissions';
import { isGuid, toNumber } from '@utils';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class PermissionsController extends BaseController {
  private readonly _permissionService: PermissionsService;
  constructor() {
    super();
    this._permissionService = Container.get(PermissionsService);
  }

  public add = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userGuid, permissionId, currentUserId } = this.getRequestParams(req);
      const reqDto = new AddPermissionReqDto(userGuid, permissionId, currentUserId);
      const result = await this._permissionService.add(reqDto);
      if (result) {
        res.status(201).json({ data: result, message: events.permissions.permissionAdded });
      } else {
        res.status(400).json({ data: result });
      }
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userGuid, permissionId, currentUserId } = this.getRequestParams(req);
      const reqDto = new DeletePermissionsReqDto(userGuid, permissionId, currentUserId);
      const result = await this._permissionService.delete(reqDto);
      if (result) {
        res.status(200).json({ data: result, message: events.permissions.permissionDeleted });
      } else {
        res.status(400).json({ data: result });
      }
    } catch (error) {
      next(error);
    }
  };

  private getRequestParams(req: RequestWithIdentity): {
    userGuid: string | undefined;
    permissionId: number | undefined;
    currentUserId: number | undefined;
  } {
    const userGuid = isGuid(req?.params?.userId) ? req.params.userId : undefined;
    const permissionId = toNumber(req?.params?.permissionId) ?? undefined;
    const currentUserId = this.getCurrentUserId(req);
    return { userGuid, permissionId, currentUserId };
  }
}
