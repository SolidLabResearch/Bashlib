import { KeyPair } from '@inrupt/solid-client-authn-core';
import { createDpopHeader, generateDpopKeyPair, buildAuthenticatedFetch } from '@inrupt/solid-client-authn-core';
import { decodeIdToken, getOIDCConfig, readSessionTokenInfo, storeSessionTokenInfo, writeErrorString } from '../utils/authenticationUtils';
import { getConfigCurrentToken, getConfigCurrentSession } from '../utils/configoptions';
import { IClientCredentialsTokenAuthOptions, SessionInfo } from './CreateFetch';
import BashlibError from '../utils/errors/BashlibError';
import { BashlibErrorMessage } from '../utils/errors/BashlibError';

const nodefetch = require('node-fetch')
const fs = require('fs')


export async function authenticateWithTokenFromJavascript(token: {id: string, secret: string}, idp: string) : Promise<SessionInfo>{
  if (!token) throw new BashlibError(BashlibErrorMessage.noValidToken)
  let id = token.id;
  let secret = (token as any).secret;
  if (!id || !secret) throw new BashlibError(BashlibErrorMessage.noValidToken)
  
  // A key pair is needed for encryption.
  // This function from `solid-client-authn` generates such a pair for you.
  const dpopKey = await generateDpopKeyPair();

  let { accessToken, expirationDate, webId } = await requestAccessToken(id, secret, dpopKey, { idp });

  let fetch = await buildAuthenticatedFetch(nodefetch, accessToken, { dpopKey });

  return { fetch, webId }
}


export async function authenticateToken(options?: IClientCredentialsTokenAuthOptions) : Promise<SessionInfo>{

  let session = getConfigCurrentSession();
  let token = getConfigCurrentToken();
  try {
    // If user switches token, cannot reuse older session.
    if (session && (!token || token.idp === session.idp)) {
      let sessionInfo = await readSessionTokenInfo();
      if (sessionInfo) {
        var tokenTimeLeftInSeconds = (sessionInfo.expirationDate.getTime() - new Date().getTime()) / 1000;
        if (tokenTimeLeftInSeconds > 60) {
          // Only reuse previous session tokens if we have enough time to work with, else continue to create a new access token.
          let fetch = await buildAuthenticatedFetch(nodefetch, sessionInfo.accessToken, { dpopKey: sessionInfo.dpopKey });
          let webId = sessionInfo.webId;
          return { fetch, webId }
        }
      }
    }
  } catch (e) {
    if (options?.verbose) writeErrorString('Could not load existing session', e);
  }
  try {
    return createFetchWithNewAccessToken(options);
  } catch (e) {
    if (options?.verbose) writeErrorString('Could not create new session', e);
    return { fetch: nodefetch}
  }
}

async function createFetchWithNewAccessToken(options?: IClientCredentialsTokenAuthOptions): Promise<SessionInfo>{
  let token = getConfigCurrentToken();
  if (!token) throw new BashlibError(BashlibErrorMessage.noValidToken)
  let id = token.id;
  let secret = (token as any).secret;
  let idp = token.idp; // We stored this cheekily in the token file
  if (!id || !secret) throw new BashlibError(BashlibErrorMessage.noValidToken)
  
  // A key pair is needed for encryption.
  // This function from `solid-client-authn` generates such a pair for you.
  const dpopKey = await generateDpopKeyPair();

  if (!options) { options = { idp }}
  else if (!options.idp) options.idp = idp;

  let { accessToken, expirationDate, webId } = await requestAccessToken(id, secret, dpopKey, options);

  await storeSessionTokenInfo(accessToken, dpopKey, expirationDate, webId, idp)
  let fetch = await buildAuthenticatedFetch(nodefetch, accessToken, { dpopKey });

  return { fetch, webId }
}

export async function requestAccessToken(id: string, secret: string, dpopKey: KeyPair, options: IClientCredentialsTokenAuthOptions) {

  // TODO:: other possibility to pass idp here not only store in session obj
  let tokenUrl = options.idp
    ? (await getOIDCConfig(options.idp)).token_endpoint
    : `${options.idp}.oidc/token`;

  // These are the ID and secret generated in the previous step.
  // Both the ID and the secret need to be form-encoded.
  const authString = `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`;
  // This URL can be found by looking at the "token_endpoint" field at
  // http://localhost:3000/.well-known/openid-configuration
  // if your server is hosted at http://localhost:3000/.

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      // The header needs to be in base64 encoding.
      authorization: `Basic ${Buffer.from(authString).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded',
      dpop: await createDpopHeader(tokenUrl, 'POST', dpopKey),
    },
    body: 'grant_type=client_credentials&scope=webid',
  });
  if (!response.ok) 
    throw new BashlibError(BashlibErrorMessage.httpResponseError, tokenUrl, `${response.status} ${response.statusText}`)

  // This is the Access token that will be used to do an authenticated request to the server.
  // The JSON also contains an "expires_in" field in seconds, 
  // which you can use to know when you need request a new Access token.
  let json = await response.json();
  let accessToken = json.access_token;
  let tokenExpiratationInSeconds = json.expires_in;
  
  let currentDate = new Date();
  let expirationDate = new Date(currentDate.getTime() + (1000 * tokenExpiratationInSeconds))

  let idTokenInfo = decodeIdToken(json.access_token);
  let webId = idTokenInfo.webid;
  if (!idTokenInfo || !webId)
    throw new BashlibError(BashlibErrorMessage.authFlowError, undefined, 'Invalid id token received')
  
  return { accessToken, expirationDate, webId } ;
}
