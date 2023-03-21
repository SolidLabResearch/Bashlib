import { isDirectory, readRemoteDirectoryRecursively } from '../utils/util';
import { list } from '..';
import chalk from 'chalk';
import { deleteContainer, deleteFile } from '@inrupt/solid-client';
import type { Logger } from '../logger';
import { ICommandOptions, setOptionDefaults, IPreparedCommandOptions } from './solid-command';

export interface ICommandOptionsRemove extends ICommandOptions {
  recursive?: boolean,
}

export default async function remove(url: string, options: ICommandOptionsRemove) {
  let commandOptions = setOptionDefaults<ICommandOptionsRemove>(options)

  if (isDirectory(url)) {
    const listing = await list(url, { fetch: commandOptions.fetch })
    if(!listing || listing.length === 0) {
      // Remove single directory
      await removeContainer(url, commandOptions)
    } else if (!commandOptions.recursive) {
      commandOptions.logger.error('Please use the recursive option when removing containers')
      return;
    } else {
      await removeContainerRecursively(url, commandOptions)
    }
  } else {
    await removeFile(url, commandOptions)
  }
}

async function removeFile(url: string, options: ICommandOptionsRemove & IPreparedCommandOptions) {
  await deleteFile(url, { fetch: options.fetch })
  if (options.verbose) options.logger.log(`Removed ${url}`)
  return;
}

async function removeContainer(url: string, options: ICommandOptionsRemove & IPreparedCommandOptions) {
  await deleteContainer(url, { fetch: options.fetch })
  if (options.verbose) options.logger.log(`Removed ${chalk.blue.bold(url)}`)
  return;

}

async function removeContainerRecursively(url: string, options: ICommandOptionsRemove & IPreparedCommandOptions) {
  let recursiveContainerInfo = await readRemoteDirectoryRecursively(url, options)
  let fileInfos = recursiveContainerInfo.files
  let containerInfos = recursiveContainerInfo.directories
  let containers = containerInfos.map(containerInfo => {
    return({
      url: containerInfo.absolutePath,
      depth: containerInfo.absolutePath.split('/').length
    }) 
  })
  // The current container info is not returned by the recursive read so we add it manually
  containers.push({
    url,
    depth: url.split('/').length
  })
  let sortedContainerInfo = containers.sort((a, b) => {
    if (!a.depth && !b.depth) return 0
    if (!a.depth) return 1
    if (!b.depth) return -1
    if (a.depth === b.depth) return (a.url.localeCompare(b.url))
    return b.depth - a.depth
  })
  for (let containerInfo of sortedContainerInfo) {
    let containerUrl = containerInfo.url;
    if (!containerUrl) {
      continue
    }
    let containedFiles = fileInfos.filter(fileInfo => fileInfo.directory === containerUrl)
    for (let file of containedFiles) {
      await removeFile(file.absolutePath, options)
    }
    await removeContainer(containerUrl, options)
  }
}

function onlyUnique(value: any, index: number, self: any[]) {
  return self.indexOf(value) === index;
}