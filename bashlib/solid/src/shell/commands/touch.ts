import { Command } from 'commander';
import touch from '../../commands/solid-touch';
import authenticate from '../../authentication/authenticate';
import { addEnvOptions, changeUrlPrefixes, getAndNormalizeURL } from '../../utils/shellutils';
import { writeErrorString } from '../../utils/util';
import SolidCommand from './SolidCommand';

export default class TouchCommand extends SolidCommand { 

  public addCommand(program: Command) {
    this.programopts = program.opts();

    program
      .command('touch')
      .description('Utility to create an empty resource on your data pod (if doesn\'t exist yet)')
      .argument('<url>', 'file to be created')
      .option('-v, --verbose', 'Log all operations')
      .action(async (url, options) => {
        let programOpts = addEnvOptions(program.opts() || {});
        const authenticationInfo = await authenticate(programOpts)
        options.fetch = authenticationInfo.fetch
        try {
          if (this.shell) url = getAndNormalizeURL(url, this.shell);
          url = await changeUrlPrefixes(authenticationInfo, url)
          await touch(url, options)
        } catch (e) {
          writeErrorString(`Could not touch ${url}`, e)
          if (this.mayExit) process.exit(1)
        }
        if (this.mayExit) process.exit(0)
      })
  
    return program
  }
}