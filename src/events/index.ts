export const events = {
  users: {
    userLoggedIn: 'onUserLoggedIn',
    inactiveUserTriesToLogIn: 'inactiveUserTriesToLogIn',
    lockedUserTriesToLogIn: 'lockedUserTriesToLogIn',
    failedLoginAttempt: 'onFailedLoginAttempt',
    userLockedOut: 'onUserLockedOut',
    userRetrieved: 'onUserRetrieved',
    userCreated: 'onUserCreated',
    userDeleted: 'onUserDeleted',
    userActivated: 'onUserActivated',
    userDeactivated: 'onUserDeactivated',
  },
  permissions: {
    permissionAdded: 'onPermissionAdded',
    permissionDeleted: 'onPermissionDeleted',
  },
};

export { Event } from './Event';

export { EventDispatcherService } from './event-dispatcher.service';
