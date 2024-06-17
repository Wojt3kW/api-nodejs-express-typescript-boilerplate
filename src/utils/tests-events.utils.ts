import {
  FailedLoginAttemptEvent,
  InactiveUserTriesToLogInEvent,
  LockedUserTriesToLogInEvent,
  UserLockedOutEvent,
  UserLoggedInEvent,
} from '@modules/auth';
import { PermissionAddedEvent, PermissionDeletedEvent } from '@modules/permissions';
import { UserActivatedEvent, UserCreatedEvent, UserDeactivatedEvent, UserDeletedEvent, UserRetrievedEvent } from '@modules/users';
import { EventDispatcher } from 'event-dispatch';

const testEventHandlers: {
  onUserLoggedIn: (data: any) => void;
  inactiveUserTriesToLogIn: (data: any) => void;
  lockedUserTriesToLogIn: (data: any) => void;
  onFailedLoginAttempt: (data: any) => void;
  onUserLockedOut: (data: any) => void;
  onUserCreated: (data: any) => void;
  onUserRetrieved: (data: any) => void;
  onUserDeleted: (data: any) => void;
  onUserActivated: (data: any) => void;
  onUserDeactivated: (data: any) => void;
  onPermissionAdded: (data: any) => void;
  onPermissionDeleted: (data: any) => void;
} = {
  onUserLoggedIn: jest.fn((data: UserLoggedInEvent) => {}),
  inactiveUserTriesToLogIn: jest.fn((data: InactiveUserTriesToLogInEvent) => {}),
  lockedUserTriesToLogIn: jest.fn((data: LockedUserTriesToLogInEvent) => {}),
  onFailedLoginAttempt: jest.fn((data: FailedLoginAttemptEvent) => {}),
  onUserLockedOut: jest.fn((data: UserLockedOutEvent) => {}),
  onUserCreated: jest.fn((data: UserCreatedEvent) => {}),
  onUserRetrieved: jest.fn((data: UserRetrievedEvent) => {}),
  onUserDeleted: jest.fn((data: UserDeletedEvent) => {}),
  onUserActivated: jest.fn((data: UserActivatedEvent) => {}),
  onUserDeactivated: jest.fn((data: UserDeactivatedEvent) => {}),
  onPermissionAdded: jest.fn((data: PermissionAddedEvent) => {}),
  onPermissionDeleted: jest.fn((data: PermissionDeletedEvent) => {}),
};

const registerTestEventHandlers = (eventDispatcher: EventDispatcher): void => {
  Object.entries(testEventHandlers).forEach(([event, eventHandler]) => {
    eventDispatcher.on(event, eventHandler);
  });
};

export { registerTestEventHandlers, testEventHandlers };
