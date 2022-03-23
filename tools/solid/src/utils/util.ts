const fs = require('fs')
const path = require('path')
var LinkHeader = require( 'http-link-header' )

export type FileInfo = { 
  absolutePath: string, 
  relativePath: string, 
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