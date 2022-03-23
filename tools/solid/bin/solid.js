const { program } = require('commander');
const fs = require('fs')
const createAuthenticatedSession = require('../../css/').createAuthenticatedSession
const copyData = require('../').copyData
const list = require('../').list
const remove = require('../').remove
const authenticatedFetch = require('../').authenticatedFetch
const authenticate = require('../dist/utils/authenticate').default

const columns = require('cli-columns');
const chalk = require('chalk');

const arrayifyHeaders = (value, previous) => previous ? previous.concat(value) : [value]

// Fix for console error in Inrupt lib.
let consoleErrorFunction = console.error;
console.error = function(errorString){
  if (!errorString.includes('DraftWarning')) {
    consoleErrorFunction(errorString)
  }
};

program
  .name('solid')
  .description('Utility toolings for interacting with a Solid server.')
  .version('0.1.0')
  .enablePositionalOptions()
  .option('-idp, --identityprovider <string>', 'URI of the IDP')
  .option('-e, --email <string>', 'Email adres for the user. Default to <uname>@test.edu')
  .option('-p, --password <string>', 'User password. Default to <uname>')
  .option('-c, --config <string>', 'Config file containing user email, password and idp in format: {email: <email>, password: <password>, idp: <idp>}')
  .option('-s, --silent', 'Silence authentication errors')

/*********
 * FETCH *
 *********/
program
  .command('fetch')
  .description('Utility to fetch files from remote Solid pod.')
  .version('0.1.0')
  .argument('<url>', 'file to be fetched')
  .option('-v, --verbose', 'Write out full response and all headers')
  .option('-H, --only-headers', 'Only write out headers')


  .option('-m, --method <string>', 'GET, POST, PUT, DELETE, ...')
  .option('-b, --body <string>', 'The request body')
  .option('-h, --header <string>', 'The request header. Multiple headers can be added separately. These follow the style of CURL. e.g. --header "Content-Type: application/json" ', arrayifyHeaders)
  
  // .option('-m, --mode <string>', 'no-cors, *cors, same-origin')
  // .option('-ca, --cache <string>', '*default, no-cache, reload, force-cache, only-if-cached')
  // .option('-cr, --credentials <string>', 'include, *same-origin, omit')
  // .option('-r, --redirect <string>', 'manual, *follow, error')
  // .option('-rp, --refferer-policy <string>', 'no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url')

  .action( async (url, options) => {
    let programOpts = program.opts();
    const authenticationInfo = await authenticate(programOpts)
    options.fetch = authenticationInfo.fetch
    try {
      await authenticatedFetch(url, options)
    } catch (e) {
      console.error(`Could not fetch resource at ${url}: ${e.message}`)
      process.exit(1)
    }

    process.exit(0)
  })

/*******
 * SCP *
 *******/
