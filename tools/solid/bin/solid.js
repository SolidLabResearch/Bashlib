const { program } = require('commander');
const os = require("os");
const pth = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const child_process = require('child_process')
var editor = process.env.EDITOR || 'vi';


const authenticate = require('../dist/utils/authenticate').default
const commands = require('../')

const copyData = commands.copyData
const list = commands.list
const find = commands.find
const remove = commands.remove
const move = commands.move
const query = commands.query
const tree = commands.tree
const listPermissions = commands.listPermissions
const changePermissions = commands.changePermissions
const deletePermissions = commands.deletePermissions
const authenticatedFetch = commands.authenticatedFetch

const columns = require('cli-columns');
const Table = require('cli-table');
const chalk = require('chalk');
const { writeErrorString, getFileContentsAndInfo, isDirectory } = require('../dist/utils/util');
const fs = require('fs');

const arrayifyHeaders = (value, previous) => previous ? previous.concat(value) : [value]

// Fix for console error in Inrupt lib.
let consoleErrorFunction = console.error;
console.error = function(errorString){
  if (!errorString.includes('DraftWarning')) {
    consoleErrorFunction(errorString)
  }
};

function addEnvOptions(options) {
  const envStorage = process.env['SOLID_SUITE_SESSION_STORAGE']
  const envConfig = process.env['SOLID_SUITE_CONFIG']
  if (envStorage && !options.storage) options.storage = envStorage
  if (envConfig && !options.config) options.config = envConfig
  return options
}

program
  .name('solid')
  .description('Utility toolings for interacting with a Solid server.')
  .version('0.1.0')
  .enablePositionalOptions()
  .option('-idp, --identityprovider <string>', 'URI of the IDP')
  .option('-e, --email <string>', 'Email adres for the user. Default to <uname>@test.edu')
  .option('-p, --password <string>', 'User password. Default to <uname>')
  .option('-c, --config <string>', 'Config file containing user email, password and idp in format: {email: <email>, password: <password>, idp: <idp>}')
  .option('-i, --interactive', 'Flag to login interactively. Requires the idp value to be set as a flag or via a passed config file.')
  .option('-s, --storage <string>', 'Local file to store session information for consequent uses')
  .option('--silent', 'Silence authentication errors')

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
    let programOpts = addEnvOptions(program.opts() || {});
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
  .option('-a, --all', 'Copy .acl files in recursive directory copies')
  .option('-v, --verbose', 'Log all read and write operations')

  .action( async (src, dst, options) => {
    let programOpts = addEnvOptions(program.opts() || {});
    const authenticationInfo = await authenticate(programOpts)
    let opts = { 
      fetch: authenticationInfo.fetch, 
    }
    await copyData(src, dst, { ...options, ...opts})

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
      let programOpts = addEnvOptions(program.opts() || {});
      const authenticationInfo = await authenticate(programOpts)
      
      options.fetch = authenticationInfo.fetch
      let listings = []
      try {
        listings = await list(url, options)
      } catch (e) {
        console.error(`Could not provide listing for ${url}: ${e.message}`)
        process.exit(1)
      }

      // Output to command line
      console.log(formatListing(listings, options))
      process.exit(0)
    })

