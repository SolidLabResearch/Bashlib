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
      .description('Create an empty resource')
      .argument('<url>', 'resource to be created')
      .option('-c, --content-type <string>', 'Content type of the created resource')
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
          writeErrorString(`Could not touch ${url}`, e, options)
          if (this.mayExit) process.exit(1)
        }
        if (this.mayExit) process.exit(0)
      })
  
    return program
  }
}