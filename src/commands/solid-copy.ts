import fs from 'fs'
import path from 'path'
import { getFile, overwriteFile, getContentType, getContainedResourceUrlAll, getSolidDataset, createContainerAt } from "@inrupt/solid-client"
import { isRemote, isDirectory, FileInfo, ensureDirectoryExistence, fixLocalPath, readRemoteDirectoryRecursively, checkRemoteFileExists, writeErrorString } from '../utils/util';
import Blob = require("fetch-blob")
import { requestUserCLIConfirmation } from '../utils/userInteractions';

const mime = require('mime-types');

// TODO:: Make reads / writes happen 1 file at a time (1 pair at a time in a threaded loop maybe), instead of reading all files and then writing all files.
// Also this can probably be made a tad shorter by removing some duplication and clearing some code

type srcOptions = {
  path: string,
  isRemote: boolean,
  isDir: boolean
}

type CopyOptions = {
  fetch: Function,
  verbose?: boolean,
  all?: boolean,
  interactiveOverride?: boolean,
  noOverride?: boolean,
}

export default async function copy(src: string, dst: string, options: CopyOptions) : Promise<{
  source: {files: FileInfo[]; directories: FileInfo[]; aclfiles: FileInfo[];}
  destination: {files: FileInfo[]; directories: FileInfo[]; aclfiles: FileInfo[];}
}> {
  let fetch = options.fetch;
  options.verbose = options.verbose || false;
  options.all = options.all || false;
  options.interactiveOverride = options.interactiveOverride || false;
  options.noOverride = options.noOverride || false;
  
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

  let resourcesToTransfer : { files: FileInfo[], directories: FileInfo[], aclfiles: FileInfo[] };
  if (source.isRemote) {
    resourcesToTransfer = await getRemoteSourceFiles(source, fetch, options.verbose, options.all)
  } else {
    resourcesToTransfer = await getLocalSourceFiles(source, options.verbose, options.all)
  }  

  let destinationInfo: { files: FileInfo[], directories: FileInfo[], aclfiles: FileInfo[] } = {
    files: [],
    directories: [],
    aclfiles: [],
  }
  
  /**
   * Copying Directories
   */
  for (let resourceInfo of resourcesToTransfer.directories) {
    let relativePath = source.isDir
    ? resourceInfo.relativePath
    : resourceInfo.absolutePath.split('/').slice(-1)[0]; // FileName is filename.txt

    let destinationPath;
    if (destination.isRemote) {
      destinationPath = destination.isDir
      ? (relativePath ? combineURLs(destination.path, relativePath) : destination.path)
      : destination.path;
      await writeRemoteDirectory(destinationPath, resourceInfo, fetch, options)
    } else {
      destinationPath = destination.isDir
      ? (relativePath ? path.join(destination.path, relativePath) : destination.path)
      : destination.path;
      await writeLocalDirectory(destinationPath, resourceInfo, options)
    }
    destinationInfo.directories.push({absolutePath: destinationPath})
  }

  /**
   * Copying Files
   */
  for (let sourceFileInfo of resourcesToTransfer.files) {
    let fileRelativePath = source.isDir
    ? sourceFileInfo.relativePath
    : sourceFileInfo.absolutePath.split('/').slice(-1)[0]; // FileName is filename.txt

    let destinationPath;
    if (destination.isRemote) {
      destinationPath = destination.isDir
      ? (fileRelativePath ? combineURLs(destination.path, fileRelativePath) : destination.path)
      : destination.path;
      await writeRemoteFile(destinationPath, sourceFileInfo, fetch, options)
    } else {
      destinationPath = destination.isDir
      ? (fileRelativePath ? path.join(destination.path, fileRelativePath) : destination.path)
      : destination.path;
      let fileName = await writeLocalFile(destinationPath, sourceFileInfo, options)
      // fileName can change in function
      if(fileName) destinationPath = fileName
    }
    destinationInfo.files.push({absolutePath: destinationPath || ''})
  }

  /**
   * opying ACL Files
   */
  if (options.all) {
    resourcesToTransfer.aclfiles.sort((a, b) => a.absolutePath.split('/').length - b.absolutePath.split('/').length)
    for (let sourceFileInfo of resourcesToTransfer.aclfiles) {
      let fileRelativePath = source.isDir
      ? sourceFileInfo.relativePath
      : sourceFileInfo.absolutePath.split('/').slice(-1)[0]; // FileName is filename.txt
  
      let destinationPath;
      if (destination.isRemote) {
        destinationPath = destination.isDir
        ? (fileRelativePath ? combineURLs(destination.path, fileRelativePath) : destination.path)
        : destination.path;
        await writeRemoteFile(destinationPath, sourceFileInfo, fetch, options)
      } else {
        destinationPath = destination.isDir
        ? (fileRelativePath ? path.join(destination.path, fileRelativePath) : destination.path)
        : destination.path;
        let fileName = await writeLocalFile(destinationPath, sourceFileInfo, options)
        // fileName can change in function
        if(fileName) destinationPath = fileName
      }
      destinationInfo.files.push({absolutePath: destinationPath || ''})
    }
  }
  return { source: resourcesToTransfer, destination: destinationInfo }
}


