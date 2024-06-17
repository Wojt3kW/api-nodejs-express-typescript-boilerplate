import { EventDispatcher } from 'event-dispatch';

export class EventDispatcherService {
  private static instance: any | undefined = undefined;

  private readonly _eventDispatcher: EventDispatcher;

  private constructor() {
    this._eventDispatcher = new EventDispatcher();
  }

  private static readonly getInstance = (): EventDispatcherService => {
    if (EventDispatcherService.instance === undefined) {
      EventDispatcherService.instance = new EventDispatcherService();
    }

    return EventDispatcherService.instance;
  };

  public static getEventDispatcher(): EventDispatcher {
    return EventDispatcherService.getInstance()._eventDispatcher;
  }
}
