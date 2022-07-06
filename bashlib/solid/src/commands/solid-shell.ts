import { Command } from 'commander';
import { addFetchCommand } from '../shell/commands/fetch';
import { addListCommand } from '../shell/commands/list';
import { addTreeCommand } from '../shell/commands/tree';
import { addCopyCommand } from '../shell/commands/copy';
import { addMoveCommand } from '../shell/commands/mv';
import { addRemoveCommand } from '../shell/commands/remove';
import { addTouchCommand } from '../shell/commands/touch';
import { addMkdirCommand } from '../shell/commands/mkdir';
import { addFindCommand } from '../shell/commands/find';
import { addQueryCommand } from '../shell/commands/query';
import { addPermsCommand } from '../shell/commands/perms';
import { addEditCommand } from '../shell/commands/edit';
import { addExitCommand } from '../shell/commands/exit';



const readline = require('readline');

class SolidShell {
  program: Command;
  state: Object;

  constructor(programopts: any) { 
    this.program = createCommanderInstance(programopts, this);
    this.state = {};
  }

  async runShell() { 
    while (true) {
      let input = await processUserInput();
      let parsedInput = input.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g)
      let pargs = ['', ''].concat(parsedInput)
      try {
        this.program.parse(pargs);
      } catch (_ignored) {}
    }
  }
}

export default async function shell(programopts: any) { 

  console.log('programopts', programopts)

  let solidShell = new SolidShell(programopts);
  solidShell.runShell();
}

function processUserInput() : Promise<any> {
  let query = "Solid Shell >>> "
  const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
  });

  return new Promise((resolve, reject): Promise<any> => rl.question(query, async (ans: any) => {
    rl.close();
    console.log('input', ans)
    resolve(ans)
  }))
}

function createCommanderInstance(programopts: any, solidShell: SolidShell) { 
  let program = new Command()

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
  
  for (let key of Object.keys(programopts)) { 
    program.setOptionValue(key, programopts[key])
  }

  program
    .name('solid')
    .description('Utility toolings for interacting with a Solid server.')
    .version('0.2.0')
    .enablePositionalOptions()
  
  program = addFetchCommand(program)
  program = addListCommand(program)
  program = addTreeCommand(program)
  program = addCopyCommand(program)
  program = addMoveCommand(program)
  program = addRemoveCommand(program)
  program = addTouchCommand(program)
  program = addMkdirCommand(program)
  program = addFindCommand(program)
  program = addQueryCommand(program)
  program = addPermsCommand(program)
  program = addEditCommand(program)
  program = addExitCommand(program)


  return program;
}
