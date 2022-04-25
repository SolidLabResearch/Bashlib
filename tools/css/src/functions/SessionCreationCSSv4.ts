import { KeyPair } from '@inrupt/solid-client-authn-core';
import { createDpopHeader, generateDpopKeyPair, buildAuthenticatedFetch } from '@inrupt/solid-client-authn-core';
import { getOIDCConfig, readSessionTokenInfo, storeSessionTokenInfo } from '../utils/util';

const nodefetch = require('node-fetch')
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
const TOKENFILE = `${SOLIDDIR}.solid-cli-credentials`
const SESSIONFILE = `${SOLIDDIR}.solid-session-info-cssv4`

export async function generateCSSv4Token(options: TokenAuthOptions){
  if (!options.idp.endsWith('/')) options.idp += '/';

  // This assumes your server is started under http://localhost:3000/.
  // This URL can also be found by checking the controls in JSON responses when interacting with the IDP API,
  // as described in the Identity Provider section.
  let url = `${options.idp}idp/credentials/`
  const response = await nodefetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    // The email/password fields are those of your account.
    // The name field will be used when generating the ID of your token.
    body: JSON.stringify({ email: options.email, password: options.password, name: options.name }),
  });
  if (!response.ok) throw new Error(`HTTP Error Response requesting ${url}: ${response.status} ${response.statusText}`);

  // These are the identifier and secret of your token.
  // Store the secret somewhere safe as there is no way to request it again from the server!

  const token = await response.json();
  if (token.errorCode) {
    throw new Error(`Error retrieving token from server: ${token.name}`)
  }
  token.webId = options.webId;
  token.idp = options.idp;

  const tokenStorageLocation = options.tokenFile || TOKENFILE;
  fs.writeFileSync(tokenStorageLocation, JSON.stringify(token, null, 2))
  return tokenStorageLocation;
}

type TokenStorageOptions = {
  idp?: string,
  tokenFile?: string,
  sessionFile?: string,
  verbose?: boolean,
}

type SessionInfo = {
  fetch: (input: RequestInfo, init?: RequestInit | undefined) => Promise<Response>
  webId?: string
}

export async function createAuthenticatedSessionInfoCSSv4(options?: TokenStorageOptions) : Promise<SessionInfo>{
  let sessionFile = options?.sessionFile || SESSIONFILE;

  try {
    if (fs.existsSync(sessionFile)) {
      let sessionInfo = await readSessionTokenInfo(sessionFile);
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
  } catch (e:any) {
    if (options?.verbose) console.error(`Could not load existing session: ${e.message}`)
  }
  try {
    return createFetchWithNewAccessToken(options);
  } catch (e: any) {
    if (options?.verbose) console.error(`Could not create new session: ${e.message}`)
    return { fetch: nodefetch}
  }
}

async function createFetchWithNewAccessToken(options?: TokenStorageOptions): Promise<SessionInfo>{
 let tokenStorageLocation = options?.tokenFile || TOKENFILE;
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

  let { accessToken, expirationDate } = await requestAccessToken(id, secret, dpopKey, options);

  let sessionFile = options?.sessionFile || SESSIONFILE;
  await storeSessionTokenInfo(sessionFile, accessToken, dpopKey, expirationDate, webId, idp)
  let fetch = await buildAuthenticatedFetch(nodefetch, accessToken, { dpopKey });

  return { fetch, webId }
}

async function requestAccessToken(id: string, secret: string, dpopKey: KeyPair, options: TokenStorageOptions) {

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
  if (!response.ok) throw new Error(`HTTP Error Response requesting ${tokenUrl}: ${response.status} ${response.statusText}`);

  // This is the Access token that will be used to do an authenticated request to the server.
  // The JSON also contains an "expires_in" field in seconds, 
  // which you can use to know when you need request a new Access token.
  let json = await response.json();
  let accessToken = json.access_token;
  let tokenExpiratationInSeconds = json.expires_in;
  
  let currentDate = new Date();
  let expirationDate = new Date(currentDate.getTime() + (1000 * tokenExpiratationInSeconds))
  return { accessToken, expirationDate } ;
}
