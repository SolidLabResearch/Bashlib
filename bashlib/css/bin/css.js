const { program } = require('commander');
const { createPods, generateClientCredentialsToken } = require('../');
var inquirer = require('inquirer');

program
  .name('css')
  .description('Utility toolings for the Community Solid Server.')
  .version('0.1.0')

program
  .command('create-pod')
  .option('-b, --base-url <string>', 'Base URI of the pod server.')
  .option('-n, --name <string>', 'Name for the newly created Solid account.')
  .option('-e, --email <string>', 'Email adres for the user. Default to <uname>@test.edu')
  .option('-p, --password <string>', 'User password. Default to <uname>')
  .action( async (options) => {
    let questions = []
    if (!options.baseUrl) questions.push({ type: 'input', name: 'baseUrl',  message: 'CSS instance base url'})
    if (!options.name) questions.push({ type: 'input', name: 'name',  message: 'Pod and user name'})
    if (!options.email) questions.push({ type: 'input', name: 'email',  message: 'User email (defaults to <name>@test.edu)'})
    if (!options.password) questions.push({ type: 'password', name: 'password',  message: 'User password (defaults to <name>)'})
    if (questions.length) {
      let answers = await inquirer.prompt(questions)
      options = { ...options, ...answers }
    }
    
    let accountDataArray = [{
      name: options.name,
      email: options.email,
      password: options.password,
    }]
    try {
      await createPods(options.baseUrl, accountDataArray)
    } catch (e) {
      console.error(`Could not create pod: ${e.message}`)
    }
  })


program
  .command('create-token')
  .option('-b, --base-url <string>', 'URL of your identity provider (= baseURI of your CSS server)')
  .option('-n, --name <string>', 'Token name')
  .option('-e, --email <string>', 'User email')
  .option('-p, --password <string>', 'User password')
  .option('-o, --out <string>', 'Token file location. Defaults to ~/.solid/.css-auth-token')
  .option('-v, --verbose', 'Log actions')
  .action( async (options) => {
    let questions = []
    if (!options.baseUrl) questions.push({ type: 'input', name: 'baseUrl',  message: 'Pod baseuri'})
    if (!options.name) questions.push({ type: 'input', name: 'name',  message: 'Token name'})
    if (!options.email) questions.push({ type: 'input', name: 'email',  message: 'User email'})
    if (!options.password) questions.push({ type: 'password', name: 'password',  message: 'User password'})

    if (questions.length) {
      questions.push({ type: 'input', name: 'out',  message: 'Token location (default: ~/.solid/.css-auth-token)'})
      let answers = await inquirer.prompt(questions)
      options = { ...options, ...answers }
    }
    options.clientCredentialsTokenStorageLocation = options.out;
    options.idp = options.baseUrl;

    try {
      let storageLocation = await generateClientCredentialsToken(options);
      if(options.verbose) console.log(`Successfully created token file at ${storageLocation}`)
    } catch (e) {
      console.error(`Could not create token: ${e.message}`)
      console.error(`Please make sure the filled in email and password values are correct!`)
    }
  })

program
  .parse(process.argv);