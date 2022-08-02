import SolidCommand from './SolidCommand';
import { Command } from 'commander';

import { getAllConfigEntries, getConfigCurrentWebID, getConfigCurrentSession, getConfigCurrentToken, setConfigToken } from '../../utils/configoptions';
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
        let currentWebID = getConfigCurrentWebID();
        let head = [
          chalk.cyan.bold("WebID"), 
        ] 
        let table = new Table({ head });
        table.push([currentWebID || "None"])
        
        console.log(`
${table.toString()}`
        )
        
      })
    
    authcommand
      .command('list')
      .description('Show current authentication options.')
      .action(async (options: any) => { 
      })
    
    authcommand
      .command('set')
      .description('Show current authentication settings.')
      .action(async (options: any) => { 
        let configopts = getAllConfigEntries();
//         let head = [
//           chalk.cyan.bold("method"), 
//           chalk.bold("token"), 
//           chalk.bold("session"), 
//         ] 
//         let table = new Table({ head });
//         table.push([configopts.method || "undefined", configopts.token || "undefined", configopts.session || "undefined"])
        
//         console.log(`
// ${chalk.bold("Authentication settings")}
// ${table.toString()}`
        // )
        
      })
    
    authcommand
      .command('clear')
      .description('Clear authentication info.')
      .action(async (options: any) => { 
        let configopts = getAllConfigEntries();
//         let head = [
//           chalk.cyan.bold("method"), 
//           chalk.bold("token"), 
//           chalk.bold("session"), 
//         ] 
//         let table = new Table({ head });
//         table.push([configopts.method || "undefined", configopts.token || "undefined", configopts.session || "undefined"])
        
//         console.log(`
// ${chalk.bold("Authentication settings")}
// ${table.toString()}`
        // )
        
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
      })
    
    
    return program
  }
  
}


