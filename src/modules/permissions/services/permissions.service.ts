import { events } from '@events';
import { BaseService } from '@modules/common';
import {
  AddPermissionReqDto,
  DeletePermissionsReqDto,
  PermissionAddedEvent,
  PermissionDeletedEvent,
  PermissionsRepository,
  SystemPermission,
} from '@modules/permissions';
import { isEnumValue, isGuid, isNullOrUndefined } from '@utils';
import { Container, Service } from 'typedi';

@Service()
export class PermissionsService extends BaseService {
  private readonly _permissionRepository: PermissionsRepository;

  public constructor() {
    super();
    this._permissionRepository = Container.get(PermissionsRepository);
  }

  public async add(reqDto: AddPermissionReqDto): Promise<boolean> {
    if (!isGuid(reqDto.userGuid) || !isEnumValue(SystemPermission, reqDto.permissionId)) {
      return false;
    }

    const result = await this._permissionRepository.add(reqDto);

    if (result) {
      this._eventDispatcher.dispatch(
        events.permissions.permissionAdded,
        new PermissionAddedEvent(reqDto.userGuid, reqDto.permissionId, reqDto.currentUserId),
      );
    }

    return result;
  }

  public async delete(reqDto: DeletePermissionsReqDto): Promise<boolean> {
    if (!isGuid(reqDto.userGuid) || (!isNullOrUndefined(reqDto.permissionId) && !isEnumValue(SystemPermission, reqDto.permissionId))) {
      return false;
    }

    const result = await this._permissionRepository.delete(reqDto);

    if (result) {
      this._eventDispatcher.dispatch(
        events.permissions.permissionDeleted,
        new PermissionDeletedEvent(reqDto.userGuid, reqDto.permissionId, reqDto.currentUserId),
      );
    }

    return result;
  }
}
