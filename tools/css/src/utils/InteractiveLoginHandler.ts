// This script makes use of the logic found in the @inrupt/generate-oidc-token library.
import { Session, InMemoryStorage, ISessionInfo } from '@inrupt/solid-client-authn-node';
import fs from 'fs';
var CryptoJS = require("crypto-js");
import getMAC from 'getmac'
import LoginHandler from './LoginHandler';
const open = require('open')

const express = require('express')
const homedir = require('os').homedir();

const SOLIDDIR = `${homedir}/.solid/`
const CREDENTIALSFILE = `${SOLIDDIR}.solid-cli-credentials`
const MACADDRESS = getMAC()

export type SessionCreateOptions = {
  oidcIssuer?: string,
  appName?: string,
  port?: number,
  verbose?: boolean,
}

export default class InteractiveLoginHandler extends LoginHandler {
  storageHandler: StorageHandler;
  constructor() {
    super();
    this.storageHandler = new StorageHandler();
  }

  async login(oidcIssuer: string, appName="Solid tooling", port = 3434, storageLocation: string = CREDENTIALSFILE) : Promise<Session> {
    return new Promise( async (resolve, reject) => {
      const app = express();
      const redirectUrl = `http://localhost:${port}`;
      const storage = this.storageHandler;

      let clientId: string | undefined, clientSecret: string | undefined, retrievedOidcIssuer: string | undefined, refreshToken: string | undefined, sessionId: string | undefined;

      if (fs.existsSync(storageLocation)) {
        storage.loadFromFile(storageLocation)
        let sessionInfo = await getSessionInfoFromStorage(storage, true)
        if (sessionInfo) {
          clientId = sessionInfo.clientId
          clientSecret = sessionInfo.clientSecret
          refreshToken = sessionInfo.refreshToken
          retrievedOidcIssuer = sessionInfo.issuer
          sessionId = sessionInfo.sessionId
        }
      }
  
      let session : Session;
      const handleRedirect = (url: string) => { open(url) }
  
      const server = app.listen(port, async () => {
        if (clientId && clientSecret && retrievedOidcIssuer) {
          try {
            session = new Session({
              insecureStorage: storage,
              secureStorage: storage,
            }, sessionId);
            
            const loginOptions = {
              clientName: appName,
              oidcIssuer,
              redirectUrl,
              tokenType: "DPoP" as "DPoP", // typescript fix
              handleRedirect,
              clientId,
              clientSecret, 
              refreshToken
            };
            await session.login(loginOptions)
            // Continue flow to do interactive authentication in case of failed login
            if (session?.info.isLoggedIn) resolve(session);
            else throw new Error('Could not login using stored credentials.') 

          } catch (_ignored) {
            await storage.clear();
            session = new Session({
              insecureStorage: storage,
              secureStorage: storage,
            });
            
            const loginOptions = {
              clientName: appName,
              oidcIssuer,
              redirectUrl,
              tokenType: "DPoP" as "DPoP", // typescript fix
              handleRedirect,
            };
            await session.login(loginOptions)
            // NO RESOLVE HERE, return is handled through the login redirect
          }
        } else {
          await storage.clear();
          session = new Session({
            insecureStorage: storage,
            secureStorage: storage,
          });
          
          const loginOptions = {
            clientName: appName,
            oidcIssuer,
            redirectUrl,
            tokenType: "DPoP" as "DPoP", // typescript fix
            handleRedirect,
          };
          await session.login(loginOptions)
          // NO RESOLVE HERE, return is handled through the login redirect
        }
      });
      
      app.get("/", async (_req: any, res: any) => {
        // Handling incoming redirect from login sequence above
        const redirectIri = new URL(_req.url, redirectUrl).href;
        await session.handleIncomingRedirect(redirectIri);
        const rawStoredSession = await storage.get(
          `solidClientAuthenticationUser:${session.info.sessionId}`
        );
        if (rawStoredSession === undefined) {
          reject(
            `Cannot find session with ID [${session.info.sessionId}] in storage.`
          );
        }
        server.close();
        this.storageHandler.writeToFile(storageLocation)
        resolve(session)
      });
    })
  }
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

async function getSessionInfoFromStorage(storage: StorageHandler, verbose: boolean) {
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


class StorageHandler {
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

  public writeToFile(fileName: string) {
    // TODO:: FIx this encoding sequence. This is POC
    let PASSPHRASE = MACADDRESS
    try {
      let text = JSON.stringify(Array.from(this.map))
      var encrypted = CryptoJS.AES.encrypt(text, PASSPHRASE);
      
      if (!fs.existsSync(SOLIDDIR)){
        fs.mkdirSync(SOLIDDIR, { recursive: true });
      }
      fs.writeFileSync(fileName, encrypted.toString())
    } catch (e) {
      throw new Error('Could not write credentials file.')
    }
  }

  public loadFromFile(fileName: string) {
    // TODO:: FIx this decoding sequence. This is POC
    let PASSPHRASE = MACADDRESS
    try {
      let text = fs.readFileSync(fileName, {encoding: 'utf8'})
      var decrypted = CryptoJS.AES.decrypt(text, PASSPHRASE);
      this.map = new Map(JSON.parse(decrypted.toString(CryptoJS.enc.Utf8)))
    } catch (e) {
      throw new Error('Could not read credentials file.')
    }
  }

  public clear() {
    this.map = new Map();
  }

}