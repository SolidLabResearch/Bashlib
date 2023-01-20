import { getResourceInfo } from '@inrupt/solid-client';
import { isContainer } from '@inrupt/solid-client';
import authenticate from '../../../authentication/authenticate';
import { addEnvOptions, normalizeURL, getAndNormalizeURL, changeUrlPrefixes } from '../../../utils/shellutils';
import { checkRemoteFileAccess, writeErrorString } from '../../../utils/util';
import { Command } from 'commander';
import SolidCommand from '../SolidCommand';

export default class ChangedirectoryCommand extends SolidCommand { 
  
  public addCommand(program: Command) {
    this.programopts = program.opts();
    let urlParam = this.mayUseCurrentContainer ? '[url]' : '<url>'
    
    program
      .command('cd')
      .description('Utility to navigate between containers in a Solid pod.')
      .argument(urlParam, 'container to navigate to. Can be a relative path or a full URL.')
      .action(async (url: string, options: any) => { 
        await this.executeCommand(url, options)
      })
    
    return program
  }

  private async executeCommand(url?: string, options?: any) {
    let programOpts = addEnvOptions(this.programopts || {});
    const authenticationInfo = await authenticate(programOpts)
    options.fetch = authenticationInfo.fetch
    if (!this.shell)
      throw new Error('Cannot access the current shell to update current working container.')
    if (!this.shell.podBaseURI)
      throw new Error('Cannot discover pod base url.')
    
    try {
      if (!url) url = this.shell?.podBaseURI || undefined;
      url = getAndNormalizeURL(url, this.shell);
      url = await changeUrlPrefixes(authenticationInfo, url)
      if (!url) throw new Error('Could not discover url value or pod root location.')
      if (!url.endsWith('/')) url = url + '/'
      if (this.shell.podBaseURI.startsWith(url) && this.shell.podBaseURI !== url) 
        throw new Error('Cannot change directory to this location. Please provide a relative location within the data pod, or provide an absolute URI.')
      if (await checkRemoteFileAccess(url, authenticationInfo.fetch) && isContainer(await getResourceInfo(url, {fetch: authenticationInfo.fetch}))) {
        await this.shell.changeWorkingContainer(url);
      } else {
        console.error(`Could not change working container to ${url}: No such container`)
        if (this.mayExit) process.exit(1)
      }
    } catch (e) { 
      writeErrorString(`Could not change working container to ${url}`, e, options)
      if (this.mayExit) process.exit(1)
    }
    if (this.mayExit) process.exit(0)
  }
}
