import { Command } from 'commander';
import list from '../../commands/solid-list';
import authenticate from '../../authentication/authenticate';
import { addEnvOptions, changeUrlPrefixes, getResourceInfoRelativePath, normalizeURL, getAndNormalizeURL } from '../../utils/shellutils';
import { writeErrorString, ResourceInfo } from '../../utils/util';
import chalk from 'chalk';
import SolidCommand from './SolidCommand';
const columns = require('cli-columns');

export default class ListCommand extends SolidCommand { 

  public addCommand(program: Command) {
    this.programopts = program.opts();
    let urlParam = this.mayUseCurrentContainer ? '[url]' : '<url>'

    program
      .command('ls')
      .description('Utility to view files in container on remote Solid pod.')
      .argument(urlParam, 'URL of container to be listed')
      .option('-a, --all', 'List all files including acl files')
      .option('-f, --full', 'List files with their full uri')
      .option('-l, --long', 'List in long format')
      .option('-v, --verbose', '')
      .action(async (url: string, options: any) => { 
        await this.executeCommand(url, options)
      })

    program
      .command('list')
      .description('Utility to view files in container on remote Solid pod.')
      .argument(urlParam, 'URL of container to be listed')
      .option('-a, --all', 'List all files including acl files')
      .option('-f, --full', 'List files with their full uri')
      .option('-l, --long', 'List in long format')
      .option('-v, --verbose', '')
      .action(async (url: string, options: any) => { 
        await this.executeCommand(url, options)
      })
    
    return program
  }
  
  private async executeCommand(url?: string, options?: any) {
    let programOpts = addEnvOptions(this.programopts || {});
    const authenticationInfo = await authenticate(programOpts)
    options.fetch = authenticationInfo.fetch
    let listings: ResourceInfo[] = []
    try {
      if (this.shell) { 
        if (!url) url = this.shell?.workingContainer || undefined;
        url = getAndNormalizeURL(url, this.shell);
      }
      if (!url) throw new Error('No valid url parameter passed')
      url = await changeUrlPrefixes(authenticationInfo, url)
      listings = await list(url, options)
    } catch (e) {
      writeErrorString(`Could not provide listing for ${url}`, e, options)
      if (this.mayExit) process.exit(1)
    }
    // Output to command line
    console.log(formatListing(listings, options))
    if (this.mayExit) process.exit(0)
  }
}


/**
 * 
 * @param {ResourceInfo[]} listings 
 * @param {ICommandOptionsList} options 
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
      else if (path.endsWith('.meta')) return chalk.greenBright(path)
      else return path
    })
    return columns(values)
  } else {
    // Write long formatted
    const fileNameLengths = listings.map(fileInfo => options.full ? fileInfo.url.length : getResourceInfoRelativePath(fileInfo).length)
    const fileNameFieldLength = Math.max(...[Math.max(...fileNameLengths.map(x => x || 0)), 8])

    const aclLengths = listings.map(fileInfo => fileInfo.acl ? (options.full ? fileInfo.acl.url.length : fileInfo.acl.relativePath.length) : 0)
    const aclFieldLength = Math.max(...[Math.max(...aclLengths.map(x => x || 0)), 3])

    const metaLengths = listings.map(fileInfo => fileInfo.metadata ? (options.full ? fileInfo.metadata.url.length : fileInfo.metadata.relativePath.length) : 0)
    const metaFieldLength = Math.max(...[Math.max(...metaLengths.map(x => x || 0)), 4])

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
    const titleMetaString = "meta".padEnd(metaFieldLength)

    // SORT the listings
    listings.sort((a, b) => (a.url).localeCompare(b.url))

    let output = ''
    output += `${titleFilenameString} | ${titleMTimeString} | ${titleSizeString} | ${titleModifiedString} | ${titleAclString} | ${titleMetaString}\n`
    output += `${'-'.repeat(fileNameFieldLength + mtimeFieldLength + sizeFieldLength + modifiedFieldLength + aclFieldLength + metaFieldLength + 16)}\n`
    for (let listingInfo of listings) {
      const path = (options.full ? listingInfo.url : getResourceInfoRelativePath(listingInfo)) || ''

      let pathString = '';
      if (listingInfo.isDir) pathString = chalk.blue.bold(path.padEnd(fileNameFieldLength))
      else if (path.endsWith('.acl')) pathString = chalk.red(path.padEnd(fileNameFieldLength))
      else if (path.endsWith('.meta')) pathString = chalk.greenBright(path.padEnd(fileNameFieldLength))
      else pathString = path.padEnd(fileNameFieldLength)

      const mtime = (listingInfo.mtime ? listingInfo.mtime.toString() : '').padEnd(mtimeFieldLength)         
      const size = (listingInfo.size ? listingInfo.size.toString() : '').padEnd(sizeFieldLength)        
      const modified = (listingInfo.modified ? listingInfo.modified.toISOString() : '').padEnd(modifiedFieldLength)
      const aclPath = listingInfo.acl ? (options.full ? listingInfo.acl.url : getResourceInfoRelativePath(listingInfo.acl)) : ''
      const acl = aclPath.padEnd(aclFieldLength)
      const metaPath = listingInfo.metadata ? (options.full ? listingInfo.metadata.url : getResourceInfoRelativePath(listingInfo.metadata)) : ''
      const meta = metaPath.padEnd(metaFieldLength)
      output += `${pathString} | ${mtime} | ${size} | ${modified} | ${acl} | ${meta}\n`
    } 
    return(output)
  }
}