/*********************
 * UTILITY FUNCTIONS *
 *********************/

async function getLocalSourceFiles(source: srcOptions, verbose: boolean, all: boolean): Promise<{files: FileInfo[], directories: FileInfo[], aclfiles: FileInfo[]}> {
  if (source.isDir) {
    let filePathInfos = readLocalDirectoryRecursively(source.path, undefined, {verbose, all} )
    let files = await Promise.all(filePathInfos.files.map(async fileInfo => {
      let fileData = await readLocalFile(fileInfo.absolutePath, verbose) 
      fileInfo.buffer = fileData.buffer
      fileInfo.contentType = fileData.contentType
      return fileInfo
    }))
    let aclfiles = await Promise.all(filePathInfos.aclfiles.map(async fileInfo => {
      let fileData = await readLocalFile(fileInfo.absolutePath, verbose) 
      fileInfo.buffer = fileData.buffer
      fileInfo.contentType = fileData.contentType
      return fileInfo
    }))
    return { files, aclfiles, directories: filePathInfos.directories }
  } else {
    let fileData = await readLocalFile(source.path, verbose) 
    return { files: [ {
      absolutePath: source.path,
      relativePath: '',
      contentType: fileData.contentType,
      buffer: fileData.buffer,
    } ], aclfiles: [], directories: [] }
  }
}

async function getRemoteSourceFiles(source: srcOptions, fetch: Function, verbose: boolean, all: boolean) : Promise<{files: FileInfo[], directories: FileInfo[], aclfiles: FileInfo[]}> {
  if (source.isDir) {
    let discoveredResources = await readRemoteDirectoryRecursively(source.path, { fetch, verbose, all})

    // Filter out files that return errors (e.g no authentication privileges)
    let files = (await Promise.all(discoveredResources.files.map(async fileInfo => {
      try {
        const fileData = await readRemoteFile(fileInfo.absolutePath, fetch, verbose) 
        fileInfo.blob = fileData.blob as any;
        fileInfo.contentType = fileData.contentType
        return fileInfo
      } catch (e) {
        if (verbose) writeErrorString(`Could not read remote file ${fileInfo.absolutePath}`, e);
        return null;
      }
    }))).filter(f => f) as FileInfo[]

    let aclfiles : FileInfo[] = []
    if (all) {
      aclfiles = (await Promise.all(discoveredResources.aclfiles.map(async fileInfo => {
        try {
          const fileData = await readRemoteFile(fileInfo.absolutePath, fetch, verbose) 
          fileInfo.blob = fileData.blob as any;
          fileInfo.contentType = fileData.contentType
          return fileInfo
        } catch (e) {
          if (verbose) writeErrorString(`Could not read remote file ${fileInfo.absolutePath}`, e);
          return null;
        }
      }))).filter(f => f) as FileInfo[]
    }
    return { files, aclfiles, directories: discoveredResources.directories }
  } else {
    let fileData = await readRemoteFile(source.path, fetch, verbose) 
    return { files: [ {
      absolutePath: source.path,
      relativePath: '',
      contentType: fileData.contentType,
      blob: fileData.blob as any,
    }] , aclfiles: [], directories: [] }
  }

}

function readLocalFile(path: string, verbose: boolean): { buffer: Buffer, contentType: string} {
  if (verbose) console.log('Reading local file:', path)
  const file = fs.readFileSync(path)
  let contentType = path.endsWith('.acl') || path.endsWith('.meta') ? 'text/turtle' : mime.lookup(path)
  return { buffer: file, contentType };
}

async function readRemoteFile(path: string, fetch: any, verbose: boolean) : Promise<{ blob: Blob, contentType: string}> {
  if (verbose) console.log('Reading remote file:', path)
  const file = await getFile(path, { fetch })
  const contentType = await getContentType(file) as string // TODO:: error handling?
  return { blob: file as any, contentType };
  
}

async function writeLocalDirectory(path: string, fileInfo: FileInfo, options: CopyOptions): Promise<any> {
  if (options.verbose) console.log('Writing local directory:', path)
  fs.mkdirSync(path, { recursive: true })
  return true;
}

async function writeRemoteDirectory(path: string, fileInfo: FileInfo, fetch: any, options: CopyOptions): Promise<any> {
  if (options.verbose) console.log('Writing remote directory:', path)
  try {
    await createContainerAt(path, { fetch })
  } catch (e) {
    if (options.verbose) writeErrorString(`Could not write directory for ${path}`, e);
  }
}

