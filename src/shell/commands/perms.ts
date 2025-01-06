import { Command } from 'commander';
import * as acl_perms from '../../commands/solid-perms_acl';
import { setPermission, listPermissions, IPermissionOperation } from '../../commands/solid-perms';
import authenticate from '../../authentication/authenticate';
import { addEnvOptions, changeUrlPrefixes, getAndNormalizeURL } from '../../utils/shellutils';
import { writeErrorString } from '../../utils/util';
import chalk from 'chalk';
import SolidCommand from './SolidCommand';
const Table = require('cli-table');

export default class PermsCommand extends SolidCommand { 

  public addCommand(program: Command) {
    this.programopts = program.opts();

    
    const access = program
      .command('access')
      .description('Control and edit resource permissions.');



    access
      .command('list')
      .argument('<url>', 'Resource URL')
      .option('--acl', 'Displays ACL specific information such as group and default access')
      .option('-p, --pretty', 'Pretty format')
      .option('-v, --verbose', 'Log all operations') 
      .action(async (url: string, options: any) => {

        let programOpts = addEnvOptions(this.programopts || {});
        const authenticationInfo = await authenticate(programOpts)
        options.fetch = authenticationInfo.fetch
        url = await changeUrlPrefixes(authenticationInfo, url)

        if (options.acl) {
          const listings = await acl_perms.listPermissions(url, options)
          if (listings) formatACLPermissionListing(url, listings, options)
        } else {
          const listings = await listPermissions(url, options)
          if (listings) formatPermissionListing(url, listings, options)
        }
        if (this.mayExit) process.exit(0)
      })


    access
      .command('set')
      .argument('<url>', 'Resource URL')
      .argument('[permissions...]', 
      `Permission format when setting permissions. 
      Format according to id=[a][c][r][w]. 
      For public permissions please set id to "p". 
      For the current authenticated user please set id to "u".
      For specific agents, set id to be the agent webid.
      `)
      .option('--acl', 'Enables ACL specific operations --default and --group')
      .option('--default', 'Set the defined permissions as default (only in --acl mode)')
      .option('--group', 'Process identifier as a group identifier (only in --acl mode)')
      .option('-v, --verbose', 'Log all operations') // Should this be default?
      .action( async (url: string, permissions: string[], options: any) => {

        let programOpts = addEnvOptions(this.programopts || {});
        const authenticationInfo = await authenticate(programOpts)
        options.fetch = authenticationInfo.fetch
        url = await changeUrlPrefixes(authenticationInfo, url)

        try {
          // if (this.shell) url = getAndNormalizeURL(url, this.shell);
          let parsedPermissions = permissions.map(permission => {
            const splitPerm = permission.split('=')
            if (! (splitPerm.length === 2)) { 
              writeErrorString('Incorrect permission format.', 'Please format your permissions as id=[a][c][r][w].', options) 
              process.exit(0)
            }
            let id = splitPerm[0]
            const permissionOptions = splitPerm[1].split('')
            let type;
            const acl = options.acl

            if (options.group) {
              if (!acl) {
                writeErrorString('Cannot set group permissions outside of --acl mode.', options);
                process.exit(0)
              }
              type = 'group'
            } else if (id === 'p') {
              type = 'public'
            } else if (id === 'u') {
              if (!authenticationInfo.webId) { 
                writeErrorString('Could not autmatically fill in webId of authenticated user.', 'Please make sure you have an authenticated session to auto-fill your webId', options);
                process.exit(0)
              }
              type = 'agent'
              id = authenticationInfo.webId
            } 
            const read = permissionOptions.indexOf('r') !== -1
            const write = permissionOptions.indexOf('w') !== -1
            const append = permissionOptions.indexOf('a') !== -1
            const control = permissionOptions.indexOf('c') !== -1
            const def = options.default
            if (options.default && !options.acl) {
              writeErrorString('Cannot set default permissions outside of --acl mode.', options);
              process.exit(0)
            }
            return ({ type, id, read, write, append, control, default: def, acl } as IPermissionOperation)
          })
          try {
            for (let permission of parsedPermissions) {
              if (permission.acl) {
                await acl_perms.changePermissions(url, parsedPermissions, options)
              } else {
                await setPermission(url, parsedPermissions, options)
              }

            }
          } catch (e) {
            if (options.verbose) writeErrorString(`Could not update permissions for resource at ${url}`, e, options)
          }
        }
        catch (e) {
          writeErrorString(`Could not evaluate permissions for ${url}`, e, options)
          if (this.mayExit) process.exit(1)
        }
      })

    access
      .command('delete')
      .argument('<url>', 'Resource URL')
      .description('Delete ACL resource attached to resource with given URI. Does not work for ACP based pods!')
      .option('-v, --verbose', 'Log all operations') // Should this be default?
      .action(async (url: string, options: any) => {
        let programOpts = addEnvOptions(this.programopts || {});
        const authenticationInfo = await authenticate(programOpts)
        options.fetch = authenticationInfo.fetch
        url = await changeUrlPrefixes(authenticationInfo, url)

        try {
          await acl_perms.deletePermissions(url, options)
        } catch (e) {
          if (options.verbose) writeErrorString(`Could not delete permissions for resource at ${url}`, e, options)
        }
        if (this.mayExit) process.exit(0)
      })

    return program
  }

}




