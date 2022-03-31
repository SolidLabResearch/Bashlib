import { writeErrorString } from './util';
const createAuthenticatedSession = require('../../../css/').createAuthenticatedSession;
const fs = require('fs')
const nodeFetch = require('node-fetch')

export type LoginOptions = {
  silent?: boolean,
  email?: string,
  password?: string,
  interactive?: boolean,
  identityprovider?: string,
  config?: string,
}

type authenticateFuncParams = {
  idp?: string,
  email?: string,
  password?: string,
  interactive?: boolean,
}


export default async function authenticate(options: LoginOptions) {
  let loginOptions : authenticateFuncParams = {};
  if ( options.config || (options.identityprovider && options.email && options.password) ) {
    loginOptions = {
      idp: options.identityprovider,
      email: options.email,
      password: options.password,
    }
    if (options.config) {
      try {
        let configObj = JSON.parse(fs.readFileSync(options.config, 'utf8'));
        if (configObj.email) loginOptions.email = configObj.email
        if (configObj.password) loginOptions.password = configObj.password
        if (configObj.idp) loginOptions.idp = configObj.idp
      } catch (error: any) {
        throw new Error(`Error parsing config file. Please make sure it is valid JSON: ${error.message}`);
      }
    }
  } if (options.interactive) {
    loginOptions = { 
      ...loginOptions,
      interactive: true,
    }
    if (options.identityprovider) loginOptions.idp = options.identityprovider
  } 

  if (loginOptions.interactive) {
    if (!loginOptions.idp) console.error('Cannot authenticate: Please provide a valid identity provider value to login interactively, Continuing unauthenticated')
  } else {
    if (!loginOptions.email) {
      if (!options.silent) console.error('Cannot authenticate: Please provide an email value. Continuing unauthenticated')
    } else if (!loginOptions.password) {
      if (!options.silent) console.error('Cannot authenticate: Please provide a password value. Continuing unauthenticated')
    } else if (!loginOptions.idp) {
      if (!options.silent) console.error('Cannot authenticate: Please provide an identity provider value. Continuing unauthenticated')
    }   
  }
  
  type loginInfo = {
    session?: any,
    webId?: string,
    fetch?: Function,
  }
  let loginInfo : loginInfo = {};
  if (loginOptions) {      
    // Login to the session provider
    let session = await createAuthenticatedSession(loginOptions)
    // if (!silent) console.log(`Continuing as: ${session.info.webId}`)
    loginInfo.session = session;
    loginInfo.webId = session.info.webId;
    loginInfo.fetch = session.fetch;
  } else {
    if (!options.silent) console.log(`Continuing unauthenticated`)
    loginInfo.fetch = nodeFetch;
  }
  return loginInfo;
}