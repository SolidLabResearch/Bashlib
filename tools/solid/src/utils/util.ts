import { getSolidDataset, getContainedResourceUrlAll, getUrl, getUrlAll, getThing, getThingAll, getDatetime, getInteger, SolidDataset } from '@inrupt/solid-client';
import chalk from 'chalk';
const fs = require('fs')
const path = require('path')
var LinkHeader = require( 'http-link-header' )
var Queue = require('tiny-queue');


export type FileInfo = { 
  absolutePath: string, 
  relativePath?: string,
  directory?: string, 
  contentType?: string,
  buffer?: Buffer,
  blob?: Blob
}

export type ResourceInfo = {
  url: string,
  relativePath?: string,
  isDir: boolean,
  modified?: Date | null,
  mtime?: number | null,
  size?: number | null,
  types?: string[],
  metadata?: ResourceInfo
  acl?: ResourceInfo,
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
  all?: boolean,
}

export async function readRemoteDirectoryRecursively(
  root_path: string, options: ReadOptions, local_path: string = '', files: FileInfo[] = [], directories: FileInfo[] = [], aclfiles: FileInfo[] = []
  ): Promise<{files: FileInfo[], directories: FileInfo[], aclfiles: FileInfo[]}> {
  // Make sure directory path always ends with a /
  if (local_path && !local_path.endsWith('/')) local_path = local_path + '/'
  if (root_path && !root_path.endsWith('/')) root_path = root_path + '/'
  let resourcePath = root_path + local_path
  let containerDataset = null;
  try {
    containerDataset = await getSolidDataset(resourcePath, { fetch: options.fetch })
  } catch (e: any) {
    if (options.verbose) console.error(`Could not read directory at ${root_path}: ${e.message}`)
  }
  if (!containerDataset) return {files: [], directories: [], aclfiles: []}

  let containedURIs = getContainedResourceUrlAll(containerDataset);
  const subdirRemoteURIs: string[] = []

  // check for container .acl file
  if (options.all) {
    let containerLinks = null
    try {
      containerLinks = await checkHeadersForAclAndMetadata(resourcePath, options.fetch);
    } catch (_ignored) {}
    if (containerLinks && containerLinks.acl) {
      if (await checkFileExists(containerLinks.acl, options.fetch)) {
        aclfiles.push({
          absolutePath: containerLinks.acl,
          relativePath: containerLinks.acl.startsWith(resourcePath) ? containerLinks.acl.slice(resourcePath.length) : '',
          directory: resourcePath,
        })
      }
    }
  }
  
  for (let uri of containedURIs) {
    let localURI = uri.slice(root_path.length)

    // check for file .acl file
    if (options.all && !isDirectory(uri)) {
      let resourceLinks = null
      try {
        resourceLinks = await checkHeadersForAclAndMetadata(uri, options.fetch)
        if (resourceLinks && resourceLinks.acl) {
          if (await checkFileExists(resourceLinks.acl, options.fetch)) {
            aclfiles.push({ 
              absolutePath: resourceLinks.acl, 
              relativePath: resourceLinks.acl.startsWith(root_path) ? resourceLinks.acl.slice(root_path.length) : '',
              directory: resourcePath,
            });
          }
        }
      } catch (_ignored) {}
    }

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
    const subDirInfo = await readRemoteDirectoryRecursively(root_path, options, subDirURI, files, directories, aclfiles)
    files = subDirInfo.files;
    directories = subDirInfo.directories
    aclfiles = subDirInfo.aclfiles
  }
  
  return { files, directories, aclfiles };
}

export async function* generateRecursiveListing( baseContainerURI: string, options: ReadOptions ): AsyncGenerator<FileInfo, any, undefined> {
  // Make sure directory path always ends with a /
  if (!baseContainerURI.endsWith('/')) baseContainerURI += '/'

  let containerQueue = new Queue();
  containerQueue.push(baseContainerURI)

  let containerURI = containerQueue.shift();
  while(containerURI) {
    // Process current directory
    let containerDataset = null;
    try {
      containerDataset = await getSolidDataset(containerURI, { fetch: options.fetch })
    } catch (e: any) {
      if (options.verbose) console.error(`Could not read directory at ${containerURI}: ${e.message}`)
      containerURI = containerQueue.shift();
      continue;
    }
    
    if (options.listDirectories) yield({
      absolutePath: containerURI,
      relativePath: getRelativePath(containerURI, baseContainerURI),
    })

    // Check for container .acl files
    if (options.all) {
      let linkInfos = await getResourceHeaderLinks(containerURI, options.fetch, baseContainerURI)
      if (linkInfos?.acl) yield(linkInfos.acl)
      if (linkInfos?.meta) yield(linkInfos.meta)
    }

    let containerResourceURIs = await getContainedResourceUrlAll(containerDataset)
    containerResourceURIs.sort()
    for (let containedResourceURI of containerResourceURIs) {
      if (containedResourceURI.endsWith('/')) {
        containerQueue.push(containedResourceURI)
      } else {
        let fileInfo : FileInfo = {
          absolutePath: containedResourceURI,
          relativePath: getRelativePath(containedResourceURI, baseContainerURI),
          directory: containerURI,
        }
        yield(fileInfo)
        if (fileInfo && options.all) {
          let linkInfos = await getResourceHeaderLinks(containedResourceURI, options.fetch, baseContainerURI)
          if (linkInfos?.acl) yield(linkInfos.acl)
          if (linkInfos?.meta) yield(linkInfos.meta)
        }
      }
    }
    containerURI = containerQueue.shift();
  }  
}

