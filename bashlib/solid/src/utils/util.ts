import { getSolidDataset, getContainedResourceUrlAll, getUrl, getUrlAll, getThing, getThingAll, getDatetime, getInteger, SolidDataset } from '@inrupt/solid-client';
const fs = require('fs')
const path = require('path')
var LinkHeader = require( 'http-link-header' )

export type DirInfo = {
  files: FileInfo[], 
  directories: FileInfo[], 
  aclfiles: FileInfo[]
}

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

export async function getPodRoot(url: string, fetch: Function): Promise<string | null> {
  // TODO:: MAKE SPEC COMPLIANT AND MORE FALLBACKS N STUFF
  let splitUrl = url.split('/')
  for (let index = splitUrl.length-1; index > 2; --index) {
    let currentUrl = splitUrl.slice(0, index).join('/') + '/'
    let res = await fetch(currentUrl)
    if (!res.ok) continue // throw new Error(`HTTP Error Response requesting ${url}: ${res.status} ${res.statusText}`);
    let linkHeaders = res.headers.get('Link')
    if (!linkHeaders) continue // return null;
    let headers = LinkHeader.parse(linkHeaders)
    for (let header of headers.refs) {
      if (header.uri === 'http://www.w3.org/ns/pim/space#Storage' && header.rel === 'type') {
        return currentUrl.endsWith('/') ? currentUrl : currentUrl + '/';
      }
    }
  }
  return null;
}

export async function getWebIDIdentityProvider(webId: string) { 
   // TODO:: MAKE SPEC COMPLIANT AND MORE FALLBACKS N STUFF
  let ds = await getSolidDataset(webId);
  if (!ds) return null;
  let thing = await getThing(ds, webId);
  if (!thing) return null;
  let idp = getUrl(thing, "http://www.w3.org/ns/solid/terms#oidcIssuer")
  return idp;
}

export async function getInbox(webId: string, fetch: Function) : Promise<string | null> {
  let dataset = await getSolidDataset(webId);
  if (!dataset) throw new Error('Could not retrieve profile document.')
  let thing = getThing(dataset, webId);
  if (!thing) throw new Error('Could not retrieve profile document.')
  let inbox = getUrl(thing, "http://www.w3.org/ns/ldp#inbox")
  return inbox;
}

export type ReadOptions = {
  fetch: any,
  verbose?: boolean,
  listDirectories?: boolean,
  all?: boolean,
}

