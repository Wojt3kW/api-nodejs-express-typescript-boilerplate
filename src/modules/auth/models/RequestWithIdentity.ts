import { Request } from 'express';
import { Identity } from './Identity';

export interface RequestWithIdentity extends Request {
  identity: Identity;
}
