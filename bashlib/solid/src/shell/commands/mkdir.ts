import { Command } from 'commander';
import authenticate from '../../authentication/authenticate';
import { addEnvOptions, changeUrlPrefixes, getAndNormalizeURL } from '../../utils/shellutils';
import { writeErrorString } from '../../utils/util';
import makeDirectory from '../../commands/solid-mkdir';
import SolidCommand from './SolidCommand';

export default class MkdirCommand extends SolidCommand { 

  public addCommand(program: Command) {
    this.programopts = program.opts();
    
    program
      .command('mkdir')
      .description('Utility to add an empty container to your pod.')
      .argument('<url>', 'Container to start the search')
      .option('-v, --verbose', 'Log all operations')
      .action(async (url, options) => {
        let programOpts = addEnvOptions(program.opts() || {});
        const authenticationInfo = await authenticate(programOpts)
        options.fetch = authenticationInfo.fetch
        try {
          if (this.shell) url = getAndNormalizeURL(url, this.shell);
          url = await changeUrlPrefixes(authenticationInfo, url)
          await makeDirectory(url, options)
        } catch (e) {
          writeErrorString(`Could not create container at ${url}`, e)
          if (this.mayExit) process.exit(1)
        }
        if (this.mayExit) process.exit(0)
      })
    
    return program
  }
}
