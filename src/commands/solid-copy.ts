import fs from 'fs'
import path from 'path'
import { getFile, getContentType, createContainerAt } from "@inrupt/solid-client"
import { isRemote, isDirectory, FileInfo, ensureDirectoryExistence, fixLocalPath, readRemoteDirectoryRecursively, writeErrorString, isDirectoryContents, resourceExists, getLocalFileLastModified, getRemoteResourceLastModified, compareLastModifiedTimes } from '../utils/util';
import { Blob } from "buffer"
import { requestUserCLIConfirmationDefaultNegative } from '../utils/userInteractions';
import BashlibError from '../utils/errors/BashlibError';
import { BashlibErrorMessage } from '../utils/errors/BashlibError';
import type { Logger } from '../logger';
import { ICommandOptions, setOptionDefaults } from './solid-command';

const mime = require('mime-types');

// TODO:: Make reads / writes happen 1 file at a time (1 pair at a time in a threaded loop maybe), instead of reading all files and then writing all files.
// Also this can probably be made a tad shorter by removing some duplication and clearing some code

interface SourceOptions {
  path: string,
  isRemote: boolean,
  isDir: boolean
}

interface FileRetrieval {
  buffer: Buffer, 
  contentType: string, 
  lastModified?: Date
}

interface ResourceRetrieval {
  blob: any, 
  contentType: string, 
  lastModified?: Date
}

export interface ICommandOptionsCopy extends ICommandOptions {
  all?: boolean,
  override?: boolean,
  neverOverride?: boolean,
  compareLastModified?: boolean,
}

