import { generateRecursiveListing, FileInfo } from '../utils/util';
import { ICommandOptions, setOptionDefaults } from './solid-command';

export interface ICommandOptionsFind extends ICommandOptions {
  all?: boolean,
  full?: boolean,
  listDirectories?: boolean,
}

export default async function* find(rootcontainer: string, filename: string, options?: ICommandOptionsFind) {
  let commandOptions = setOptionDefaults(options || {});

  if (!filename || !rootcontainer) return;
  for await (let fileInfo of generateRecursiveListing(rootcontainer, commandOptions)) {
    const match = processFileNameMatching(filename, fileInfo, commandOptions)
    if (match) yield fileInfo
  }
}

function processFileNameMatching(fileName: string, fileInfo: FileInfo, options: ICommandOptionsFind) : boolean {
  const regex = new RegExp(fileName)
  const name = options.full ? fileInfo.absolutePath : (fileInfo.relativePath || fileInfo.absolutePath)
  const match = name.match(regex)
  return !!match
  
}