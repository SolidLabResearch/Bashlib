const createAuthenticatedSession = require('../../../css/').createAuthenticatedSession;
const fs = require('fs')
const nodeFetch = require('node-fetch')

export type LoginOptions = {
  silent?: boolean,
  email?: string,
  password?: string,
  identityprovider?: string,
  config: string,
}

export default async function authenticate(options: LoginOptions) {
  let silent = options.silent || false;
  let loginOptions = {
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
      if (!silent) console.error('Error parsing config file. Please make sure it is valid JSON: ', error.message)
    }
  }

  let authenticated = true;
  if (!loginOptions.email) {
    if (!silent) console.error('Cannot authenticate: Please provide an email value. Continuing without authentication')
    authenticated = false;
  } else if (!loginOptions.password) {
    if (!silent) console.error('Cannot authenticate: Please provide a password value. Continuing without authentication')
    authenticated = false;
  } else if (!loginOptions.idp) {
    if (!silent) console.error('Cannot authenticate: Please provide an identity provider value. Continuing without authentication')
    authenticated = false;
  } 

  type loginOptions = {
    session?: any,
    webId?: string,
    fetch?: Function,
  }
  let loginInfo : loginOptions = {};
  if (authenticated) {      
    // Login to the session provider
    let session = await createAuthenticatedSession(loginOptions)
    // if (!silent) console.log(`Continuing as: ${session.info.webId}`)
    loginInfo.session = session;
    loginInfo.webId = session.info.webId;
    loginInfo.fetch = session.fetch;
  } else {
    if (!silent) console.log(`Continuing unauthenticated`)
    loginInfo.fetch = nodeFetch;
  }
  return loginInfo;
}