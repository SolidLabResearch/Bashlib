type FetchOptions = {
  fetch: Function,
  header?: string[],
  method?: string,
  body?: string,
  verbose?: boolean,
  onlyHeaders?: boolean,
}
export default async function authenticatedFetch(url: string, options: FetchOptions) {
  const fetch = options.fetch
  let processedHeaders : any = {}
  for (let header of options.header || []) {
    let split = header.split(':')
    processedHeaders[split[0].trim()] = split[1].trim()
  }
  
  const fetchOptions = {
    method: options.method,
    headers: processedHeaders,
    body: options.body,
    // mode: options.mode,
    // cache: options.cache,
    // credentials: options.credentials,
    // redirect: options.redirect,
    // referrerPolicy: options.referrerPolicy,
  }
  
  const response = await fetch(url, fetchOptions)
  if (!response.ok) throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
  const text = await response.text();
  let methodString = ''
  let requestHeaderString = ''
  let responseHeaderString = ''

  // Create method string
  methodString = `${options.method || 'GET'} ${url}\n`
  
  // Create request header string
  for (let header of options.header || []) {
    let splitHeader = header.split(':')
    requestHeaderString += `> ${splitHeader[0]} ${splitHeader[1]}\n`
  }

  // Create response header string
  for (let header of Array.from(response.headers) as any[]) {
    responseHeaderString += `< ${header[0]} ${header[1]}\n`
  }

  // Log to command line
  if (options.verbose) {
    console.error(methodString)
    console.error(requestHeaderString)
    console.error(responseHeaderString)
  } else if (options.onlyHeaders) {
    console.error(requestHeaderString)
    console.error(responseHeaderString)
  }
  if (!options.onlyHeaders) {
    console.log(text.trim())
  }
}