export async function readRemoteDirectoryRecursively(
  root_path: string, options: ReadOptions, local_path: string = '', files: FileInfo[] = [], directories: FileInfo[] = [], aclfiles: FileInfo[] = []
  ): Promise<DirInfo> {
  // Make sure directory path always ends with a /
  if (local_path && !local_path.endsWith('/')) local_path = local_path + '/'
  if (root_path && !root_path.endsWith('/')) root_path = root_path + '/'
  let resourcePath = root_path + local_path
  let containerDataset = null;
  try {
    containerDataset = await getSolidDataset(resourcePath, { fetch: options.fetch })
  } catch (e) {
    if (options.verbose) console.error(`Could not read directory at ${root_path}: ${(<Error>e).message}`)
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
      if (await checkRemoteFileAccess(containerLinks.acl, options.fetch)) {
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
          if (await checkRemoteFileAccess(resourceLinks.acl, options.fetch)) {
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
  
  let recursiveReads = subdirRemoteURIs.map(subDirURI => {
    return new Promise((resolve, reject) => {
      readRemoteDirectoryRecursively(
        root_path, options, subDirURI, files, directories, aclfiles
      ).then(subDirInfo => resolve(subDirInfo))
    })
  })

  let subDirInfos = await Promise.all(recursiveReads) as DirInfo[];

  for (let subDirInfo of subDirInfos) {
    files = subDirInfo.files;
    directories = subDirInfo.directories
    aclfiles = subDirInfo.aclfiles
  }
  
  return { files, directories, aclfiles };
}

export async function* generateRecursiveListing( baseContainerURI: string, options: ReadOptions ): AsyncGenerator<FileInfo, any, undefined> {
  // Make sure directory path always ends with a /
  if (!baseContainerURI.endsWith('/')) baseContainerURI += '/'

  let containers : string[] = [];
  containers.push(baseContainerURI)

  let containerURI = containers.pop();
  while(containerURI) {
    // Process current directory
    let containerDataset = null;
    try {
      containerDataset = await getSolidDataset(containerURI, { fetch: options.fetch })
    } catch (e) {
      if (options.verbose) console.error(`Could not read directory at ${containerURI}: ${(<Error>e).message}`)
      containerURI = containers.pop();
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
    let resourceURIs = containerResourceURIs.filter((uri: string) => !uri.endsWith('/'));
    let containerURIs = containerResourceURIs.filter((uri: string) => uri.endsWith('/'));
    resourceURIs.sort()
    containerURIs.sort().reverse();
    
    for (let containedResourceURI of resourceURIs) {
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

    // We add them to the array in reverse, so we pop them in the right sorted orientation!
    for (let containedResourceURI of containerURIs) {
      containers.push(containedResourceURI)
    }

    containerURI = containers.pop();
  }  
}

async function getResourceHeaderLinks(url: string, fetch: any, baseUrl?: string ) : Promise<{acl?: FileInfo, meta?: FileInfo} | undefined> {
  let acl, meta;
  try { 
    let links = await checkHeadersForAclAndMetadata(url, fetch) 
    if (links && links.acl && await checkRemoteFileAccess(links.acl, fetch)) {
      acl = {
        absolutePath: links.acl,
        relativePath: baseUrl && getRelativePath(links.acl, baseUrl),
        directory: url,
      }
    }
    if (links && links.meta && await checkRemoteFileAccess(links.meta, fetch)) {
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
    const res = await fetch(url, {
      method: "HEAD"
    })
    if (!res.ok) throw new Error(`HTTP Error Response requesting ${url}: ${res.status} ${res.statusText}`);
    let linkHeaders = res.headers.get('Link')
    if (!linkHeaders) return foundHeaders;
    headers = LinkHeader.parse(linkHeaders)
  }
  for (let header of headers.refs) {
    if (header.rel === 'acl') {
      // Check if file exists first
      if (await checkRemoteFileAccess(header.uri, fetch)) {
        foundHeaders.acl = header.uri;
      }
    } else if (header.rel === 'describedby') {
      // Check if file exists first
      if (await checkRemoteFileAccess(header.uri, fetch)) {
        foundHeaders.meta = header.uri;
      }
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
      isDir: types.indexOf('http://www.w3.org/ns/ldp#Container') !== -1 || types.indexOf('http://www.w3.org/ns/ldp#BasicContainer') !== -1,
      modified, mtime, size, types
    }
  }
  return resourceInfo
}

export async function getResourceInfoFromHeaders(resourceUrl: string, containerUrl: string, fetch: any) : Promise<ResourceInfo | undefined> {
  let res = await fetch(resourceUrl, {method: "HEAD"})
  if (!res.ok) throw new Error(`HTTP Error Response requesting ${resourceUrl}: ${res.status} ${res.statusText}`);
  let headers = res.headers;
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
  let last_modified_header = res.headers.get('last-modified')
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


export async function getFileContentsAndInfo(url: string, options: {fetch: any, header: string[]}) : Promise<{url: string, contentType: string | undefined, text: string | undefined}> {
  let processedHeaders : any = {}
  for (let header of options.header || []) {
    let split = header.split(':')
    processedHeaders[split[0].trim()] = split[1].trim()
  }
  
  const fetchOptions = {
    method: "GET",
    headers: processedHeaders,
  }

  const res = await fetch(url, fetchOptions)
  if (!res.ok) throw new Error(`HTTP Error Response requesting ${url}: ${res.status} ${res.statusText}`);
  const contentType = getContentTypeHeader(res);
  const text = await res.text()

  return {url, contentType, text}
}

function getContentTypeHeader(reply: any) {
  return reply.headers.get('Content-type')
}

export async function checkRemoteFileExists(url: string, fetch: any){ 
  try {
    const res = await fetch(url, {method: 'HEAD'})
    // When are we sure a file does not exists
    if (res && res.status && res.status === 404) return false;
    return true 
  } catch (e) {
    return false;
  } 
}

export async function checkRemoteFileAccess(url: string, fetch: any){ 
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok;
  } catch (e) {
    return false;
  } 
}

export function getRelativePath(path: string, basePath: string) {
  if (!path.startsWith(basePath)) return undefined
  return path.slice(basePath.length);
}

export function writeErrorString(explanation: string, e: any) {
  let message = (e instanceof Error) ? e.message : String(e);
  console.error(`${explanation}: ${message}`)
}