import { isDirectory, readRemoteDirectoryRecursively } from '../utils/util';
import { list } from '..';
import chalk from 'chalk';
import { deleteContainer, deleteFile } from '@inrupt/solid-client';

export type RemoveOptions = {
  fetch: any,
  recursive?: boolean,
  verbose?: boolean,
}

export default async function remove(url: string, options: RemoveOptions) {
  if (isDirectory(url)) {
    const listing = await list(url, { fetch: options.fetch })
    if(!listing || listing.length === 0) {
      // Remove single directory
      await removeContainer(url, options)
    } else if (!options.recursive) {
      console.error('Please use the recursive option when removing containers')
      return;
    } else {
      await removeContainerRecursively(url, options)
    }
  } else {
    await removeFile(url, options)
  }
}

async function removeFile(url: string, options: RemoveOptions) {
  await deleteFile(url, { fetch: options.fetch })
  if (options.verbose) console.log(`Removed ${url}`)
  return;
}

async function removeContainer(url: string, options: RemoveOptions) {
  await deleteContainer(url, { fetch: options.fetch })
  if (options.verbose) console.log(`Removed ${chalk.blue.bold(url)}`)
  return;

}

async function removeContainerRecursively(url: string, options: RemoveOptions) {
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