import { generateRecursiveListing, FileInfo } from '../utils/util';

export type FindOptions =  {
  fetch: any,
  name?: string,
  query?: string,
  all?: boolean,
  full?: boolean,
  verbose?: boolean,
}
export async function* find (url: string, options: FindOptions) {
  if (!options.name && !options.query) {
    throw new Error('Please use the find command with either the [name] or [query] option')
  }
  
  for await (let fileInfo of generateRecursiveListing(url, options)) {
    if (options.name) {
      const match = processFileNameMatching(fileInfo, options)
      if (match) yield fileInfo
    } else if (options.query) {
      throw new Error('Method not implemented yet')
    }
  }
}

export async function findSync(url: string, match: string, options: any) {
  throw new Error('Method Not Implemented')
}


function processFileNameMatching(fileInfo: FileInfo, options: FindOptions) : boolean {
  if (!options.name) throw new Error('Tried to do name-based matching without name option value')
  const regex = new RegExp(options.name)
  const name = options.full ? fileInfo.absolutePath : (fileInfo.relativePath || fileInfo.absolutePath)
  const match = name.match(regex)
  return !!match
  
}