program
  .command('remove')
  .description('Utility to remove files or container on remote Solid pod.')
  .version('0.1.0')
  .argument('<url>', 'URL of container to be listed')
  .option('-r, --recursive', 'Recursively removes all files in given container (.acl files are removed on resource removal)') // Should this be default?
  .option('-v, --verbose', 'Log all operations') // Should this be default?
  .action( async (url, options) => {
    let programOpts = addEnvOptions(program.opts() || {});
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
.command('move')
.description('Utility to move files or containers on remote Solid pod.')
.version('0.1.0')
.argument('<src>', 'file or directory to be moved')
.argument('<dst>', 'destination of the move')
.option('-a, --all', 'Move .acl files when moving directories recursively')
.option('-v, --verbose', 'Log all operations') 
.action( async (src, dst, options) => {
  let programOpts = addEnvOptions(program.opts() || {});
  const authenticationInfo = await authenticate(programOpts)
  options.fetch = authenticationInfo.fetch
  try {
    await move(src, dst, options)
  } catch (e) {
    console.error(`Could not move ${url}: ${e.message}`)
    process.exit(1)
  }
  process.exit(0)
})

program
.command('find')
.description('Utility to find resoures on your data pod.')
.version('0.1.0')
.argument('<url>', 'Container to start the search')
.argument('<filename>', 'Filename to match, processed as RegExp(filename)')
.option('-a, --all', 'Match .acl and .meta files')
.option('-f, --full', 'Match full filename.')
.option('-v, --verbose', 'Log all operations') 
.action( async (url, filename, options) => {
  let programOpts = addEnvOptions(program.opts() || {});
  const authenticationInfo = await authenticate(programOpts)
  options.fetch = authenticationInfo.fetch
  try {
    for await (let fileInfo of find(url, filename, options)) {
      const name = options.full ? fileInfo.absolutePath : (fileInfo.relativePath || fileInfo.absolutePath)
      console.log(name)
    }
  } catch (e) {
    console.error(`Could not find match in ${url}: ${e.message}`)
    process.exit(1)
  }
  process.exit(0)
})

program
.command('mkdir')
.description('Utility to add an empty container to your pod.')
.version('0.1.0')
.argument('<url>', 'Container to start the search')
.option('-v, --verbose', 'Log all operations')
.action( async (url, options) => {
  let programOpts = addEnvOptions(program.opts() || {});
  const authenticationInfo = await authenticate(programOpts)
  options.fetch = authenticationInfo.fetch
  try {
    await commands.makeDirectory(url, options)
  } catch (e) {
    console.error(`Could not create container at ${url}: ${e.message}`)
    process.exit(1)
  }
  process.exit(0)
})

program
.command('query')
.description('Utility to query RDF resoures on your data pod.')
.version('0.1.0')
.argument('<url>', 'Resource to query. In case of container recursively queries all contained files.')
.argument('<query>', 'SPARQL query string')
.option('-a, --all', 'Match .acl and .meta files')
.option('-p, --pretty', 'Pretty format') 
.option('-f, --full', 'Return containing files using full filename.')
.option('-v, --verbose', 'Log all operations') // Should this be default?
.action( async (url, filename, options) => {
  let programOpts = addEnvOptions(program.opts() || {});
  const authenticationInfo = await authenticate(programOpts)
  options.fetch = authenticationInfo.fetch
  for await (let result of query(url, filename, options)) {
    formatBindings(result.fileName, result.bindings, options)
  }
  process.exit(0)
})

program
.command('tree')
.description('Utility to query RDF resoures on your data pod.')
.version('0.1.0')
.argument('<url>', 'Base container to construct tree over')
.option('-a, --all', 'Match .acl and .meta files')
.option('-f, --full', 'Return containing files using full filename.')
.option('-v, --verbose', 'Log all operations') // Should this be default?
.action( async (url, options) => {
  let programOpts = addEnvOptions(program.opts() || {});
  const authenticationInfo = await authenticate(programOpts)
  options.fetch = authenticationInfo.fetch
  await tree(url, options)
  process.exit(0)
})

program
.command('perms')
.description('Utility to list and edit resource permissions on a data pod. Only supports operations on ACL and not ACP.')
.version('0.1.0')
.argument('<operation>', 'list, edit, delete')
.argument('<url>', 'Resource URL')
.argument('[permissions...]', `Permission operations to edit resource permissions. 
Formatted according to <id>=[d][g][a][c][r][w]. 
For public permissions please set <id> to "p". 
For the current authenticated user please set <id> to "u".
To set updated permissions as default, please add the [d] option as follows: <id>=d[g][a][c][r][w]
To indicate the id as a group id, please add the [g] option as follows: <id>=g[d][a][c][r][w]
`)
.option('-p, --pretty', 'Pretty format') 
.option('-v, --verbose', 'Log all operations') // Should this be default?
.action( async (operation, url, permissions, options) => {
  let programOpts = addEnvOptions(program.opts() || {});
  const authenticationInfo = await authenticate(programOpts)
  options.fetch = authenticationInfo.fetch

  if (operation === 'list') {
    let listings = await listPermissions(url, options)
    if (listings) formatPermissionListing(url, listings, options)
  } else if (operation === 'edit') {
    let parsedPermissions = permissions.map(permission => {
      const splitPerm = permission.split('=')
      if (!splitPerm.length === 2) { 
        writeErrorString('Incorrect permission format.', 'Please format your permissions as <id>=[d][a][c][r][w].') 
        process.exit(0)
      }
      let id = splitPerm[0]
      const permissionOptions = splitPerm[1].split('')
      let type;
      if (id === 'p') {
        type = 'public'
      } else if (id === 'u') {
        if (!authenticationInfo.webId) { 
          writeErrorString('Could not autmatically fill in webId of authenticated user.', 'Please make sure you have an authenticated session to auto-fill your webId');
          process.exit(0)
        }
        type = 'agent'
        id = authenticationInfo.webId
      } else {
        type = permissionOptions.indexOf('g') === -1 ? 'agent' : 'group'
      }
      const read = permissionOptions.indexOf('r') !== -1
      const write = permissionOptions.indexOf('w') !== -1
      const append = permissionOptions.indexOf('a') !== -1
      const control = permissionOptions.indexOf('c') !== -1
      const def = permissionOptions.indexOf('d') !== -1
      return ({ type, id, read, write, append, control, default: def })
    })
    try {
      await changePermissions(url, parsedPermissions, options)
    } catch (e) {
      console.log(e)
      if (options.verbose) writeErrorString(`Could not update permissions for resource at ${url}`, e)
    }
  } else if (operation === 'delete') {
    try {
      await deletePermissions(url, options)
    } catch (e) {
      if (options.verbose) writeErrorString(`Could not delete permissions for resource at ${url}`, e)
    }
  } else {
    writeErrorString('Invalid operation.')
  }
  process.exit(0)
})

program
.command('edit')
.description('Edit a remote file using your default editor')
.version('0.1.0')
.argument('<url>', 'Resource URL')
.option('-h, --header <string>', 'The request header. Multiple headers can be added separately. These follow the style of CURL. e.g. --header "Content-Type: application/json" ', arrayifyHeaders)
.option('-e, --editor <path_to_editor_executable>', 'Use custom editor') 
.option('-w, --wait', 'Wait for user confirmation of file update before continuing') 
.option('-v, --verbose', 'Log all operations') // Should this be default?
.action( async (url, options) => {
  let programOpts = addEnvOptions(program.opts() || {});
  const authenticationInfo = await authenticate(programOpts)
  options.fetch = authenticationInfo.fetch;
  if (isDirectory(url)) {
    console.error('Cannot edit containers, only single files.')
    process.exit(1);
  }

  const tmpDir = os.tmpdir()
  const fileName = url.split('/').slice(-1)[0]
  const tmpPath = pth.join(tmpDir, '.solid', fileName)
  let copiedFileLocalUrl;
  try {
    let copiedData = await copyData(url, tmpPath, options);
    let copiedFileContentType = copiedData.source.files[0].contentType;
    let copiedFileUrl = copiedData.source.files[0].absolutePath;
    copiedFileLocalUrl = copiedData.destination.files[0].absolutePath;

    await new Promise((resolve, reject) => {
      var child = child_process.spawn(options.editor || editor, [copiedFileLocalUrl], {
        stdio: 'inherit'
      });
  
      child.on('exit', function (e, code) {
        console.log("finished");
        resolve();
      });
  
    })

    if (options.wait){    
      console.log('Press any key to update remote file with changes');
      await new Promise((resolve, reject) => {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', () => resolve());
      })
    }

    await copyData(copiedFileLocalUrl, copiedFileUrl, options)
    if (options.verbose) console.log('Remote file updated!');
    

  } catch (e) {
    console.error(`Could not edit resource at ${url}: ${e.message}`)
    process.exit(1)
  } finally {
    if(copiedFileLocalUrl) fs.unlinkSync(copiedFileLocalUrl);
  }
  process.exit(0)
})


program
  .parse(process.argv);





/**
 * HELPER FUNCTIONS
 */


/**
 * 
 * @param {ResourceInfo[]} listings 
 * @param {ListingOptions} options 
 * @returns 
 */
function formatListing(listings, options) {
  if (!options.long) {
    // Write short formatted
    let values = listings.map((listingInfo) => {
      let path = options.full
      ? listingInfo.url
      : listingInfo.relativePath 
      
      if (listingInfo.isDir) return chalk.blue.bold(path)
      else if (path.endsWith('.acl')) return chalk.red(path)
      else return path
    })
    return columns(values)
    // console.log(columns(values));
  } else {
    // Write long formatted
    const fileNameLengths = listings.map(fileInfo => options.full ? fileInfo.url.length : getResourceInforelativePath(fileInfo).length)
    const fileNameFieldLength = Math.max(...[Math.max(...fileNameLengths.map(x => x || 0)), 8])

    const aclLengths = listings.map(fileInfo => fileInfo.acl ? (options.full ? fileInfo.acl.url.length : fileInfo.acl.relativePath.length) : 0)
    const aclFieldLength = Math.max(...[Math.max(...aclLengths.map(x => x || 0)), 3])

    const mtimeLength = listings.map(listingInfo => listingInfo.mtime ? listingInfo.mtime.toString().length : 0)
    const mtimeFieldLength = Math.max(...[Math.max(...mtimeLength), 5])

    const sizeLengths = listings.map(listingInfo => listingInfo.size ? listingInfo.size.toString().length : 0)
    const sizeFieldLength = Math.max(...[Math.max(...sizeLengths), 4])

    const modifiedLengths = listings.map(listingInfo => listingInfo.modified ? listingInfo.modified.toISOString().length : 0)
    const modifiedFieldLength = Math.max(...[Math.max(...modifiedLengths), 8])

    const titleFilenameString = "filename".padEnd(fileNameFieldLength)
    const titleMTimeString = "mtime".padEnd(mtimeFieldLength)
    const titleSizeString = "size".padEnd(sizeFieldLength)
    const titleModifiedString = "modified".padEnd(modifiedFieldLength)
    const titleAclString = "acl".padEnd(aclFieldLength)

    // SORT the listings
    listings.sort((a, b) => (a.url).localeCompare(b.url))

    let output = ''
    output += `${titleFilenameString} | ${titleMTimeString} | ${titleSizeString} | ${titleModifiedString} | ${titleAclString}\n`
    output += `${'-'.repeat(fileNameFieldLength + mtimeFieldLength + sizeFieldLength + modifiedFieldLength + aclFieldLength + 12)}\n`
    for (let listingInfo of listings) {
      const path = (options.full ? listingInfo.url : getResourceInforelativePath(listingInfo)) || ''

      let pathString = '';
      if (listingInfo.isDir) pathString = chalk.blue.bold(path.padEnd(fileNameFieldLength))
      else if (path.endsWith('.acl')) pathString = chalk.red(path.padEnd(fileNameFieldLength))
      else pathString = path.padEnd(fileNameFieldLength)

      const mtime = (listingInfo.mtime ? listingInfo.mtime.toString() : '').padEnd(mtimeFieldLength)         
      const size = (listingInfo.size ? listingInfo.size.toString() : '').padEnd(sizeFieldLength)        
      const modified = (listingInfo.modified ? listingInfo.modified.toISOString() : '').padEnd(modifiedFieldLength)
      const aclPath = listingInfo.acl ? (options.full ? listingInfo.acl.url : getResourceInforelativePath(listingInfo.acl)) : ''
      const acl = aclPath.padEnd(aclFieldLength)
      output += `${pathString} | ${mtime} | ${size} | ${modified} | ${acl}\n`
    } 
    return(output)
  }
}


function formatBindings(fileName, bindings, options) {
  if (options.pretty) {
    let table;
    if (!bindings.length) {
      console.log(chalk.bold(`> ${fileName}`))
      writeErrorString(`No results for file ${fileName}`, '-')
      return;
    }
    for (let binding of bindings) {
      if (!table) {
        table = new Table({
          head: Array.from(bindings[0].entries.keys())
        });
      }
      table.push(Array.from(binding.entries.values()).map(e => e.value || ''))
    }
    console.log(`
${chalk.bold(`> ${fileName}`)}
${table.toString()}
    `)
  } else {
    let bindingsString = ""
    if (!bindings.length) {
      console.log(chalk.bold(`> ${fileName}`))
      writeErrorString(`No results for file ${fileName}`, '-')
      return;
    }
    for (let binding of bindings) {
      for (let entry of Array.from(binding.entries.entries())) {
        bindingsString += `${entry[0]}: ${entry[1].value}\n`
      }
      bindingsString += `\n`
    }
    console.log(`
  ${chalk.bold(`> ${fileName}`)}
  ${bindingsString}`)
  }
}

function formatPermissionListing(url, permissions, options) {
  let formattedPerms = permissions.access 
  if (permissions.resource) {
    if (permissions.resource.agent) {
      for (let agentId of Object.keys(permissions.resource.agent)) {
        formattedPerms.agent[agentId]['resource'] = true
      }
    }
    if (permissions.resource.group) {
      for (let groupId of Object.keys(permissions.resource.group)) {
        formattedPerms.group[groupId]['resource'] = true
      }
    }
    if (permissions.resource.public) {
      formattedPerms.public['resource'] = true
    }
  }
  
  if (permissions.default) {
    if (permissions.default.agent) {
      for (let agentId of Object.keys(permissions.default.agent)) {
        formattedPerms.agent[agentId]['default'] = true;
      }
    }
    if (permissions.default.group) {
      for (let groupId of Object.keys(permissions.default.group)) {
        formattedPerms.group[groupId]['default'] = true;
      }
    }
    if (permissions.default.public) {
      let isDefault = true;
      for (let value of ["read", "append", "write", "control"]) {
        if (permissions.resource.public[value] !== permissions.default.public[value]) {
          isDefault = false;
        }
      }
      if (isDefault) formattedPerms.public['default'] = true;
    }
  }


  if (options.pretty) {
    let head = [
      chalk.cyan.bold("ID"), 
      chalk.bold("read"), 
      chalk.bold("append"), 
      chalk.bold("write"), 
      chalk.bold("control"), 
      "inherited", 
      "is default",
    ] 
    let table = new Table({ head });
    if (!isEmpty(formattedPerms.agent)) {
      table.push([chalk.bold('Agent'), '', '', '', '', '', ''])
      for (let id of Object.keys(formattedPerms.agent)) {
        table.push([
          id,
          formattedPerms.agent[id].read || 'false',
          formattedPerms.agent[id].append || 'false',
          formattedPerms.agent[id].write || 'false',
          formattedPerms.agent[id].control || 'false',
          formattedPerms.agent[id].resource ? !formattedPerms.agent[id].resource : 'true', // inherited
          formattedPerms.agent[id].default || 'false',
        ])
      }
    }
    if (!isEmpty(formattedPerms.group)) {
      table.push([chalk.bold('Group'), '', '', '', '', '', ''])
      for (let id of Object.keys(formattedPerms.group)) {
        table.push([
          chalk.green(id),
          formattedPerms.group[id].read || 'false',
          formattedPerms.group[id].append || 'false',
          formattedPerms.group[id].write || 'false',
          formattedPerms.group[id].control || 'false',
          formattedPerms.group[id].resource ? !formattedPerms.group[id].resource : 'true', // inherited
          formattedPerms.group[id].default || 'false',
        ])
      }
    }
    if (!isEmpty(formattedPerms.public)) {
      table.push([chalk.bold('Public'), '', '', '', '', '', ''])
      table.push([
        chalk.blue('#public'),
        chalk.bold(formattedPerms.public.read || 'false'),
        chalk.bold(formattedPerms.public.append || 'false'),
        chalk.bold(formattedPerms.public.write || 'false'),
        chalk.bold(formattedPerms.public.control || 'false'),
        chalk.bold(formattedPerms.public.resource ? !formattedPerms.public.resource : 'true'), // inherited
        chalk.bold(formattedPerms.public.default || 'false'),
      ])

    }
    let formattedString = ``
    formattedString += `> ${chalk.bold(url)}\n`
    formattedString += `${table.toString()}`
    console.log(formattedString)
  } else {

    let formattedString = ``    
    formattedString += `> ${chalk.bold(url)}\n`
    if (!isEmpty(formattedPerms.agent)) {
      formattedString += `${chalk.bold('Agent')}\n`
      for (let id of Object.keys(formattedPerms.agent)) {
        formattedString += `${id} - `
        for (let permission of Object.entries(formattedPerms.agent[id])) {
          if (permission[1]) {
            formattedString += `${permission[0]} `
          } else if (permission[0] === 'resource') {
            formattedString += `${chalk.cyan('inherited')} `
          }
        }
        if (Object.entries(formattedPerms.agent[id]).indexOf('resource') === -1) {
          formattedString += `${chalk.cyan('inherited')} `
        }
        formattedString += `\n`
      }
    }
    if (!isEmpty(formattedPerms.group)) {
      formattedString += `${chalk.bold('Group')}\n`
      for (let id of Object.keys(formattedPerms.group)) {
        formattedString += `${id} - `
        for (let permission of Object.entries(formattedPerms.group[id])) {
          if (permission[1]) {
            formattedString += `${permission[0]} `
          } else if (permission[0] === 'resource') {
            formattedString += `${chalk.cyan('inherited')} `
          }
        }
        if (Object.entries(formattedPerms.group[id]).indexOf('resource') === -1) {
          formattedString += `${chalk.cyan('inherited')} `
        }
        formattedString += `\n`
      }
    }
    if (!isEmpty(formattedPerms.public)) {
      formattedString += `${chalk.bold('Public')}\n`
      formattedString += `${'#public'} - `
      for (let permission of Object.entries(formattedPerms.public)) {
        if (permission[1] && permission[0] !== 'resource') {
          formattedString += `${permission[0]} `
        } else if (permission[0] === 'resource') {
          formattedString += `${chalk.cyan('inherited')} `
        }
      }
      if (Object.entries(formattedPerms.public).indexOf('resource') === -1) {
        formattedString += `${chalk.cyan('inherited')} `
      }
      formattedString += `\n`
    }
    console.log(formattedString)
  }
}

function getResourceInforelativePath(info) { return info.relativePath ? info.relativePath : info.url }

function isEmpty (obj) {
  return Object.keys(obj).length === 0
}