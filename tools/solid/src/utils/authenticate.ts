import { writeErrorString } from './util';
const SolidFetchBuilder = require('../../../css/').SolidFetchBuilder;
const fs = require('fs')
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


export default async function authenticate(options: ILoginOptions) {

  let builder = new SolidFetchBuilder;

  options.idp = options.idp || options.identityprovider; // TODO:: make this not necessary :p
  let authType = (options.auth || 'token').trim().toLowerCase();

  if (authType === 'unauthenticated') {
    return { fetch: nodeFetch }
    
  } else if (authType === 'credentials') {
    try {
      options = createClientCredentialsAuthOptions(options);
      await builder.buildFromClientCredentials(options)
    } catch (e: any) {
      if (options.verbose) console.error(`Could not authenticate using client credentials: ${e.message}`)
    }
    
  } else if (authType === 'token') {
    try {
      await builder.buildFromClientCredentialsToken(options)
    } catch (e: any) {
      if (options.verbose) console.error(`Could not authenticate using client credentials token: ${e.message}`)
    }

  } else if (authType === 'interactive') {
    try {
      options = createInteractiveAuthOptions(options);
      await builder.buildInteractive(options);
    } catch (e: any) {
      if (options.verbose) console.error(`Could not authenticate interactively: ${e.message}`)
    }
  } else {
    throw new Error('Invalid authentication scheme. Please choose "credentials", "token" or "interactive" as your authentication option.')
  }

  let sessionInfo = builder.getSessionInfo();
  if (!sessionInfo || !sessionInfo.fetch) {
    if (options.verbose) console.error('Continuing unauthenticated')
    return { fetch: nodeFetch}
  } else {
    return sessionInfo
  }

}

function createClientCredentialsAuthOptions(options: ILoginOptions) {
  if (options.config) {
    try {
      let configObj = JSON.parse(fs.readFileSync(options.config, 'utf8'));
      if (configObj.email && !options.email) options.email = configObj.email;
      if (configObj.password && !options.password) options.password = configObj.password;
      if (configObj.idp && !options.idp) options.idp = configObj.idp;
      if (configObj.storage && !options.sessionInfoStorageLocation) 
        options.sessionInfoStorageLocation = configObj.sessionInfoStorageLocation;
    } catch (e) {
      throw new Error(`Error parsing config file. Please make sure it is valid JSON: ${(<Error>e).message}`);
    }
  }

  if (!options.email) {
    throw new Error('No valid email value given.')
  } else if (!options.password) {
    throw new Error('No valid password value given')
  } else if (!options.idp) {
    throw new Error('No valid identity provider value given.')
  }   
  
  return options;
}

function createInteractiveAuthOptions(options: ILoginOptions) {
  if (options.config) {
    try {
      let configObj = JSON.parse(fs.readFileSync(options.config, 'utf8'));
      if (configObj.idp && !options.idp) options.idp = configObj.idp;
      if (configObj.sessionInfoStorageLocation && !options.sessionInfoStorageLocation) 
        options.sessionInfoStorageLocation = configObj.sessionInfoStorageLocation;
    } catch (e) {
      throw new Error(`Error parsing config file. Please make sure it is valid JSON: ${(<Error>e).message}`);
    }
  }
  if (!options.idp) throw new Error('No valid identity provider value given.')
  return options;
}