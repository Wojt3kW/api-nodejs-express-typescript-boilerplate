import { SystemPermission } from '@modules/permissions';

export interface DataStoredInToken {
  id: string | undefined;
  permissions: SystemPermission[] | undefined;
}
