import { getInbox, getPodRoot, writeErrorString } from './util';
import fs from 'fs';

export function arrayifyHeaders(value: any, previous: any) { return previous ? previous.concat(value) : [value] }

export function addEnvOptions(options: any) {
  const envAuthType = process.env['BASHLIB_AUTH']
  const envIdp = process.env['BASHLIB_IDP']
  const envTokenStorage = process.env['BASHLIB_TOKEN_STORAGE']
  const envSessionStorage = process.env['BASHLIB_SESSION_STORAGE']
  const envConfig = process.env['BASHLIB_CONFIG']
  const envAuthPort = process.env['BASHLIB_AUTH_PORT']

  // Set config options
  options.config = options.config || envConfig
  if (options.config) {
    try {
      let cfg = JSON.parse(fs.readFileSync(options.config, 'utf8'));
      for (let key of Object.keys(cfg)) {
        // Set config option value if no cli value
        if (!options[key]) options[key] = cfg[key]
      }
    } catch (e) {
      // Dirty solution to prevent extra error handling everywhere :)
      writeErrorString(`Error parsing config file at ${options.config}.`, e);
      process.exit(1);
    }
  }

  // Set env option value if no cli and config option value
  options.auth = options.auth || envAuthType
  options.idp = options.idp || envIdp
  options.tokenStorage = options.tokenStorage || envTokenStorage
  options.sessionStorage = options.sessionStorage || envSessionStorage
  options.port = options.port || envAuthPort

  // Fixing some naming inconsistencies because of limited option length
  options.clientCredentialsTokenStorageLocation = options.tokenStorage
  options.sessionInfoStorageLocation = options.sessionStorage
  options.verbose = !options.silent 
  return options
}


export async function changeUrlPrefixes(authenticationInfo: any, url: string) {
  if (!url) return url;

  if (url.startsWith('webid:')) {
    if (!authenticationInfo.webId) throw new Error('Cannot process URL with "webid:" prefix, no WebID value currently known.')
    return mergeStringsSingleSlash(authenticationInfo.webId, url.replace('webid:', '')) 

  } else if (url.startsWith('root:')) {
    if (!authenticationInfo.webId) throw new Error('Cannot process URL with "root:" prefix, no WebID value currently known.')
    let podRoot = await getPodRoot(authenticationInfo.webId, authenticationInfo.fetch);
    if (!podRoot) throw new Error('No pod root container found')
    return mergeStringsSingleSlash(podRoot, url.replace('root:', '')) 

  } else if (url.startsWith('base:')) {
    if (!authenticationInfo.webId) throw new Error('Cannot process URL with "root:" prefix, no WebID value currently known.')
    let podRoot = await getPodRoot(authenticationInfo.webId, authenticationInfo.fetch);
    if (!podRoot) throw new Error('No pod root container found')
    return mergeStringsSingleSlash(podRoot, url.replace('base:', '')) 

  } else if (url.startsWith('inbox:')) {
    if (!authenticationInfo.webId) throw new Error('Cannot process URL with "inbox:" prefix, no WebID value currently known.')
    let inbox = await getInbox(authenticationInfo.webId, authenticationInfo.fetch);
    if (!inbox) throw new Error('No inbox value found')
    return mergeStringsSingleSlash(inbox, url.replace('inbox:', '')) 
  } else {
    return url;
  }
}

export function mergeStringsSingleSlash(a: string, b: string) {
  if (!b) return a
  if (a.endsWith('/') && b.startsWith('/')) {
    return `${a}${b.slice(1).toString()}`
  }
  if (!a.endsWith('/') && !b.startsWith('/')) {
    return `${a}/${b}`
  }
  return `${a}${b}`
}


export function getResourceInfoRelativePath(info: any) { return info.relativePath ? info.relativePath : info.url }