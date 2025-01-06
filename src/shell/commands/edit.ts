import { Command } from 'commander';
import edit from '../../commands/solid-edit';
import authenticate from '../../authentication/authenticate';
import { addEnvOptions, changeUrlPrefixes } from '../../utils/shellutils';
import { isDirectory, writeErrorString } from '../../utils/util';
import { SolidShell } from '../../commands/solid-shell';
import SolidCommand from './SolidCommand';


var editor = process.env.EDITOR || 'vi';

export default class EditCommand extends SolidCommand { 

  public addCommand(program: Command) {
    this.programopts = program.opts();
  
    program
      .command('edit')
      .description('Edit remote resources')
      .argument('<url>', 'Resource URL')
      .option('-e, --editor <path_to_editor_executable>', 'Use custom editor')
      .option('-t, --touch', 'Create file if not exists') // Should this be default?
      .option('-v, --verbose', 'Log all operations') // Should this be default?
      .action(async (url, options) => {
        let programOpts = addEnvOptions(program.opts() || {});
        const authenticationInfo = await authenticate(programOpts)
        options.fetch = authenticationInfo.fetch;
        options.editor = options.editor || editor
        try {
          url = await changeUrlPrefixes(authenticationInfo, url)
          if (isDirectory(url)) {
            console.error('Cannot edit containers, only single files.')
            process.exit(1);
          }
          await edit(url, options)
        } catch (e) {
          writeErrorString(`Could not edit resource at ${url}`, e, options)
          if (this.mayExit) process.exit(1)
        }
        if (this.mayExit) process.exit(0)
      })
    return program
  }
}
