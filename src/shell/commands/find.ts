import { Command } from 'commander';
import authenticate from '../../authentication/authenticate';
import { addEnvOptions, changeUrlPrefixes, getAndNormalizeURL } from '../../utils/shellutils';
import { writeErrorString } from '../../utils/util';
import find from '../../commands/solid-find'
import { SolidShell } from '../../commands/solid-shell';
import SolidCommand from './SolidCommand';

export default class FindCommand extends SolidCommand { 

  public addCommand(program: Command) {
    this.programopts = program.opts();
  
    program
      .command('find')
      .description('Find resources')
      .argument('<url>', 'Container to start the search')
      .argument('<filename>', 'Filename to match, processed as RegExp(filename)')
      .option('-a, --all', 'Match .acl and .meta files')
      .option('-f, --full', 'Match full filename.')
      .option('-v, --verbose', 'Log all operations')
      .action(async (url: string, filename: string, options: any) => {
        let programOpts = addEnvOptions(program.opts() || {});
        const authenticationInfo = await authenticate(programOpts)
        options.fetch = authenticationInfo.fetch
          try {
          if (this.shell) url = getAndNormalizeURL(url, this.shell);
          url = await changeUrlPrefixes(authenticationInfo, url)
          for await (let fileInfo of find(url, filename, options)) {
            const name = options.full ? fileInfo.absolutePath : (fileInfo.relativePath || fileInfo.absolutePath)
            // Emit results to console
            console.log(name)
          }
        } catch (e) {
          writeErrorString(`Could not find match in ${url}`, e, options)
          if (this.mayExit) process.exit(1)
        }
        if (this.mayExit) process.exit(0)
      })
    
    return program
  }
}
