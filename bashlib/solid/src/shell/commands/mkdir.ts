import { Command } from 'commander';
import authenticate from '../../utils/authenticate';
import { addEnvOptions, changeUrlPrefixes } from '../../utils/shellutils';
import { writeErrorString } from '../../utils/util';
import makeDirectory from '../../commands/solid-mkdir';

export function addMkdirCommand(program: Command, exit = false) { 
  
  program
    .command('mkdir')
    .description('Utility to add an empty container to your pod.')
    .argument('<url>', 'Container to start the search')
    .option('-v, --verbose', 'Log all operations')
    .action( async (url, options) => {
      let programOpts = addEnvOptions(program.opts() || {});
      const authenticationInfo = await authenticate(programOpts)
      options.fetch = authenticationInfo.fetch
      try {
        url = await changeUrlPrefixes(authenticationInfo, url)
        await makeDirectory(url, options)
      } catch (e) {
        writeErrorString(`Could not create container at ${url}`, e)
        if (exit) process.exit(1)
      }
      if (exit) process.exit(0)
    })
  
  return program
}
