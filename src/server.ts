import { App } from '@/app';
import { CommunityRoute } from '@modules/community';
import { NewsRoute } from '@modules/news';
import { PermissionsRoute } from '@modules/permissions';
import { UsersRoute } from '@modules/users';
import { ValidateEnv } from '@utils/validateEnv';

ValidateEnv();

const app = new App([new PermissionsRoute(), new CommunityRoute(), new NewsRoute(), new UsersRoute()]);

app.listen();
