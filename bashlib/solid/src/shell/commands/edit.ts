import { Command } from 'commander';
import edit from '../../commands/solid-edit';
import authenticate from '../../utils/authenticate';
import { addEnvOptions, changeUrlPrefixes } from '../../utils/shellutils';
import { isDirectory, writeErrorString } from '../../utils/util';


var editor = process.env.EDITOR || 'vi';

export function addEditCommand(program: Command, exit = false) { 
  
  program
    .command('edit')
    .description('Edit a remote file using your default editor')
    .argument('<url>', 'Resource URL')
    //.option('-h, --header <string>', 'The request header. Multiple headers can be added separately. These follow the style of CURL. e.g. --header "Content-Type: application/json" ', arrayifyHeaders)
    .option('-e, --editor <path_to_editor_executable>', 'Use custom editor') 
    .option('-t, --touch', 'Create file if not exists') // Should this be default?
    .option('-v, --verbose', 'Log all operations') // Should this be default?
    .action( async (url, options) => {
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
        writeErrorString(`Could not edit resource at ${url}`, e)
        if (exit) process.exit(1)
      } 
      if (exit) process.exit(0)
    })

  return program
}
