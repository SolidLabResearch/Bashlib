import { createContainerAt } from '@inrupt/solid-client';
import type { Logger } from '../logger';
import { ICommandOptions, setOptionDefaults } from './solid-command';

export interface ICommandOptionsMakeDirectory extends ICommandOptions { }

export default async function makeDirectory(url: string, options: ICommandOptionsMakeDirectory) {
  let commandOptions = setOptionDefaults<ICommandOptionsMakeDirectory>(options);
  
  let info = await createContainerAt(url, { fetch: commandOptions.fetch });
  if (commandOptions.verbose) commandOptions.logger.log(`Container successfully created at ${url}`);
  return info
}
