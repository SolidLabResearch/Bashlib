import { Command } from 'commander';
import copy from '../../commands/solid-copy';
import authenticate from '../../utils/authenticate';
import { addEnvOptions, changeUrlPrefixes } from '../../utils/shellutils';
import { writeErrorString } from '../../utils/util';

export function addExitCommand(program: Command, exit = false) { 
  
  program
    .command('exit')
    .description('Exit the shell.')
    .action(() => process.exit(0))
  
  program
    .command('quit')
    .description('Exit the shell.')
    .action(() => process.exit(0))

  return program

}