import { Command } from 'commander';
import authenticate from '../../utils/authenticate';
import { addEnvOptions, changeUrlPrefixes } from '../../utils/shellutils';
import { writeErrorString } from '../../utils/util';
import tree from '../../commands/solid-tree';

export function addTreeCommand(program: Command, exit = false) { 
  
  program
    .command('tree')
    .description('Utility to query RDF resoures on your data pod.')
    .argument('<url>', 'Base container to construct tree over')
    .option('-a, --all', 'Match .acl and .meta files')
    .option('-f, --full', 'Return containing files using full filename.')
    .option('-v, --verbose', 'Log all operations') // Should this be default?
    .action( async (url, options) => {
      let programOpts = addEnvOptions(program.opts() || {});
      const authenticationInfo = await authenticate(programOpts)
      options.fetch = authenticationInfo.fetch
      url = await changeUrlPrefixes(authenticationInfo, url)
      try {
        await tree(url, options)  
      } catch (e) {
        writeErrorString(`Could not display tree structure for ${url}`, e)
        if (exit) process.exit(1)
      }
      if (exit) process.exit(0)
    })
  
  return program
}
