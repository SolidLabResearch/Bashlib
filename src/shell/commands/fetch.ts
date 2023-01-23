import { Command } from 'commander';
import authenticatedFetch from '../../commands/solid-fetch';
import authenticate from '../../authentication/authenticate';
import { addEnvOptions, arrayifyHeaders, changeUrlPrefixes, getAndNormalizeURL } from '../../utils/shellutils';
import { writeErrorString } from '../../utils/util';
import SolidCommand from './SolidCommand';

export default class FetchCommand extends SolidCommand { 
  public addCommand(program: Command) {
    this.programopts = program.opts();
    let urlParam = this.mayUseCurrentContainer ? '[url]' : '<url>'

    program
      .command('cat')
      .description('Utility to display files from remote Solid pod.')
      .argument(urlParam, 'file to be displayed')
      .action(async (url: string, options: any) => { 
        await this.executeCommand(url, options)
      })
    
    program
      .command('fetch')
      .description('Utility to fetch files from remote Solid pod.')
      .argument(urlParam, 'file to be fetched')
      .option('-v, --verbose', 'Write out full response and all headers')
      .option('-H, --only-headers', 'Only write out headers')
      .option('-m, --method <string>', 'GET, POST, PUT, DELETE, ...')
      .option('-b, --body <string>', 'The request body')
      .option('-F, --file <string>', 'File containing the request body. Ignored when the --body flag is set.')
      .option('-h, --header <string>', 'The request header. Multiple headers can be added separately. e.g. -h "Accept: application/json" -h "..." ', arrayifyHeaders)
      .action(async (url: string, options: any) => { 
        await this.executeCommand(url, options)
      })
  
    return program
  }
  
  private async executeCommand(url?: string, options?: any) {
    let programOpts = addEnvOptions(this.programopts || {});
    const authenticationInfo = await authenticate(programOpts)
    options.fetch = authenticationInfo.fetch
    try {
      if (!url) url = this.shell?.workingContainer || undefined;
      if (this.shell) url = getAndNormalizeURL(url, this.shell);
      if (!url) throw new Error('No valid url parameter passed')
      url = await changeUrlPrefixes(authenticationInfo, url)
      await authenticatedFetch(url, options)
    } catch (e) {
      writeErrorString(`Could not fetch resource at ${url}`, e, options)
      if (this.mayExit) process.exit(1)
    }
    if (this.mayExit) process.exit(0)
  }

}
