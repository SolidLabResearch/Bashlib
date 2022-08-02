import SolidCommand from './SolidCommand';
import { Command } from 'commander';

import { getAllConfigEntries, getConfigCurrentWebID, getConfigCurrentSession, getConfigCurrentToken, setConfigToken, setConfigCurrentWebID, removeConfigSession, removeConfigSessionAll, addConfigEmtpyEntry } from '../../utils/configoptions';
import inquirer from 'inquirer';

import cliSelect from "cli-select"
import chalk from 'chalk';
import { generateCSSToken } from '../../authentication/TokenCreationCSS';
import { getPodRoot } from '../../utils/util';
import { generateDpopKeyPair } from '@inrupt/solid-client-authn-core';
import { requestAccessToken } from '../../authentication/AuthenticationToken';
const Table = require('cli-table');
const nodeFetch = require('node-fetch')


export default class AuthCommand extends SolidCommand { 
  public addCommand(program: Command) {
    this.programopts = program.opts();

    let authcommand = program.command('auth').description('Utility to edit authentication options for Bashlib.')

    authcommand
      .command('show')
      .description('Show current authentication settings.')
      .action(async (options: any) => { 
        await showAuthenticationOption(options)
      })
    
    authcommand
      .command('list')
      .description('Show current authentication options.')
      .option('-i, --pretty', 'Show listing in table format.')
      .action(async (options: any) => { 
        await listAuthenticationOptions(options)
      })
    
    authcommand
      .command('set')
      .description('Show current authentication settings.')
      .action(async (options: any) => { 
        await setAuthenticationOption(options)
      })
    
    authcommand
      .command('clear')
      .description('Clear authentication info.')
      .option('-a, -all', 'clear all entries')
      .option('-w, --webid', 'clear specific WebID entry')
      .action(async (options: any) => { 
        await clearAuthenticationOption(options)
      })
    
    authcommand
      .command('create-token')
      .description('create authentication token (only for WebIDs hosted on a Community Solid Server v4.0.0 and up).')
      .option('-b, --base-url <string>', 'URL of your CSS server')
      .option('-n, --name <string>', 'Token name')
      .option('-e, --email <string>', 'User email')
      .option('-p, --password <string>', 'User password')
      .option('-v, --verbose', 'Log actions')
      .action(async (options) => {
        await createAuthenticationTokenCSS(options)
      })
    
    return program
  } 
}

async function showAuthenticationOption(options: any) { 
  let currentWebID = getConfigCurrentWebID();
  let head = [
    chalk.cyan.bold("WebID"), 
  ] 
  let table = new Table({ head });
  table.push([currentWebID || "None"])
  
  console.log(`
${table.toString()}`
  )
}

async function listAuthenticationOptions(options: any) {
  if (options.pretty) {
    let head = [
      chalk.cyan.bold("WebID"),
      "has auth token",
      "has active session",
      "session expires at"
    ]
    let table = new Table({ head });

    let entries = getAllConfigEntries();
    for (let webId of Object.keys(entries)) {
      table.push([getConfigCurrentWebID() === webId ? `*${webId}` : webId, entries[webId].hasToken, !!entries[webId].session, entries[webId].session?.expirationDate?.toISOString()])
    }
    console.log(`
Stored authentication data:
${table.toString()}`
    )
  } else { 
    let entries = getAllConfigEntries();
    for (let webId of Object.keys(entries)) {
      console.log(
        chalk.cyan.bold(getConfigCurrentWebID() === webId ? `*${webId}` : webId),
        entries[webId].hasToken ? `- ${chalk.bold('auth token')}` : "",
        !!entries[webId].session ? `- ${chalk.bold('active session')}` : "",
        entries[webId].session?.expirationDate ? `- session expires at ${entries[webId].session?.expirationDate?.toISOString()}` : "",
        !entries[webId].hasToken && !entries[webId].session ? "No active session or token found" : ""
      )
    }
  }
  
}

async function setAuthenticationOption(options: any) {
  let entries = getAllConfigEntries();
  let values: Record<string, string> = {}
  values["new"] = `${chalk.bold.blueBright("Authenticate using new WebID")}`
  for (let webId of Object.keys(entries)) { 
    values[webId] =
`${chalk.bold.greenBright(getConfigCurrentWebID() === webId ? `*${webId}` : webId)} ${entries[webId].hasToken ? `- ${chalk.bold("auth token")}` : ""} ${entries[webId].session ? `- ${chalk.bold("existing session")} expiring at ${entries[webId].session?.expirationDate?.toISOString()}` : ""}`
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
    });
  })

  let selectedWebID = undefined;
  // Add a new webId to the config
  if (selected === "new") {
    let answers = await inquirer.prompt([{ type: 'input', name: 'webid',  message: 'Use a new WebID to authenticate'}])
    let newWebId = answers.webid;
    setConfigCurrentWebID(newWebId)
    addConfigEmtpyEntry(newWebId)
    selectedWebID = newWebId
  } else { 
    setConfigCurrentWebID(selected as unknown as string)
    selectedWebID = selected
  }
  console.log(`Authenticating for WebID: ${selectedWebID}`)
}

async function clearAuthenticationOption(options: any) {
  if (options.all) {
    removeConfigSessionAll();
  } else if (options.webid === 'all') { 
    removeConfigSession(options.webId)
  } else { 
    setConfigCurrentWebID(undefined);
  } 
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
      options.baseUrl = session?.idp || token?.idp || await getPodRoot(webId, nodeFetch)
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
    let { accessToken, expirationDate, webId } = await requestAccessToken(token.id, token.secret, dpopKey, options); 4
    if (!webId) throw new Error('Could not create valid authentication token.')
    setConfigToken(webId, token)
    console.log(`Successfully created new token ${options.name}`)
  } catch (e) {
    console.error(`Could not create token: ${(e as Error).message}`)
    console.error(`Please make sure the filled in email and password values are correct!`)
  }
}

