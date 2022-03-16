const { program } = require('commander');
const fs = require('fs')
const NodeSolidSessionProvider = require("../dist/NodeSolidSessionProvider.js").default;


function arrayifyHeaders(value, previous) {
  if (previous) {
    previous.push(value)
    return previous;
  } else {
    return [value]
  }
}

program
  .name('css-fetch')
  .description('Utility function to make automated fetches on Solid pods from the command line.')
  .version('0.0.1')
  .argument('<url>', 'Url to fetch')
  .option('-e, --email <string>', 'User Email Address used to login to pod.')
  .option('-p, --password <string>', 'User password used to login to pod.')
  .option('-idp, --identityprovider <string>', 'Pod identity provider')
  .option('-c, --config <string>', 'Config file containing user email, password and idp in format: {email: <email>, password: <password>, idp: <idp>}')
  .option('-m, --method <string>', 'GET, POST, PUT, DELETE, ...')
  .option('-b, --body <string>', 'The request body')
  .option('-h, --header <string>', 'The request header. Multiple headers can be added separately. These follow the style of CURL. e.g. --header "Content-Type: application/json" ', arrayifyHeaders)
  
  .option('-m, --mode <string>', 'no-cors, *cors, same-origin')
  .option('-ca, --cache <string>', '*default, no-cache, reload, force-cache, only-if-cached')
  .option('-cr, --credentials <string>', 'include, *same-origin, omit')
  .option('-r, --redirect <string>', 'manual, *follow, error')
  .option('-rp, --refferer-policy <string>', 'no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url')

  .action((url, options) => {loginAndFetch(url, options)})
  .parse(process.argv);




async function loginAndFetch(url, options) {
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
    } catch (error) {
      console.error('Error parsing config file. Please make sure it is valid JSON.')
      process.exit()
    }
  }

  if (!loginOptions.email) {
    console.error('Please provide an email value either via the command line or through a config file. In case no authentication is needed, please use another library :)')
    process.exit()
  } if (!loginOptions.password) {
    console.error('Please provide a password value either via the command line or through a config file. In case no authentication is needed, please use another library :)')
    process.exit()
  } if (!loginOptions.idp) {
    console.error('Please provide an identity provider value either via the command line or through a config file. In case no authentication is needed, please use another library :)')
    process.exit()
  }


  let processedHeaders = {}
  for (let header of options.header || []) {
    let split = header.split(':')
    processedHeaders[split[0].trim()] = split[1].trim()
  }

  const fetchOptions = {
    method: options.method,
    mode: options.mode,
    cache: options.cache,
    credentials: options.credentials,
    headers: processedHeaders,
    redirect: options.redirect,
    referrerPolicy: options.referrerPolicy,
    body: options.body,
  }
  
  // Overwrite error function to ignore error thrown by inrupt auth lib
  let consoleErrorFunction = console.error;
  console.error = function(errorString){
    if (!errorString.includes('DraftWarning')) {
      consoleErrorFunction(errorString)
    }
  };

  let provider = new NodeSolidSessionProvider(loginOptions);

  // Login to the session provider
  let session = await provider.login()

  // On session success, fetch requested resource
  const fetched = await session.fetch(url, fetchOptions)
  const text = await fetched.text();

  // Log to command line
  console.log(text.trim())
  process.exit();
}