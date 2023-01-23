import { Command } from 'commander';
import shell from '../../commands/solid-shell';
import { writeErrorString } from '../../utils/util';
import SolidCommand from './SolidCommand';

export default class ShellCommand extends SolidCommand { 

  public addCommand(program: Command) {
    // this.programopts = program.opts();

    // program
    //   .command('shell')
    //   .description('Open a Solid Shell')
    //   .action(async () => {
    //     try {
    //       await shell(program.opts());
    //     } catch (e) {
    //       writeErrorString(`Could not open Solid Shell`, e, options)
    //       if (this.mayExit) process.exit(1)
    //     }
    //     if (this.mayExit) process.exit(0)
    //   })

    return program
  }
}
