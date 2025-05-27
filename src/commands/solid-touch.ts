import { setOptionDefaults, ICommandOptions } from './solid-command';
import { resourceExists } from "../utils/util";
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

    let urlExists = await resourceExists(url, commandOptions.fetch);
    
    if (urlExists) {
        if (commandOptions.verbose) commandOptions.logger.log(`Remote file already exists`)
    }
    else {
        let path = url.replace(/.*\//,'') // todo: remove this? Might be leftover from shell experiment

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