import copyData from '../../dist/commands/solid-copy';
import { isDirectory } from '../utils/util';
import remove from './solid-remove';

export default async function move(source: string, destination: string, options: any) {
  let source_is_dir = isDirectory(source)
  let dest_is_dir = isDirectory(destination)
  if (source_is_dir !== dest_is_dir) {
    console.error('Please make sure both source and destination are either a file or a container (ending in [/])')
    return;
  } 
  
  // Copy from source to destination
  await copyData(source, destination, options)

  // Remove source recursively
  options.recursive = true;
  await remove(source, options);

}