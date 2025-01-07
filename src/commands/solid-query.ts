import { QueryEngine } from '@comunica/query-sparql';
import { isDirectory, writeErrorString, FileInfo, generateRecursiveListing, isRDFResource, readRemoteDirectoryRecursively, DirInfo } from '../utils/util';
import find from './solid-find';
import type { Logger } from '../logger';
import { ICommandOptions, setOptionDefaults } from './solid-command';

export interface ICommandOptionsQuery extends ICommandOptions{
  all?: boolean,
}


export async function queryFederated(containerUrl: string, query: string, options?: ICommandOptionsQuery) {
  let commandOptions = setOptionDefaults<ICommandOptionsQuery>(options || {});

  if (!isDirectory(containerUrl)) throw new Error('Executing federated query over single resource!');

  const directoryInfo: DirInfo = await readRemoteDirectoryRecursively(containerUrl, commandOptions);
  const files = directoryInfo.files


  try {
    const rdfResourceURIs: string[] = [];
    for (let file of files) {
      if (await isRDFResource(file, options?.fetch)) rdfResourceURIs.push(file.absolutePath)
    }
    const bindings = await queryResource(query, rdfResourceURIs, commandOptions.fetch);
    return bindings
  } catch (e) {
    writeErrorString('Could not evaluate query', e, commandOptions)
  }
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