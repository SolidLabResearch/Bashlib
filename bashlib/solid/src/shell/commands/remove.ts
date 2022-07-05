import { Command } from 'commander';
import remove from '../../commands/solid-remove';
import authenticate from '../../utils/authenticate';
import { addEnvOptions, changeUrlPrefixes } from '../../utils/shellutils';
import { writeErrorString } from '../../utils/util';

export function addRemoveCommand(program: Command, exit = false) { 

  async function executeRemoveCommand (url: string, options: any) {
    let programOpts = addEnvOptions(program.opts() || {});
    const authenticationInfo = await authenticate(programOpts)
    options.fetch = authenticationInfo.fetch
    try {
      url = await changeUrlPrefixes(authenticationInfo, url)
      await remove(url, options)
    } catch (e) {
      writeErrorString(`Could not remove ${url}`, e)
      if (exit) process.exit(1)
    }
    if (exit) process.exit(0)
  }

  program
    .command('rm')
    .description('Utility to remove files or container on remote Solid pod.')
    .argument('<url>', 'URL of container to be listed')
    .option('-r, --recursive', 'Recursively removes all files in given container (.acl files are removed on resource removal)') // Should this be default?
    .option('-v, --verbose', 'Log all operations') // Should this be default?
    .action(executeRemoveCommand)
  
  program
    .command('remove')
    .description('Utility to remove files or container on remote Solid pod.')
    .argument('<url>', 'URL of container to be listed')
    .option('-r, --recursive', 'Recursively removes all files in given container (.acl files are removed on resource removal)') // Should this be default?
    .option('-v, --verbose', 'Log all operations') // Should this be default?
    .action(executeRemoveCommand)

  return program
}
