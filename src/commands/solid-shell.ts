import { Command } from 'commander';
import FetchCommand from '../shell/commands/fetch';
import ListCommand from '../shell/commands/list';
import TreeCommand from '../shell/commands/tree';
import CopyCommand from '../shell/commands/copy';
import MoveCommand from '../shell/commands/mv';
import RemoveCommand from '../shell/commands/remove'; 
import TouchCommand from '../shell/commands/touch';
import MkdirCommand from '../shell/commands/mkdir';
import FindCommand from '../shell/commands/find';
import QueryCommand from '../shell/commands/query';
import PermsCommand from '../shell/commands/perms';
import EditCommand from '../shell/commands/edit';
import ExitCommand from '../shell/commands/exit';
import chalk from 'chalk';
import { addEnvOptions } from '../utils/shellutils';
import authenticate from '../authentication/authenticate';
import { checkRemoteFileAccess, getPodRoot } from '../utils/util';
import ChangedirectoryCommand from '../shell/commands/navigation/cd';
import { getContainedResourceUrlAll, getSolidDataset, isContainer } from '@inrupt/solid-client';

const readline = require('readline');

export class SolidShell {
  program: Command;
  podBaseURI: string | null = null;
  workingContainer: string | null = null;
  workingContainerEntries: string[] = [];
  state: Object;

  constructor(programopts: any) { 
    this.program = new Command();

    // pass through the command line options passed to the shell command
    for (let key of Object.keys(programopts)) { 
      this.program.setOptionValue(key, programopts[key])
    }

    fillProgram(this, programopts);
    this.state = {};
  }

  async prepareShell(){ 
    let programOpts = addEnvOptions(this.program.opts() || {});

    const authenticationInfo = await authenticate(programOpts)


    // Get current pod working directory
    let webId = authenticationInfo.webId
    if (!webId) throw new Error('Could not authenticate sesssion.');
  
    let podRootURI = await getPodRoot(webId, authenticationInfo.fetch)
    this.podBaseURI = podRootURI;
    if (podRootURI) await this.changeWorkingContainer(podRootURI)
    this.workingContainer = podRootURI;
  }

  async runShell(options: any = {}) {
    while (true) {
      let input = await this.processUserInput();
      let parsedInput = input.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g)
      let pargs = ['', ''].concat(parsedInput)
      try {
        await this.program.parseAsync(pargs);
      } catch (_ignored) {}
    }
  }

  async command_completion(line: string, callback: any) {

    new Promise(async (resolve, reject) => { 
      let lineArgs = line.split(/\s/).reverse();
      let lastInput = lineArgs[0] || lineArgs[1]
      let container = this.workingContainer + lastInput;
      container = container.split('/').slice(0, -1).join('/') + '/'

      let workingContainerEntries : string[] = []

      // Get container entries
      try {
        const authenticationInfo = await authenticate(this.program.opts())
        let containerDataset = await getSolidDataset(container, { fetch: authenticationInfo.fetch })
        if (!isContainer(containerDataset)) {
          throw new Error(`Cannot change container. Target ${container} is not a container.`)
        } else if (!checkRemoteFileAccess(container, authenticationInfo.fetch)) { 
          throw new Error(`Cannot change container. Cannot read target ${container}.`)
        }
        workingContainerEntries = getContainedResourceUrlAll(containerDataset) || []
      } catch (error) {
        reject(error)
      }
      const completions = workingContainerEntries.map(e => this.podBaseURI ? e.replace(this.podBaseURI, "") : e);
      const hits = completions.filter((c) => c.startsWith(lastInput))
      if (hits.length > 1) {
        resolve([hits, line])
      } else if (hits.length === 1) {
        resolve([hits, container + hits[0]])
      } else { 
        resolve([completions, line])
      }
    }).then((ans: any) => {
      callback(null, ans)
    })
  }

  async processUserInput(): Promise<any> {
    let currentContainerName = this.workingContainer === this.podBaseURI ? "/" : this.workingContainer?.split('/').reverse()[1]
    let query = chalk.bold(`[${chalk.green(this.podBaseURI || "Solid Shell")} ${chalk.red(currentContainerName)}]$ `)
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
      completer: this.command_completion.bind(this)
    });
    
    return new Promise((resolve, reject): Promise<any> => rl.question(query, async (ans: any) => {
      rl.close();
      resolve(ans)
    }))
  }

  /**
   * Set the current working container for the shell. 
   * Fetcha ll contained resources for shell autocompletion purposes.
   * @param url 
   */
  async changeWorkingContainer(url: string) {
    //TODO:: Fix authentication and this whole thing. This was made hastily
    const authenticationInfo = await authenticate(this.program.opts())
    
    let newBaseURI;
    let newWorkingContainer = url;

    if (!this.podBaseURI || !url.startsWith(this.podBaseURI)) {
      newBaseURI = await getPodRoot(url, authenticationInfo.fetch);
    }
    
    if (newWorkingContainer) { 
      this.workingContainer = newWorkingContainer || this.workingContainer;
      this.podBaseURI = newBaseURI || this.podBaseURI;
    }

    try {
      let containerDataset = await getSolidDataset(url, { fetch: authenticationInfo.fetch })
      if (!isContainer(containerDataset)) {
        throw new Error(`Cannot change container. Target ${url} is not a container.`)
      } else if (!checkRemoteFileAccess(url, authenticationInfo.fetch)) { 
        throw new Error(`Cannot change container. Cannot read target ${url}.`)
      }
      this.workingContainerEntries = getContainedResourceUrlAll(containerDataset) || []
    } catch (_ignored) {
     }
  }
}

