import { ICommandOptions, setOptionDefaults } from './solid-command';
import { readFileSync } from 'fs';

export function makePatchBody(patchOptions: { where?: string, inserts?: string, deletes?: string } ) : string {
  let patchString =  
`@prefix solid: <http://www.w3.org/ns/solid/terms#>.
_:patch a solid:InsertDeletePatch;`
if (patchOptions.where) {
  patchString += `
  solid:where { ${patchOptions.where} }`
}
if (patchOptions.inserts) {
  patchString += `
  solid:inserts { ${patchOptions.inserts} }`
}
if (patchOptions.deletes) {
  patchString += `
  solid:deletes { ${patchOptions.deletes} }`
}
return patchString
}

export async function readPatchBodyFromFile(file: string) : Promise<string> {
  const patchRequest = readFileSync(file, { encoding: "utf-8" })
  if (!patchRequest)  {
    throw new Error(`Could not find patch resource at ${file}`)
  }
  // todo: evaluate PATCH body
  return patchRequest
}

export async function readPatchBodyFromURL(resourceURI: string, fetch: any) : Promise<string> {
  const patchResource = await fetch(resourceURI)
  // todo: evaluate PATCH body
  if (patchResource.ok)
    return await patchResource.text();
  else {
    throw new Error(`Loading ${resourceURI} failed with error code ${patchResource.status}: ${patchResource.statusText}`)
  }
}

export async function sendPatchRequest(target: string, fetch: Function, body: string) : Promise<boolean> {
  const res = await fetch (target, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'text/n3',
    },
    body
  })
  return res.ok
}