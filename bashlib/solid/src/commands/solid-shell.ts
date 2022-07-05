import { Command } from 'commander';
import { populateProgram } from '../shell/create-shell';
var parseArgs = require('minimist')

let program = new Command();


const readline = require('readline');

export default async function shell() { 
  program = populateProgram(program);

  let running = true;
  
  
  while (running) {
    let input = await processUserInput();
    let parsedInput = input.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g)

    let pargs = ['', ''].concat(parsedInput)
    
    // let pargs = parseArgs(parsedInput)
    console.log('args', pargs)
    try {
      await program.parse(pargs);
    } catch (_ignored) { 
      
    }
    

  }
}

function processUserInput() : Promise<any> {
  let query = "Solid Shell >>> "
  const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
  });

  return new Promise((resolve, reject): Promise<any> => rl.question(query, async (ans: any) => {
    rl.close();
    resolve(ans)
  }))
}

function createCommanderInstance(program: Command) { 
  program = new Command()

  program
    .name('solid')
    .description('Utility toolings for interacting with a Solid server.')
    .version('1.0.0')
    .enablePositionalOptions()
    .option('-a, --auth <string>', 'token | credentials | interactive | none - Authentication type (defaults to "none")')
    .option('-i, --idp <string>', '(auth: any) URL of the Solid Identity Provider')
    .option('-e, --email <string>', '(auth: credentials) Email adres for the user. Default to <uname>@test.edu')
    .option('-p, --password <string>', '(auth: credentials) User password. Default to <uname>')
    .option('-t, --tokenStorage <string>', '(auth: token) Location of file storing Client Credentials token. Defaults to ~/.solid/.css-auth-token')
    .option('-s, --sessionStorage <string>', '(auth: token | interactive) Location of file storing session information. Defaults to ~/.solid/.session-info-<auth>')
    .option('-c, --config <string>', '(auth: any) Location of config file with authentication info.')
    .option('--silent', 'Silence authentication errors')
    .option('--port', 'Specify port to be used when redirecting in Solid authentication flow. Defaults to 3435.')


  return program;
}
