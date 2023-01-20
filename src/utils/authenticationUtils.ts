import fs from 'fs';
import path from 'path'
import { KeyPair } from '@inrupt/solid-client-authn-core';
import { KeyLike, JWK, importJWK, exportJWK } from 'jose';
import jwt_decode from 'jwt-decode';
import { randomUUID } from 'crypto';
import { setConfigSession, getConfigCurrentSession } from './configoptions';
import crossfetch from 'cross-fetch';

export type SessionInfo = {
  fetch: typeof fetch
  webId?: string
}

export type OIDCConfig = {
  authorization_endpoint: string,
  claims_parameter_supported: true,
  claims_supported: string[],
  code_challenge_methods_supported: string[],
  end_session_endpoint: string,
  grant_types_supported: string[],
  id_token_signing_alg_values_supported: string[],
  issuer: string,
  jwks_uri: string,
  registration_endpoint: string,
  response_modes_supported: string[],
  response_types_supported: string[],
  scopes_supported: string[],
  subject_types_supported: string[],
  token_endpoint_auth_methods_supporte: string[],
  token_endpoint_auth_signing_alg_values_supported: string[],
  token_endpoint: string,
  request_object_signing_alg_values_supported: string[],
  request_parameter_supported: boolean,
  request_uri_parameter_supported: boolean,
  require_request_uri_registration: boolean,
  userinfo_endpoint: string,
  userinfo_signing_alg_values_supported: string[],
  introspection_endpoint: string,
  introspection_endpoint_auth_methods_supported: string[],
  introspection_endpoint_auth_signing_alg_values_supported: string[],
  dpop_signing_alg_values_supported: string[],
  revocation_endpoint: string,
  revocation_endpoint_auth_methods_supported: string[],
  revocation_endpoint_auth_signing_alg_values_supported: string[],
  claim_types_supported: string[],
  solid_oidc_supported: string,
}

export async function getOIDCConfig(idp: string): Promise<OIDCConfig> {
  try {
    idp = idp.endsWith('/') ? idp : idp + '/';
    let oidclocation = idp + '.well-known/openid-configuration'
    let res = await crossfetch(oidclocation)
    if (!res.ok) throw new Error(`HTTP Error Response requesting ${oidclocation}: ${res.status} ${res.statusText}`);
    let json = await res.json();
    return json;
  } catch (e) {
    let message = (e instanceof Error) ? e.message : String(e);
    throw new Error(`Could not find OIDC config of user: ${message}`)
  }
}

export function ensureDirectoryExistence(filePath: string) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}


type ISessionInformation = {
  clientId?: string,
  idTokenSignedResponseAlg?: string,
  clientSecret?: string,
  issuer?: string,
  redirectUrl?: string,
  dpop?: string,
  refreshToken?: string,
  webId?: string,
  isLoggedIn?: string,
  publicKey?: string,
  privateKey?: string,
  sessionId?: string,
}

export async function getSessionInfoFromStorage(storage: StorageHandler) : Promise<ISessionInformation | undefined> {
  let foundSessionInfo : ISessionInformation | undefined;
  
  let sessions = await storage.get('solidClientAuthn:registeredSessions')
  if (sessions) {
    let parsedSessionObjects = JSON.parse(sessions) 
    for (let sessionNumber of parsedSessionObjects || []) {
      let sessionInfo: any = await storage.get(`solidClientAuthenticationUser:${sessionNumber}`)
      if (sessionInfo) {
        foundSessionInfo = JSON.parse(sessionInfo) as ISessionInformation
        foundSessionInfo.sessionId = sessionNumber
      }
    }
  }
  return foundSessionInfo 
}

export class StorageHandler {
  map: Map<string, string>;
  constructor() {
    this.map = new Map()
  }
  public get = async (key: string) : Promise<string | undefined> => {
    return this.map.get(key)
  }
  public set = async (key: string, value: string) : Promise<void> => {
    this.map.set(key, value)
    return
  }
  public delete = async (key: string) : Promise<void> => {
    this.map.delete(key)
  }

