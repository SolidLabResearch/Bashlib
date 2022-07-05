import { Command } from 'commander';
import copy from '../../commands/solid-copy';
import authenticate from '../../utils/authenticate';
import { addEnvOptions, changeUrlPrefixes } from '../../utils/shellutils';
import { writeErrorString } from '../../utils/util';

export function addCopyCommand(program: Command, exit = false) { 
  
  async function executeCopyCommand (src: string, dst: string, options: any) {
    let programOpts = addEnvOptions(program.opts() || {});
    const authenticationInfo = await authenticate(programOpts)
    let opts = { 
      fetch: authenticationInfo.fetch, 
    }
    try {
      src = await changeUrlPrefixes(authenticationInfo, src)
      dst = await changeUrlPrefixes(authenticationInfo, dst)
      await copy(src, dst, { ...options, ...opts})  
    } catch (e) {
      writeErrorString(`Could not copy requested resources from ${src} to ${dst}`, e)
      if (exit) process.exit(1)
    }
    if (exit) process.exit(0)
  }

  program
    .command('cp')
    .description('Utility to copy files from and to both the local file system and remote Solid pod.')
    .argument('<src>', 'file or directory to be copied')
    .argument('<dst>', 'destination to copy file or directory to')
    .option('-a, --all', 'Copy .acl files in recursive directory copies')
    .option('-i, --interactive-override', 'Interactive confirmation prompt when overriding existing files')
    .option('-n, --no-override', 'Do not override existing files')
    .option('-v, --verbose', 'Log all read and write operations')
    .action(executeCopyCommand)

  program
    .command('copy')
    .description('Utility to copy files from and to both the local file system and remote Solid pod.')
    .argument('<src>', 'file or directory to be copied')
    .argument('<dst>', 'destination to copy file or directory to')
    .option('-a, --all', 'Copy .acl files in recursive directory copies')
    .option('-i, --interactive-override', 'Interactive confirmation prompt when overriding existing files')
    .option('-n, --no-override', 'Do not override existing files')
    .option('-v, --verbose', 'Log all read and write operations')
    .action(executeCopyCommand)
  
  return program

}