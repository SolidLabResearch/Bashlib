import { getInbox, getPodRoot, writeErrorString } from './util';
import fs from 'fs';
import { SolidShell } from '../commands/solid-shell';

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
      writeErrorString(`Error parsing config file at ${options.config}.`, e, options);
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
    return authenticationInfo.webId as string

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
  if (!b && a && !a.endsWith('/')) return a + '/'
  if (a.endsWith('/') && b.startsWith('/')) {
    return `${a}${b.slice(1).toString()}`
  }
  if (!a.endsWith('/') && !b.startsWith('/')) {
    return `${a}/${b}`
  }
  return `${a}${b}`
}

export function normalizeURL(url: string, shell?: SolidShell): string {
  if (url.startsWith('http') || url.startsWith('https')) {
    return url;
  } else if (shell && (shell.podBaseURI && shell.workingContainer)) {
    if (url.startsWith('/') && !shell.podBaseURI) throw new Error('Cannot find root of the current Solid pod.')
    let path = url.startsWith('/') ? shell.podBaseURI : shell.workingContainer
    for (let pathEntry of url.split('/')) {
      if (pathEntry === '.') {
        continue;
      } else if (pathEntry === '..') {
        let split = path.split('/')
        path = path.endsWith('/') ? split.slice(0, split.length - 2).join('/') : split.slice(0, split.length - 1).join('/')
        path = path + '/' // Prevent missing trailing slash
      } else if (pathEntry === '*') {
        throw new Error(`Wildcard urls ('*') are currently not supported`)
      } else {
        if (path.endsWith('/') && !pathEntry) {
          continue // Prevent double slashes
        }
        path = mergeStringsSingleSlash(path, pathEntry)
      }
    }
    return path;
  } else { 
    return url;
  }
}

export function getAndNormalizeURL(url?: string, shell?: SolidShell) : string { 
  if (url) { 
    return normalizeURL(url, shell)
  } else if (!url && shell && shell.workingContainer) {
    return shell.workingContainer;
  } else { 
    throw new Error('Could not find current working directory')
  }
}
  



export function getResourceInfoRelativePath(info: any) { return info.relativePath ? info.relativePath : info.url }