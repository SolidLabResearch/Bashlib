import { Command } from 'commander';
import SolidCommand from './SolidCommand';

export default class ExitCommand extends SolidCommand { 

  public addCommand(program: Command) {
    this.programopts = program.opts();
    
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
}