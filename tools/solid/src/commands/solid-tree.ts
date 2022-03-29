import { find } from '../../';
import { isDirectory, FileInfo, writeErrorString } from '../utils/util';
import chalk from 'chalk';

export type TreeOptions = {
  fetch: any
  all?: boolean,
  verbose?: boolean
}
const WHITESPACE = '   '
const DASHES = '---'

export default async function tree(url: string, options: TreeOptions) {
  if (!isDirectory(url)) {
    throw new Error('Can only call tree with a container as argument.')
  }
  
  console.log(chalk.bold(url))
  for await (let fileInfo of find(url, '.', { listDirectories: true, ...options } as any )) {
    const depth = getDepth(fileInfo)
    let outputString = ''
    if (!depth) {
      if (options.verbose) writeErrorString('Could not construct a local path for file', fileInfo.absolutePath)
    } else if (isDirectory(fileInfo.absolutePath)) {
      for (let i = 0; i < depth-1; i++) outputString += `|${WHITESPACE}`
      outputString += `${chalk.blue.bold(getFileName(fileInfo))}`

    } else {
      for (let i = 0; i < depth-1; i++) outputString += `|${WHITESPACE}`
      outputString += `|${DASHES} ${getFileName(fileInfo)}`
    }
    console.log(outputString)
  }
} 

function getDepth(fileInfo: FileInfo) {
  if (!fileInfo.relativePath) return;
  return fileInfo.relativePath.split('/').length;
}

function getFileName(fileInfo: FileInfo) {
  return isDirectory(fileInfo.absolutePath)
  ? fileInfo.absolutePath.split('/').slice(-2)[0]
  : fileInfo.absolutePath.split('/').slice(-1)[0]
}