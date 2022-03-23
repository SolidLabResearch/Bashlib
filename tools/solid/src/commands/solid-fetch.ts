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
  
  try {
    const fetched = await fetch(url, fetchOptions)
    const text = await fetched.text();
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
    for (let header of Array.from(fetched.headers) as any[]) {
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
  } catch (e: any) {
    throw new Error(`Fetch operation failed for ${url}: ${e.message}`)
  }
}