function formatPermissionListing(url: string, permissions: any, options: any) {
  let formattedString = ``    
  let formattedPerms = permissions.access 
  if (permissions.resource) {
    if (permissions.resource.agent) {
      for (let agentId of Object.keys(permissions.resource.agent)) {
        formattedPerms.agent[agentId]['resource'] = true
      }
    }
    if (permissions.resource.public) {
      formattedPerms.public['resource'] = true
    }
  }
  

  if (options.pretty) {
    let head = [
      chalk.cyan.bold("ID"), 
      chalk.bold("read"), 
      chalk.bold("append"), 
      chalk.bold("write"), 
      chalk.bold("control"), 
    ] 
    let table = new Table({ head });
    if (!isEmpty(formattedPerms.agent)) {
      table.push([chalk.bold('Agent'), '', '', '', ''])
      for (let id of Object.keys(formattedPerms.agent)) {
        const control = formattedPerms.agent[id].controlRead && formattedPerms.agent[id].controlWrite
        table.push([
          id,
          formattedPerms.agent[id].read || 'false',
          formattedPerms.agent[id].append || 'false',
          formattedPerms.agent[id].write || 'false',
          control || 'false',
        ])
      }
    }
    if (!isEmpty(formattedPerms.public)) {
      const control = formattedPerms.public.controlRead && formattedPerms.public.controlWrite
      table.push([chalk.bold('Public'), '', '', '', ''])
      table.push([
        chalk.blue('#public'),
        chalk.bold(formattedPerms.public.read || 'false'),
        chalk.bold(formattedPerms.public.append || 'false'),
        chalk.bold(formattedPerms.public.write || 'false'),
        chalk.bold(control || 'false'),
      ])
    }
    formattedString += `> ${chalk.bold(url)}\n`
    formattedString += `${table.toString()}`
  } else {
    formattedString += `> ${chalk.bold(url)}\n`
    if (!isEmpty(formattedPerms.agent)) {
      formattedString += `${chalk.bold('Agent')}\n`
      for (let id of Object.keys(formattedPerms.agent)) {
        formattedString += `${id} - `
        for (let permission of Object.entries(formattedPerms.agent[id])) {
          if (permission[1] && permission[0] !== "controlRead" && permission[0] !== "controlWrite") {
            formattedString += `${permission[0]} `
          } 
        }
        if (formattedPerms.agent[id]["controlRead"] && formattedPerms.agent[id]["controlWrite"]) {
          formattedString += `control `
        }
        formattedString += `\n`
      }
    }
    if (!isEmpty(formattedPerms.public)) {
      formattedString += `${chalk.bold('Public')}\n`
      formattedString += `${'#public'} - `
      let inherited = true;
      for (let permission of Object.entries(formattedPerms.public)) {
        if (permission[1] && permission[0] !== "controlRead" && permission[0] !== "controlWrite") {
          formattedString += `${permission[0]} `
        } 
      }
      if (formattedPerms.public["controlRead"] && formattedPerms.public["controlWrite"]) {
        formattedString += `control `
      }
      formattedString += `\n`
    }
  }
  console.log(formattedString)
}


function formatACLPermissionListing(url: string, permissions: any, options: any) {
  let formattedString = ``    
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
    formattedString += `> ${chalk.bold(url)}\n`
    formattedString += `${table.toString()}`
  } else {
    formattedString += `> ${chalk.bold(url)}\n`
    if (!isEmpty(formattedPerms.agent)) {
      formattedString += `${chalk.bold('Agent')}\n`
      for (let id of Object.keys(formattedPerms.agent)) {
        formattedString += `${id} - `
        let inherited = true;
        for (let permission of Object.entries(formattedPerms.agent[id])) {
          if (permission[0] === 'resource') { 
            inherited = false
          } else if (permission[1]) {
            formattedString += `${permission[0]} `
          } 
        }
        if (inherited) {
          formattedString += `${chalk.cyan('inherited')} `
        }
        formattedString += `\n`
      }
    }
    if (!isEmpty(formattedPerms.group)) {
      formattedString += `${chalk.bold('Group')}\n`
      for (let id of Object.keys(formattedPerms.group)) {
        formattedString += `${id} - `
        let inherited = true;
        for (let permission of Object.entries(formattedPerms.group[id])) {
          if (permission[0] === 'resource') { 
            inherited = false
          } else if (permission[1]) {
            formattedString += `${permission[0]} `
          } 
        }
        if (inherited) {
          formattedString += `${chalk.cyan('inherited')} `
        }
        formattedString += `\n`
      }
    }
    if (!isEmpty(formattedPerms.public)) {
      formattedString += `${chalk.bold('Public')}\n`
      formattedString += `${'#public'} - `
      let inherited = true;
      for (let permission of Object.entries(formattedPerms.public)) {
        if (permission[0] === 'resource') { 
          inherited = false
        } else if (permission[1]) {
          formattedString += `${permission[0]} `
        } 
      }
      if (inherited) {
        formattedString += `${chalk.cyan('inherited')} `
      }
      formattedString += `\n`
    }
  }
  console.log(formattedString)
}

function isEmpty (obj: any) {
  if (!obj) return true;
  return Object.keys(obj).length === 0
}
