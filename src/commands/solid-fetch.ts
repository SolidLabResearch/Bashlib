import fs from 'fs';
import type { Logger } from '../logger';
import { ICommandOptions, setOptionDefaults } from './solid-command';

interface ICommandOptionsFetch extends ICommandOptions {
  header?: string[],
  method?: string,
  body?: string,
  file?: string, // File containing the body
  onlyHeaders?: boolean,
}
export default async function authenticatedFetch(url: string, options?: ICommandOptionsFetch) {
  let commandOptions = setOptionDefaults<ICommandOptionsFetch>(options || {});
  
  const fetch = commandOptions.fetch
  let processedHeaders : any = {}
  for (let header of commandOptions.header || []) {
    let split = header.split(':')
    processedHeaders[split[0].trim()] = split[1].trim()
  }

  if (commandOptions.file && !commandOptions.body){
    commandOptions.body = fs.readFileSync(commandOptions.file, { encoding: "utf-8"})
  }
  
  const ICommandOptionsFetch = {
    method: commandOptions.method,
    headers: processedHeaders,
    body: commandOptions.body,
    // mode: options.mode,
    // cache: options.cache,
    // credentials: options.credentials,
    // redirect: options.redirect,
    // referrerPolicy: options.referrerPolicy,
  }
  
  const response = await fetch(url, ICommandOptionsFetch)
  if (!response.ok) throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
  const text = await response.text();
  let methodString = ''
  let requestHeaderString = ''
  let responseHeaderString = ''

  // Create method string
  methodString = `${commandOptions.method || 'GET'} ${url}\n`
  
  // Create request header string
  for (let header of commandOptions.header || []) {
    let splitHeader = header.split(':')
    requestHeaderString += `> ${splitHeader[0]} ${splitHeader[1]}\n`
  }

  // Create response header string
  response.headers.forEach(header => {
    responseHeaderString += `< ${header[0]} ${header[1]}\n`
  })

  // Log to command line
  if (commandOptions.verbose) {
    commandOptions.logger.error(methodString);
    commandOptions.logger.error(requestHeaderString);
    commandOptions.logger.error(responseHeaderString);
  } else if (commandOptions.onlyHeaders) {
    commandOptions.logger.error(requestHeaderString);
    commandOptions.logger.error(responseHeaderString);
  }
  if (!commandOptions.onlyHeaders) {
    commandOptions.logger.log(text.trim());
  }
}
