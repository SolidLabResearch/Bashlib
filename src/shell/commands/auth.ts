import SolidCommand from './SolidCommand';
import { Command } from 'commander';

import { getAllConfigEntries, getConfigCurrentWebID, getConfigCurrentSession, getConfigCurrentToken, setConfigToken, setConfigCurrentWebID, removeConfigSession, removeConfigSessionAll, addConfigEmtpyEntry, clearConfigCurrentWebID } from '../../utils/configoptions';
import inquirer from 'inquirer';

import cliSelect from "cli-select"
import chalk from 'chalk';
import { generateCSSToken, generateInruptToken } from '../../authentication/TokenCreationCSS';
import { getWebIDIdentityProvider, writeErrorString } from '../../utils/util';
import { generateDpopKeyPair } from '@inrupt/solid-client-authn-core';
import { requestAccessToken } from '../../authentication/AuthenticationToken';
import { getSolidDataset, getThing } from '@inrupt/solid-client';
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
      .description('Set WebID through interactive menu, or directly set the WebID through argument.')
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
      .command('create-token-css')
      .description('create authentication token (only for WebIDs hosted on a Community Solid Server v4.0.0 and up).')
      .option('-w, --webid <string>', 'User WebID')
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
    

    authcommand
    .command('create-token-ess')
    .description('Store application id and secret for authentication token generation (register bashlib here: https://login.inrupt.com/registration.html).')
    .option('-w, --webid <string>', 'User WebID')
    .option('-i, --id <string>', 'application registration id')
    .option('-s, --secret <string>', 'application registration secret')
    .option('-v, --verbose', 'Log actions')
    .action(async (options) => {
      try {
        await createAuthenticationTokenInrupt(options)
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
      chalk.cyan("WebID"),
      "has auth token",
      "has active session",
    ]
    let table = new Table({ head });

    let entries = getAllConfigEntries();
    for (let webId of Object.keys(entries)) {
      let activeSession = entries[webId]?.session
      if (webId === currentWebId) table.push([colorWebID(webId), entries[webId].hasToken, 
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
        colorWebID(webId),
        entries[webId].hasToken ? `- ${chalk('auth token')}` : "",
        !!activeSession && !! activeSession.expirationDate && 
          activeSession.expirationDate > new Date() ? `- ${chalk('active session')}` : ""
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
      table.push([colorWebID(webId), entries[webId].hasToken, 
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
        entries[webId].hasToken ? `- ${chalk('auth token')}` : "",
        !!activeSession && !! activeSession.expirationDate && 
          activeSession.expirationDate > new Date() ? `- ${chalk('active session')}` : ""
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
    values["cancel"] = `${chalk.redBright("Cancel operation")}`
    values["new"] = `${chalk.blueBright("Authenticate using new WebID")}`
    values["clear"] = `${chalk.red("Clear current authentication option")}`
    for (let webId of Object.keys(entries)) { 
      values[webId] =
  `${colorWebID(webId)} ${entries[webId].hasToken ? `- ${chalk("auth token")}` : ""} ${!!activeSession && !! activeSession?.expirationDate && activeSession.expirationDate > new Date() ? `- ${chalk("active session")}` : ""}`
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

// todo: handle multiple auth servers for a single WebID.
async function createAuthenticationTokenCSS(options: any) { 
  options.name = options.name || "Solid-cli token"
  let questions = []

  let currentWebID = getConfigCurrentWebID();
  let createTokenForCurrentWebID = false;
  
  if (options.webid) options.webId = options.webid

  if (!options.webId && currentWebID) { 
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
    if(webId) options.webId = webId;
    if (webId) options.idp = session?.idp || token?.idp || await getWebIDIdentityProvider(webId)
  }

  if (!options.webId) questions.push({ type: 'input', name: 'webId',  message: 'WebID to create token for'})
  if (!options.email) questions.push({ type: 'input', name: 'email',  message: 'User email'})
  if (!options.password) questions.push({ type: 'password', name: 'password',  message: 'User password'})

  if (questions.length) {
    let answers = await inquirer.prompt(questions)
    options = { ...options, ...answers }
  }

  if (!options.idp) {
    try {
      options.idp  = await getWebIDIdentityProvider(options.webId);
    } catch (e) {
      throw new Error(`Could not process provided WebID at ${options.webid}`)
    }
  }

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

async function createAuthenticationTokenInrupt(options: any){
  options.name = options.name || "Solid-cli token"
  let questions = []

  let currentWebID = getConfigCurrentWebID();
  let createTokenForCurrentWebID = false;

  if (options.webid) options.webId = options.webid

  if (!options.webId && currentWebID) { 
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
    if(webId) options.webId = webId;
    if (!options.idp && webId) options.idp = session?.idp || token?.idp || await getWebIDIdentityProvider(webId)
  } 

  if (!options.webId) questions.push({ type: 'input', name: 'webId',  message: 'WebID to create token for'})
  if (!options.email) questions.push({ type: 'input', name: 'id',  message: 'id'})
  if (!options.password) questions.push({ type: 'input', name: 'secret',  message: 'secret'})

  if (questions.length) {
    let answers = await inquirer.prompt(questions)
    options = { ...options, ...answers }
  }

  if (!options.idp) {
    try {
      options.idp  = await getWebIDIdentityProvider(options.webId);
    } catch (e) {
      throw new Error(`Could not process provided WebID at ${options.webid}`)
    }
  }
  
  try {
    let token = await generateInruptToken(options);

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
    values["all"] = `${chalk.redBright("Delete all saved auth information (including tokens)")}`
    for (let webId of Object.keys(entries)) { 
      values[webId] =
  `${colorWebID(webId)} ${entries[webId].hasToken ? `- ${chalk("auth token")}` : ""} ${!!activeSession && !! activeSession?.expirationDate && activeSession.expirationDate > new Date() ? `- ${chalk("active session")}` : ""}`
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
  return getConfigCurrentWebID() === webId ? chalk.bold(webId) : chalk(webId)
}