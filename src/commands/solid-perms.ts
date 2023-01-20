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

export type QueryOptions = {
  fetch: any
  verbose?: boolean
  logger?: Logger
}

type Record<K extends keyof any, T> = {
  [P in K]: T;
};


export type PermissionListing = {
  access: {
    agent?: null | Record<string, Access>,
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

export async function listPermissions(resourceUrl: string, options: QueryOptions) {
  let permissions : PermissionListing = { access: {} }
  try {
    const resourceInfo = await getResourceInfoWithAcl(resourceUrl, { fetch: options.fetch })
    permissions.access.agent = await getAgentAccessAll(resourceInfo)
    permissions.access.group = await getGroupAccessAll(resourceInfo)
    permissions.access.public = await getPublicAccess(resourceInfo)

    let aclDataset = getResourceAcl(resourceInfo); 
    
    if (aclDataset) {
      permissions.default = {};
      permissions.default.agent = await getAgentDefaultAccessAll(aclDataset)
      permissions.default.group = await getGroupDefaultAccessAll(aclDataset)
      permissions.default.public = await getPublicDefaultAccess(aclDataset)

      permissions.resource = {};
      permissions.resource.agent = await getAgentResourceAccessAll(aclDataset)
      permissions.resource.group = await getGroupResourceAccessAll(aclDataset)
      permissions.resource.public = await getPublicResourceAccess(aclDataset)
      
    }
    return permissions
  } catch (e) {
    if (options.verbose) writeErrorString(`Could not retrieve permissions for ${resourceUrl}`, e, options)
  }
}

export type PermissionOperation = {
  type: 'agent' | 'group' | 'public',
  id?: string,
  read?: boolean,
  write?: boolean,
  append?: boolean,
  control?: boolean,
  default?: boolean,
}

export async function changePermissions(resourceUrl: string, operations: PermissionOperation[], options: QueryOptions) {
  const resourceInfo = await getResourceInfoWithAcl(resourceUrl, { fetch: options.fetch })
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
      if (operation.default) aclDataset = await setAgentDefaultAccess(aclDataset, operation.id, access)
      aclDataset = await setAgentResourceAccess(aclDataset, operation.id, access)

    } else if (operation.type === 'group') {
      // Update access rights
      if (!operation.id) { throw new Error('Please specify group id in the passed operation.')}
      let access = { read: false, write: false, append: false, control: false }
      access = updateAccess(access, operation)
      // Update local acl for group with new rights
      if (operation.default) aclDataset = await setGroupDefaultAccess(aclDataset, operation.id, access)
      aclDataset = await setGroupResourceAccess(aclDataset, operation.id, access)

    } else if (operation.type === 'public') {
      // Update access rights
      if (!operation.id) { throw new Error('Please specify agent id in the passed operation.')}
      let access = { read: false, write: false, append: false, control: false }
      access = updateAccess(access, operation)
      // Update local acl for agent with new rights
      if (operation.default) aclDataset = await setPublicDefaultAccess(aclDataset, access)
      aclDataset = await setPublicResourceAccess(aclDataset, access)
    } else { 
      if (options.verbose) writeErrorString("Incorrect operation type", 'Please provide an operation type of agent, group or public.', options)
    }
  }
  // Post updated acl to pod
  if (aclDataset && await hasAccessibleAcl(resourceInfo)) {
    await saveAclFor(resourceInfo as WithAccessibleAcl, aclDataset, {fetch: options.fetch})
    if (options.verbose) (options.logger || console).log(`Updated permissions for: ${resourceUrl}`)
  }
}

export async function deletePermissions(resourceUrl: string, options: QueryOptions) {
  let resourceInfo = await getResourceInfoWithAcl(resourceUrl, {fetch: options.fetch})
  if (hasAccessibleAcl(resourceInfo)) {
    await deleteAclFor(resourceInfo, {fetch: options.fetch})
    if (options.verbose) (options.logger || console).log(`Deleted resource at ${resourceUrl}`)
  } else {
    throw Error(`Resource at ${resourceUrl} does not have an accessible ACL resource`)
  }
}

function updateAccess(access: Access, operation: PermissionOperation) {
  if (operation.read !== undefined) access.read = operation.read
  if (operation.write !== undefined) access.write = operation.write
  if (operation.append !== undefined) access.append = operation.append
  if (operation.control !== undefined) access.control = operation.control
  return access
}