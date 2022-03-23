import { getSolidDataset, getContainedResourceUrlAll } from '@inrupt/solid-client';
const fs = require('fs')
const path = require('path')
var LinkHeader = require( 'http-link-header' )

export type FileInfo = { 
  absolutePath: string, 
  relativePath: string,
  directory?: string, 
  contentType?: string,
  buffer?: Buffer,
  blob?: Blob
}

export function isRemote(resourcePath: string) {
  return resourcePath.startsWith('http://') || resourcePath.startsWith('https://')
}

export function isDirectory(resourcePath: string) : boolean {
  return resourcePath.endsWith('/')
}


export function ensureDirectoryExistence(filePath: string) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

export function fixLocalPath(filePath: string) {
  return filePath.endsWith('/')
  ? path.resolve(filePath) + '/'
  : path.resolve(filePath)
}

export async function getPodRoot(url: string, fetch: Function) : Promise<string | null> {
  let splitUrl = url.split('/')
  for (let index = splitUrl.length-1; index > 2; --index) {
    let currentUrl = splitUrl.slice(0, index).join('/') + '/'
    let result = await fetch(currentUrl)
    let linkHeaders = result.headers.get('Link')
    if (!linkHeaders) return null;
    let headers = LinkHeader.parse(linkHeaders)
    for (let header of headers.refs) {
      if (header.uri === 'http://www.w3.org/ns/pim/space#Storage' && header.rel === 'type') {
        return currentUrl;
      }
    }
  }
  return null;
}

export type ReadOptions = {
  fetch: any,
  verbose?: boolean,
  listDirectories?: boolean,
}

export async function readRemoteDirectoryRecursively(root_path: string, options: ReadOptions, local_path: string = '', files: FileInfo[] = [], directories: FileInfo[] = []): Promise<{files: FileInfo[], directories: FileInfo[]}> {
  // Make sure directory path always ends with a /
  if (local_path && !local_path.endsWith('/')) local_path = local_path + '/'
  if (root_path && !root_path.endsWith('/')) root_path = root_path + '/'
  let resourcePath = root_path + local_path

  let containerDataset = await getSolidDataset(resourcePath, { fetch: options.fetch })
  let containedURIs = getContainedResourceUrlAll(containerDataset);

  const subdirRemoteURIs: string[] = []

  for (let uri of containedURIs) {
    let localURI = uri.slice(root_path.length)
    if (uri.endsWith('/')) {
      subdirRemoteURIs.push(localURI) // Push the updated local path
      directories.push({
        absolutePath: uri,
        relativePath: localURI,
      })
    } else {
      files.push({ 
        absolutePath: uri, 
        relativePath: localURI,
        directory: resourcePath,
      });
    }
  }

  for (let subDirURI of subdirRemoteURIs) {
    const subDirInfo = await readRemoteDirectoryRecursively(root_path, options, subDirURI, files, directories)
    files = subDirInfo.files;
    directories = subDirInfo.directories
  }
  
  return { files, directories };
}