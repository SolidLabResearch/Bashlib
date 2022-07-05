import { Command } from 'commander';
import list from '../../commands/solid-list';
import authenticate from '../../utils/authenticate';
import { addEnvOptions, changeUrlPrefixes, getResourceInfoRelativePath } from '../../utils/shellutils';
import { writeErrorString, ResourceInfo } from '../../utils/util';
import chalk from 'chalk';
const columns = require('cli-columns');

export function addListCommand(program: Command, exit = false) { 
  
  async function executeListCommand (url: string, options: any) {
    let programOpts = addEnvOptions(program.opts() || {});
    const authenticationInfo = await authenticate(programOpts)
    
    options.fetch = authenticationInfo.fetch
    let listings: ResourceInfo[] = []
    try {
      url = await changeUrlPrefixes(authenticationInfo, url)
      listings = await list(url, options)
    } catch (e) {
      writeErrorString(`Could not provide listing for ${url}`, e)
      if (exit) process.exit(1)
    }
    // Output to command line
    console.log(formatListing(listings, options))
    if (exit) process.exit(0)
  }

  program
    .command('ls')
    .description('Utility to view files in container on remote Solid pod.')
    .argument('<url>', 'URL of container to be listed')
    .option('-a, --all', 'List all files including acl files')
    .option('-f, --full', 'List files with their full uri')
    .option('-l, --long', 'List in long format')
    .option('-v, --verbose', '')
    .action(executeListCommand)

  program
    .command('list')
    .description('Utility to view files in container on remote Solid pod.')
    .argument('<url>', 'URL of container to be listed')
    .option('-a, --all', 'List all files including acl files')
    .option('-f, --full', 'List files with their full uri')
    .option('-l, --long', 'List in long format')
    .option('-v, --verbose', '')
    .action(executeListCommand)

  return program

}


/**
 * 
 * @param {ResourceInfo[]} listings 
 * @param {ListingOptions} options 
 * @returns 
 */
function formatListing(listings: any[], options: any) {
  if (!options.long) {
    // Write short formatted
    let values = listings.map((listingInfo) => {
      let path = options.full
      ? listingInfo.url
      : listingInfo.relativePath 
      
      if (listingInfo.isDir) return chalk.blue.bold(path)
      else if (path.endsWith('.acl')) return chalk.red(path)
      else return path
    })
    return columns(values)
    // console.log(columns(values));
  } else {
    // Write long formatted
    const fileNameLengths = listings.map(fileInfo => options.full ? fileInfo.url.length : getResourceInfoRelativePath(fileInfo).length)
    const fileNameFieldLength = Math.max(...[Math.max(...fileNameLengths.map(x => x || 0)), 8])

    const aclLengths = listings.map(fileInfo => fileInfo.acl ? (options.full ? fileInfo.acl.url.length : fileInfo.acl.relativePath.length) : 0)
    const aclFieldLength = Math.max(...[Math.max(...aclLengths.map(x => x || 0)), 3])

    const mtimeLength = listings.map(listingInfo => listingInfo.mtime ? listingInfo.mtime.toString().length : 0)
    const mtimeFieldLength = Math.max(...[Math.max(...mtimeLength), 5])

    const sizeLengths = listings.map(listingInfo => listingInfo.size ? listingInfo.size.toString().length : 0)
    const sizeFieldLength = Math.max(...[Math.max(...sizeLengths), 4])

    const modifiedLengths = listings.map(listingInfo => listingInfo.modified ? listingInfo.modified.toISOString().length : 0)
    const modifiedFieldLength = Math.max(...[Math.max(...modifiedLengths), 8])

    const titleFilenameString = "filename".padEnd(fileNameFieldLength)
    const titleMTimeString = "mtime".padEnd(mtimeFieldLength)
    const titleSizeString = "size".padEnd(sizeFieldLength)
    const titleModifiedString = "modified".padEnd(modifiedFieldLength)
    const titleAclString = "acl".padEnd(aclFieldLength)

    // SORT the listings
    listings.sort((a, b) => (a.url).localeCompare(b.url))

    let output = ''
    output += `${titleFilenameString} | ${titleMTimeString} | ${titleSizeString} | ${titleModifiedString} | ${titleAclString}\n`
    output += `${'-'.repeat(fileNameFieldLength + mtimeFieldLength + sizeFieldLength + modifiedFieldLength + aclFieldLength + 12)}\n`
    for (let listingInfo of listings) {
      const path = (options.full ? listingInfo.url : getResourceInfoRelativePath(listingInfo)) || ''

      let pathString = '';
      if (listingInfo.isDir) pathString = chalk.blue.bold(path.padEnd(fileNameFieldLength))
      else if (path.endsWith('.acl')) pathString = chalk.red(path.padEnd(fileNameFieldLength))
      else pathString = path.padEnd(fileNameFieldLength)

      const mtime = (listingInfo.mtime ? listingInfo.mtime.toString() : '').padEnd(mtimeFieldLength)         
      const size = (listingInfo.size ? listingInfo.size.toString() : '').padEnd(sizeFieldLength)        
      const modified = (listingInfo.modified ? listingInfo.modified.toISOString() : '').padEnd(modifiedFieldLength)
      const aclPath = listingInfo.acl ? (options.full ? listingInfo.acl.url : getResourceInfoRelativePath(listingInfo.acl)) : ''
      const acl = aclPath.padEnd(aclFieldLength)
      output += `${pathString} | ${mtime} | ${size} | ${modified} | ${acl}\n`
    } 
    return(output)
  }
}
