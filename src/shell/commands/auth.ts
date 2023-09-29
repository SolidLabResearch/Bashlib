import SolidCommand from './SolidCommand';
import { Command } from 'commander';

import { getAllConfigEntries, getConfigCurrentWebID, getConfigCurrentSession, getConfigCurrentToken, setConfigToken, setConfigCurrentWebID, removeConfigSession, removeConfigSessionAll, addConfigEmtpyEntry, clearConfigCurrentWebID } from '../../utils/configoptions';
import inquirer from 'inquirer';

import cliSelect from "cli-select"
import chalk from 'chalk';
import { generateCSSToken } from '../../authentication/TokenCreationCSS';
import { getWebIDIdentityProvider, writeErrorString } from '../../utils/util';
import { generateDpopKeyPair } from '@inrupt/solid-client-authn-core';
import { requestAccessToken } from '../../authentication/AuthenticationToken';
const Table = require('cli-table');


export default class AuthCommand extends SolidCommand { 
  public addCommand(program: Command) {
    this.programopts = program.opts();

    let authcommand = program.command('auth').description('Utility to edit authentication options for Bashlib.')

    authcommand
      .command('show')
      .description('Show current authentication settings.')
      .option('-p, --pretty', 'Show listing in table format.')
      .action(async (options: any) => { 
        try {
          await showAuthenticationOption(options)
        } catch (e) { 
          writeErrorString('Could not show current authentication info', e, options)
          if (this.mayExit) process.exit(1)
        }
        if (this.mayExit) process.exit(0)
      })
    
    authcommand
      .command('list')
      .description('List available authentication options.')
      .option('-p, --pretty', 'Show listing in table format.')
      .action(async (options: any) => { 
        try {
          await listAuthenticationOptions(options)
        } catch (e) { 
          writeErrorString('Could not list authentication options', e, options) 
          if (this.mayExit) process.exit(1)
        }
      if (this.mayExit) process.exit(0)
      })
    
    authcommand
      .command('set')
      .description('Set current authentication option.')
      .argument('[webid]', 'Set active WebID directly, without requiring manual selection.')
      .action(async (webid: string | undefined, options: any) => { 
        options.webid = webid;
        try {
          await setAuthenticationOption(options)
        } catch (e) { 
          writeErrorString('Could not set authentication option', e, options) 
          if (this.mayExit) process.exit(1)
        }
        if (this.mayExit) process.exit(0)
      })
    
    authcommand
      .command('remove')
      .argument('[string]', 'webid | all')
      .description('Removes the authentication information for a specific WebID or for all saved WebIDs.')
      .action(async (webid, options: any) => { 
        options.webid = webid;
        try {
          await removeAuthenticationOption(options)
        } catch (e) { 
          writeErrorString('Could not clear authentication option(s)', e, options) 
          if (this.mayExit) process.exit(1)
        }
        if (this.mayExit) process.exit(0)
      })

      authcommand
        .command('clear')
        .description('Clear currently authenticated WebID')
        .action(async (options: any) => { 
          try {
            await clearAuthenticationOption()
          } catch (e) { 
            writeErrorString('Could not clear authentication option(s)', e, options) 
            if (this.mayExit) process.exit(1)
          }
          if (this.mayExit) process.exit(0)
        })
    
    authcommand
      .command('create-token')
      .description('Create authentication token (only for WebIDs hosted on a Community Solid Server v4.0.0 and up).')
      .option('-b, --base-url <string>', 'URL of your CSS server')
      .option('-n, --name <string>', 'Token name')
      .option('-e, --email <string>', 'User email')
      .option('-p, --password <string>', 'User password')
      .option('-v, --verbose', 'Log actions')
      .action(async (options) => {
        try {
          await createAuthenticationTokenCSS(options)
        } catch (e) { 
          writeErrorString('Could not create authentication token', e, options) 
          if (this.mayExit) process.exit(1)
        }
        if (this.mayExit) process.exit(0)
      })
    
    return program
  } 
}

async function showAuthenticationOption(options: any) { 
  let currentWebId = getConfigCurrentWebID();
  if (options.pretty) {
    let head = [
      chalk.cyan.bold("WebID"),
      "has auth token",
      "has active session",
    ]
    let table = new Table({ head });

    let entries = getAllConfigEntries();
    for (let webId of Object.keys(entries)) {
      let activeSession = entries[webId]?.session
      if (webId === currentWebId) table.push([chalk.cyan.bold(webId), entries[webId].hasToken, 
        !!activeSession && !! activeSession.expirationDate && activeSession.expirationDate > new Date()])
    }
    console.log(`
Stored authentication data:
${table.toString()}`
    )
  } else { 
    let entries = getAllConfigEntries();
    for (let webId of Object.keys(entries)) {
      let activeSession = entries[webId]?.session
      if (webId === currentWebId) console.log(
        chalk.cyan.bold(webId),
        entries[webId].hasToken ? `- ${chalk.bold('auth token')}` : "",
        !!activeSession && !! activeSession.expirationDate && 
          activeSession.expirationDate > new Date() ? `- ${chalk.bold('active session')}` : ""
      )
    }
  }
  
}