  public async writeToFile(filePath: string) {
    // TODO:: FIx this encoding sequence. This is POC
    // let PASSPHRASE = MACADDRESS
    try {
      let text = JSON.stringify(Array.from(this.map))
      // var encrypted = CryptoJS.AES.encrypt(text, PASSPHRASE);
      await ensureDirectoryExistence(filePath)
      if (!fs.existsSync(filePath)){
        fs.mkdirSync(filePath, { recursive: true });
      }
      // fs.writeFileSync(filePath, encrypted.toString())
      fs.writeFileSync(filePath, text)
    } catch (e) {
      throw new Error('Could not write credentials file.')
    }
  }

  public loadFromFile(fileName: string) {
    // TODO:: FIx this decoding sequence. This is POC
    // let PASSPHRASE = MACADDRESS
    try {
      let text = fs.readFileSync(fileName, {encoding: 'utf8'})
      // var decrypted = CryptoJS.AES.decrypt(text, PASSPHRASE);
      // this.map = new Map(JSON.parse(decrypted.toString(CryptoJS.enc.Utf8)))
      this.map = new Map(JSON.parse(text))
    } catch (e) {
      throw new Error('Could not read credentials file.')
    }
  }

  public clear() {
    this.map = new Map();
  }

}


const JWTALG = 'ES256';
type SessionTokenInfo = {
  accessToken: string,
  expirationDate: Date,
  dpopKey: KeyPair
  webId?: string,
  idp?: string,
}

export async function storeSessionTokenInfo(accessToken: string, dpopKey: KeyPair, expirationDate: Date, webId?: string, idp?: string) {
  let id = randomUUID();
  let privateKeyJWK = await exportJWK(dpopKey.privateKey)
  let expirationDateString = expirationDate.toISOString();
  let exportedObject = { id, accessToken, dpopKey: { privateKey: privateKeyJWK, publicKey: dpopKey.publicKey }, expirationDate: expirationDateString, webId, idp }
  // Add the session to the config
  if (webId) {
    setConfigSession(webId, exportedObject);
  } 
  
 return; 
}

export async function readSessionTokenInfo() : Promise<SessionTokenInfo> {
  let sessionInfo: SessionTokenInfo = getConfigCurrentSession() as unknown as SessionTokenInfo; // TODO:: Double check this?
  sessionInfo.expirationDate = new Date(sessionInfo.expirationDate);
  sessionInfo.dpopKey = await fixKeyPairType(sessionInfo.dpopKey);
  return sessionInfo;
}


async function fixKeyPairType(key: any) : Promise<KeyPair> {
  let publicKeyJWK : JWK;
  let privateKeyKeyLike : KeyLike;
  try {
    const publicKeyKeyLike = await importJWK(key.publicKey, JWTALG);
    publicKeyJWK = await exportJWK(publicKeyKeyLike);
    privateKeyKeyLike = await importJWK(key.privateKey, JWTALG) as KeyLike;
  } catch (e) {
    let message = (e instanceof Error) ? e.message : String(e);
    throw new Error(`Cannot restore session keys: ${message}`)
  }
  let dpopKey = {
    privateKey: privateKeyKeyLike,
    publicKey: publicKeyJWK
  };
  dpopKey.publicKey.alg = JWTALG;
  return dpopKey;

}

type IdToken = {
  azp: string,
  sub: string,
  webid: string,
  at_hash: string,
  aud: string,
  exp: number,
  iat: number,
  iss: string,

}
export function decodeIdToken(idToken: string): IdToken {
  return jwt_decode(idToken);
}

export function writeErrorString(explanation: string, e: any, options?: { logger?: Logger }) {
  let message = (e instanceof Error) ? e.message : String(e);
  (options?.logger || console).error(`${explanation}: ${message}`)
}