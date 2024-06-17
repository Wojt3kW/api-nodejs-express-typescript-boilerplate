import { getUtcNow } from '@utils';

export abstract class Event {
  public readonly timestamp: Date;
  public readonly currentUserId: number | undefined;

  constructor(currentUserId: number | undefined = undefined) {
    this.timestamp = getUtcNow();
    this.currentUserId = currentUserId;
  }
}