export default async function shell(programopts: any) { 
  let solidShell = new SolidShell(programopts);
  await solidShell.prepareShell();
  solidShell.runShell();
}


function fillProgram(shell: SolidShell, programopts: any) {

  let program = shell.program;

  // Make it that the shell does not quit process but just throws exception
  program.exitOverride();

  program
    .option('-a, --auth <string>', 'token | credentials | interactive | none - Authentication type (defaults to "none")')
    .option('-i, --idp <string>', '(auth: any) URL of the Solid Identity Provider')
    .option('-e, --email <string>', '(auth: credentials) Email adres for the user. Default to <uname>@test.edu')
    .option('-p, --password <string>', '(auth: credentials) User password. Default to <uname>')
    .option('-t, --tokenStorage <string>', '(auth: token) Location of file storing Client Credentials token. Defaults to ~/.solid/.css-auth-token')
    .option('-s, --sessionStorage <string>', '(auth: token | interactive) Location of file storing session information. Defaults to ~/.solid/.session-info-<auth>')
    .option('-c, --config <string>', '(auth: any) Location of config file with authentication info.')
    .option('--silent', 'Silence authentication errors')
    .option('--port', 'Specify port to be used when redirecting in Solid authentication flow. Defaults to 3435.')
  

  program
    .name('solid')
    .description('Utility toolings for interacting with a Solid server.')
    .version('0.2.0')
    .enablePositionalOptions()
  
  program = new FetchCommand(shell, false, true).addCommand(program)
  program = new ListCommand(shell, false, true).addCommand(program)
  program = new TreeCommand(shell, false, true).addCommand(program)
  program = new CopyCommand(shell, false, false).addCommand(program)
  program = new MoveCommand(shell, false, false).addCommand(program)
  program = new RemoveCommand(shell, false, false).addCommand(program)
  program = new TouchCommand(shell, false, false).addCommand(program)
  program = new MkdirCommand(shell, false, false).addCommand(program)
  program = new FindCommand(shell, false, false).addCommand(program)
  program = new QueryCommand(shell, false, false).addCommand(program)
  program = new PermsCommand(shell, false, false).addCommand(program)
  program = new EditCommand(shell, false, false).addCommand(program)
  program = new ExitCommand(shell, false, false).addCommand(program) 
  program = new ChangedirectoryCommand(shell, false, true).addCommand(program) 

  return program;
}