async function listAuthenticationOptions(options: any) {
  if (options.pretty) {
    let head = [
      chalk.cyan.bold("WebID"),
      "has auth token",
      "has active session",
    ]
    let table = new Table({ head });

    let entries = getAllConfigEntries();
    for (let webId of Object.keys(entries)) {
      let activeSession = entries[webId]?.session
      table.push([webId, entries[webId].hasToken, 
        !!activeSession && !! activeSession.expirationDate && activeSession.expirationDate > new Date()])
    }
    console.log(`
Stored authentication data:
${table.toString()}`
    )
  } else { 
    let entries = getAllConfigEntries();
    for (let webId of Object.keys(entries)) {
      let activeSession = entries[webId]?.session
      console.log(
        colorWebID(webId),
        entries[webId].hasToken ? `- ${chalk.bold('auth token')}` : "",
        !!activeSession && !! activeSession.expirationDate && 
          activeSession.expirationDate > new Date() ? `- ${chalk.bold('active session')}` : ""
      )
    }
  }
}

async function setAuthenticationOption(options: any) {
  let webId = options.webid
  if (webId) {  
    await setConfigCurrentWebID(webId)
    addConfigEmtpyEntry(webId)
    console.log(`Authenticating for WebID: ${webId}`)
  } else { 
    let entries = getAllConfigEntries();
    let values: Record<string, string> = {}
    let activeSession = entries[webId]?.session
    values["cancel"] = `${chalk.bold.redBright("Cancel operation")}`
    values["new"] = `${chalk.bold.blueBright("Authenticate using new WebID")}`
    values["clear"] = `${chalk.bold.red("Clear current authentication option")}`
    for (let webId of Object.keys(entries)) { 
      values[webId] =
  `${colorWebID(webId)} ${entries[webId].hasToken ? `- ${chalk.bold("auth token")}` : ""} ${!!activeSession && !! activeSession?.expirationDate && activeSession.expirationDate > new Date() ? `- ${chalk.bold("active session")}` : ""}`
    }

    let selected = await new Promise((resolve, reject) => { 
      cliSelect({
        values,
        valueRenderer: (value, selected) => {
          if (selected) {
            return chalk.underline(value);
          }
          return value;
        },
      }).then(result => { 
        resolve(result.id)
      }).catch(e => reject(e));
    })

    let selectedWebID = undefined;
    // Add a new webId to the config
    if (selected === "new") {
      let answers = await inquirer.prompt([{ type: 'input', name: 'webid',  message: 'Use a new WebID to authenticate'}])
      let newWebId = answers.webid;
      await setConfigCurrentWebID(newWebId)
      addConfigEmtpyEntry(newWebId)
      selectedWebID = newWebId
    } else if (selected === "cancel") {
       // We just return from the function
      return;
    } else if (selected === "clear") {
       // We clear the currently authenticated session
      clearAuthenticationOption()
      console.log(`Cleared authenticated WebID.`)
      return;
    } else { 
      // We set the selected WebID as the currently used one
      await setConfigCurrentWebID(selected as unknown as string)
      selectedWebID = selected
    }
    console.log(`Authenticating for WebID: ${selectedWebID}`)
  }
}

async function clearAuthenticationOption(options?: any) {
  await clearConfigCurrentWebID();
}