program
  .command('copy')
  .description('Utility to copy files from and to both the local file system and remote Solid pod.')
  .version('0.1.0')
  .argument('<src>', 'file or directory to be copied')
  .argument('<dst>', 'destination to copy file or directory to')
  .option('-v, --verbose', 'Log all read and write operations')

  .action( async (src, dst, options) => {
    let programOpts = program.opts();
    const authenticationInfo = await authenticate(programOpts)

    let opts = { 
      fetch: authenticationInfo.fetch, 
      verbose: options.verbose || false 
    }
    await copyData(src, dst, opts)

    process.exit(0)
  })

  program
    .command('list')
    .description('Utility to view files in container on remote Solid pod.')
    .version('0.1.0')
    .argument('<url>', 'URL of container to be listed')
    .option('-a, --all', 'List all files including acl files')
    .option('-f, --full', 'List files with their full uri')
    .option('-l, --long', 'List in long format')
    .option('-v, --verbose', '')
    .action( async (url, options) => {
      if (options.all) { console.log('The all option is still in development') }
      let programOpts = program.opts();
      const authenticationInfo = await authenticate(programOpts)
      
      options.fetch = authenticationInfo.fetch
      let listings = []
      try {
        listings = await list(url, options)
      } catch (e) {
        console.error(`Could not provide listing for ${url}: ${e.message}`)
        process.exit(1)
      }
      

      if (!options.long) {
        // Write short formatted
        let values = listings.map((listingInfo) => {
          let path = options.full
          ? listingInfo.url
          : listingInfo.localurl 
          
          return listingInfo.isDir
          ? chalk.blue.bold(path)
          : path
        })
        // Output to CLI
        console.log(columns(values));
      } else {
        // Write long formatted
        const fileNameLengths = listings.map(fileInfo => options.full ? fileInfo.url.length : fileInfo.localurl.length)
        const fileNameFieldLength = Math.max(...[Math.max(...fileNameLengths), 8])

        const mtimeLength = listings.map(listingInfo => listingInfo.mtime ? listingInfo.mtime.toString().length : '')
        const mtimeFieldLength = Math.max(...[Math.max(...mtimeLength), 5])

        const sizeLengths = listings.map(listingInfo => listingInfo.size ? listingInfo.size.toString().length : '')
        const sizeFieldLength = Math.max(...[Math.max(...sizeLengths), 4])

        const modifiedLengths = listings.map(listingInfo => listingInfo.modified ? listingInfo.modified.toISOString().length : '')
        const modifiedFieldLength = Math.max(...[Math.max(...modifiedLengths), 8])


        const titleFilenameString = "filename".padEnd(fileNameFieldLength)
        const titleMTimeString = "mtime".padEnd(mtimeFieldLength)
        const titleSizeString = "size".padEnd(sizeFieldLength)
        const titleModifiedString = "modified".padEnd(modifiedFieldLength)

        // SORT the listings
        listings.sort((a, b) => a.url.localeCompare(b.url))

        let output = ''
        output += `${titleFilenameString} | ${titleMTimeString} | ${titleSizeString} | ${titleModifiedString}\n`
        output += `${'-'.repeat(fileNameFieldLength + mtimeFieldLength + sizeFieldLength + modifiedFieldLength + 9)}\n`
        for (let listingInfo of listings) {
          const path = options.full
          ? listingInfo.url
          : listingInfo.localurl 
          const pathString = listingInfo.isDir ? chalk.blue.bold(path.padEnd(fileNameFieldLength)) : path.padEnd(fileNameFieldLength)
          const mtime = (listingInfo.mtime ? listingInfo.mtime.toString() : '').padEnd(mtimeFieldLength)         
          const size = (listingInfo.size ? listingInfo.size.toString() : '').padEnd(sizeFieldLength)        
          const modified = (listingInfo.modified ? listingInfo.modified.toISOString() : '').padEnd(modifiedFieldLength)
          output += `${pathString} | ${mtime} | ${size} | ${modified}\n`
        }
        console.log(output)
      }
      process.exit(0)
    })

program
  .command('remove')
  .description('Utility to remove files or container on remote Solid pod.')
  .version('0.1.0')
  .argument('<url>', 'URL of container to be listed')
  .option('-r, --recursive', 'Recursively removes all files in given container') // Should this be default?
  .action( async (url, options) => {
    let programOpts = program.opts();
    const authenticationInfo = await authenticate(programOpts)
    options.fetch = authenticationInfo.fetch
    try {
      await remove(url, options)
    } catch (e) {
      console.error(`Could not remove ${url}: ${e.message}`)
      process.exit(1)
    }
    process.exit(0)
  })

program
  .parse(process.argv);


  


/********************
 * HELPER FUNCTIONS *
 ********************/

// async function authenticate(options) {
//   let silent = options.silent || false;
//   let loginOptions = {
//     idp: options.identityprovider,
//     email: options.email,
//     password: options.password,
//   }

//   if (options.config) {
//     try {
//       let configObj = JSON.parse(fs.readFileSync(options.config, 'utf8'));
//       if (configObj.email) loginOptions.email = configObj.email
//       if (configObj.password) loginOptions.password = configObj.password
//       if (configObj.idp) loginOptions.idp = configObj.idp
//       if (configObj.dir) options.dir = configObj.dir
//     } catch (error) {
//       if (!silent) console.error('Error parsing config file. Please make sure it is valid JSON: ', error.message)
//     }
//   }

//   let authenticated = true;
//   if (!loginOptions.email) {
//     if (!silent) console.error('Cannot authenticate: Please provide an email value. Continuing without authentication')
//     authenticated = false;
//   } else if (!loginOptions.password) {
//     if (!silent) console.error('Cannot authenticate: Please provide a password value. Continuing without authentication')
//     authenticated = false;
//   } else if (!loginOptions.idp) {
//     if (!silent) console.error('Cannot authenticate: Please provide an identity provider value. Continuing without authentication')
//     authenticated = false;
//   } 

//   let loginInfo = {};
//   if (authenticated) {      
//     // Login to the session provider
//     let session = await createAuthenticatedSession(loginOptions)
//     // if (!silent) console.log(`Continuing as: ${session.info.webId}`)
//     loginInfo.session = session;
//     loginInfo.webId = session.info.webId;
//     loginInfo.fetch = session.fetch;
//   } else {
//     if (!silent) console.log(`Continuing unauthenticated`)
//     loginInfo.fetch = nodeFetch;
//   }
//   return loginInfo;
// }