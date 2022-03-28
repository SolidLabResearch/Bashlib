import { generateRecursiveListing, FileInfo } from '../utils/util';

export type FindOptions =  {
  fetch: any,
  name?: string,
  query?: string,
  all?: boolean,
  full?: boolean,
  verbose?: boolean,
  listDirectories?: boolean,
}

export default async function* find (rootcontainer: string, filename: string, options: FindOptions) {
  if (!filename || !rootcontainer) return;
  for await (let fileInfo of generateRecursiveListing(rootcontainer, options)) {
    const match = processFileNameMatching(filename, fileInfo, options)
    if (match) yield fileInfo
  }
}

function processFileNameMatching(fileName: string, fileInfo: FileInfo, options: FindOptions) : boolean {
  const regex = new RegExp(fileName)
  const name = options.full ? fileInfo.absolutePath : (fileInfo.relativePath || fileInfo.absolutePath)
  const match = name.match(regex)
  return !!match
  
}