import find from './solid-find'
import { isDirectory, FileInfo, writeErrorString } from '../utils/util';
import chalk from 'chalk';
import type { Logger } from '../logger';
import { ICommandOptions, setOptionDefaults } from './solid-command';

export interface ICommandOptionsTree extends ICommandOptions {
  all?: boolean,
}
const WHITESPACE = '   '
const DASHES = '---'

/**
 * This function is CLI only, as it does not make any sense as a Node.JS export
 */
export default async function tree(url: string, options: ICommandOptionsTree) {
  let commandOptions = setOptionDefaults<ICommandOptionsTree>(options);

  if (!isDirectory(url)) {
    throw new Error('Can only call tree with a container as argument.')
  }
  
  commandOptions.logger.log(chalk.bold(url))
  for await (let fileInfo of find(url, '.', { listDirectories: true, ...options } as any )) {
    const depth = getDepth(fileInfo)
    let outputString = ''
    if (!depth) {
      if (commandOptions.verbose) writeErrorString('Could not construct a local path for file', fileInfo.absolutePath, options)
    } else if (isDirectory(fileInfo.absolutePath)) {
      for (let i = 0; i < depth-1; i++) outputString += `|${WHITESPACE}`
      outputString += `${chalk.blue.bold(getFileName(fileInfo))}`

    } else {
      for (let i = 0; i < depth-1; i++) outputString += `|${WHITESPACE}`
      outputString += `|${DASHES} ${getFileName(fileInfo)}`
    }
    commandOptions.logger.log(outputString)
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