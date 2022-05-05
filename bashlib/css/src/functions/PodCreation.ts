// import * as fetch from "node-fetch";
const fetch = require('node-fetch')

export type AccountData = {
  name: string,
  email?: string,
  password?: string,
}

/**
 * @description
 * Function to initialize an array of data pods on a CSS instance.
 */
export default async function createPods(baseUrl: string, accountData: AccountData[]) {
  if (!baseUrl) throw new Error('Please pass a value for the CSS baseUrl');

  // Uses hardcoded URL. Not sure if this URL can be discovered dynamically?
  let pod_server_register_url = baseUrl?.endsWith('/')
    ? `${baseUrl}idp/register/`
    : `${baseUrl}/idp/register/`

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
    
    const res = await fetch(pod_server_register_url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(settings),
    });
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
