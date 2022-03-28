import { getAgentAccessAll, AgentAccess, Access, getPublicAccess, getResourceAcl, getGroupAccessAll, getAgentDefaultAccessAll, getPublicDefaultAccess, getGroupDefaultAccessAll, getAgentResourceAccessAll, getGroupResourceAccessAll, getPublicResourceAccess, getResourceInfoWithAcl } from '@inrupt/solid-client';
import { writeErrorString } from '../utils/util';

export type QueryOptions = {
  fetch: any
  verbose?: boolean
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
    const resource = await getResourceInfoWithAcl(resourceUrl, { fetch: options.fetch })
    permissions.access.agent = await getAgentAccessAll(resource)
    permissions.access.group = await getGroupAccessAll(resource)
    permissions.access.public = await getPublicAccess(resource)

    let aclDataset = getResourceAcl(resource); 
    
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
    if (options.verbose) writeErrorString(`Could not retrieve permissions for ${resourceUrl}`, e)
  }
}