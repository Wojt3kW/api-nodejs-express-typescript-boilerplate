import { BadRequestException } from '@exceptions';
import { plainToInstance } from 'class-transformer';
import { validateOrReject, ValidationError } from 'class-validator';
import { NextFunction, Request, Response } from 'express';

export const validateData = (type: any, skipMissingProperties = false, whitelist = false, forbidNonWhitelisted = false) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const dto = plainToInstance(type, req.body);
    validateOrReject(dto, { skipMissingProperties, whitelist, forbidNonWhitelisted })
      .then(() => {
        req.body = dto;
        next();
      })
      .catch((errors: ValidationError[]) => {
        const message = errors.map((error: ValidationError) => [...new Set(Object.values(error.constraints ?? {}))]).join(', ');
        next(new BadRequestException(message));
      });
  };
};
