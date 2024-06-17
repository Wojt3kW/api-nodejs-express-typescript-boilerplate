import { HttpException } from '@exceptions/HttpException';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { logger } from '@utils/logger';
import { NextFunction, Request, Response } from 'express';
import { ErrorMiddleware } from './error.middleware';

jest.mock('@utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('ErrorMiddleware tests', () => {
  let error: HttpException;
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    error = new HttpException(400, 'Test error');
    req = {} as Request;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle HttpException and send response with status code and error message', async () => {
    await ErrorMiddleware(error, req, res, next);

    expect(logger.error).toHaveBeenCalledWith('[undefined] undefined >> StatusCode:: 400, Message:: Test error::[]');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ data: { message: 'Test error' } });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle TranslatableHttpException and send response with status code, error message, and arguments', async () => {
    const translatableError = new TranslatableHttpException(500, 'Test error', [1, 'arg']);
    await ErrorMiddleware(translatableError, req, res, next);

    expect(logger.error).toHaveBeenCalledWith('[undefined] undefined >> StatusCode:: 500, Message:: Test error::[1,"arg"]');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ data: { message: 'Test error', args: [1, 'arg'] } });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle unexpected error and call next middleware', async () => {
    const unexpectedError = new Error('Unexpected error');
    jest.spyOn(logger, 'error').mockImplementation(() => {
      throw unexpectedError;
    });

    await ErrorMiddleware(error, req, res, next);

    expect(logger.error).toHaveBeenCalledWith('[undefined] undefined >> StatusCode:: 400, Message:: Test error::[]');
    expect(next).toHaveBeenCalledWith(unexpectedError);
  });
});
