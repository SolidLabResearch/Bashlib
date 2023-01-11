#! /usr/bin/env node

const { Command } = require('commander');
let program = new Command();

const c = require('../dist/shell/shellcommands')
const initConfig = require('../dist/utils/configoptions').initializeConfig

// Fix for console error in Inrupt lib.
let consoleErrorFunction = console.error;
console.error = function(errorString){
  if (errorString && !errorString.includes('DraftWarning') && !errorString.includes('ExperimentalWarning')) {
    consoleErrorFunction(errorString)
  }
};

initConfig();

program
  .name('solid')
  .description('Utility toolings for interacting with a Solid server.')
  .version('0.2.0')
  .enablePositionalOptions()
  .option('-n, --no-auth', 'continue unauthenticated')
  .option('-a, --auth <string>', 'token | credentials | interactive | none - Authentication type (defaults to "none")')
  .option('-i, --idp <string>', '(auth: any) URL of the Solid Identity Provider')
  .option('-e, --email <string>', '(auth: credentials) Email adres for the user. Default to <uname>@test.edu')
  .option('-p, --password <string>', '(auth: credentials) User password. Default to <uname>')
  .option('-t, --tokenStorage <string>', '(auth: token) Location of file storing Client Credentials token. Defaults to ~/.solid/.css-auth-token')
  .option('-s, --sessionStorage <string>', '(auth: token | interactive) Location of file storing session information. Defaults to ~/.solid/.session-info-<auth>')
  .option('-c, --config <string>', '(auth: any) Location of config file with authentication info.')
  .option('--silent', 'Silence authentication errors')
  .option('--port', 'Specify port to be used when redirecting in Solid authentication flow. Defaults to 3435.')

program = new c.FetchCommand(undefined, true).addCommand(program)
program = new c.ListCommand(undefined, true).addCommand(program)
program = new c.TreeCommand(undefined, true).addCommand(program)
program = new c.CopyCommand(undefined, true).addCommand(program)
program = new c.MoveCommand(undefined, true).addCommand(program)
program = new c.RemoveCommand(undefined, true).addCommand(program)
program = new c.TouchCommand(undefined, true).addCommand(program)
program = new c.MkdirCommand(undefined, true).addCommand(program)
program = new c.FindCommand(undefined, true).addCommand(program)
program = new c.QueryCommand(undefined, true).addCommand(program)
program = new c.PermsCommand(undefined, true).addCommand(program)
program = new c.EditCommand(undefined, true).addCommand(program)
// program = new c.ShellCommand(undefined, true).addCommand(program) 
// program = new c.ExitCommand(undefined, true).addCommand(program) 
program = new c.AuthCommand(undefined, true).addCommand(program) 

program
  .parse(process.argv);

