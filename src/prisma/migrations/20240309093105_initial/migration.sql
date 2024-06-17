-- CreateTable
CREATE TABLE `Users` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `Uuid` VARCHAR(36) NOT NULL,
    `Email` VARCHAR(320) NOT NULL,
    `EmailConfirmed` BOOLEAN NOT NULL DEFAULT false,
    `Phone` VARCHAR(30) NOT NULL,
    `PhoneConfirmed` BOOLEAN NOT NULL DEFAULT false,
    `Password` VARCHAR(1024) NOT NULL,
    `Salt` VARCHAR(64) NOT NULL,
    `FirstName` VARCHAR(255) NULL,
    `LastName` VARCHAR(255) NULL,
    `BirthDay` DATE NULL,
    `JoiningYear` DATE NULL,
    `IsActive` BOOLEAN NOT NULL DEFAULT false,
    `CreatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `UpdatedAt` TIMESTAMP(0) NULL,
    `LastLoginAt` TIMESTAMP(0) NULL,
    `FailedLoginAttempts` INTEGER NOT NULL DEFAULT 0,
    `IsLockedOut` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `UQ_User_Uuid`(`Uuid`),
    UNIQUE INDEX `UQ_User_Email_Phone`(`Email`, `Phone`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `System_Permissions` (
    `Id` INTEGER NOT NULL,
    `ParentId` INTEGER NULL,
    `Name` VARCHAR(50) NOT NULL,
    `Description` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User_To_SystemPermissions` (
    `UserId` INTEGER NOT NULL,
    `PermissionId` INTEGER NOT NULL,
    `AssignedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `AssignedById` INTEGER NOT NULL,

    PRIMARY KEY (`UserId`, `PermissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `System_Permissions` ADD CONSTRAINT `FK_SystemPermission_ParentId` FOREIGN KEY (`ParentId`) REFERENCES `System_Permissions`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User_To_SystemPermissions` ADD CONSTRAINT `FK_UserSystemPermission_To_User_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User_To_SystemPermissions` ADD CONSTRAINT `FK_UserSystemPermission_To_SystemPermission` FOREIGN KEY (`PermissionId`) REFERENCES `System_Permissions`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User_To_SystemPermissions` ADD CONSTRAINT `FK_UserSystemPermission_To_User_AssignedById` FOREIGN KEY (`AssignedById`) REFERENCES `Users`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;
