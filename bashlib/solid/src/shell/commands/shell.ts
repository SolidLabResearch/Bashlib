import { Command } from 'commander';
import shell from '../../commands/solid-shell';
import authenticate from '../../utils/authenticate';
import { addEnvOptions, changeUrlPrefixes } from '../../utils/shellutils';
import { writeErrorString } from '../../utils/util';

export function addShellCommand(program: Command, exit = false) { 
  program
    .command('shell')
    .description('Open a Solid Shell')
    .action(async (options) => {
      let programOpts = addEnvOptions(program.opts() || {});
      const authenticationInfo = await authenticate(programOpts)
      options.fetch = authenticationInfo.fetch
      try {
        await shell(program.opts());
      } catch (e) {
        writeErrorString(`Could not open Solid Shell`, e)
        if (exit) process.exit(1)
      } 
      if (exit) process.exit(0)
    })

  return program
}
