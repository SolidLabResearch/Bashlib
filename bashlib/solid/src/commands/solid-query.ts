import { QueryEngine } from '@comunica/query-sparql';
import { isDirectory, writeErrorString, FileInfo } from '../utils/util';
import find from './solid-find';

export type QueryOptions = {
  fetch: any
  all?: boolean,
  verbose?: boolean
}


export default async function* query(resourceUrl: string, query: string, options: QueryOptions) {
  if (isDirectory(resourceUrl)) {
    for await (let fileInfo of find(resourceUrl, '.', options)) {
      try {
        const bindings = await queryResource(query, [fileInfo.absolutePath], options.fetch)
        yield({ fileName: fileInfo.absolutePath, bindings })
      } catch (e) {
        if (options.verbose) writeErrorString('Could not query file', e)
      }
    }
  } else {
    try {
      const bindings = await queryResource(query, [resourceUrl], options.fetch)
      yield({ fileName: resourceUrl, bindings })
      return
    } catch (e) {
      writeErrorString('Could not query file', e)
      return
    }
  }
}

async function queryResource(query: string, sources: any, fetch: any) {
  const queryEngine = new QueryEngine();
  return new Promise(async (resolve, reject) => {
    try {
      const bindingsStream = await queryEngine.queryBindings(query, { sources, fetch });
      if (!bindingsStream) throw new Error(`Could not query file ${sources}`)
      if (!bindingsStream) reject();
      const bindings : any[] = []
      bindingsStream.on('data', (binding: any) => {
        bindings.push(binding)
      });
      bindingsStream.on('end', () => { resolve(bindings) });
      bindingsStream.on('error', (error: any) => { reject(error) });
    } catch (e) { reject(e) }
  })
  
}