import fetch from 'cross-fetch';
import type { Logger } from '../logger';
import { setOptionDefaults, ICommandOptions } from './solid-command';

export interface IAccountData {
  name: string,
  email?: string,
  password?: string,
}

/**
 * @description
 * Function to initialize an array of data pods on a CSS instance.
 */
export default async function createSolidPods(url: string, accountData: IAccountData[], options?: ICommandOptions) {
  let commandOptions = setOptionDefaults(options || {});

  if (!url) throw new Error('Please pass a value for the CSS pod hosting service');

  // Uses hardcoded URL. Not sure if this URL can be discovered dynamically?
  let pod_server_register_url = url?.endsWith('/')
    ? `${url}idp/register/`
    : `${url}/idp/register/`

  const responses = []
  for (let account of accountData) {
    const settings =  {
      podName: account.name.toLowerCase(),
      email: account.email || `${account.name}@test.edu`,
      password: account.password || account.name,
      confirmPassword: account.password || account.name,
      register: true,
      createPod: true,
      createWebId: true
    }
    
    const res = await commandOptions.fetch(pod_server_register_url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(settings),
    });
    // See server response or error text
    let jsonResponse = await res.json()
    if (jsonResponse.name && jsonResponse.name.includes('Error')) {
      commandOptions.logger.error(`${jsonResponse.name} - Creating pod for ${account.name} failed: ${jsonResponse.message}`)
    } else {
      commandOptions.logger.log(`Pod for ${account.name} created succesfully on ${jsonResponse.webId}`)
      responses.push(jsonResponse)
    }
  }
  return responses
}