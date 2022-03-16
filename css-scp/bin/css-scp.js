const { program } = require('commander');
const copyData = require("../").default
const nodeFetch = require('node-fetch')
const fs = require('fs')
const NodeSolidSessionProvider = require('../../css-login').default

program
  .name('css-scp')
  .description('Utility lib to create pods on a pod server for testing purposes - created for the Community Solid Server using the built-in IDP functionality.')
  .version('0.1.0')
  .argument('<src>', 'file or directory to be copied')
  .argument('<dst>', 'destination to copy file or directory to')
  .option('-idp, --identityprovider <string>', 'URI of the IDP')
  .option('-e, --email <string>', 'Email adres for the user. Default to <uname>@test.edu')
  .option('-p, --password <string>', 'User password. Default to <uname>')
  .option('-c, --config <string>', 'Config file containing user email, password and idp in format: {email: <email>, password: <password>, idp: <idp>}')
 
  .action( async (src, dst, options) => {

    let loginOptions = {
      idp: options.identityprovider,
      email: options.email,
      password: options.password,
    }

    if (options.config) {
      try {
        let configObj = JSON.parse(fs.readFileSync(options.config, 'utf8'));
        if (configObj.email) loginOptions.email = configObj.email
        if (configObj.password) loginOptions.password = configObj.password
        if (configObj.idp) loginOptions.idp = configObj.idp
        if (configObj.dir) options.dir = configObj.dir
      } catch (error) {
        console.error('Error parsing config file. Please make sure it is valid JSON: ', error.message)
        process.exit()
      }
    }

    let fetch;

    let authenticated = true;
    if (!loginOptions.email) {
      console.error('Cannot authenticate: Please provide an email value. Continuing without authentication')
      authenticated = false;
    } if (!loginOptions.password) {
      console.error('Cannot authenticate: Please provide a password value. Continuing without authentication')
      authenticated = false;
    } if (!loginOptions.idp) {
      console.error('Cannot authenticate: Please provide an identity provider value. Continuing without authentication')
      authenticated = false;
    } 

    options.authenticated = authenticated

    if (authenticated) {
      // Login handler
      let provider = new NodeSolidSessionProvider(loginOptions);
      
      // Login to the session provider
      let session = await provider.login()
      options.webId = session.info.webId;

      fetch = session.fetch;
    } else {
      fetch = nodeFetch
    }
    options.fetch = fetch;

    await copyData(src, dst, options)

    process.exit(0)
  })
  .parse(process.argv);
