import { 
  getAgentAccessAll, 
  AgentAccess, 
  Access, 
  getPublicAccess, 
  getResourceAcl, 
  getGroupAccessAll, 
  getAgentDefaultAccessAll, 
  getPublicDefaultAccess, 
  getGroupDefaultAccessAll, 
  getAgentResourceAccessAll, 
  getGroupResourceAccessAll, 
  getPublicResourceAccess, 
  getResourceInfoWithAcl, 
  setAgentDefaultAccess, 
  setGroupDefaultAccess, 
  setPublicDefaultAccess, 
  setAgentResourceAccess, 
  setGroupResourceAccess, 
  setPublicResourceAccess, 
  hasAccessibleAcl,
  getFallbackAcl,
  AclDataset,
  saveAclFor,
  WithAccessibleAcl,
  deleteAclFor,
  hasResourceAcl,
  createAclFromFallbackAcl,
  hasFallbackAcl,
  createAcl,
} from '@inrupt/solid-client';
import { writeErrorString } from '../utils/util';
import type { Logger } from '../logger';
import { ICommandOptions, setOptionDefaults } from './solid-command';

export interface ICommandOptionsPermissions extends ICommandOptions { }

export type Record<K extends keyof any, T> = {
  [P in K]: T;
};

const denyAllAccess = { read: false, write: false, append: false, control: false };


export interface IPermissionListing {
  access: {
    agent?: null | AgentAccess,
    group?: null | Record<string, Access>,
    public?: null | Access
  },
  default?: {
    agent?: null | AgentAccess,
    group?: null | Record<string, Access>,
    public?: null | Access
  }
  resource?: {
    agent?: null | AgentAccess,
    group?: null | Record<string, Access>,
    public?: null | Access
  }
}

export async function listPermissions(resourceUrl: string, options?: ICommandOptionsPermissions) {
  let commandOptions = setOptionDefaults<ICommandOptionsPermissions>(options || {});

  let permissions : IPermissionListing = { access: {} }
  try {
    const resourceInfo = await getResourceInfoWithAcl(resourceUrl, { fetch: commandOptions.fetch })
    permissions.access.agent = getAgentAccessAll(resourceInfo)
    permissions.access.group = getGroupAccessAll(resourceInfo)
    permissions.access.public = getPublicAccess(resourceInfo)

    let aclDataset = getResourceAcl(resourceInfo); 
    
    if (aclDataset) {
      permissions.default = {};
      permissions.default.agent = getAgentDefaultAccessAll(aclDataset)
      permissions.default.group = getGroupDefaultAccessAll(aclDataset)
      permissions.default.public = getPublicDefaultAccess(aclDataset)

      permissions.resource = {};
      permissions.resource.agent = getAgentResourceAccessAll(aclDataset)
      permissions.resource.group = getGroupResourceAccessAll(aclDataset)
      permissions.resource.public = getPublicResourceAccess(aclDataset)
      
    }
    return permissions
  } catch (e) {
    if (commandOptions.verbose) writeErrorString(`Could not retrieve acl permissions for ${resourceUrl}`, e, commandOptions)
  }
}

export interface IPermissionOperation {
  type: 'agent' | 'group' | 'public',
  id?: string,
  read?: boolean,
  write?: boolean,
  append?: boolean,
  control?: boolean,
  default?: boolean,
}

