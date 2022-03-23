import { getPodRoot, isDirectory } from "../utils/util";
import { getContainedResourceUrlAll, getSolidDataset, getThing, getInteger, getDatetime, getUrlAll } from '@inrupt/solid-client';

export type ResourceInfo = {
  url: string,
  localurl: string,
  isDir: boolean,
  modified?: Date | null,
  mtime?: number | null,
  size?: number | null,
  types?: string[],
}

export default async function list(url: string, options: any) {

  if (!isDirectory(url)) {
    console.error('List can only be called on containers. Please write containers with their trailing slash.')
  }
  
  console.log('listing', url, getSolidDataset, options.fetch)
  const res = await fetch(url)
  console.log('middle', res)
  let dataset = await getSolidDataset(url, { fetch: options.fetch })

  console.log('listing dataset')
  let resourceInfos = []
  for (let containedResourceUrl of getContainedResourceUrlAll(dataset)) {
    const thing = getThing(dataset, containedResourceUrl)
    if (thing) {
      const modified = getDatetime(thing, 'http://purl.org/dc/terms/modified')
      const mtime = getInteger(thing, 'http://www.w3.org/ns/posix/stat#mtime')
      const size = getInteger(thing, 'http://www.w3.org/ns/posix/stat#size')
      const types = getUrlAll(thing, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
      const resourceInfo : ResourceInfo = {
        url: containedResourceUrl,
        localurl: containedResourceUrl.slice(url.length),
        isDir: types.indexOf('http://www.w3.org/ns/ldp#Container') !== -1,
        modified, mtime, size, types
      }
      resourceInfos.push(resourceInfo)
    }
    
  }
  return resourceInfos
}