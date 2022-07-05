import { Command } from 'commander';
import authenticate from '../../utils/authenticate';
import { addEnvOptions, changeUrlPrefixes } from '../../utils/shellutils';
import { writeErrorString } from '../../utils/util';
import find from '../../commands/solid-find';

export function addFindCommand(program: Command, exit = false) { 
  
  program
    .command('find')
    .description('Utility to find resoures on your data pod.')
    .argument('<url>', 'Container to start the search')
    .argument('<filename>', 'Filename to match, processed as RegExp(filename)')
    .option('-a, --all', 'Match .acl and .meta files')
    .option('-f, --full', 'Match full filename.')
    .option('-v, --verbose', 'Log all operations') 
    .action( async (url: string, filename: string, options: any) => {
      let programOpts = addEnvOptions(program.opts() || {});
      const authenticationInfo = await authenticate(programOpts)
      options.fetch = authenticationInfo.fetch
      try {
        url = await changeUrlPrefixes(authenticationInfo, url)
        for await (let fileInfo of find(url, filename, options)) {
          const name = options.full ? fileInfo.absolutePath : (fileInfo.relativePath || fileInfo.absolutePath)
          console.log(name)
        }
      } catch (e) {
        writeErrorString(`Could not find match in ${url}`, e)
        if (exit) process.exit(1)
      }
      if (exit) process.exit(0)
    })
  
  return program
}
