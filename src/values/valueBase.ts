export abstract class PlaybackValueBase {
  public type: string;
  public value: any;
  public abstract toBoolean(): boolean;
  public abstract toOutputString(): string;
  public execute(): this { return this; }
}