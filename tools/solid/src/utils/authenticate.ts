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
  idp?: string,
  config?: string,
  storage?: string,
}

export default async function authenticate(options: LoginOptions) {
  let loginOptions = options;
  loginOptions.idp = loginOptions.identityprovider;
  if (options.config) {
    try {
      let configObj = JSON.parse(fs.readFileSync(options.config, 'utf8'));
      if (configObj.email && !loginOptions.email) loginOptions.email = configObj.email;
      if (configObj.password && !loginOptions.password) loginOptions.password = configObj.password;
      if (configObj.idp && !loginOptions.idp) loginOptions.idp = configObj.idp;
      if (configObj.storage && !loginOptions.storage) loginOptions.storage = configObj.storage;
    } catch (e) {
      throw new Error(`Error parsing config file. Please make sure it is valid JSON: ${(<Error>e).message}`);
    }
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
    try {
      // Login to the session provider
      let session = await createAuthenticatedSession(loginOptions)
      // if (!silent) console.log(`Continuing as: ${session.info.webId}`)
      loginInfo.session = session;
      loginInfo.webId = session.info.webId;
      loginInfo.fetch = session.fetch;
    } catch (e) {
      if (!options.silent) writeErrorString('Login failed', e)
      if (!options.silent) console.error(`Continuing unauthenticated`)
      loginInfo.fetch = nodeFetch;
    }
  } else {
    if (!options.silent) console.error(`Continuing unauthenticated`)
    loginInfo.fetch = nodeFetch;
  }
  return loginInfo;
}