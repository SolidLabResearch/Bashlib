import createAuthenticatedSession from "../../../packages/css/css-login/dist";
import { getSolidDataset } from '@inrupt/solid-client';

const nodeFetch = require('node-fetch')

const fs = require('fs');

export default async function getAuthenticatedSessionFromCredentials (options: any) : Promise<any> {
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
      if (configObj.dir) options.dir = configObj.dir
    } catch (error) {
      console.error('Error parsing config file. Please make sure it is valid JSON: ', error.message)
      process.exit()
    }
  }

  let authenticated = true;
  if (!loginOptions.email) {
    console.error('Cannot authenticate: Please provide an email value. Continuing without authentication')
    authenticated = false;
  } if (!loginOptions.password) {
    console.error('Cannot authenticate: Please provide a password value. Continuing without authentication')
    authenticated = false;
  } if (!loginOptions.idp) {
    console.error('Cannot authenticate: Please provide an identity provider value. Continuing without authentication')
    authenticated = false;
  } 

  options.authenticated = authenticated

  let session;

  if (authenticated) {    
    // Create authenticated solid session
    session = await createAuthenticatedSession(loginOptions);
    console.log('Start shell in authenticated mode for', session.info.webId)

  } else {
    console.log('Start shell in unauthenticated mode.')
    session = {
      fetch: nodeFetch,
      info: {
        isLoggedIn: false,
        sessionId: null,
        webId: null
      }
    }
  }
  return session
}

export async function getUserName(webId: string, fetch: Function) {
  let dataset = await getSolidDataset()
}