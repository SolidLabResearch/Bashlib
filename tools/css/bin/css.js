const { program } = require('commander');
const { createPods, generateCSSv4Token } = require('../');
var inquirer = require('inquirer');

program
  .name('css')
  .description('Utility toolings for the Community Solid Server.')
  .version('0.1.0')

program
  .command('create-pod')
  .argument('<userName>', 'string argument')
  .option('-b, --base-url <string>', 'Base URI of the pod server. Can be used to derive the registry url for the Community Solid Server v2')
  .option('-r, --registry-url <string>', 'Url of the api that is used to register data pods.')
  .option('-p, --password <string>', 'User password. Default to <uname>')
  .option('-e, --email <string>', 'Email adres for the user. Default to <uname>@test.edu')
  .option('-c, --config <string>', 'Config file containing user email, password and idp in format: {email: <email>, password: <password>, idp: <idp>}')
  .action( async (userName, options) => {
    options.name = userName;
    let accountDataArray = [{
      name: options.name,
      email: options.email,
      password: options.password,
    }]
    try {
      await createPods(accountDataArray, options)
    } catch (e) {
      console.error(`Could not create pod: ${e.message}`)
    }
    
  })


program
.command('create-token')
.option('-i, --idp <string>', 'BaseURI of your CSS v4 pod')
.option('-n, --name <string>', 'Token name')
.option('-e, --email <string>', 'User email')
.option('-p, --password <string>', 'User password')
.option('-w, --webId <string>', 'User webId (optional)')
.option('-o, --out <string>', 'Token file location. Defaults to ~/.solid/.solid-cli-credentials')
.option('-v, --verbose', 'Log actions')
.action( async (options) => {

  let questions = []
  if (!options.name) questions.push({ type: 'input', name: 'name',  message: 'Token name'})
  if (!options.idp) questions.push({ type: 'input', name: 'idp',  message: 'Pod baseuri'})
  if (!options.email) questions.push({ type: 'input', name: 'email',  message: 'User email'})
  if (!options.password) questions.push({ type: 'password', name: 'password',  message: 'User password'})

  if (questions.length) {
    questions.push({ type: 'input', name: 'webId',  message: 'User WebId'})
    questions.push({ type: 'input', name: 'out',  message: 'Token location (default: ~/.solid/.solid-cli-credentials)'})
    let answers = await inquirer.prompt(questions)
    options = { ...options, ...answers }
  }
  
  try {
    let storageLocation = await generateCSSv4Token(options);
    if(options.verbose) console.log(`Successfullly created token file at ${storageLocation}`)
  } catch (e) {
    throw new Error(`Could not create token: ${e.message}`)
  }
  
})

program
  .parse(process.argv);