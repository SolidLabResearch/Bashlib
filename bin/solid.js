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
  .version('0.6.4')
  .enablePositionalOptions()
  .option('-a, --auth <string>', 'token | interactive | request | none - Authentication type (defaults to "request")')
  // .option('-i, --idp <string>', 'URL of the Solid Identity Provider')
  // .option('-c, --config <string>', 'Location of config file with authentication info.')
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

