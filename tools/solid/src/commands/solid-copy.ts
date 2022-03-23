import fs from 'fs'
import path from 'path'
import { getFile, overwriteFile, getContentType, getContainedResourceUrlAll, getSolidDataset } from "@inrupt/solid-client"
import { isRemote, isDirectory, FileInfo, ensureDirectoryExistence, fixLocalPath } from '../utils/util';
import Blob = require("fetch-blob")

const mime = require('mime-types');

export type CopyOptions = {
  fetch: Function,
}

type srcOptions = {
  path: string,
  isRemote: boolean,
  isDir: boolean
}

type copyOptions = {
  fetch: Function,
  verbose: boolean
}

export default async function copyData(src: string, dst: string, options: copyOptions) : Promise<void> {
  let fetch = options.fetch;
  let verbose = options.verbose || false;
  
  /*********************
   * Processing Source *
   *********************/

  const src_isRemote = isRemote(src)
  const src_path = src_isRemote ? src : fixLocalPath(src)
  const src_isDir = isDirectory(src_path)

  const source: srcOptions = {
    path: src_path,
    isRemote: src_isRemote,
    isDir: src_isDir
  }
  
  /**************************
   * Processing Destination *
   **************************/

  const dst_isRemote = isRemote(dst)
  const dst_path = dst_isRemote ? dst : fixLocalPath(dst)
  let dst_isDir = isDirectory(dst_path);

  const destination: srcOptions = {
    path: dst_path,
    isRemote: dst_isRemote,
    isDir: dst_isDir
  }

  /**********************
   * Checking validitiy *
   **********************/

  if (source.isDir && !destination.isDir) {
    console.error('Cannot copy a directory to a file')
    process.exit(1);
  } 

  let filesToTransfer : FileInfo[] = []
  if (source.isRemote) {
    filesToTransfer = await getRemoteSourceFiles(source, fetch, verbose)
  } else {
    filesToTransfer = await getLocalSourceFiles(source, verbose)
  }  


  for (let sourceFileInfo of filesToTransfer) {
    let fileRelativePath = source.isDir
    ? sourceFileInfo.relativePath
    : sourceFileInfo.absolutePath.split('/').slice(-1)[0]; // FileName is filename.txt

    if (destination.isRemote) {
      let destinationPath = destination.isDir
      ? combineURLs(destination.path, fileRelativePath)
      : destination.path;
      await writeRemoteFile(destinationPath, sourceFileInfo, fetch, verbose)
    } else {
      let destinationPath = destination.isDir
      ? path.join(destination.path, fileRelativePath)
      : destination.path;
      await writeLocalFile(destinationPath, sourceFileInfo, verbose)
    }
  }
}


/*********************
 * UTILITY FUNCTIONS *
 *********************/

async function getLocalSourceFiles(source: srcOptions, verbose: boolean): Promise<FileInfo[]> {
  if (source.isDir) {
    let filePathInfos = readLocalDirectoryRecursively(source.path, undefined, undefined, verbose)
    return await Promise.all(filePathInfos.map(async fileInfo => {
      let fileData = await readLocalFile(fileInfo.absolutePath, verbose) 
      fileInfo.buffer = fileData.buffer
      fileInfo.contentType = fileData.contentType
      return fileInfo
    }))
  } else {
    let fileData = await readLocalFile(source.path, verbose) 
    return [ {
      absolutePath: source.path,
      relativePath: '',
      contentType: fileData.contentType,
      buffer: fileData.buffer,
    } ]
  }
}

async function getRemoteSourceFiles(source: srcOptions, fetch: Function, verbose: boolean) : Promise<FileInfo[]> {
  if (source.isDir) {
    let filePathInfos = await readRemoteDirectoryRecursively(source.path, undefined, undefined, verbose)
    
    return await Promise.all(filePathInfos.map(async fileInfo => {
      const fileData = await readRemoteFile(fileInfo.absolutePath, fetch, verbose) 
      fileInfo.blob = fileData.blob as any;
      fileInfo.contentType = fileData.contentType
      return fileInfo
    }))
  } else {
    let fileData = await readRemoteFile(source.path, fetch, verbose) 
    return [ {
      absolutePath: source.path,
      relativePath: '',
      contentType: fileData.contentType,
      blob: fileData.blob as any,
    } ]
  }

}

