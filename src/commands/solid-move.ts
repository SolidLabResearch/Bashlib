import copy from './solid-copy';
import { isDirectory, isDirectoryContents, isRemote } from '../utils/util';
import remove from './solid-remove';
import { ICommandOptions, setOptionDefaults } from './solid-command';

export interface ICommandOptionsMove extends ICommandOptions {
  all?: boolean,
  neverOverride?: boolean,
  override?: boolean,
  verbose?: boolean,
}
export default async function move(source: string, destination: string, options?: ICommandOptionsMove) {
  let commandOptions = setOptionDefaults<ICommandOptionsMove>(options || {});

  let source_is_dir = isDirectory(source)
  let dest_is_dir = isDirectory(destination)
  if (source_is_dir && !dest_is_dir) {
    commandOptions.logger.error('Cannot move directory to a file')
    return;
  } 

  if (!source_is_dir && dest_is_dir) {
    // Define the file to where the resource will be sent
    const fileName = source.split('/').slice(-1)[0]
    destination = destination + fileName
  }
  
  // Copy from source to destination
  await copy(source, destination, commandOptions)

  // Remove source recursively
  if (isRemote(source)) {
    if (isDirectoryContents(source)) {
      const sourceDir = source.substring(0, source.length - 1)
      await remove(sourceDir, { recursive: true, saveRoot: true, ...commandOptions });
    } else {
      await remove(source, { recursive: true, ...commandOptions });
    }
    
  }
}