async function writeLocalFile(resourcePath: string, fileInfo: FileInfo, options: CopyOptions): Promise<string | undefined> {
  ensureDirectoryExistence(resourcePath);
  let ext = path.extname(resourcePath) 
  // Hardcode missing common extensions
  if (resourcePath.endsWith('.acl')) ext = '.acl'
  if (resourcePath.endsWith('.meta')) ext = '.meta'
  if (!ext) {
    const extension = mime.extension(fileInfo.contentType)
    if (extension) resourcePath = `${resourcePath}$.${extension}`
  }

  let executeWrite = true
  if (options.interactiveOverride || options.noOverride) {
    if (fs.existsSync(resourcePath)) { 
      if (options.noOverride) {
        executeWrite = false;
      } else if (options.interactiveOverride) { 
        executeWrite = await requestUserCLIConfirmation(`Overwrite local file: ${resourcePath}`)
      }
    }
  }
  if (!executeWrite) {
    if (options.verbose) console.log('Skipping existing local file:', resourcePath)
    return undefined;
  }

  if (options.verbose) console.log('Writing local file:', resourcePath)
  try {
    if (fileInfo.buffer) {
      fs.writeFileSync(resourcePath, fileInfo.buffer)
    } else if (fileInfo.blob) {
      let buffer = Buffer.from(await fileInfo.blob.arrayBuffer())
      fs.writeFileSync(resourcePath, buffer)
    } else {
      console.error('No content to write for:', resourcePath)
    }
    return resourcePath;
  } catch (e) {
    if (options.verbose) writeErrorString(`Could not save local file ${resourcePath}`, e);
    return undefined;
  }
}

async function writeRemoteFile(resourcePath: string, fileInfo: FileInfo, fetch: any, options: CopyOptions): Promise<string | undefined> {
  resourcePath = resourcePath.split('$.')[0];

  let executeWrite = true
  if (options.interactiveOverride || options.noOverride) {
    if (fs.existsSync(resourcePath)) { 
      if (options.noOverride) {
        executeWrite = false;
      } else if (options.interactiveOverride) { 
        executeWrite = await requestUserCLIConfirmation(`Overwrite local file: ${resourcePath}`)
      }
    }
  }
  if (!executeWrite) {
    if (options.verbose) console.log('Skipping existing local file:', resourcePath)
    return undefined;
  }

  try {
    if (fileInfo.buffer) {
      let blob = new Blob([toArrayBuffer(fileInfo.buffer)], {type: fileInfo.contentType})
      let res = await fetch(
        resourcePath, 
        {
          method: 'PUT',
          body: blob,
          headers: { 
            'Content-Type': fileInfo.contentType
          }

        }
      )
      if (!res.ok) throw new Error(`HTTP Error Response requesting ${resourcePath}: ${res.status} ${res.statusText}`);

    } else if (fileInfo.blob) {
      let res = await fetch(
        resourcePath, 
        {
          method: 'PUT',
          body: fileInfo.blob,
          headers: { 
            'Content-Type': fileInfo.contentType
          }
        }
      )
      if (!res.ok) throw new Error(`HTTP Error Response requesting ${resourcePath}: ${res.status} ${res.statusText}`);
    } else {
      if (options.verbose) console.error('No content to write for:', resourcePath)
    }
    return resourcePath;
  } catch (e:any) {
    if (options.verbose) writeErrorString(`CouldCould not write file ${resourcePath}`, e);
    return;
  }
}


function readLocalDirectoryRecursively(
  root_path: string, local_path: string = '', options: { verbose: boolean, all: boolean }, files: FileInfo[] = [], directories: FileInfo[] = [], aclfiles: FileInfo[] = [] 
  ): { files: FileInfo[], directories: FileInfo[], aclfiles: FileInfo[] } {

  // Make sure directory path always ends with a /
  if (local_path && !local_path.endsWith('/')) local_path = local_path + '/'
  if (root_path && !root_path.endsWith('/')) root_path = root_path + '/'
  
  let resourcePath = path.join(root_path + local_path)
  
  const dir = fs.readdirSync(resourcePath)
  const subdirLocalPaths: string[] = []

  dir.forEach(function(resource: any) {
    if (fs.statSync(resourcePath + "/" + resource).isDirectory()) {
      subdirLocalPaths.push(local_path + resource) // Push the updated local path
      directories.push({ absolutePath: resourcePath + resource + '/', relativePath: local_path + resource + '/'});
    } else if (resource.endsWith('.acl')) {
      if (options.all) { aclfiles.push({ absolutePath: resourcePath + resource, relativePath: local_path + resource }) }
    } else {
      files.push({ absolutePath: resourcePath + resource, relativePath: local_path + resource });
    }
  })

  for (let subdirLocalPath of subdirLocalPaths) {
    let dirInfo = readLocalDirectoryRecursively(root_path, subdirLocalPath, options, files, directories, aclfiles);
    files = dirInfo.files
    aclfiles = dirInfo.aclfiles
    directories = dirInfo.directories
  }
  return { files, aclfiles, directories } ;
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