export default async function copy(src: string, dst: string, options?: ICommandOptionsCopy) : Promise<{
  source: {files: FileInfo[]; directories: FileInfo[]; aclfiles: FileInfo[];}
  destination: {files: FileInfo[]; directories: FileInfo[]; aclfiles: FileInfo[];}
}> {
  let commandOptions = setOptionDefaults<ICommandOptionsCopy>(options || {});
  let fetch = commandOptions.fetch;
  commandOptions.all = commandOptions.all || false;
  commandOptions.override = commandOptions.override || false;
  commandOptions.neverOverride = commandOptions.neverOverride || false;
  commandOptions.compareLastModified = commandOptions.compareLastModified || false; // todo: fix
  
  /**************************
   * Preprocess src and dst *
   **************************/
  if (isDirectoryContents(dst)) {
    dst = dst.substring(0, dst.length - 1)
  }
  if (isDirectoryContents(src)) {
    src = src.substring(0, src.length - 1)
    // we are fine, just don't remove src
  } else if (isDirectory(src)) {
    if (!isDirectory(dst)) {
      commandOptions.logger.error('Cannot copy a directory to a file')
      process.exit(1);
    }
    const split = src.split('/')
    const srcContainerName = src.endsWith('/') ? split[split.length - 2] : split[split.length - 1]
    dst = dst+srcContainerName+'/'
  }

  /*********************
   * Processing Source *
   *********************/

  const src_isRemote = isRemote(src)
  const src_path = src_isRemote ? src : fixLocalPath(src)
  const src_isDir = isDirectory(src_path)

  const source: SourceOptions = {
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

  const destination: SourceOptions = {
    path: dst_path,
    isRemote: dst_isRemote,
    isDir: dst_isDir
  }

  /**********************
   * Checking validitiy *
   **********************/

  if (source.isDir && !destination.isDir) {
    commandOptions.logger.error('Cannot copy a directory to a file')
    process.exit(1);
  } 


  let resourcesToTransfer : { files: FileInfo[], directories: FileInfo[], aclfiles: FileInfo[] };
  if (source.isRemote) {
    resourcesToTransfer = await getRemoteSourceFiles(source, fetch, commandOptions.verbose, commandOptions.all, commandOptions)
  } else {
    resourcesToTransfer = await getLocalSourceFiles(source, commandOptions.verbose, commandOptions.all, commandOptions)
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
      await writeRemoteDirectory(destinationPath, resourceInfo, fetch, commandOptions)
    } else {
      destinationPath = destination.isDir
      ? (relativePath ? path.join(destination.path, relativePath) : destination.path)
      : destination.path;
      await writeLocalDirectory(destinationPath, resourceInfo, commandOptions)
    }
    destinationInfo.directories.push({absolutePath: destinationPath})
  }

  /**
   * Copying Files
   */
  for (let sourceFileInfo of resourcesToTransfer.files) {
    try {
      let fileRelativePath = source.isDir
        ? sourceFileInfo.relativePath
        : sourceFileInfo.absolutePath.split('/').slice(-1)[0]; // FileName is filename.txt

      let destinationPath;
      if (destination.isRemote) {
        destinationPath = destination.isDir
          ? (fileRelativePath ? combineURLs(destination.path, fileRelativePath) : destination.path)
          : destination.path;
        await writeRemoteFile(destinationPath, sourceFileInfo, fetch, commandOptions)
      } else {
        destinationPath = destination.isDir
          ? (fileRelativePath ? path.join(destination.path, fileRelativePath) : destination.path)
          : destination.path;
        let fileName = await writeLocalFile(destinationPath, sourceFileInfo, commandOptions)
        // fileName can change in function
        if (fileName) destinationPath = fileName
      }
      destinationInfo.files.push({ absolutePath: destinationPath || '' })
    } catch (e) { 
      console.error(`Could not copy file ${sourceFileInfo.relativePath || sourceFileInfo.absolutePath}: ${e}` )
    }
  }

  /**
   * opying ACL Files
   */
  if (commandOptions.all) {
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
        await writeRemoteFile(destinationPath, sourceFileInfo, fetch, commandOptions)
      } else {
        destinationPath = destination.isDir
        ? (fileRelativePath ? path.join(destination.path, fileRelativePath) : destination.path)
        : destination.path;
        let fileName = await writeLocalFile(destinationPath, sourceFileInfo, commandOptions)
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

async function getLocalSourceFiles(source: SourceOptions, verbose: boolean, all: boolean, options?: { logger?: Logger, compareLastModified?: boolean }): Promise<{files: FileInfo[], directories: FileInfo[], aclfiles: FileInfo[]}> {
  if (source.isDir) {
    let filePathInfos = readLocalDirectoryRecursively(source.path, undefined, {verbose, all} )
    let files = await Promise.all(filePathInfos.files.map(async fileInfo => {
      fileInfo.loadFile = async () => readLocalFile(fileInfo.absolutePath, verbose, options) 
      fileInfo.lastModified = options?.compareLastModified ? getLocalFileLastModified(source.path) : undefined;
      return fileInfo
    }))
    let aclfiles = await Promise.all(filePathInfos.aclfiles.map(async fileInfo => {
      fileInfo.lastModified = options?.compareLastModified ? getLocalFileLastModified(source.path) : undefined;
      fileInfo.loadFile = async () => readLocalFile(fileInfo.absolutePath, verbose, options) 
      return fileInfo
    }))
    return { files, aclfiles, directories: filePathInfos.directories }
  } else {
    return { files: [ {
      lastModified: options?.compareLastModified ? getLocalFileLastModified(source.path) : undefined,
      absolutePath: source.path,
      relativePath: '',
      loadFile: async () => readLocalFile(source.path, verbose, options)
    } ], aclfiles: [], directories: [] }
  }
}

async function getRemoteSourceFiles(source: SourceOptions, fetch: typeof globalThis.fetch, verbose: boolean, all: boolean, options?: { logger?: Logger, compareLastModified?: boolean }) : Promise<{files: FileInfo[], directories: FileInfo[], aclfiles: FileInfo[]}> {
  if (source.isDir) {
    let discoveredResources = await readRemoteDirectoryRecursively(source.path, { fetch, verbose, all})

    // Filter out files that return errors (e.g no authentication privileges)
    let files = (await Promise.all(discoveredResources.files.map(async fileInfo => {
      fileInfo.loadFile = async () => readRemoteFile(fileInfo.absolutePath, fetch, verbose, options) 
      fileInfo.lastModified = await (options?.compareLastModified ? getRemoteResourceLastModified(source.path, fetch) : undefined)
      return fileInfo
    }))).filter(f => f) as FileInfo[]

    let aclfiles : FileInfo[] = []
    if (all) {
      aclfiles = (await Promise.all(discoveredResources.aclfiles.map(async fileInfo => {
        fileInfo.loadFile = async () => readRemoteFile(fileInfo.absolutePath, fetch, verbose, options) 
        fileInfo.lastModified = await (options?.compareLastModified ? getRemoteResourceLastModified(source.path, fetch) : undefined)
        return fileInfo
      }))).filter(f => f) as FileInfo[]
    }
    return { files, aclfiles, directories: discoveredResources.directories }
  } else {
    return { files: [ {
      lastModified: await (options?.compareLastModified ? getRemoteResourceLastModified(source.path, fetch) : undefined),
      absolutePath: source.path,
      relativePath: '',
      loadFile: async () => readRemoteFile(source.path, fetch, verbose, options) 
    }] , aclfiles: [], directories: [] }
  }

}

function readLocalFile(path: string, verbose: boolean, options?: { logger?: Logger, compareLastModified?: boolean }): FileRetrieval {
  if (verbose) (options?.logger || console).log('Reading local file:', path)
  const file = fs.readFileSync(path)
  const contentType = path.endsWith('.acl') || path.endsWith('.meta') ? 'text/turtle': path.endsWith('.acp') ? 'application/ld+json':  mime.lookup(path)
  // if (options?.compareLastModified) {
  //   const lastModified = getLocalFileLastModified(path)
  //   return { buffer: file, contentType, lastModified };
  // } else {
    return { buffer: file, contentType };
  // }
}

async function readRemoteFile(path: string, fetch: any, verbose: boolean, options?: { logger?: Logger, compareLastModified?: boolean }) : Promise< ResourceRetrieval > {
  if (verbose) (options?.logger || console).log('Reading remote file:', path)
  const resourceFile = await getFile(path, { fetch })
  const contentType = await getContentType(resourceFile) as string // TODO:: error handling?
  // if (options?.compareLastModified) {
  //   const lastModified = await getRemoteResourceLastModified(path, fetch)
  //   return { blob: resourceFile as any, contentType, lastModified };
  // } else {
    return { blob: resourceFile as any, contentType };
  // }
}

async function writeLocalDirectory(path: string, fileInfo: FileInfo, options: ICommandOptionsCopy): Promise<any> {
  if (options.verbose) (options.logger || console).log('Writing local directory:', path)
  fs.mkdirSync(path, { recursive: true })
  return true;
}

async function writeRemoteDirectory(path: string, fileInfo: FileInfo, fetch: any, options: ICommandOptionsCopy): Promise<any> {
  if (options.verbose) (options.logger || console).log('Writing remote directory:', path)
  try {
    await createContainerAt(path, { fetch })
  } catch (e) {
    if (options.verbose) writeErrorString(`Could not write directory for ${path}`, e, options);
  }
}

async function writeLocalFile(resourcePath: string, fileInfo: FileInfo, options: ICommandOptionsCopy): Promise<string | undefined> {
  ensureDirectoryExistence(resourcePath);
  
  let executeWrite = true
  if (options.compareLastModified) {
    const targetResourceLastModified = await getLocalFileLastModified(resourcePath)
    const decision = await compareLastModifiedTimes(fileInfo.lastModified, targetResourceLastModified)
    executeWrite = decision.write
  } 
  if (options.neverOverride || !options.override) {
    if (await resourceExists(resourcePath, options.fetch)) { 
      if (options.neverOverride) {
        executeWrite = false;
      } else { 
        executeWrite = await requestUserCLIConfirmationDefaultNegative(`Overwrite local file: ${resourcePath}`)
      }
    }
  }

  if (!executeWrite) {
    if (options.verbose) (options.logger || console).log('Skipping existing local file:', resourcePath)
    return undefined;
  }

  if (options.verbose) (options.logger || console).log('processing local file:', resourcePath)
  try {
    if (!fileInfo.loadFile) throw new Error(`Could not load file at location: ${fileInfo.absolutePath}`)
    let fileData = await fileInfo.loadFile();

    // Handle writing data with the correct extension if no extension in the resource path    
    let ext = path.extname(resourcePath) 
    // Hardcode missing common extensions
    if (resourcePath.endsWith('.acl')) ext = '.acl'
    if (resourcePath.endsWith('.acp')) ext = '.acp'
    if (resourcePath.endsWith('.meta')) ext = '.meta'
    if (!ext) {
      const extension = mime.extension(fileData.contentType)
      if (extension) resourcePath = `${resourcePath}$.${extension}`
    }
    
    if (fileData.buffer) {
      fs.writeFileSync(resourcePath, fileData.buffer)
      if (options.verbose) (options.logger || console).log(`Writing local resource: ${resourcePath}`);
    } else if (fileData.blob) {
      let buffer = Buffer.from(await fileData.blob.arrayBuffer())
      fs.writeFileSync(resourcePath, buffer)
    } else {
      (options.logger || console).error('No content to write for:', resourcePath)
    }
    return resourcePath;
  } catch (e) {
    if (options.verbose) writeErrorString(`Could not save local file ${resourcePath}`, e, options);
    return undefined;
  }
}

async function writeRemoteFile(resourcePath: string, fileInfo: FileInfo, fetch: any, options: ICommandOptionsCopy): Promise<string | undefined> {
  resourcePath = resourcePath.split('$.')[0];
  let executeWrite = true
  let executeRequest = true;
  if (options.compareLastModified) {
    const targetResourceLastModified = await getRemoteResourceLastModified(resourcePath, options.fetch)
    // only compare if file exists
    if (targetResourceLastModified) {
      const decision = await compareLastModifiedTimes(fileInfo.lastModified, targetResourceLastModified)
      executeWrite = decision.write
      executeRequest = decision.request
    }
  } 
  if (!executeWrite && executeRequest && (options.neverOverride || !options.override)) {
    if (await resourceExists(resourcePath, fetch)) { 
      if (options.neverOverride) {
        executeWrite = false;
      } else { 
        executeWrite = await requestUserCLIConfirmationDefaultNegative(`Overwrite remote file: ${resourcePath}`)
      }
    }
  }

  if (!executeWrite) {
    if (options.verbose) (options.logger || console).log('Skipping existing remote file:', resourcePath)
    return undefined;
  }

  try {
    if (!fileInfo.loadFile) throw new Error(`Could not load file at location: ${fileInfo.absolutePath}`)
    let fileData = await fileInfo.loadFile();
    if (fileData.buffer) {
      let res = await fetch(
        resourcePath, 
        {
          method: 'PUT',
          body: fileData.buffer,
          headers: { 
            'Content-Type': fileData.contentType
          }

        }
      )
      if (!res.ok)
        throw new BashlibError(BashlibErrorMessage.httpResponseError, resourcePath, `${res.status} ${res.statusText}`)
      else if (options.verbose) (options.logger || console).log(`Writing remote resource: ${resourcePath}`);

    } else if (fileData.blob) {
      let res = await fetch(
        resourcePath, 
        {
          method: 'PUT',
          body: fileData.blob,
          headers: { 
            'Content-Type': fileData.contentType
          }
        }
      )
      if (!res.ok)
        throw new BashlibError(BashlibErrorMessage.httpResponseError, resourcePath, `${res.status} ${res.statusText}`)
      else if (options.verbose) (options.logger || console).log(`Writing remote resource: ${resourcePath}`);
    } else {
      throw new BashlibError(BashlibErrorMessage.cannotWriteResource, resourcePath, "No contents to write")
    }
    return resourcePath;
  } catch (e: any) {
    throw new BashlibError(BashlibErrorMessage.cannotWriteResource, resourcePath, e.message)
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
    } else if (resource.endsWith('.acp')) {
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