export async function changePermissions(resourceUrl: string, operations: IPermissionOperation[], options?: ICommandOptionsPermissions) {
  let commandOptions = setOptionDefaults<ICommandOptionsPermissions>(options || {});

  const resourceInfo = await getResourceInfoWithAcl(resourceUrl, { fetch: commandOptions.fetch })
  let aclDataset : AclDataset | null;
  if (await hasResourceAcl(resourceInfo)) {
    aclDataset = await getResourceAcl(resourceInfo); 
  } else {
    try {
      if (hasFallbackAcl(resourceInfo) && hasAccessibleAcl(resourceInfo)) {
        aclDataset =  await createAclFromFallbackAcl(resourceInfo)
      } else if (hasAccessibleAcl(resourceInfo)) {
        aclDataset =  await createAcl(resourceInfo)
      } else {
        throw new Error('No acl found in path to root. This tool requires at least a root acl to be set.');
      }
    } catch (e) {
      throw new Error(`Could not find fallback ACL file to initialize permissions for ${resourceUrl}: ${(<Error>e).message}`)
    }
  }
  if (!aclDataset) {
    throw new Error(`You do not have the permissions to edit the ACL file for ${resourceUrl}`)
  }
  
  for (let operation of operations) {
    if (operation.type === 'agent') {
      // Update access rights
      if (!operation.id) { throw new Error('Please specify agent id in the passed operation.')}
      let access = { read: false, write: false, append: false, control: false }
      access = updateAccess(access, operation)
      // Update local acl for agent with new rights
      if (operation.default) {
        // remove non default entry
        aclDataset = setAgentResourceAccess(aclDataset, operation.id, access)
        // update default entry
        aclDataset = setAgentDefaultAccess(aclDataset, operation.id, access)
      } else {
        // remove default entry
        aclDataset = setAgentDefaultAccess(aclDataset, operation.id, denyAllAccess)
        // add non default entry 
        aclDataset = await setAgentResourceAccess(aclDataset, operation.id, access)
      }
      

    } else if (operation.type === 'group') {
      // Update access rights
      if (!operation.id) { throw new Error('Please specify group id in the passed operation.')}
      let access = { read: false, write: false, append: false, control: false }
      access = updateAccess(access, operation)
      // Update local acl for group with new rights
      if (operation.default) {
        // remove non default entry
        aclDataset = setGroupResourceAccess(aclDataset, operation.id, access)
        // update default entry
        aclDataset = setGroupDefaultAccess(aclDataset, operation.id, access)
      } else {
        // remove default entry
        aclDataset = setGroupDefaultAccess(aclDataset, operation.id, denyAllAccess)
        // add non default entry 
        aclDataset = setGroupResourceAccess(aclDataset, operation.id, access)
      }
    } else if (operation.type === 'public') {
      // Update access rights
      if (!operation.id) { throw new Error('Please specify agent id in the passed operation.')}
      let access = { read: false, write: false, append: false, control: false }
      access = updateAccess(access, operation)
      // Update local acl for agent with new rights
      if (operation.default) {
        // remove non default entry
        aclDataset = setPublicResourceAccess(aclDataset, access)
        // update default entry
        aclDataset = setPublicDefaultAccess(aclDataset, access)
      } else {
        // remove default entry
        aclDataset = setPublicDefaultAccess(aclDataset, denyAllAccess)
        // add non default entry 
        aclDataset = setPublicResourceAccess(aclDataset, access)
      }
    } else { 
      if (commandOptions.verbose) writeErrorString("Incorrect operation type", 'Please provide an operation type of agent, group or public.', commandOptions)
    }
  }
  // Post updated acl to pod
  if (aclDataset && await hasAccessibleAcl(resourceInfo)) {
    await saveAclFor(resourceInfo as WithAccessibleAcl, aclDataset, {fetch: commandOptions.fetch})
    if (commandOptions.verbose) commandOptions.logger.log(`Updated permissions for: ${resourceUrl}`)
  }
}

export async function deletePermissions(resourceUrl: string, options?: ICommandOptionsPermissions) {
  let commandOptions = setOptionDefaults<ICommandOptionsPermissions>(options || {});

  let resourceInfo = await getResourceInfoWithAcl(resourceUrl, {fetch: commandOptions.fetch})
  if (hasAccessibleAcl(resourceInfo)) {
    await deleteAclFor(resourceInfo, {fetch: commandOptions.fetch})
    if (commandOptions.verbose) commandOptions.logger.log(`Deleted resource at ${resourceUrl}`)
  } else {
    throw Error(`Resource at ${resourceUrl} does not have an accessible ACL resource`)
  }
}

function updateAccess(access: Access, operation: IPermissionOperation) {
  if (operation.read !== undefined) access.read = operation.read
  if (operation.write !== undefined) access.write = operation.write
  if (operation.append !== undefined) access.append = operation.append
  if (operation.control !== undefined) access.control = operation.control
  return access
}