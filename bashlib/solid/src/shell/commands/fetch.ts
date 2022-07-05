import { Command } from 'commander';
import authenticatedFetch from '../../commands/solid-fetch';
import authenticate from '../../utils/authenticate';
import { addEnvOptions, arrayifyHeaders, changeUrlPrefixes } from '../../utils/shellutils';
import { writeErrorString } from '../../utils/util';

export function addFetchCommand(program: Command, exit = false) { 

  async function executeFetchCommand (url: string, options: any) {
    let programOpts = addEnvOptions(program.opts() || {});
    const authenticationInfo = await authenticate(programOpts)
    options.fetch = authenticationInfo.fetch
    try {
      url = await changeUrlPrefixes(authenticationInfo, url)
      await authenticatedFetch(url, options)
    } catch (e) {
      writeErrorString('Could not fetch resource at ${url}', e)
      if (exit) process.exit(1)
    }
    if (exit) process.exit(0)
  }

  program
    .command('cat')
    .description('Utility to display files from remote Solid pod.')
    .argument('<url>', 'file to be displayed')
    .action(executeFetchCommand)
  
  program
    .command('fetch')
    .description('Utility to fetch files from remote Solid pod.')
    .argument('<url>', 'file to be fetched')
    .option('-v, --verbose', 'Write out full response and all headers')
    .option('-H, --only-headers', 'Only write out headers')
    .option('-m, --method <string>', 'GET, POST, PUT, DELETE, ...')
    .option('-b, --body <string>', 'The request body')
    .option('-F, --file <string>', 'File containing the request body. Ignored when the --body flag is set.')
    .option('-h, --header <string>', 'The request header. Multiple headers can be added separately. e.g. -h "Accept: application/json" -h "..." ', arrayifyHeaders)
    .action(executeFetchCommand)
  
  return program
}
