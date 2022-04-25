// import * as fetch from "node-fetch";
const fetch = require('node-fetch')

export type AccountData = {
  name: string,
  email?: string,
  password?: string,
}

export type PodOptions = {
  baseUrl?: string,
  registryUrl?: string,
}

/**
 * @description
 * Function to create a data pod on the server
 *
 * @param {Object} options
 * @param {String} options.baseUrl datapod server base url
 * @param {String} options.registryUrl datapod server registry API url
 */
export default async function createPods(accountData: AccountData[], options: PodOptions) {
  if (!options.baseUrl && !options.registryUrl) {
    throw new Error('Please pass a value for one of the options: base-url, registry-url');
  }
  let pod_server_register_url = options.registryUrl;
  if (!pod_server_register_url && options.baseUrl) {
    pod_server_register_url = options.baseUrl?.endsWith('/')
      ? `${options.baseUrl}idp/register/`
      : `${options.baseUrl}/idp/register/`
  }

  const responses = []
  
  for (let account of accountData) {
    const settings =  {
      podName: account.name,
      email: account.email || `${account.name}@test.edu`,
      password: account.password || account.name,
      confirmPassword: account.password || account.name,
      register: true,
      createPod: true,
      createWebId: true
    }
    console.log('pod_server_register_url', pod_server_register_url)
  
    
    const res = await fetch(pod_server_register_url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error(`HTTP Error Response requesting ${pod_server_register_url}: ${res.status} ${res.statusText}`);
  
    // See server response or error text
    let jsonResponse = await res.json()
    if (jsonResponse.name && jsonResponse.name.includes('Error')) {
      console.error(`${jsonResponse.name} - Creating pod for ${settings.podName} failed: ${jsonResponse.message}`)
    } else {
      console.log(`Pod for ${settings.podName} created succesfully on ${jsonResponse.webId}`)
      responses.push(jsonResponse)
    }
  }
  return responses
}
