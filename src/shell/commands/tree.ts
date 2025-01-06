import authenticate from '../../authentication/authenticate';
import { addEnvOptions, changeUrlPrefixes, getAndNormalizeURL } from '../../utils/shellutils';
import { writeErrorString } from '../../utils/util';
import tree from '../../commands/solid-tree';
import { Command } from 'commander';
import SolidCommand from './SolidCommand';

export default class TreeCommand extends SolidCommand { 

  public addCommand(program: Command) {
    this.programopts = program.opts();
    let urlParam = this.mayUseCurrentContainer ? '[url]' : '<url>'
    
    program
      .command('tree')
      .description('View resource tree from container')
      .argument(urlParam, 'Base container to construct tree over')
      .option('-a, --all', 'Match .acl and .meta files')
      .option('-f, --full', 'Return containing files using full filename.')
      .option('-v, --verbose', 'Log all operations') // Should this be default?
      .action(async (url: string, options: any) => { 
        await this.executeCommand(url, options)
      })
    
    return program
  }
  
  private async executeCommand (url?: string, options?: any) {
    let programOpts = addEnvOptions(this.programopts || {});
    const authenticationInfo = await authenticate(programOpts)
    options.fetch = authenticationInfo.fetch
    try {
      if (!url) url = this.shell?.workingContainer || undefined;
      if (this.shell) url = getAndNormalizeURL(url, this.shell);
      if (!url) throw new Error('No valid url parameter passed')
      url = await changeUrlPrefixes(authenticationInfo, url)
      await tree(url, options)
    } catch (e) {
      writeErrorString(`Could not display tree structure for ${url}`, e, options)
      if (this.mayExit) process.exit(1)
    }
    if (this.mayExit) process.exit(0)
  }
}
