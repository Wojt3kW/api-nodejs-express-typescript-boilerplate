import { SECRET_AUDIENCE, SECRET_ISSUER, SECRET_KEY } from '@config';
import { UnauthorizedException, errorKeys } from '@exceptions';
import { DataStoredInToken, Identity, RequestWithIdentity } from '@modules/auth';
import { PermissionsRepository } from '@modules/permissions';
import { UsersRepository } from '@modules/users';
import { isNullOrEmptyString, isNullOrUndefined } from '@utils';
import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';
import Container from 'typedi';

const getAuthorization = (req: Request): string | null => {
  const cookie: any = req.cookies?.Authorization;
  if (!isNullOrUndefined(cookie)) {
    return cookie;
  }

  const header: string | null | undefined = req.header('Authorization');
  if (!isNullOrEmptyString(header)) {
    const splittedHeader = header!.split('Bearer ');
    return (splittedHeader?.length ?? 0) > 1 ? splittedHeader[1] : null;
  }

  return null;
};

export const setIdentity = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authorization: string | null = getAuthorization(req);
    if (isNullOrEmptyString(authorization)) {
      req.identity = new Identity(undefined, []);
      next();
    } else {
      const { id } = verify(authorization!, SECRET_KEY!, {
        complete: true,
        algorithms: ['HS256'],
        clockTolerance: 0,
        ignoreExpiration: false,
        ignoreNotBefore: false,
        audience: SECRET_AUDIENCE,
        issuer: SECRET_ISSUER,
      }).payload as DataStoredInToken;
      const userRepository = Container.get(UsersRepository);
      const user = await userRepository?.getByUuid(id);

      if (isNullOrUndefined(user)) {
        next(new UnauthorizedException(errorKeys.login.Wrong_Authentication_Token));
      } else {
        const permissionRepository = Container.get(PermissionsRepository);
        const permissions = await permissionRepository.getUserPermissions(user!.id);
        req.identity = new Identity(user, permissions);
        next();
      }
    }
  } catch (error) {
    next(new UnauthorizedException(errorKeys.login.Wrong_Authentication_Token));
  }
};
