import { FetchError, getResourceInfo } from "@inrupt/solid-client" 
const mime = require('mime-types');

export default async function touch(url: string, options: any) { 
    let fetch = options.fetch;
    let verbose = options.verbose || false;
    
    if (url.endsWith('/')) {
        throw new Error('Can\'t touch containers only resources')
    }

    let urlExists = await resourceExists(url, options);
    
    if (urlExists) {
        if (verbose) console.log(`Remote file already exists`)
    }
    else {
        let path = url.replace(/.*\//,'')
        let mimetype = mime.lookup(path)
        let contentType = (path.endsWith('.acl') || path.endsWith('.meta') || !mimetype) ? 'text/turtle' : mimetype

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
        console.log(res.body)
        if (res.ok) {
            if (verbose) console.log(`Remote file created`)
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