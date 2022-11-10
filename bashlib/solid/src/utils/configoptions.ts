import { getSolidDataset, getThing, getUrl, getUrlAll } from '@inrupt/solid-client';
const fs = require('fs')

const homedir = require('os').homedir();
const SOLIDDIR = `${homedir}/.solid/`
const BASHLIBCONFIGPATH = `${SOLIDDIR}.bashlibconfig`

export type IConfig = {
  currentWebID?: string,
  authInfo: Record<string, IAuthInfoEntry>
}

export type IAuthInfoEntry = {
  token?: ITokenEntry,
  session?: ISessionEntry,
}

export type ITokenEntry = {
  name: string,
  email: string,
  idp: string, 
  webId: string,
  id: string,
}

export type ISessionEntry = {
  id: string,
  idp: string,
  webId: string,
  expirationDate: Date,
}

export function initializeConfig() { 
  if (!fs.existsSync(BASHLIBCONFIGPATH)) { 
    let config: IConfig = {
      currentWebID: undefined,
      authInfo: {
        
      }
    }
    fs.writeFileSync(BASHLIBCONFIGPATH, JSON.stringify(config, null, 2))
  }
}

export async function checkValidWebID(webId: string | undefined) { 
  if (!webId) return false;
  let webIdDocumentURL = webId.split('#')[0]
  try {
    let ds = await getSolidDataset(webId)
    let documentThing = getThing(ds, webIdDocumentURL)
    let webIdThing = getThing(ds, webId)
    if (documentThing && getUrlAll(documentThing, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type").includes('http://xmlns.com/foaf/0.1/PersonalProfileDocument')) { 
      return true;
    } else if (webIdThing && getUrl(webIdThing, "http://www.w3.org/ns/solid/terms#oidcIssuer")) { 
      return true;
    }

  } catch (_ignored) { 
    return false;
  }
  return false;
}

export async function clearConfigCurrentWebID() { 
  try {
    let config = loadConfig()
    delete config.currentWebID
    fs.writeFileSync(BASHLIBCONFIGPATH, JSON.stringify(config, null, 2))
  }
  catch (e) { 
    throw new Error('Could not read config.')
  }
}


export async function setConfigCurrentWebID(webId: string | undefined) { 
  if (!webId) throw new Error(`No WebID value provided`)
  let valid = await checkValidWebID(webId)
  if (!valid) throw new Error(`Invalid WebID value provided: "${webId}"`)
    
  try {
    let config = loadConfig()
    config.currentWebID = webId
    fs.writeFileSync(BASHLIBCONFIGPATH, JSON.stringify(config, null, 2))
  }
  catch (e) { 
    throw new Error('Could not read config.')
  }
}

export function getConfigCurrentWebID() { 
  try {
    let config : IConfig = JSON.parse(fs.readFileSync(BASHLIBCONFIGPATH, { encoding: "utf8" }));
    return config.currentWebID;
  }
  catch (e) { 
    throw new Error('Could not read config.')
  }
}

export function setConfigToken(webId: string, token: any) { 
  try {
    let config = loadConfig()
    if (config.authInfo[webId]) {
      if (config.authInfo[webId].token) {
        console.error('WebID already has token entry')
      } else { 
        config.authInfo[webId].token = token
        // Remove any prior session for interactive authentication.
        config.authInfo[webId].session = undefined
      }
    } else { 
      config.authInfo[webId] = {
        token: token
      }
    }
    fs.writeFileSync(BASHLIBCONFIGPATH, JSON.stringify(config, null, 2))
  }
  catch (e) { 
    throw new Error('Could not read config.')
  }
}

export function setConfigSession(webId: string, session: any) { 
  try {
    let config = loadConfig()
    if (config.authInfo[webId]) {
        config.authInfo[webId].session = session
    } else { 
      config.authInfo[webId] = { session: session }
    }
    fs.writeFileSync(BASHLIBCONFIGPATH, JSON.stringify(config, null, 2))
  }
  catch (e) { 
    throw new Error('Could not read config.')
  }
}

export function getConfigCurrentSession() {
  let config : IConfig = JSON.parse(fs.readFileSync(BASHLIBCONFIGPATH, { encoding: "utf8" }));
  let webId = config.currentWebID
  if (!webId) return null;
  return config.authInfo[webId].session
}

export function getConfigCurrentToken() {
  let config : IConfig = JSON.parse(fs.readFileSync(BASHLIBCONFIGPATH, { encoding: "utf8" }));
  let webId = config.currentWebID
  if (!webId) return null;
  return config.authInfo[webId].token 
}

export function getAllConfigEntries() { 
  let info: Record<string, { hasToken: boolean, session?: { id?: string, idp?: string, expirationDate?: Date } }> = {}
  try {
    let config = loadConfig()
    for (let webId of Object.keys(config.authInfo)) { 
      info[webId] = {
        hasToken: !!config.authInfo[webId].token,
        session: config.authInfo[webId].session && {
          id: config.authInfo[webId].session?.id,
          idp: config.authInfo[webId].session?.idp,
          expirationDate: config.authInfo[webId].session?.expirationDate
        }
      }
    }
  }
  catch (e) { 
    throw new Error('Could not read config.')
  }
  return info
}

export function removeConfigSession(webId: string) {
  try {
    let config : IConfig = JSON.parse(fs.readFileSync(BASHLIBCONFIGPATH, { encoding: "utf8" }));
    delete config.authInfo[webId];
    fs.writeFileSync(BASHLIBCONFIGPATH, JSON.stringify(config, null, 2))
  }
  catch (e) { 
    throw new Error('Could not read config.')
  }
}

export function removeConfigSessionAll() {
  try {
    let config = loadConfig()
    for (let webId of Object.keys(config.authInfo)) { 
      delete config.authInfo[webId]
    }
    fs.writeFileSync(BASHLIBCONFIGPATH, JSON.stringify(config, null, 2))
  }
  catch (e) { 
    throw new Error('Could not read config.')
  }
}

export function addConfigEmtpyEntry(webId: string) { 
  try {
    let config = loadConfig()
    if (!config.authInfo[webId]) { 
      config.authInfo[webId] = {};  
    }
    fs.writeFileSync(BASHLIBCONFIGPATH, JSON.stringify(config, null, 2))
  }
  catch (e) { 
    throw new Error('Could not read config.')
  }
}

function loadConfig() : IConfig { 
  let config : IConfig = JSON.parse(fs.readFileSync(BASHLIBCONFIGPATH, { encoding: "utf8" }));
  for (let webId of Object.keys(config.authInfo)) { 
    let expirationDate = config.authInfo[webId].session?.expirationDate
    if (expirationDate)
      (config.authInfo[webId].session as any).expirationDate = new Date(expirationDate) // idk why its complaining here
  }
  return config
}