
const { Command } = require('commander');
let program = new Command();

const c = require('../dist/shell/shellcommands')

// Fix for console error in Inrupt lib.
let consoleErrorFunction = console.error;
console.error = function(errorString){
  if (!errorString.includes('DraftWarning')) {
    consoleErrorFunction(errorString)
  }
};

program
  .name('solid')
  .description('Utility toolings for interacting with a Solid server.')
  .version('0.2.0')
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

program = c.addFetchCommand(program)
program = c.addListCommand(program)
program = c.addTreeCommand(program)
program = c.addCopyCommand(program)
program = c.addMoveCommand(program)
program = c.addRemoveCommand(program)
program = c.addTouchCommand(program)
program = c.addMkdirCommand(program)
program = c.addFindCommand(program)
program = c.addQueryCommand(program)
program = c.addPermsCommand(program)
program = c.addEditCommand(program)
program = c.addShellCommand(program)

program
  .parse(process.argv);

