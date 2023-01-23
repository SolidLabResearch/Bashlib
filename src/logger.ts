export interface Logger {
  log(...msg: string[]): void;
  error(...msg: string[]): void;
}
