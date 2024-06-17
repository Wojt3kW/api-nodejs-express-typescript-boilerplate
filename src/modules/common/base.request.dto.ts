export abstract class BaseReqDto {
  public readonly currentUserId: number | undefined;

  public constructor(currentUserId: number | undefined) {
    this.currentUserId = currentUserId;
  }
}
