import { QueryEngine } from '@comunica/query-sparql';
import { isDirectory, writeErrorString } from '../utils/util';
import find from './solid-find';

export type UpdateOptions = {
  fetch: any
  all?: boolean,
  verbose?: boolean
}


export default async function* update(resourceUrl: string, query: string, options: UpdateOptions) {
  if (isDirectory(resourceUrl)) {
    for await (let fileInfo of find(resourceUrl, '.', options)) {
      try {
        const bindings = await updateResource(query, [fileInfo.absolutePath], options.fetch)
        yield({ fileName: fileInfo.absolutePath, bindings })
      } catch (e) {
        if (options.verbose) writeErrorString('Could not update file', e)
      }
    }
  } else {
    try {
      const bindings = await updateResource(query, [resourceUrl], options.fetch)
      yield({ fileName: resourceUrl, bindings })
      return
    } catch (e) {
      writeErrorString('Could not update file', e)
      return
    }
  }
}

async function updateResource(query: string, sources: any, fetch: any) {
  const queryEngine = new QueryEngine();
  return new Promise(async (resolve, reject) => {
    try {
      const success = await queryEngine.queryBoolean(query, { sources, fetch });
      if (!success) throw new Error(`Could not update file ${sources}`)
      if (!success) reject();
    } catch (e) { reject(e) }
  })
}