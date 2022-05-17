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
  let DEFAULTAUTHOPTION = 'none'

  options.idp = options.idp || options.identityprovider; // TODO:: make this not necessary :p
  let authType = (options.auth || DEFAULTAUTHOPTION).trim().toLowerCase();

  if (authType === 'none') {
    return { fetch: nodeFetch }
    
  } else if (authType === 'credentials') {
    try {
      options = checkClientCredentialsAuthOptions(options);
      await builder.buildFromClientCredentials(options)
    } catch (e) {

      if (options.verbose) writeErrorString(`Could not authenticate using client credentials`, e);
    }
    
  } else if (authType === 'token') {
    try {
      await builder.buildFromClientCredentialsToken(options)
    } catch (e) {
      if (options.verbose) writeErrorString(`Could not authenticate using client credentials token`, e);
    }

  } else if (authType === 'interactive') {
    try {
      options = checkInteractiveAuthOptions(options);
      await builder.buildInteractive(options);
    } catch (e) {
      if (options.verbose) writeErrorString(`Could not authenticate interactively`, e);
    }
  } else {
    throw new Error('Invalid authentication scheme. Please choose "credentials", "token", "interactive" or "none" as your authentication option.')
  }

  let sessionInfo = builder.getSessionInfo();
  if (!sessionInfo || !sessionInfo.fetch) {
    if (options.verbose) console.error('Continuing unauthenticated')
    return { fetch: nodeFetch}
  } else {
    return sessionInfo
  }

}

function checkClientCredentialsAuthOptions(options: ILoginOptions) {
   if (!options.email) {
    throw new Error('No valid email value given.')
  } else if (!options.password) {
    throw new Error('No valid password value given')
  } else if (!options.idp) {
    throw new Error('No valid identity provider value given.')
  }   
  return options;
}

function checkInteractiveAuthOptions(options: ILoginOptions) {
  if (!options.idp) throw new Error('No valid identity provider value given.')
  return options;
}