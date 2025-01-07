import { ResourceInfo } from './../utils/util';
import { createContainerAt } from '@inrupt/solid-client';
import type { Logger } from '../logger';
import { ICommandOptions, setOptionDefaults } from './solid-command';

const LDP = "http://www.w3.org/ns/ldp#";

export interface ICommandOptionsMakeDirectory extends ICommandOptions { }

export default async function makeDirectory(url: string, options?: ICommandOptionsMakeDirectory) {
  let commandOptions = setOptionDefaults<ICommandOptionsMakeDirectory>(options || {});
  try {
    let container = await createContainerAt(url, { fetch: commandOptions.fetch });
    let info: ResourceInfo = {
      url,
      isDir: true,
      modified: new Date(),
      types: [LDP+"Container", LDP+"BasicContainer", LDP+"Resource"],
    }
    if (commandOptions.verbose) commandOptions.logger.log(`Container successfully created at ${url}`);
    return info
  } catch (e) {
    throw new Error("Target container may exist already")
  }
}
