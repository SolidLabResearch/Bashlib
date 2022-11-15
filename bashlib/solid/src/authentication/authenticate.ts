import SolidFetchBuilder from './CreateFetch';
import { getPodRoot, getWebIDIdentityProvider, writeErrorString } from '../utils/util';
import inquirer from 'inquirer';
import { getConfigCurrentWebID, getConfigCurrentToken } from '../utils/configoptions';
import { getSessionFromStorage } from '@inrupt/solid-client-authn-node';
const nodeFetch = require('node-fetch')

export type ILoginOptions = {
  auth?: string,
  idp?: string,
  identityprovider?: string,
  email?: string,
  password?: string, 
  config?: string, 
  clientCredentialsTokenStorageLocation?: string,  // Storage location of the stored client credentials token.
  sessionInfoStorageLocation?: string, 
  verbose?: boolean, 
}


export default async function authenticate(options: ILoginOptions): Promise<{ fetch: any, webId?: string }> {

  let builder = new SolidFetchBuilder;

  options.idp = options.idp || options.identityprovider; // TODO:: make this not necessary :p
  options = await queryUserAuthentication(options)
   
  let authType = 'none'
  if (getConfigCurrentToken()) authType = 'token'
  else if (getConfigCurrentWebID() || options.idp) authType = 'interactive'

  if (authType === 'none') {
    return { fetch: nodeFetch }

  } else if (authType === 'token') {
    try {
      await builder.buildFromClientCredentialsToken(options)
    } catch (e) {
      if (options.verbose) writeErrorString(`Could not authenticate using client credentials token`, e);
    }

  } else if (authType === 'interactive') {

    try {
      await builder.buildInteractive(options);
    } catch (e) {
      if (options.verbose) writeErrorString(`Could not authenticate interactively`, e);
    }
  } 

  let sessionInfo = builder.getSessionInfo();
  if (!sessionInfo || !sessionInfo.fetch) {
    if (options.verbose) console.error('Continuing unauthenticated')
    return { fetch: nodeFetch }
  } else {
    return sessionInfo
  }

}

async function queryUserAuthentication(options: ILoginOptions) { 
  let currentWebID = getConfigCurrentWebID();
  if (!currentWebID && !options.idp) { 
    // Ask the user if they want to authenticate. If not, use node-fetch, else give them a prompt to provide an idp
    console.log(`Do you want to authenticate the current request? [y, N] `);
    let userWantsToAuthenticate = await new Promise((resolve, reject) => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', (chk) => {
        if (chk.toString('utf8') === "y") {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
    
    while (!options.idp && userWantsToAuthenticate) { 
      if (userWantsToAuthenticate) {
        options.idp = await getUserIdp()
      }
    }
  }
  return options
}

export async function getUserIdp() { 
  let idp;
  let webId = getConfigCurrentWebID()
  if (webId) { 
    idp = await getWebIDIdentityProvider(webId)
  }
  if (!idp) { 
    let answers = await inquirer.prompt([{ type: 'input', name: 'webid', message: 'Please provide a WebID to authenticate with.' }])
    idp = await getWebIDIdentityProvider(answers.webid.trim())
  }
  if (!idp) throw new Error('No valid WebID value provided.')
  return idp && (idp.endsWith('/') ? idp : idp + '/');
}
  
