import BashlibError from '../utils/errors/BashlibError';
import { BashlibErrorMessage } from '../utils/errors/BashlibError';

const express = require('express')

export interface ICSSClientCredentialsTokenGenerationOptions {
  name: string,
  email: string,
  password: string,
  idp: string,
  webId?: string,
}

export interface IInruptClientCredentialsTokenGenerationOptions {
  id: string,
  secret: string,
  idp: string,
  webId?: string,
}


export type InruptToken = {
  id: string,
  secret: string,
  idp: string,
}

export type CSSToken = {
  id: string,
  secret: string,
  controls: any,
  name: string,
  idp: string,
  email: string,
}

import crossfetch from 'cross-fetch';

export async function generateCSSToken(options: ICSSClientCredentialsTokenGenerationOptions) {
  return generateCSSTokenVersion7(options)
}

export async function generateCSSTokenVersion7(options: ICSSClientCredentialsTokenGenerationOptions) {

  if (!options.idp) throw new BashlibError(BashlibErrorMessage.noIDPOption)
  if (!options.webId) throw new BashlibError(BashlibErrorMessage.noWebIDOption)
  
  // For CSS we expect the IDP to be the CSS server.
  // No plans to support external IDPs, as they probably do not support this custom token generation anyways?
  if (!options.idp.endsWith('/')) options.idp += '/';
  let url = `${options.idp}.account/`
  
  // All these examples assume the server is running at `http://localhost:3000/`.
  // First we request the account API controls to find out where we can log in
  const indexResponse = await fetch(url);
  const { controls } = await indexResponse.json();

  // And then we log in to the account API
  const response = await crossfetch(controls.password.login, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: options.email, password: options.password }),
  });
  // This authorization value will be used to authenticate in the next step
  const { authorization } = await response.json();

  // Now that we are logged in, we need to request the updated controls from the server.
  // These will now have more values than in the previous example.
  const indexResponse2 = await fetch(url, {
    headers: { authorization: `CSS-Account-Token ${authorization}` }
  });
  const controls2 = (await indexResponse2.json()).controls;
  // Here we request the server to generate a token on our account
  const response2 = await fetch(controls2.account.clientCredentials, {
    method: 'POST',
    headers: { authorization: `CSS-Account-Token ${authorization}`, 'content-type': 'application/json' },
    // The name field will be used when generating the ID of your token.
    // The WebID field determines which WebID you will identify as when using the token.
    // Only WebIDs linked to your account can be used.
    body: JSON.stringify({ name: options.name, webId: options.webId }),
  });

  // These are the identifier and secret of your token.
  // Store the secret somewhere safe as there is no way to request it again from the server!
  // The `resource` value can be used to delete the token at a later point in time.
  const { id, secret, resource } = await response2.json();

  const token = {
    controls: controls2,
    id: id,
    secret: secret,
    name: options.name,
    email: options.email,
    idp: options.idp,
  } as CSSToken

  return token;
}

export async function generateCSSTokenVersion6(options: ICSSClientCredentialsTokenGenerationOptions) {
  
  if (!options.idp) throw new BashlibError(BashlibErrorMessage.noIDPOption)
  
  if (!options.idp.endsWith('/')) options.idp += '/';

  // This assumes your server is started under http://localhost:3000/.
  // This URL can also be found by checking the controls in JSON responses when interacting with the IDP API,
  // as described in the Identity Provider section.
  let url = `${options.idp}idp/credentials/`
  const response = await crossfetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    // The email/password fields are those of your account.
    // The name field will be used when generating the ID of your token.
    body: JSON.stringify({ email: options.email, password: options.password, name: options.name }),
  });
  if (!response.ok) 
    throw new BashlibError(BashlibErrorMessage.httpResponseError, url, `${response.status} ${response.statusText}`)

  // These are the identifier and secret of your token.
  // Store the secret somewhere safe as there is no way to request it again from the server!

  const token = await response.json();
  if (token.errorCode) {
    throw new BashlibError(BashlibErrorMessage.authFlowError, undefined, `Error retrieving token from server: ${token.name}`)
  }
  token.name = options.name;
  token.email = options.email;
  token.idp = options.idp;

  return token as CSSToken;
}


export function generateInruptToken(options: IInruptClientCredentialsTokenGenerationOptions): InruptToken {

  return {
    id: options.id,
    secret: options.secret,
    idp: options.idp
  }
}