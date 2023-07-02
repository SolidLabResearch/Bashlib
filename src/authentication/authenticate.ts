import SolidFetchBuilder from './CreateFetch';
import { getWebIDIdentityProvider, writeErrorString } from '../utils/util';
import inquirer from 'inquirer';
import { getConfigCurrentWebID, getConfigCurrentToken } from '../utils/configoptions';
import type { Logger } from '../logger';
import crossfetch from 'cross-fetch';

export interface ILoginOptions {
  auth?: string,
  idp?: string,
  identityprovider?: string,
  email?: string,
  password?: string, 
  config?: string, 
  sessionInfoStorageLocation?: string, 
  verbose?: boolean,
  logger?: Logger,
}


export default async function authenticate(options: ILoginOptions): Promise<{ fetch: any, webId?: string }> {
  let builder = new SolidFetchBuilder;

  options.idp = options.idp || options.identityprovider; // TODO:: make this not necessary :p
  
  let authType = options.auth

  if (!authType) { 
    if (getConfigCurrentToken()) authType = "token"
    // Try to authenticate interactively
    else if (getConfigCurrentWebID() || options.idp) authType = "interactive"
    // Ask user for IDP to authenticate interactively
    else authType = "request"
  }

  if (authType === "request") { 
    const userWantsToAuthenticate = await queryUserAuthentication();
    if (userWantsToAuthenticate) {
      const idp = await getUserIdp()
      options.idp = idp
      authType = "interactive"
    } else { 
      authType = "none"
    }
  }

  switch (authType) {
    case "none":
      return { fetch: crossfetch }
  
    case "token":
      try {
        await builder.buildFromClientCredentialsToken(options)
      } catch (e) {
        if (options.verbose) writeErrorString(`Could not authenticate using client credentials token`, e, options);
        throw new Error("Could not authenticate using client credentials token") // TODO:: do this concretely
      }      
      break;
    
    case "interactive":
      try {
        await builder.buildInteractive(options);
      } catch (e) {
        if (options.verbose) writeErrorString(`Could not authenticate interactively`, e, options);
        throw new Error("Could not authenticate interactively") // TODO:: do this concretely
      }
      break;
    
    default:
      throw new Error(`Unknown authentication type: ${authType}`);
  }
  
  let sessionInfo = builder.getSessionInfo();
  if (!sessionInfo || !sessionInfo.fetch) {
    console.error('Continuing unauthenticated')
    return { fetch: crossfetch }
  } else {
    return sessionInfo
  }

}

async function queryUserAuthentication() { 
  // Ask the user if they want to authenticate. If not, use cross-fetch, else give them a prompt to provide an idp
  console.log(`Do you want to authenticate the current request? [Y, n] `);
  let userWantsToAuthenticate : boolean = await new Promise((resolve, reject) => {
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
  return userWantsToAuthenticate
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
  
