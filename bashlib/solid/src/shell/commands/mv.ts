import { Command } from 'commander';
import move from '../../commands/solid-move';
import authenticate from '../../authentication/authenticate';
import { addEnvOptions, changeUrlPrefixes, getAndNormalizeURL } from '../../utils/shellutils';
import { writeErrorString } from '../../utils/util';
import SolidCommand from './SolidCommand';

export default class MkdirCommand extends SolidCommand { 

  public addCommand(program: Command) {
    this.programopts = program.opts();

    program
      .command('mv')
      .description('Utility to move files or containers on remote Solid pod.')
      .argument('<src>', 'file or directory to be moved')
      .argument('<dst>', 'destination of the move')
      .option('-a, --all', 'Move .acl files when moving directories recursively')
      .option('-i, --interactive-override', 'Interactive confirmation prompt when overriding existing files')
      .option('-n, --no-override', 'Do not override existing files')
      .option('-v, --verbose', 'Log all operations')
      .action(this.executeCommand)
    
    program
      .command('move')
      .description('Utility to move files or containers on remote Solid pod.')
      .argument('<src>', 'file or directory to be moved')
      .argument('<dst>', 'destination of the move')
      .option('-a, --all', 'Move .acl files when moving directories recursively')
      .option('-i, --interactive-override', 'Interactive confirmation prompt when overriding existing files')
      .option('-n, --no-override', 'Do not override existing files')
      .option('-v, --verbose', 'Log all operations')
      .action(this.executeCommand)
    
    return program
  }

  async executeCommand (src: string, dst: string, options: any) {
    let programOpts = addEnvOptions(this.programopts || {});
    const authenticationInfo = await authenticate(programOpts)
    options.fetch = authenticationInfo.fetch
    try {
      if (this.shell) src = getAndNormalizeURL(src, this.shell);
      if (this.shell) dst = getAndNormalizeURL(dst, this.shell);
      src = await changeUrlPrefixes(authenticationInfo, src)
      dst = await changeUrlPrefixes(authenticationInfo, dst)
      await move(src, dst, options)
    } catch (e) {
      writeErrorString(`Could not move requested resources from ${src} to ${dst}`, e)
      if (this.mayExit) process.exit(1)
    }
    if (this.mayExit) process.exit(0)
  }


}
