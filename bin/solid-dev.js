const { program } = require('commander');
var inquirer = require('inquirer');

program
  .name('solid-dev')
  .description('Utility toolings for the Community Solid Server.')
  .version('0.2.0')

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
  .parse(process.argv);
