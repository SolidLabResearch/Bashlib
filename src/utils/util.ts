import { getSolidDataset, getContainedResourceUrlAll, getUrl, getUrlAll, getThing, getThingAll, getDatetime, getInteger, SolidDataset, acp_ess_2, hasAccessibleAcl, FetchError } from '@inrupt/solid-client';
import { requestUserIdp } from './userInteractions';
import type { Logger } from '../logger';
import * as fs from "fs"
import * as path from "path"
import LinkHeader from "http-link-header"
import * as mime from "mime-types"

export type DirInfo = {
  files: FileInfo[], 
  directories: FileInfo[], 
  aclfiles: FileInfo[]
}

interface FileLoadingFunction {
  (): Promise< {
    buffer?: Buffer;
    blob?: Blob;
    contentType: string;
  }>
}

export type FileInfo = { 
  absolutePath: string, 
  relativePath?: string,
  directory?: string, 
  contentType?: string,
  buffer?: Buffer,
  lastModified?: Date,
  blob?: Blob,
  loadFile?: FileLoadingFunction
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

export function isDirectoryContents(resourcePath: string) : boolean {
  return resourcePath.endsWith('/.')
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
  // TODO:: MAKE MORE ROBUST

  // Check current resource header
  let res = await fetch(url, {method: "HEAD"})

  if (!res.ok) return null // throw new Error(`HTTP Error Response requesting ${url}: ${res.status} ${res.statusText}`);
  let linkHeaders;
  if (res.ok) linkHeaders = res.headers.get('Link')
  if (linkHeaders) { 
    let headers = LinkHeader.parse(linkHeaders)
    for (let header of headers.refs) {
      if (header.uri === 'http://www.w3.org/ns/pim/space#Storage' && header.rel === 'type') {
        return url.endsWith('/') ? url : url + '/';
      }
    }
  }

  // Check current resource for link
  try {
    let ds = await getSolidDataset(url)
    let thing = ds && getThing(ds, url)
    let storageUrl = thing && getUrl(thing, 'http://www.w3.org/ns/pim/space#storage')
    if (storageUrl) return storageUrl;
  } catch (_ignored) { }

  let splitUrl = url.split('/')
  let index = url.endsWith('/') ? splitUrl.length - 2 : splitUrl.length - 1
  let nextUrl = splitUrl.slice(0, index).join('/') + '/'
  
  return getPodRoot(nextUrl, fetch)
}

export async function getWebIDIdentityProvider(webId: string) { 
   // TODO:: MAKE SPEC COMPLIANT AND MORE FALLBACKS N STUFF
  let ds = await getSolidDataset(webId);
  if (!ds) return null;
  let thing = await getThing(ds, webId);
  if (!thing) return null;
  let idp = getUrl(thing, "http://www.w3.org/ns/solid/terms#oidcIssuer")

  if (!idp) idp = await requestUserIdp()
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

export interface IReadOptions {
  fetch: typeof globalThis.fetch,
  verbose?: boolean,
  listDirectories?: boolean,
  all?: boolean,
}

export async function readRemoteDirectoryRecursively(
  root_path: string, options: IReadOptions, local_path: string = '', files: FileInfo[] = [], directories: FileInfo[] = [], aclfiles: FileInfo[] = []
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

export async function* generateRecursiveListing( baseContainerURI: string, options: IReadOptions ): AsyncGenerator<FileInfo, any, undefined> {
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


export async function getAclAndMetadata(url: any, containerUrl: string, fetch: Function, headers?: any) : Promise<{acl: ResourceInfo | null, meta: ResourceInfo | null}> {
  let foundHeaders: {acl: ResourceInfo | null, meta: ResourceInfo | null} = { acl: null, meta: null }
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
      try {
        const aclResource = await getResourceInfoFromHeaders(header.uri, containerUrl, fetch)
        if(aclResource) foundHeaders.acl = aclResource;
      } catch (e) { } //todo:
      
    } else if (header.rel === 'describedby') {

      try {
        const metaResourceInfo = await getResourceInfoFromHeaders(header.uri, containerUrl, fetch)
        if(metaResourceInfo) foundHeaders.meta = metaResourceInfo;
      } catch (e) { } //todo:
    }
  }
  return foundHeaders;
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
      // if (await checkRemoteFileAccess(header.uri, fetch)) {
        foundHeaders.acl = header.uri;
      // }
    } else if (header.rel === 'describedby') {
      // Check if file exists first
      // if (await checkRemoteFileAccess(header.uri, fetch)) {
        foundHeaders.meta = header.uri;
      // }
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
  } else {
    resourceInfo = {
      url: resourceUrl,
      relativePath: baseUrl ? resourceUrl.slice(baseUrl.length) : undefined, 
      isDir: resourceUrl.endsWith('/') // Note: it might be best to dereference the URL to check for sure, but this saves an extra request.
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
    relativePath: containerUrl && resourceUrl.startsWith(containerUrl) ? resourceUrl.slice(containerUrl.length) : undefined, 
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

export function writeErrorString(explanation: string, e: any, options?: { logger?: Logger }) {
  let message = (e instanceof Error) ? e.message : String(e);
  (options?.logger || console).error(`${explanation}: ${message}`);
}

const parseableExtensions = [
  "ttl",
  "trig",
  "nt",
  "nq",
  "jsonld",
  "rdf",
]
export async function isRDFResource(fileInfo: FileInfo, fetch: any) {
  let extension: string | boolean;
  if (fileInfo.contentType) {
    extension = mime.extension(fileInfo.contentType)
    if (!!extension && parseableExtensions.indexOf(extension) !== -1) return true;
    return false;
  } 
  for (let extension of parseableExtensions) {
    if (fileInfo.absolutePath.endsWith("."+extension)) return true;
  }
  // could be non-rdf extension OR rdf with no extension
  const split = fileInfo.absolutePath.split('/')
  if (!!mime.contentType(split[split.length - 1])) { return false }
  // We cannot discover any info, so we need to go look

  const res = await fetch(fileInfo.absolutePath);
  let contentType = res.headers.get('Content-Type')

  const ct = mime.extension(contentType)
  if(!contentType) return false;
  else if (!!ct && parseableExtensions.indexOf(ct) !== -1) return true;
  return false
}

export async function discoverAccessMechanism(url: string, fetch: any) {
  // We need to first check acp because Inrupt libs are kinda wack and reuse of acl rel header is confusing their own libs.
  try {
    const acpInfo = await acp_ess_2.getResourceInfoWithAcr(url, { fetch })  
    const acp = acp_ess_2.hasAccessibleAcr(acpInfo)
    if (acp) return({ acp: true, acl: false })
  } catch {}
  
  // Now we check acl
  try {
    const dataset = await acp_ess_2.getResourceInfoWithAccessDatasets(url, { fetch })  
    const acl = hasAccessibleAcl(dataset) // && !acp -> is implicit here
    if (acl) return({ acp: false, acl: true })
  } catch {}
  
  return ({ acp: false, acl: false })
}

export async function resourceExists(url: string, fetch: any) {
  try {
      let res = await fetch(url, { method: "HEAD" })
      return res.ok;
  }
  catch (e) {
      if (e instanceof FetchError && e.response.status === 404) {
          return false;
      } 
      else {
          return undefined;
      }
  }
}


export async function compareLastModifiedTimes(sourceResourceTime: Date | undefined, targetResourceTime: Date | undefined ): Promise<{ 
  write: boolean, request: boolean
 }> {
  if (!targetResourceTime || !sourceResourceTime) return { write: false, request: true }
  else if ( targetResourceTime < sourceResourceTime ) return { write: true, request: false }
  else return { write: false, request: false }
}


export async function getRemoteResourceLastModified(url: string, fetch: any): Promise< Date | undefined > {
  try {
    let res = await fetch(url, { method: "HEAD" })
    if (!res.ok) return undefined
    const lastModified = res.headers.get('last-modified')
    return new Date(lastModified)
  }
  catch (e) { 
    return undefined 
  }
}


export function getLocalFileLastModified(path: string): Date {
  return fs.statSync(path).mtime
}