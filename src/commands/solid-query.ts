import { QueryEngine } from '@comunica/query-sparql';
import { isDirectory, writeErrorString, FileInfo } from '../utils/util';
import find from './solid-find';
import type { Logger } from '../logger';
import { ICommandOptions, setOptionDefaults } from './solid-command';

export interface ICommandOptionsQuery extends ICommandOptions{
  all?: boolean,
}


export default async function* query(resourceUrl: string, query: string, options?: ICommandOptionsQuery) {
  let commandOptions = setOptionDefaults<ICommandOptionsQuery>(options || {});

  if (isDirectory(resourceUrl)) {
    for await (let fileInfo of find(resourceUrl, '.', commandOptions)) {
      try {
        const bindings = await queryResource(query, [fileInfo.absolutePath], commandOptions.fetch)
        yield({ fileName: fileInfo.absolutePath, bindings })
      } catch (e) {
        if (commandOptions.verbose) writeErrorString('Could not query file', e, commandOptions)
      }
    }
  } else {
    try {
      const bindings = await queryResource(query, [resourceUrl], commandOptions.fetch)
      yield({ fileName: resourceUrl, bindings })
      return
    } catch (e) {
      writeErrorString('Could not query file', e, commandOptions)
      return
    }
  }
}

async function queryResource(query: string, sources: any, fetch: typeof globalThis.fetch) {
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