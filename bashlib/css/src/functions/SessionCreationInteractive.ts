import { getOIDCConfig, getSessionInfoFromStorage, StorageHandler, OIDCConfig, readSessionTokenInfo, storeSessionTokenInfo, decodeIdToken, writeErrorString } from '../utils/util';
import { generateDpopKeyPair, KeyPair, createDpopHeader, buildAuthenticatedFetch } from '@inrupt/solid-client-authn-core';
import formurlencoded from 'form-urlencoded';
import { Session } from '@inrupt/solid-client-authn-node';
import open from 'open';
import fs from 'fs';
import { SessionInfo, IInteractiveAuthOptions, DEFAULTPORT, APPNAME } from './CreateFetch';

const nodefetch = require("node-fetch")
const express = require('express')
const homedir = require('os').homedir();
const SOLIDDIR = `${homedir}/.solid/`
const SESSIONINFOSTORAGELOCATION = `${SOLIDDIR}.session-info-interactive`

export default async function createAuthenticatedSessionInteractive(options: IInteractiveAuthOptions) : Promise<SessionInfo> {
  let sessionInfoStorageLocation = options?.sessionInfoStorageLocation || SESSIONINFOSTORAGELOCATION;

  try {
    if (fs.existsSync(sessionInfoStorageLocation)) {
      let sessionInfo = await readSessionTokenInfo(sessionInfoStorageLocation);
      if (options.idp && (!sessionInfo.idp || sessionInfo.idp !== options.idp )) throw new Error('Falling back on interactive login as stored session idp does not match current value')
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
  
  if (!options.idp) throw new Error('Cannot login: no identity provider value given.')
  let appName = APPNAME
  let port = options.port || DEFAULTPORT

  try {
    return await createFetchWithNewAccessToken(options.idp, appName, port, sessionInfoStorageLocation)
  } catch (e) {
    if (options?.verbose) writeErrorString('Error creating new session', e);
    return { fetch: nodefetch }
  }
  

}

/**
 * Handle login flow if no existing session can be reused
 * @param oidcIssuer 
 * @param appName 
 * @param port 
 * @param storageLocation 
 * @returns 
 */
async function createFetchWithNewAccessToken(oidcIssuer: string, appName: string, port: number, sessionInfoStorageLocation: string) : Promise<SessionInfo> {
  return new Promise( async (resolve, reject) => {
    const config = await getOIDCConfig(oidcIssuer);
    if (!config) reject(new Error("Could not read oidc config"));

    const app = express();
    const redirectUrl = `http://localhost:${port}/`;
    const storage = new StorageHandler();
    
    let session : Session = new Session({
      insecureStorage: storage,
      secureStorage: storage,
    });
    const handleRedirect = (url: string) => { open(url) }

    const server = app.listen(port, async () => {  
      const loginOptions = {
        clientName: appName,
        oidcIssuer,
        redirectUrl,
        tokenType: "DPoP" as "DPoP", // typescript fix
        handleRedirect,
      };
      await session.login(loginOptions)
    });
    
    app.get("/", async (_req: any, res: any) => {
      
      const code = new URL(_req.url, redirectUrl).searchParams.get('code');
      if (!code) throw new Error('No code parameter received in authentication flow.')
      let { accessToken, expirationDate, dpopKey, webId } = await handleIncomingRedirect(oidcIssuer, redirectUrl, code, storage)


      storeSessionTokenInfo(sessionInfoStorageLocation, accessToken, dpopKey, expirationDate, webId, oidcIssuer)
      let fetch = await buildAuthenticatedFetch(nodefetch, accessToken, { dpopKey });

      server.close();
      resolve({
        fetch, webId
      })
    });
  })
}



/**
 * Handles incoming redirect request and returns relevant access token info extracted.
 * @param idp 
 * @param redirectUrl 
 * @param code 
 * @param storage 
 * @returns 
 */
async function handleIncomingRedirect(idp: string, redirectUrl: string, code: string, storage: StorageHandler) {
  let config = await getOIDCConfig(idp)
  let dpopKey = await generateDpopKeyPair();
  let sessionInfo = await getSessionInfoFromStorage(storage);
  if (!sessionInfo || !sessionInfo.clientId || !sessionInfo.clientSecret || !(sessionInfo as any).codeVerifier) throw new Error('Could not create an authenticated session.')

  return await requestAccessToken({
    dpopKey,
    code,
    codeVerifier: (sessionInfo as any).codeVerifier,
    clientId: sessionInfo.clientId,
    clientSecret: sessionInfo.clientSecret,
    redirectUrl,
    config,
  })

}


async function requestAccessToken(p: {
      dpopKey: KeyPair, 
      code: string, 
      codeVerifier: string, 
      clientId: string, 
      clientSecret: string, 
      redirectUrl: string
      config: OIDCConfig
    }) : Promise<{ accessToken: string, expirationDate: Date, dpopKey: KeyPair, webId: string }>
  {

 
  const authString = `${encodeURIComponent(p.clientId)}:${encodeURIComponent(p.clientSecret)}`;

  const response = await fetch(p.config.token_endpoint, {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(authString).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded',
      dpop: await createDpopHeader(p.config.token_endpoint, 'POST', p.dpopKey),
    },
    body: formurlencoded({
      grant_type: 'authorization_code',
      redirect_uri: p.redirectUrl,
      code: p.code,
      code_verifier: p.codeVerifier,
      client_id: p.clientId,
    }),
  });

  let json = await response.json()
  if (json.error) {
    throw new Error(`Could not retrieve access token: ${json.error} - ${json.error_description}`)
  }

  let accessToken = json.access_token;
  let tokenExpiratationInSeconds = json.expires_in;

  let currentDate = new Date();
  let expirationDate = new Date(currentDate.getTime() + (1000 * tokenExpiratationInSeconds))

  let idTokenInfo = decodeIdToken(json.id_token);
  let webId = idTokenInfo.webid;
  if (!idTokenInfo || !webId) throw new Error('Invalid id token received')

  return { accessToken, expirationDate, dpopKey: p.dpopKey, webId };
}