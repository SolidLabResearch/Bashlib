import { KeyPair } from '@inrupt/solid-client-authn-core';
import { createDpopHeader, generateDpopKeyPair, buildAuthenticatedFetch } from '@inrupt/solid-client-authn-core';
import authenticatedFetch from '../../../solid/dist/commands/solid-fetch';
const fetch = require('node-fetch')
const fs = require('fs')

type TokenAuthOptions = {
  name: string,
  email: string,
  password: string,
  webId: string,
  idp: string,
  tokenFile?: string,
}

const homedir = require('os').homedir();
const SOLIDDIR = `${homedir}/.solid/`
const CREDENTIALSFILE = `${SOLIDDIR}.solid-cli-credentials`

export async function generateCSSv4Token(options: TokenAuthOptions){
  if (!options.idp.endsWith('/')) options.idp += '/';

  // This assumes your server is started under http://localhost:3000/.
  // This URL can also be found by checking the controls in JSON responses when interacting with the IDP API,
  // as described in the Identity Provider section.
  const response = await fetch(`${options.idp}idp/credentials/`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    // The email/password fields are those of your account.
    // The name field will be used when generating the ID of your token.
    body: JSON.stringify({ email: options.email, password: options.password, name: options.name }),
  });

  // These are the identifier and secret of your token.
  // Store the secret somewhere safe as there is no way to request it again from the server!

  const token = await response.json();
  if (token.errorCode) {
    throw new Error(`Error retrieving token from server: ${token.name}`)
  }
  token.webId = options.webId;
  token.idp = options.idp;

  const tokenStorageLocation = options.tokenFile || CREDENTIALSFILE;
  fs.writeFileSync(tokenStorageLocation, JSON.stringify(token, null, 2))
  return tokenStorageLocation;
}

type TokenStorageOptions = {
  idp: string,
  tokenFile?: string,
}

type SessionInfo = {
  fetch: (input: RequestInfo, init?: RequestInit | undefined) => Promise<Response>
  webId?: string
}

export async function createAuthenticatedSessionInfoCSSv4(options?: TokenStorageOptions) : Promise<SessionInfo>{
  let tokenStorageLocation = options?.tokenFile || CREDENTIALSFILE;
  if (!tokenStorageLocation) throw new Error('Could not discover existing token location.');
  let parsed = JSON.parse(fs.readFileSync(tokenStorageLocation));
  let id = parsed.id;
  let secret = parsed.secret;
  let webId = parsed.webId;
  let idp = parsed.idp; // We stored this cheekily in the token file
  if (!id || !secret) throw new Error('Could not discover valid authentication token.')
  
  // A key pair is needed for encryption.
  // This function from `solid-client-authn` generates such a pair for you.
  const dpopKey = await generateDpopKeyPair();

  if (!options) { options = { idp }}
  else if (!options.idp) options.idp = idp;

  let accessToken = await requestAccessToken(id, secret, dpopKey, options);
  let fetch = await buildFetch(accessToken, dpopKey);

  return { fetch, webId }
}

async function requestAccessToken(id: string, secret: string, dpopKey: KeyPair, options: TokenStorageOptions) {

  // These are the ID and secret generated in the previous step.
  // Both the ID and the secret need to be form-encoded.
  const authString = `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`;
  // This URL can be found by looking at the "token_endpoint" field at
  // http://localhost:3000/.well-known/openid-configuration
  // if your server is hosted at http://localhost:3000/.
  const tokenUrl = `${options.idp}.oidc/token`;
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

  // This is the Access token that will be used to do an authenticated request to the server.
  // The JSON also contains an "expires_in" field in seconds, 
  // which you can use to know when you need request a new Access token.
  const { access_token: accessToken } = await response.json();
  return accessToken;
}

async function buildFetch(accessToken: string, dpopKey: KeyPair) {
  // The DPoP key needs to be the same key as the one used in the previous step.
  // The Access token is the one generated in the previous step.
  return await buildAuthenticatedFetch(fetch, accessToken, { dpopKey });
}