import { PrismaClient } from '@prisma/client';
import { CryptoService } from './../modules/auth/services/crypto.service';
import { SystemPermission } from './../modules/permissions/enums/system-permission.enum';
import { generateRandomNumber, getAdminLoginData } from './../utils/tests.utils';

const prisma = new PrismaClient();
const cryptoService = new CryptoService();

const seedSystemPermission = async (prisma: PrismaClient): Promise<void> => {
  await prisma.systemPermission.upsert({
    where: { id: 10 },
    update: {},
    create: {
      id: 10,
      name: 'UserList',
      description: 'User list permission group',
    },
  });

  await prisma.systemPermission.upsert({
    where: { id: SystemPermission.PreviewUserList },
    update: {},
    create: {
      id: SystemPermission.PreviewUserList,
      parentId: 10,
      name: 'PreviewUserList',
      description: 'Permission that allows preview User list',
    },
  });

  await prisma.systemPermission.upsert({
    where: { id: SystemPermission.PreviewUserProfile },
    update: {},
    create: {
      id: SystemPermission.PreviewUserProfile,
      parentId: 10,
      name: 'PreviewUserProfile',
      description: 'Permission that allows preview any User profile',
    },
  });

  await prisma.systemPermission.upsert({
    where: { id: SystemPermission.AddUser },
    update: {},
    create: {
      id: SystemPermission.AddUser,
      parentId: 10,
      name: 'AddUser',
      description: 'Permission that allows add new User (without password)',
    },
  });

  await prisma.systemPermission.upsert({
    where: { id: SystemPermission.EditUserProfile },
    update: {},
    create: {
      id: SystemPermission.EditUserProfile,
      parentId: 10,
      name: 'EditUserProfile',
      description: 'Permission that allows edit any User profile information (without password)',
    },
  });

  await prisma.systemPermission.upsert({
    where: { id: SystemPermission.DeactivateUser },
    update: {},
    create: {
      id: SystemPermission.DeactivateUser,
      parentId: 10,
      name: 'DeactivateUser',
      description: 'Permission that allows deactivate User',
    },
  });

  await prisma.systemPermission.upsert({
    where: { id: SystemPermission.ActivateUser },
    update: {},
    create: {
      id: SystemPermission.ActivateUser,
      parentId: 10,
      name: 'ActivateUser',
      description: 'Permission that allows activate User',
    },
  });

  await prisma.systemPermission.upsert({
    where: { id: SystemPermission.DeleteUser },
    update: {},
    create: {
      id: SystemPermission.DeleteUser,
      parentId: 10,
      name: 'DeleteUser',
      description: 'Permission that allows delete User (user is not deleted, is anonymized)',
    },
  });

  await prisma.systemPermission.upsert({
    where: { id: SystemPermission.UnlockUser },
    update: {},
    create: {
      id: SystemPermission.UnlockUser,
      parentId: 10,
      name: 'UnlockUser',
      description: 'Permission that allows unlock User (when user locks his profile by entering the wrong login or password several times)',
    },
  });

  await prisma.systemPermission.upsert({
    where: { id: 20 },
    update: {},
    create: {
      id: 20,
      name: 'PermissionAdministration',
      description: 'Permissions administration permission group',
    },
  });

  await prisma.systemPermission.upsert({
    where: { id: SystemPermission.AddPermission },
    update: {},
    create: {
      id: SystemPermission.AddPermission,
      parentId: 20,
      name: 'AddPermission',
      description: 'Permission that allows to add permissions to other users',
    },
  });

  await prisma.systemPermission.upsert({
    where: { id: SystemPermission.DeletePermission },
    update: {},
    create: {
      id: SystemPermission.DeletePermission,
      parentId: 20,
      name: 'DeletePermission',
      description: 'Permission that allows to remove permissions from other users',
    },
  });
};

const seedUsers = async (prisma: PrismaClient): Promise<void> => {
  const adminLoginData = getAdminLoginData();
  let email: string = adminLoginData.email;
  let phone: string = adminLoginData.phone;
  let salt = cryptoService.generateSalt();
  let password = cryptoService.hashPassword(salt, adminLoginData.password);
  await prisma.user.upsert({
    where: { email_phone: { email, phone } },
    update: {},
    create: {
      email,
      phone,
      salt,
      password,
      isActive: true,
      firstName: 'has full access',
      lastName: 'only for tests',
    },
  });

  const user = await prisma.user.findUnique({ where: { email_phone: { email, phone } } });

  const permissions = await prisma.systemPermission.findMany({ where: { id: { gte: 100 } } });
  for await (const permission of permissions) {
    await prisma.userSystemPermission.upsert({
      where: { userId_permissionId: { userId: user!.id, permissionId: permission.id } },
      update: {},
      create: {
        permissionId: permission.id,
        userId: user!.id,
        assignedAt: new Date(),
        assignedById: user!.id,
      },
    });
  }

  email = 'user1';
  phone = generateRandomNumber(9);
  salt = cryptoService.generateSalt();
  password = cryptoService.hashPassword(salt, 'p@ss');
  await prisma.user.upsert({
    where: { email_phone: { email, phone } },
    update: {},
    create: {
      email,
      phone,
      salt,
      password,
      isActive: true,
      firstName: 'only for tests',
      lastName: 'only for tests',
      systemPermissions: {
        createMany: {
          data: [
            {
              permissionId: SystemPermission.PreviewUserList,
              assignedAt: new Date(),
              assignedById: user!.id,
            },
            {
              permissionId: SystemPermission.PreviewUserProfile,
              assignedAt: new Date(),
              assignedById: user!.id,
            },
          ],
        },
      },
    },
  });
};

async function main(): Promise<void> {
  await seedSystemPermission(prisma);

  await seedUsers(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
