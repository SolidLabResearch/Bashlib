const { program } = require('commander');
const inquirer = require('inquirer');
const { getAuthenticatedSessionFromCredentials, processShellCommand } = require('../');

// Overwrite error function to ignore error thrown by inrupt auth lib
let consoleErrorFunction = console.error;
console.error = function(errorString){
  if (!errorString.includes('DraftWarning')) {
    consoleErrorFunction(errorString)
  }
};

program
  .name('solid-shell')
  .description('Shell for Solid.')
  .version('0.1.0')
  .argument('<url>', 'Url to open shell in')
  .option('-idp, --identityprovider <string>', 'URI of the IDP')
  .option('-e, --email <string>', 'Email adres for the user. Default to <uname>@test.edu')
  .option('-p, --password <string>', 'User password. Default to <uname>')
  .option('-c, --config <string>', 'Config file containing user email, password and idp in format: {email: <email>, password: <password>, idp: <idp>}')
  .action(async (url, options) => {
    const session = await getAuthenticatedSessionFromCredentials(options)
    while(true) {
      let command = await showAndRetrieveCommand(url)
      console.log('awaited command', command)

      await processShellCommand(session, command, url)
      console.log('resetting shell')
    }
    
    // process.exit(0)
  })
  .parse(process.argv);

async function showAndRetrieveCommand(directory) {
  return new Promise((resolve, reject) => {
    inquirer
    .prompt(
      {type: 'input', name: 'command', prefix: '', message: `[${directory}]$`}
    ).then(answers => {
      const { command } = answers;
      resolve(command)
    })
  })
}