function readLocalFile(path: string, verbose: boolean): { buffer: Buffer, contentType: string} {
  if (verbose) console.log('Reading local file:', path)
  const file = fs.readFileSync(path)
  let contentType = mime.lookup(path)
  return { buffer: file, contentType };
}

async function readRemoteFile(path: string, fetch: any, verbose: boolean) : Promise<{ blob: Blob, contentType: string}> {
  if (verbose) console.log('Reading remote file:', path)
  const file = await getFile(path, { fetch })
  const contentType = await getContentType(file) as string // TODO:: error handling?
  return { blob: file as any, contentType };
  
}

async function writeLocalFile(path: string, fileInfo: FileInfo, verbose: boolean): Promise<boolean> {
  if (verbose) console.log('Writing local file:', path)
  ensureDirectoryExistence(path);
  try {
    if (fileInfo.buffer) {
      fs.writeFileSync(path, fileInfo.buffer)
    } else if (fileInfo.blob) {
      let buffer = Buffer.from(await fileInfo.blob.arrayBuffer())
      fs.writeFileSync(path, buffer)
    } else {
      console.error('No content to write for:', path)
    }
    return true;
  } catch (_ignored) {
    return false;
  }
}

async function writeRemoteFile(path: string, fileInfo: FileInfo, fetch: any, verbose: boolean): Promise<any> {
  if (verbose) console.log('Writing remote file:', path, fileInfo.contentType, fetch)

  try {
    if (fileInfo.buffer) {
      let blob = new Blob([toArrayBuffer(fileInfo.buffer)], {type: fileInfo.contentType})
      await overwriteFile(
        path,
        blob as any, // some type inconsistency between the lib and the spec?
        { contentType: fileInfo.contentType, fetch: fetch }
      );

    } else if (fileInfo.blob) {
      await overwriteFile(
        path,
        fileInfo.blob,
        { contentType: fileInfo.contentType, fetch: fetch }
      );
    } else {
      if (verbose) console.error('No content to write for:', path)
    }
    return true;
  } catch (e:any) {
    console.error(`Could not write file: ${path}: ${e.message}`)
    return false;
  }
}


function readLocalDirectoryRecursively(root_path: string, local_path: string = '', files: FileInfo[] = [], verbose: boolean): FileInfo[] {
  // Make sure directory path always ends with a /
  if (local_path && !local_path.endsWith('/')) local_path = local_path + '/'
  if (root_path && !root_path.endsWith('/')) root_path = root_path + '/'
  
  let resourcePath = path.join(root_path + local_path)
  
  const dir = fs.readdirSync(resourcePath)
  const subdirLocalPaths: string[] = []

  dir.forEach(function(resource: any) {
    if (fs.statSync(resourcePath + "/" + resource).isDirectory()) {
      subdirLocalPaths.push(local_path + resource) // Push the updated local path
    } else {
      files.push({ absolutePath: resourcePath + resource, relativePath: local_path + resource });
    }
  })

  for (let subdirLocalPath of subdirLocalPaths) {
    files = readLocalDirectoryRecursively(root_path, subdirLocalPath, files, verbose);
  }
  
  return files;
}

async function readRemoteDirectoryRecursively(root_path: string, local_path: string = '', files: FileInfo[] = [], verbose: boolean): Promise<FileInfo[]> {
  // Make sure directory path always ends with a /
  if (local_path && !local_path.endsWith('/')) local_path = local_path + '/'
  if (root_path && !root_path.endsWith('/')) root_path = root_path + '/'
  let resourcePath = path.join(root_path + local_path)

  let containerDataset = await getSolidDataset(resourcePath)
  let containedURIs = getContainedResourceUrlAll(containerDataset);

  const subdirRemoteURIs: string[] = []

  for (let uri of containedURIs) {
    let localURI = uri.slice(root_path.length)
    if (uri.endsWith('/')) {
      subdirRemoteURIs.push(localURI) // Push the updated local path
    } else {
      files.push({ absolutePath: uri, relativePath: localURI });
    }
  }

  for (let subDirURI of subdirRemoteURIs) {
    files =  await readRemoteDirectoryRecursively(root_path, subDirURI, files, verbose)
  }
  
  return files;
}

function combineURLs(baseURL: string, relativeURL: string) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
}

function toArrayBuffer(buf: Buffer) {
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
      view[i] = buf[i];
  }
  return ab;
}

// TODO:: make this whole shebang streaming 1 file at a time :D and have some progress indications?