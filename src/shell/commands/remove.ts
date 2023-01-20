import { Command } from 'commander';
import remove from '../../commands/solid-remove';
import authenticate from '../../authentication/authenticate';
import { addEnvOptions, changeUrlPrefixes, getAndNormalizeURL } from '../../utils/shellutils';
import { writeErrorString } from '../../utils/util';
import SolidCommand from './SolidCommand';

export default class RemoveCommand extends SolidCommand { 

  public addCommand(program: Command) {
    this.programopts = program.opts();

    program
      .command('rm')
      .description('Utility to remove files or container on remote Solid pod.')
      .argument('<urls...>', 'URL of container to be listed')
      .option('-r, --recursive', 'Recursively removes all files in given container (.acl files are removed on resource removal)') // Should this be default?
      .option('-v, --verbose', 'Log all operations') // Should this be default?
      .action(this.executeCommand)
    
    program
      .command('remove')
      .description('Utility to remove files or container on remote Solid pod.')
      .argument('<urls...>', 'URL of container to be listed')
      .option('-r, --recursive', 'Recursively removes all files in given container (.acl files are removed on resource removal)') // Should this be default?
      .option('-v, --verbose', 'Log all operations') // Should this be default?
      .action(this.executeCommand)

    return program
  }

  async executeCommand (urls: string[], options: any) {
    let programOpts = addEnvOptions(this.programopts || {});
    const authenticationInfo = await authenticate(programOpts)
    options.fetch = authenticationInfo.fetch
    for (let url of urls) {
      try {
        if (this.shell) url = getAndNormalizeURL(url, this.shell);
        url = await changeUrlPrefixes(authenticationInfo, url)
        await remove(url, options)
      } catch (e) {
        writeErrorString(`Could not remove ${url}`, e, options)
      }
    }
    if (this.mayExit) process.exit(0)
  }

}
