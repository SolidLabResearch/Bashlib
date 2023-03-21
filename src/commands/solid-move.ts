import copy from './solid-copy';
import { isDirectory, isRemote } from '../utils/util';
import remove from './solid-remove';
import type { Logger } from '../logger';

export interface MoveOptions {
  fetch: any
  all: boolean,
  verbose: boolean,
  logger?: Logger,
}
export default async function move(source: string, destination: string, options: MoveOptions) {
  let source_is_dir = isDirectory(source)
  let dest_is_dir = isDirectory(destination)
  if (source_is_dir && !dest_is_dir) {
    (options.logger || console).error('Cannot move directory to a file')
    return;
  } 

  if (!source_is_dir && dest_is_dir) {
    // Define the file to where the resource will be sent
    const fileName = source.split('/').slice(-1)[0]
    destination = destination + fileName
  }
  
  // Copy from source to destination
  await copy(source, destination, options)

  // Remove source recursively
  if (isRemote(source)) {
    await remove(source, { recursive: true, ...options });
  }
}