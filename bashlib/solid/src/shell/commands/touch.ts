import { Command } from 'commander';
import touch from '../../commands/solid-touch';
import authenticate from '../../utils/authenticate';
import { addEnvOptions, changeUrlPrefixes } from '../../utils/shellutils';
import { writeErrorString } from '../../utils/util';

export function addTouchCommand(program: Command, exit = false) { 
  program 
    .command('touch')
    .description('Utility to create an empty resource on your data pod (if doesn\'t exist yet)')
    .argument('<url>', 'file to be created')
    .option('-v, --verbose', 'Log all operations') 
    .action( async (url, options) => {
      let programOpts = addEnvOptions(program.opts() || {});
      const authenticationInfo = await authenticate(programOpts)
      options.fetch = authenticationInfo.fetch
      url = await changeUrlPrefixes(authenticationInfo, url)
      try {
        await touch(url, options)
      } catch (e) {
        writeErrorString(`Could not touch ${url}`, e)
        if (exit) process.exit(1)
      }
      if (exit) process.exit(0)
    })
  
  return program
}