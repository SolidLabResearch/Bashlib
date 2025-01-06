import { getResourceInfo, universalAccess } from "@inrupt/solid-client";

import { 
  AccessModes,
} from '@inrupt/solid-client';
import { writeErrorString } from '../utils/util';
import type { Logger } from '../logger';
import { ICommandOptions, setOptionDefaults } from './solid-command';

export interface ICommandOptionsPermissions extends ICommandOptions { }

export type Record<K extends keyof any, T> = {
  [P in K]: T;
};

export type UniversalAccess = {
  read: boolean;
  append: boolean;
  write: boolean;
  controlWrite: boolean;
  controlRead: boolean;
};


export interface IPermissionListing {
  access: {
    agent?: null | Record<string, AccessModes>,
    public?: null | AccessModes
  },
  default?: {
    agent?: null | Record<string, AccessModes>,
    public?: null | AccessModes
  }
  resource?: {
    agent?: null | Record<string, AccessModes>,
    public?: null | AccessModes
  }
}


export async function listPermissions(resourceUrl: string, options?: ICommandOptionsPermissions) {
  let commandOptions = setOptionDefaults<ICommandOptionsPermissions>(options || {});

  let permissions : IPermissionListing = { access: {} }
  try {
    permissions.access.agent = await universalAccess.getAgentAccessAll(resourceUrl, {fetch: commandOptions.fetch})
    permissions.access.public = await universalAccess.getPublicAccess(resourceUrl, {fetch: commandOptions.fetch})
    console.log('PERMISSIONS', permissions)
    return permissions
  } catch (e) {
    if (commandOptions.verbose) writeErrorString(`Could not retrieve permissions for ${resourceUrl}`, e, commandOptions)
  }
}

export interface IPermissionOperation {
  type: 'agent' | 'public',
  id?: string,
  read?: boolean,
  write?: boolean,
  append?: boolean,
  control?: boolean,
  acl?: boolean,
}


// todo: getWebID here
export async function setPermission(resourceUrl: string, operations: IPermissionOperation[], options?: ICommandOptionsPermissions) {
  let commandOptions = setOptionDefaults<ICommandOptionsPermissions>(options || {});
  
  for (let operation of operations) {
    try {
      if (operation.type === 'agent') {
        // Update access rights
        if (!operation.id) { throw new Error('Please specify agent id in the passed operation.')}
        let access: UniversalAccess = { read: false, write: false, append: false, controlRead: false, controlWrite: false }
        access = updateAccess(access, operation)
        // Update local acl for agent with new rights
        await universalAccess.setAgentAccess(resourceUrl, operation.id, access, { fetch: commandOptions.fetch })
      } else if (operation.type === 'public') {
        // Update access rights
        let access: UniversalAccess = { read: false, write: false, append: false, controlRead: false, controlWrite: false }
        access = updateAccess(access, operation)
        // Update local acl for agent with new rights
        await universalAccess.setPublicAccess(resourceUrl, access, { fetch: commandOptions.fetch })
      } else { 
        if (commandOptions.verbose) writeErrorString("Incorrect operation type", 'Please provide an operation type of agent or public.', commandOptions)
      }
      commandOptions.logger.log(`Updated permissions for: ${resourceUrl}`)
    } catch (e) {
      if (commandOptions.verbose) writeErrorString(
        `Problem setting permissions for resource ${resourceUrl} operation type`, (e as Error).message, commandOptions
      )
    }
  }
  
}

function updateAccess(access: UniversalAccess, operation: IPermissionOperation) {
  if (operation.read !== undefined) access.read = operation.read
  if (operation.write !== undefined) access.write = operation.write
  if (operation.append !== undefined) access.append = operation.append
  if (operation.control !== undefined) { 
    access.controlRead = operation.control 
    access.controlWrite = operation.control 
  }
  return access
}
