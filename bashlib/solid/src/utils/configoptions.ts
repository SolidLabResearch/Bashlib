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

export function setConfigCurrentWebID(webId: string) { 
  try {
    let config: IConfig = JSON.parse(fs.readFileSync(BASHLIBCONFIGPATH, { encoding: "utf8" }));
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
    let config: IConfig = JSON.parse(fs.readFileSync(BASHLIBCONFIGPATH, { encoding: "utf8" }));
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
    let config: IConfig = JSON.parse(fs.readFileSync(BASHLIBCONFIGPATH, { encoding: "utf8" }));
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
  let info : any = {}
  try {
    let config: IConfig = JSON.parse(fs.readFileSync(BASHLIBCONFIGPATH, { encoding: "utf8" }));
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
fs.writeFileSync(BASHLIBCONFIGPATH, JSON.stringify(config, null, 2))
  }
  catch (e) { 
    throw new Error('Could not read config.')
  }
}

export function removeConfigSession(webId: string) {
  try {
    let config : IConfig = JSON.parse(fs.readFileSync(BASHLIBCONFIGPATH, { encoding: "utf8" }));
    config.authInfo[webId].session = undefined;
    fs.writeFileSync(BASHLIBCONFIGPATH, JSON.stringify(config, null, 2))
  }
  catch (e) { 
    throw new Error('Could not read config.')
  }
}

export function removeConfigSessionAll() {
  try {
    let config: IConfig = JSON.parse(fs.readFileSync(BASHLIBCONFIGPATH, { encoding: "utf8" }));
    for (let webId of Object.keys(config.authInfo)) { 
      config.authInfo[webId].session = undefined;
    }
    fs.writeFileSync(BASHLIBCONFIGPATH, JSON.stringify(config, null, 2))
  }
  catch (e) { 
    throw new Error('Could not read config.')
  }
}