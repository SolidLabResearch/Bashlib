import { Command } from 'commander';
import move from '../../commands/solid-move';
import authenticate from '../../utils/authenticate';
import { addEnvOptions, changeUrlPrefixes } from '../../utils/shellutils';
import { writeErrorString } from '../../utils/util';

export function addMoveCommand(program: Command, exit = false) { 

  async function executeMoveCommand (src: string, dst: string, options: any) {
    let programOpts = addEnvOptions(program.opts() || {});
    const authenticationInfo = await authenticate(programOpts)
    options.fetch = authenticationInfo.fetch
    try {
      src = await changeUrlPrefixes(authenticationInfo, src)
      dst = await changeUrlPrefixes(authenticationInfo, dst)
      await move(src, dst, options)
    } catch (e) {
      writeErrorString(`Could not move requested resources from ${src} to ${dst}`, e)
      if (exit) process.exit(1)
    }
    if (exit) process.exit(0)
  }


  program
    .command('mv')
    .description('Utility to move files or containers on remote Solid pod.')
    .argument('<src>', 'file or directory to be moved')
    .argument('<dst>', 'destination of the move')
    .option('-a, --all', 'Move .acl files when moving directories recursively')
    .option('-i, --interactive-override', 'Interactive confirmation prompt when overriding existing files')
    .option('-n, --no-override', 'Do not override existing files')
    .option('-v, --verbose', 'Log all operations') 
    .action(executeMoveCommand)
  
  program
    .command('move')
    .description('Utility to move files or containers on remote Solid pod.')
    .argument('<src>', 'file or directory to be moved')
    .argument('<dst>', 'destination of the move')
    .option('-a, --all', 'Move .acl files when moving directories recursively')
    .option('-i, --interactive-override', 'Interactive confirmation prompt when overriding existing files')
    .option('-n, --no-override', 'Do not override existing files')
    .option('-v, --verbose', 'Log all operations') 
    .action(executeMoveCommand)
  
  return program
}
