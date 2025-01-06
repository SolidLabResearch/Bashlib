import { isDirectory, checkHeadersForAclAndMetadata, getResourceInfoFromDataset, getResourceInfoFromHeaders, ResourceInfo, getAclAndMetadata } from '../utils/util';
import { getContainedResourceUrlAll, getSolidDataset } from '@inrupt/solid-client';
import { ICommandOptions, setOptionDefaults } from './solid-command';

export interface ICommandOptionsList extends ICommandOptions{
  all?: boolean,
  full?: boolean,
}

export default async function list(url: string, options?: ICommandOptionsList) {
  let commandOptions = setOptionDefaults<ICommandOptionsList>(options || {});
  
  if (!isDirectory(url)) {
    commandOptions.logger.error('List can only be called on containers. Please write containers with their trailing slash.')
    throw new Error('List can only be called on containers.');
  }
  let dataset = await getSolidDataset(url, { fetch: commandOptions.fetch })
  let containedResources = getContainedResourceUrlAll(dataset)
  let resourceInfos : ResourceInfo[] = []

  // Test original directory for acl file
  if (commandOptions.all) {
    let headerInfo = await checkHeadersForAclAndMetadata(url, commandOptions.fetch)
    if (headerInfo.acl) {
      let resourceInfo = await getResourceInfoFromHeaders(headerInfo.acl, url, commandOptions.fetch)
      if(resourceInfo) resourceInfos.push(resourceInfo)
    }
    if (headerInfo.meta) {
      let resourceInfo = await getResourceInfoFromHeaders(headerInfo.meta, url, commandOptions.fetch)
      if(resourceInfo) resourceInfos.push(resourceInfo)
    }
  }
  const promiseList: Promise<ResourceInfo>[] = [];
  for (let containedResourceUrl of containedResources) {
    promiseList.push(new Promise((resolve, reject) => {
      let resourceInfo = getResourceInfoFromDataset(dataset, containedResourceUrl, url);
      if (resourceInfo && !resourceInfo.isDir && commandOptions.all) { //  We only want to show acl files in the current dir. Aka the ones of the current dir + the ones of contained files
        getAclAndMetadata(containedResourceUrl, url, commandOptions.fetch)
          .then((headerResources) => { 
            if (headerResources.acl) resourceInfo.acl = headerResources.acl
            if (headerResources.meta) resourceInfo.metadata = headerResources.meta
            resolve(resourceInfo);
          })
      } else {
        resolve(resourceInfo);
      }
    }))
  }

  const metadataResourceInfoList = (await Promise.all(promiseList)).filter((e) => !!e)
  resourceInfos = resourceInfos.concat(metadataResourceInfoList)
  metadataResourceInfoList.forEach( (resourceInfo: ResourceInfo) => {
    if(resourceInfo.acl) resourceInfos.push(resourceInfo.acl)
    if(resourceInfo.metadata) resourceInfos.push(resourceInfo.metadata)
  });
  return resourceInfos

}
