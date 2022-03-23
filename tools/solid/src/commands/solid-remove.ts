import { isDirectory } from '../utils/util';
import { deleteFile } from "@inrupt/solid-client"
import { copyData, list } from '..';

export default async function remove(url: string, options: any) {
  console.log('OwO', isDirectory(url), options)
  if (isDirectory(url)) {
    console.log('IsDirectory')
    const listing = await list(url, { fetch: options.fetch })
    console.log('listing', listing)
    if (!options.recursive) {
      console.error('Please use the recursive option when removing containers')
    } else {

    }
  } else {
    await deleteFile(url, { fetch: options.fetch })
  }
}