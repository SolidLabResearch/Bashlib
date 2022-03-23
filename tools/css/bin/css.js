const { program } = require('commander');
const { createPods } = require('../');

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
    if (!options.baseUrl && !options.registryUrl) {
      console.error('Please pass a value for one of the options: base-url, registry-url')
    }
    options.name = userName;
    let accountDataArray = [{
      name: options.name,
      email: options.email,
      password: options.password,
    }]
    await createPods(accountDataArray, options)
  })

program
  .parse(process.argv);