async function createAuthenticationTokenCSS(options: any) { 
  options.name = options.name || "Solid-cli token"
  let questions = []

  let currentWebID = getConfigCurrentWebID();
  let createTokenForCurrentWebID = false;
  if (currentWebID) { 
    console.log(`Do you want to create an authentication token for ${currentWebID}? [Y/n] `);
    createTokenForCurrentWebID = await new Promise((resolve, reject) => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', (chk) => {
        if (chk.toString('utf8') === "n") {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  if (createTokenForCurrentWebID) { 
    let session = getConfigCurrentSession()
    let token = getConfigCurrentToken()
    let webId = getConfigCurrentWebID()
    if (!options.baseUrl && webId) { 
      options.baseUrl = session?.idp || token?.idp || await getWebIDIdentityProvider(webId)
    }
  }

  if (!options.baseUrl) questions.push({ type: 'input', name: 'baseUrl',  message: 'Pod baseuri'})
  if (!options.email) questions.push({ type: 'input', name: 'email',  message: 'User email'})
  if (!options.password) questions.push({ type: 'password', name: 'password',  message: 'User password'})

  if (questions.length) {
    let answers = await inquirer.prompt(questions)
    options = { ...options, ...answers }
  }
  options.idp = options.baseUrl;

  try {
    let token = await generateCSSToken(options);

    // Get token WebID by creating an access token (a bit wastefull but no other option sadly)
      if (!token.id || !token.secret) throw new Error('Could not create valid authentication token.')
    const dpopKey = await generateDpopKeyPair();
    let { accessToken, expirationDate, webId } = await requestAccessToken(token.id, token.secret, dpopKey, options);

    if (!webId) throw new Error('Could not create valid authentication token.')
    setConfigToken(webId, token)
    console.log(`Successfully created new token ${options.name}`)
  } catch (e) {
    console.error(`Could not create token: ${(e as Error).message}`)
    console.error(`Please make sure the filled in email and password values are correct!`)
  }
}


async function setAuthenticationOption_backup(options: any) {
  let webId = options.webid
  if (webId) {  
    await setConfigCurrentWebID(webId)
    addConfigEmtpyEntry(webId)
    console.log(`Authenticating for WebID: ${webId}`)
  } else { 
    let entries = getAllConfigEntries();
    let values: Record<string, string> = {}
    let activeSession = entries[webId]?.session
    values["cancel"] = `${chalk.bold.redBright("Cancel operation")}`
    values["new"] = `${chalk.bold.blueBright("Authenticate using new WebID")}`
    values["clear"] = `${chalk.bold.red("Clear current authentication option")}`
    for (let webId of Object.keys(entries)) { 
      values[webId] =
  `${colorWebID(webId)} ${entries[webId].hasToken ? `- ${chalk.bold("auth token")}` : ""} ${!!activeSession && !! activeSession?.expirationDate && activeSession.expirationDate > new Date() ? `- ${chalk.bold("active session")}` : ""}`
    }

    let selected = await new Promise((resolve, reject) => { 
      cliSelect({
        values,
        valueRenderer: (value, selected) => {
          if (selected) {
            return chalk.underline(value);
          }
          return value;
        },
      }).then(result => { 
        resolve(result.id)
      }).catch(e => reject(e));
    })

    let selectedWebID = undefined;
    // Add a new webId to the config
    if (selected === "new") {
      let answers = await inquirer.prompt([{ type: 'input', name: 'webid',  message: 'Use a new WebID to authenticate'}])
      let newWebId = answers.webid;
      await setConfigCurrentWebID(newWebId)
      addConfigEmtpyEntry(newWebId)
      selectedWebID = newWebId
    } else if (selected === "cancel") {
       // We just return from the function
      return;
    } else if (selected === "clear") {
       // We clear the currently authenticated session
      clearAuthenticationOption()
      console.log(`Cleared authenticated WebID.`)
      return;
    } else { 
      // We set the selected WebID as the currently used one
      await setConfigCurrentWebID(selected as unknown as string)
      selectedWebID = selected
    }
    console.log(`Authenticating for WebID: ${selectedWebID}`)
  }
}

async function removeAuthenticationOption(options?: any) {

  let webId = options.webid
  if (webId) {  
    if (webId === "all") {
      removeConfigSessionAll();
      clearConfigCurrentWebID();
      console.log('Removed all saved auth information.')
    } else { 
      removeConfigSession(webId)
      if(webId === getConfigCurrentWebID) clearConfigCurrentWebID();
      console.log(`Removed all saved auth information for ${webId}.`)
    } 
  } else { 
    let entries = getAllConfigEntries();
    let values: Record<string, string> = {}
    let activeSession = entries[webId]?.session
    values["all"] = `${chalk.bold.redBright("Delete all saved auth information (including tokens)")}`
    for (let webId of Object.keys(entries)) { 
      values[webId] =
  `${colorWebID(webId)} ${entries[webId].hasToken ? `- ${chalk.bold("auth token")}` : ""} ${!!activeSession && !! activeSession?.expirationDate && activeSession.expirationDate > new Date() ? `- ${chalk.bold("active session")}` : ""}`
    }

    let selected = await new Promise((resolve, reject) => { 
      cliSelect({
        values,
        valueRenderer: (value, selected) => {
          if (selected) {
            return chalk.underline(value);
          }
          return value;
        },
      }).then(result => { 
        resolve(result.id)
      }).catch(e => reject(e));
    })

    // Add a new webId to the config
    if (selected === "all") {
      removeConfigSessionAll();
      console.log('Removed all saved auth information.')
      clearConfigCurrentWebID();
      return;
    } else if (selected as string) { 
      console.log('webid', selected)
      removeConfigSession(selected as string)
      if(selected === getConfigCurrentWebID()) clearConfigCurrentWebID();
      console.log(`Removed all saved auth information for ${selected}.`)
    }
  }
}


function colorWebID(webId: string) {
  return getConfigCurrentWebID() === webId ? chalk.bold.cyan(webId) : chalk.bold(webId)
}