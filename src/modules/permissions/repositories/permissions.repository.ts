import { UserSystemPermission } from '@db/DbModels';
import { BaseRepository } from '@modules/common';
import { AddPermissionReqDto, DeletePermissionsReqDto, SystemPermission } from '@modules/permissions';
import { UsersRepository } from '@modules/users';
import { getUtcNow, isArrayEmpty, isEnumValue, isNullOrUndefined, isPositiveNumber } from '@utils';
import Container, { Service } from 'typedi';

@Service()
export class PermissionsRepository extends BaseRepository {
  private readonly _userRepository: UsersRepository;

  public constructor() {
    super();
    this._userRepository = Container.get(UsersRepository);
  }

  public async getUserPermissions(userId: number): Promise<SystemPermission[]> {
    if (!isPositiveNumber(userId)) {
      return [];
    }

    const permissions = await this._dbContext.userSystemPermission.findMany({ where: { userId } });

    if (isArrayEmpty(permissions)) {
      return [];
    }

    return permissions.map(m => m.permissionId);
  }

  public async add(reqDto: AddPermissionReqDto): Promise<boolean> {
    const userId = await this._userRepository.getIdByUuid(reqDto.userGuid);

    if (!isPositiveNumber(userId) || !isEnumValue(SystemPermission, reqDto.permissionId)) {
      return false;
    }

    const existQuery = { userId_permissionId: { userId: userId!, permissionId: reqDto.permissionId! } };

    const existedPermission: UserSystemPermission | null = await this._dbContext.userSystemPermission.findUnique({
      where: existQuery,
    });

    if (!isNullOrUndefined(existedPermission)) {
      return true;
    }

    await this._dbContext.userSystemPermission.create({
      data: {
        user: {
          connect: { id: userId },
        },
        permission: {
          connect: { id: reqDto.permissionId },
        },
        assignedAt: getUtcNow(),
        assignedBy: {
          connect: { id: reqDto.currentUserId },
        },
      },
    });

    return true;
  }

  public async delete(reqDto: DeletePermissionsReqDto): Promise<boolean> {
    const userId = await this._userRepository.getIdByUuid(reqDto.userGuid);

    if (!isPositiveNumber(userId) || (!isNullOrUndefined(reqDto.permissionId) && !isEnumValue(SystemPermission, reqDto.permissionId))) {
      return false;
    }

    let existQuery;
    if (isEnumValue(SystemPermission, reqDto.permissionId)) {
      existQuery = {
        userId: userId!,
        permissionId: reqDto.permissionId!,
      };
    } else {
      existQuery = {
        userId: userId!,
      };
    }

    const exist = await this._dbContext.userSystemPermission.count({
      where: existQuery,
    });

    if (exist === 0) {
      return true;
    }

    let deleteResult;
    if (isEnumValue(SystemPermission, reqDto.permissionId)) {
      deleteResult = await this._dbContext.userSystemPermission.delete({
        where: {
          userId_permissionId: {
            userId: userId!,
            permissionId: reqDto.permissionId!,
          },
        },
      });
    } else {
      deleteResult = await this._dbContext.user.update({
        where: {
          id: userId,
        },
        data: {
          systemPermissions: {
            deleteMany: {},
          },
        },
        include: {
          systemPermissions: true,
        },
      });
    }

    return !isNullOrUndefined(deleteResult);
  }
}
