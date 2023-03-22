import { Logger } from './../logger';
import fetch from 'cross-fetch';

export interface ICommandOptions { 
  fetch?: typeof globalThis.fetch,
  verbose?: boolean,
  logger?: Logger,
}

export interface IPreparedCommandOptions { 
  fetch: typeof globalThis.fetch,
  verbose: boolean,
  logger: Logger,
}

export function setOptionDefaults<T>(options: ICommandOptions) { 
  options.fetch = fetch;
  options.verbose = false;
  options.logger = console;
  return options as IPreparedCommandOptions & T
}