async function getResourceHeaderLinks(url: string, fetch: any, baseUrl?: string ) : Promise<{acl?: FileInfo, meta?: FileInfo} | undefined> {
  let acl, meta;
  try { 
    let links = await checkHeadersForAclAndMetadata(url, fetch) 
    if (links && links.acl && await checkFileExists(links.acl, fetch)) {
      acl = {
        absolutePath: links.acl,
        relativePath: baseUrl && getRelativePath(links.acl, baseUrl),
        directory: url,
      }
    }
    if (links && links.meta && await checkFileExists(links.meta, fetch)) {
      meta = {
        absolutePath: links.meta,
        relativePath: baseUrl && getRelativePath(links.meta, baseUrl),
        directory: url,
      }
    }
  } catch (_ignored) {}
  if (acl || meta) {
    return { acl, meta}
  }
}

export async function checkHeadersForAclAndMetadata(url: any, fetch: Function, headers?: any) : Promise<{acl: string | null, meta: string | null}> {
  let foundHeaders = { acl: null, meta: null }
  // Fetch headers if not passed
  if (!headers) {
    const response = await fetch(url, {
      method: "HEAD"
    })
    let linkHeaders = response.headers.get('Link')
    if (!linkHeaders) return foundHeaders;
    headers = LinkHeader.parse(linkHeaders)
  }
  for (let header of headers.refs) {
    if (header.rel === 'acl') {
      foundHeaders.acl = header.uri;
    } else if (header.rel === 'describedby') {
      foundHeaders.meta = header.uri;
    }
  }
  return foundHeaders;
}

export function getResourceInfoFromDataset(dataset: SolidDataset, resourceUrl: string, baseUrl?: string) {
  const thing = getThing(dataset, resourceUrl)
  let resourceInfo: ResourceInfo | undefined;
  if (thing) {
    const modified = getDatetime(thing, 'http://purl.org/dc/terms/modified')
    const mtime = getInteger(thing, 'http://www.w3.org/ns/posix/stat#mtime')
    const size = getInteger(thing, 'http://www.w3.org/ns/posix/stat#size')
    const types = getUrlAll(thing, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
    // const aclUrl = getUrl(thing, 'http://www.w3.org/ns/auth/acl#accessControl')
    // const acl : FileInfo | undefined = aclUrl && {
    //   url: aclUrl,
    //   relativePath: baseUrl ? aclUrl.slice(baseUrl.length) : undefined,
    //   isDir: false
    // }
    resourceInfo = {
      url: resourceUrl,
      relativePath: baseUrl ? resourceUrl.slice(baseUrl.length) : undefined, 
      isDir: types.indexOf('http://www.w3.org/ns/ldp#Container') !== -1,
      modified, mtime, size, types
    }
  }
  return resourceInfo
}

export async function getResourceInfoFromHeaders(resourceUrl: string, containerUrl: string, fetch: any) : Promise<ResourceInfo | undefined> {
  let response = await fetch(resourceUrl, {method: "HEAD"})
  if (!response) return;
  let headers = response.headers;
  let linkHeaders = headers.get('Link')
  let linkTypes = [];
  if (linkHeaders)  {
    let parsedLinkHeaders = LinkHeader.parse(linkHeaders)
    for (let header of parsedLinkHeaders.refs) {
      if (header.rel === 'type') {
        linkTypes.push(header.uri)
      }
    }
  }
  let last_modified_header = response.headers.get('last-modified') || response.headers.get('date') // TODO:: Is this correct???? Double check!
  const modified = last_modified_header ? new Date(last_modified_header) : undefined
  const types = linkTypes.length ? linkTypes : undefined
  const resourceInfo : ResourceInfo = {
    url: resourceUrl,
    relativePath: containerUrl ? resourceUrl.slice(containerUrl.length) : undefined, 
    isDir: isDirectory(resourceUrl),
    modified, types
  }
  return resourceInfo
}

async function checkFileExists(url: string, fetch: any){ 
  try {
    const response = await fetch(url, {method: 'HEAD'})
    return response.status && response.status >= 200 && response.status < 300
  } catch (e) {
    return false;
  } 
}

export function getRelativePath(path: string, basePath: string) {
  if (!path.startsWith(basePath)) return undefined
  return path.slice(basePath.length);
}

export function writeErrorString(explanation: string, e: unknown) {
  console.error(`Error: ${chalk.red.bold(explanation)}: ${chalk.red((e as Error).message || e)}`)

}