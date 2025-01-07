import { FetchError, getResourceInfo } from "@inrupt/solid-client" 
import { setOptionDefaults, ICommandOptions } from './solid-command';
const mime = require('mime-types');

export interface ICommandOptionsTouch extends ICommandOptions{ 
    contentType?: string;
}

export default async function touch(url: string, options?: ICommandOptionsTouch) { 
    let commandOptions = setOptionDefaults<ICommandOptionsTouch>(options || {});
    let fetch = commandOptions.fetch;
    
    if (url.endsWith('/')) {
        throw new Error('Can\'t touch containers only resources')
    }

    let urlExists = await resourceExists(url, commandOptions);
    
    if (urlExists) {
        if (commandOptions.verbose) commandOptions.logger.log(`Remote file already exists`)
    }
    else {
        let path = url.replace(/.*\//,'')
        let mimetype = mime.lookup(path)

        let contentType = options?.contentType

        if (!contentType) {
            contentType = path.endsWith('.acl') || path.endsWith('.meta') ? 'text/turtle': path.endsWith('.acp') ? 'application/ld+json':  mime.lookup(path)
        }

        if (!contentType) {
            throw new Error('Could not discover content type for the touched resource. Please add a file extension or add a content type flag.')
        }

        let res = await fetch(
            url, 
            {
              method: 'PUT',
              body: "",
              headers: { 
                'Content-Type': contentType
              }
            }
        )
        if (res.ok) {
            if (commandOptions.verbose) commandOptions.logger.log(`Remote file created`)
        }
        else {
            throw new Error(`HTTP Error Response requesting ${url}: ${res.status} ${res.statusText}`)
        }
    }
}

export async function resourceExists(url: string, options: any) {
    let fetch = options.fetch;

    try {
        let info = await getResourceInfo(url, { fetch: fetch })
        return true;
    }
    catch (e) {
        if (e instanceof FetchError && e.response.status === 404) {
            return false;
        } 
        else {
            return undefined;
        }
    }
}