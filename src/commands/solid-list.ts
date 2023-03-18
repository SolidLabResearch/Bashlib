import { isDirectory, checkHeadersForAclAndMetadata, getResourceInfoFromDataset, getResourceInfoFromHeaders, ResourceInfo } from '../utils/util';
import { getContainedResourceUrlAll, getSolidDataset } from '@inrupt/solid-client';
import type { Logger } from '../logger';
import BashlibError from '../utils/errors/BashlibError';

type ListingOptions = {
  fetch: any,
  all?: boolean,
  full?: boolean,
  verbose?: boolean,
  logger?: Logger,
}

export default async function list(url: string, options: ListingOptions) {
  if (!isDirectory(url)) {
    (options.logger || console).error('List can only be called on containers. Please write containers with their trailing slash.')
    throw new Error('List can only be called on containers.');
  }
  let dataset = await getSolidDataset(url, { fetch: options.fetch })
  let containedResources = getContainedResourceUrlAll(dataset)
  let resourceInfos : ResourceInfo[] = []

  // Test original directory for acl file
  if (options.all) {
    let headerInfo = await checkHeadersForAclAndMetadata(url, options.fetch)
    if (headerInfo.acl) {
      let resourceInfo = await getResourceInfoFromHeaders(headerInfo.acl, url, options.fetch)
      if(resourceInfo) resourceInfos.push(resourceInfo)
    }
    if (headerInfo.meta) {
      let resourceInfo = await getResourceInfoFromHeaders(headerInfo.meta, url, options.fetch)
      if(resourceInfo) resourceInfos.push(resourceInfo)
    }
  }
  
  for (let containedResourceUrl of containedResources) {
    let resourceInfo = getResourceInfoFromDataset(dataset, containedResourceUrl, url);
    if (resourceInfo && !resourceInfo.isDir && options.all) { //  We only want to show acl files in the current dir. Aka the ones of the current dir + the ones of contained files
      const headerInfo = await checkHeadersForAclAndMetadata(containedResourceUrl, options.fetch)
      let aclResourceInfo: ResourceInfo | undefined;
      let metaResourceInfo: ResourceInfo | undefined;
      if (headerInfo.meta) {
        metaResourceInfo = await getResourceInfoFromHeaders(headerInfo.meta, url, options.fetch)
        if(metaResourceInfo) {
          resourceInfo.metadata = metaResourceInfo;
          resourceInfos.push(metaResourceInfo)
        }
      }
      if (headerInfo.acl) {
        aclResourceInfo = await getResourceInfoFromHeaders(headerInfo.acl, url, options.fetch)
        if (aclResourceInfo) {
          resourceInfo.acl = aclResourceInfo;
          resourceInfos.push(aclResourceInfo)
        }
      }
    }
    if (resourceInfo) resourceInfos.push(resourceInfo)
  }
  return resourceInfos
}
