import { writeErrorString } from './util';
const createAuthenticatedSessionInfoCSSv2 = require('../../../css/').createAuthenticatedSessionInfoCSSv2;
const createAuthenticatedSessionInfoCSSv4 = require('../../../css/').createAuthenticatedSessionInfoCSSv4;
const fs = require('fs')
const nodeFetch = require('node-fetch')

export type ILoginOptions = {
  auth?: string,
  tokenFile?: string,
  idp?: string,
  identityprovider?: string,
  email?: string,
  password?: string, 
  config?: string, 
  storage?: string, 
  silent?: boolean, 
}

export type ILoginOptionsCSSv2 = {
  silent?: boolean,
  email?: string,
  password?: string,
  idp?: string,
  config?: string,
  storage?: string,
}
export type ILoginOptionsCSSv4 = {
  silent?: boolean,
  tokenFile?: string
}
export type ILoginOptionsInteractive = {
  silent?: boolean,
  idp?: string,
  config?: string,
  storage?: string,
}

type SessionInfo = {
  session?: any,
  webId?: string,
  fetch?: Function,
}

export default async function authenticate(options: ILoginOptions) {
  let idp = options.idp || options.identityprovider; // TODO:: make this not necessary :p
  let authType = (options.auth || 'cssv4').trim().toLowerCase();

  if (authType === 'cssv2') {
    return await authenticateCSSv2({
      idp,
      email: options.email,
      password: options.password,
      config: options.config,
      storage: options.storage,
      silent: options.silent,

    })
  } else if (authType === 'cssv4') {
    return await authenticateCSSv4({
      silent: options.silent,
      tokenFile: options.tokenFile
    })
  } else if (authType === 'interactive') {
    return await authenticateInteractive({
      idp,
      config: options.config,
      storage: options.storage,
      silent: options.silent,
    });
  } else {
    throw new Error('Invalid authentication scheme. Please choose "CSSv2", "CSSv4" or "interactive" as your authentication option.')
  }
}

async function authenticateCSSv4(options: ILoginOptionsCSSv4) : Promise<SessionInfo> {

  let sessionInfo : SessionInfo = {};
  try {
    sessionInfo = await createAuthenticatedSessionInfoCSSv4(options)
  } catch (e) {
    if (!options.silent) writeErrorString('Login failed2', e)
    if (!options.silent) console.error(`Continuing unauthenticated2`)
    sessionInfo.fetch = nodeFetch;
  }
  return sessionInfo;
}


async function authenticateCSSv2(options: ILoginOptionsCSSv2) : Promise<SessionInfo> {
  let loginOptions = options;
  loginOptions.idp = loginOptions.idp;
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

  if (!loginOptions.email) {
    if (!options.silent) console.error('Cannot authenticate: Please provide an email value. Continuing unauthenticated')
  } else if (!loginOptions.password) {
    if (!options.silent) console.error('Cannot authenticate: Please provide a password value. Continuing unauthenticated')
  } else if (!loginOptions.idp) {
    if (!options.silent) console.error('Cannot authenticate: Please provide an identity provider value. Continuing unauthenticated')
  }   
  
  let sessionInfo : SessionInfo = {};
  if (loginOptions) {      
    try {
      // Login to the session provider
      sessionInfo = await createAuthenticatedSessionInfoCSSv2({ ...loginOptions, interactive: false })
      // if (!silent) console.log(`Continuing as: ${session.info.webId}`)
     
    } catch (e) {
      if (!options.silent) writeErrorString('Login failed', e)
      if (!options.silent) console.error(`Continuing unauthenticated`)
      sessionInfo.fetch = nodeFetch;
    }
  } else {
    if (!options.silent) console.error(`Continuing unauthenticated`)
    sessionInfo.fetch = nodeFetch;
  }
  return sessionInfo;
}

async function authenticateInteractive(options: ILoginOptionsInteractive) : Promise<SessionInfo> {
  let loginOptions = options;
  loginOptions.idp = loginOptions.idp;
  if (options.config) {
    try {
      let configObj = JSON.parse(fs.readFileSync(options.config, 'utf8'));
      if (configObj.idp && !loginOptions.idp) loginOptions.idp = configObj.idp;
      if (configObj.storage && !loginOptions.storage) loginOptions.storage = configObj.storage;
    } catch (e) {
      throw new Error(`Error parsing config file. Please make sure it is valid JSON: ${(<Error>e).message}`);
    }
  }

  if (!loginOptions.idp) console.error('Cannot authenticate: Please provide a valid identity provider value to login interactively, Continuing unauthenticated')
  
  let sessionInfo : SessionInfo = {};
  if (loginOptions) {      
    try {
      // Login to the session provider
      sessionInfo = await createAuthenticatedSessionInfoCSSv2({ ...loginOptions, interactive: true })
    } catch (e) {
      if (!options.silent) writeErrorString('Login failed', e)
      if (!options.silent) console.error(`Continuing unauthenticated`)
      sessionInfo.fetch = nodeFetch;
    }
  } else {
    if (!options.silent) console.error(`Continuing unauthenticated`)
    sessionInfo.fetch = nodeFetch;
  }
  return sessionInfo;
}