const { program } = require('commander');
const { createPods } = require("../dist/index")

program
  .name('')
  .description('Utility lib to create pods on a pod server for testing purposes - created for the Community Solid Server using the built-in IDP functionality.')
  .version('0.1.0')
  .argument('<baseURI>', 'string argument')
  .argument('<userName>', 'string argument')
  .option('-i, --idp <string>', 'URI of the IDP, defaults to <baseURI>/register/idp')
  .option('-p, --password <string>', 'User password. Default to <uname>')
  .option('-e, --email <string>', 'Email adres for the user. Default to <uname>@test.edu')
  .option('-c, --config <string>', 'Config file containing user email, password and idp in format: {email: <email>, password: <password>, idp: <idp>}')
  .action( async (baseURI, userName, options) => {
    options.baseURI = baseURI;
    options.name = userName;
    await createPods(options)
  })
  .parse(process.argv);
