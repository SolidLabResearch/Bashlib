import copy from '../../commands/solid-copy';
import authenticate from '../../authentication/authenticate';
import { addEnvOptions, changeUrlPrefixes } from '../../utils/shellutils';
import { isRemote, writeErrorString } from '../../utils/util';
import { Command, Option } from 'commander';
import SolidCommand from './SolidCommand';
import { makePatchBody, readPatchBodyFromFile, readPatchBodyFromURL, sendPatchRequest } from '../../commands/solid-patch';

export default class PatchCommand extends SolidCommand { 

  public addCommand(program: Command) {
    this.programopts = program.opts();

    program
      .command('patch')
      .description('Patch a target resource using N3-patch')
      .argument('<target>', 'Resource to be patched')
      .option('-w, --where <conditionPattern>', 'Condition BGP of patch request.')
      .option('-i, --inserts <insertionPattern>', 'Insertion BGP of patch request.')
      .option('-d, --deletes <deletionPattern>', 'Deletion BGP of patch request.')
      .option('-r, --resource', 'Resource containing a patch request. Can be a local file or remote resource')
      .option('-v, --verbose', 'Log all operations')
      .action(this.executeCommand)
    return program
  }

  async executeCommand (target: string, options: any) {
    if (!options.inserts && !options.deletes && !options.resource) {
      writeErrorString('No patch operation specified', new Error('No patch operation specified'), options)
      if (this.mayExit) process.exit(1)
    }
    
    let programOpts = addEnvOptions(this.programopts || {});
    const authenticationInfo = await authenticate(programOpts)
    target = await changeUrlPrefixes(authenticationInfo, target)

    try {
      let body;
      if(options.file) {
        if (isRemote(options.resource)) {
          body = await readPatchBodyFromURL(options.resource, authenticationInfo.fetch);
        } else {
          body = await readPatchBodyFromFile(options.resource);
        }
      } else {
        body = makePatchBody({ where: options.where, inserts: options.inserts, deletes: options.deletes })
      }

      const res = await sendPatchRequest(target, authenticationInfo.fetch, body)
      if (!res) {
        writeErrorString(`Could not patch resource at ${target}`, new Error('Could not patch resource'), options)
        if (this.mayExit) process.exit(1)
      } else {
        if (options.verbose) console.log(`Resource at ${target} patched successfully`)
      }
    } catch (e) {
      writeErrorString(`Could not patch resource at ${target}`, e, options)
      if (this.mayExit) process.exit(1)
    }
    if (this.mayExit) process.exit(0)
  }
}
