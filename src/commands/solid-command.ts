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
  if (!options.fetch) options.fetch = fetch
  if (!options.verbose) options.verbose = false;
  if (!options.logger) options.logger = console;

  return options as IPreparedCommandOptions & T
}