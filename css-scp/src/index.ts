var Blob = require('node-blob');
import fs from 'fs'
import path from 'path'
import { getFile, overwriteFile, getContentType, getContainedResourceUrlAll, getSolidDataset } from "@inrupt/solid-client"
import { isRemote, isDirectory, FileInfo, ensureDirectoryExistence, fixLocalPath } from './util';
const mime = require('mime-types');

export type CopyOptions = {
  fetch: Function,
}

type srcOptions = {
  path: string,
  isRemote: boolean,
  isDir: boolean
}

export default async function copyData(src: string, dst: string, options: any) : Promise<void> {
  let fetch = options.fetch
  
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
    filesToTransfer = await getRemoteSourceFiles(source, fetch)
  } else {
    filesToTransfer = await getLocalSourceFiles(source)
  }  
  
  if (destination.isRemote) {
    for (let fileInfo of filesToTransfer) {
      let dest_path = source.isDir
      ? path.join(destination.path, fileInfo.relativePath)
      : path.join(destination.path, fileInfo.absolutePath.split('/').slice(-1)[0])
      await writeRemoteFile(dest_path, fileInfo.data as Buffer, fileInfo.contentType || '', fetch)
    }
  } else {
    for (let fileInfo of filesToTransfer) {
      let dest_path = source.isDir
      ? path.join(destination.path, fileInfo.relativePath)
      : path.join(destination.path, fileInfo.absolutePath.split('/').slice(-1)[0])
      await writeLocalFile(dest_path, fileInfo.data as Buffer)
    }
  }
}


/*********************
 * UTILITY FUNCTIONS *
 *********************/

async function getLocalSourceFiles(source: srcOptions): Promise<FileInfo[]> {
  if (source.isDir) {
    let filePathInfos = readLocalDirectoryRecursively(source.path)
    return await Promise.all(filePathInfos.map(async fileInfo => {
      let fileData = await readLocalFile(fileInfo.absolutePath) 
      fileInfo.data = fileData.data
      fileInfo.contentType = fileData.contentType
      return fileInfo
    }))
  } else {
    let fileData = await readLocalFile(source.path) 
    return [ {
      absolutePath: source.path,
      relativePath: '',
      contentType: fileData.contentType,
      data: fileData.data,
    } ]
  }
}

async function getRemoteSourceFiles(source: srcOptions, fetch: Function) : Promise<FileInfo[]> {
  if (source.isDir) {
    let filePathInfos = await readRemoteDirectoryRecursively(source.path)
    
    return await Promise.all(filePathInfos.map(async fileInfo => {
      const fileData = await readRemoteFile(fileInfo.absolutePath, fetch) 
      fileInfo.data = fileData.data
      fileInfo.contentType = fileData.contentType
      return fileInfo
    }))
  } else {
    let fileData = await readRemoteFile(source.path, fetch) 
    return [ {
      absolutePath: source.path,
      relativePath: '',
      contentType: fileData.contentType,
      data: fileData.data,
    } ]
  }

}

function readLocalFile(path: string): { data: Buffer, contentType: string} {
  console.log('Reading local file:', path)
  const file = fs.readFileSync(path)
  let contentType = mime.lookup(path)
  return { data: file, contentType };
}

function writeLocalFile(path: string, file: Buffer): boolean {
  console.log('Writing local file:', path)
  ensureDirectoryExistence(path);
  try {
    fs.writeFileSync(path, file)
    return true;
  } catch (_ignored) {
    return false;
  }
}

async function readRemoteFile(path: string, fetch: any) : Promise<{ data: Buffer, contentType: string}> {
  console.log('Reading remote file:', path)
  const file = await getFile(path, { fetch })
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const contentType = await getContentType(file) as string // TODO:: error handling?
  return { data: buffer, contentType };
  
}

async function writeRemoteFile(path: string, file: Buffer, contentType: string, fetch: any): Promise<any> {
  console.log('Writing remote file:', path, file, contentType, fetch)
  const arrayBuffer = new ArrayBuffer(file.length);
  var typedArray = new Uint8Array(arrayBuffer);
  for (var i = 0; i < file.length; ++i) {
      typedArray[i] = file[i];
  }

  try {
    await overwriteFile(
      path,
      new Blob([typedArray], { type: contentType }),
      { contentType: contentType, fetch: fetch }
    );
    return true;
  } catch (e) {
    return false;
  }
}


function readLocalDirectoryRecursively(root_path: string, local_path: string = '', files: FileInfo[] = []): FileInfo[] {
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
    files = readLocalDirectoryRecursively(root_path, subdirLocalPath, files);
  }
  
  return files;
}

async function readRemoteDirectoryRecursively(root_path: string, local_path: string = '', files: FileInfo[] = []): Promise<FileInfo[]> {
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
    files =  await readRemoteDirectoryRecursively(root_path, subDirURI, files)
  }
  
  return files;
}


// TODO:: make this whole shebang streaming 1 file at a time :D and have some progress indications?