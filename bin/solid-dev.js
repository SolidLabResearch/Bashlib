
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
  .name('solid-dev')
  .description('Utility toolings for the Community Solid Server.')
  .version('0.2.0')

program = new c.CreatePodCommand(undefined, true).addCommand(program)

program
  .parse(process.argv);
