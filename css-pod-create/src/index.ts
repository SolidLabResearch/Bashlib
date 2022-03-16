// import * as fetch from "node-fetch";
const fetch = require('node-fetch')

export type AccountData = {
  name: string,
  email?: string,
  password?: string,
}

export type PodOptions = {
  baseURI?: string,
  idp?: string,
}

/**
 * @description
 * Function to create a data pod on the server
 *
 * @param {Object} options
 * @param {String} options.baseURI datapod server base url
 * @param {String} options.idp datapod server identity provider
 */
export default async function createPods(accountData: AccountData[], options: PodOptions) {
  const idp_register_url = options.idp || `${options.baseURI}/idp/register/`

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
  
    
    const res = await fetch(idp_register_url, {
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


// export async function populatePod(fetch: Function, options: any) {
//   const webId = options.webId
//   let dataRoot = options.dataroot || null
//   let directory = options.dir;

//   // Discover pod root if not given
//   if (!dataRoot) {
//     if (!webId) throw new Error('At least root uri or webId required')
//     let splitUrl = webId.split('/')
//     let currentIndex = splitUrl.length;

//     while (!dataRoot && currentIndex > 2) { // 2 for http(s)://
//       const url = splitUrl.slice(0, currentIndex).join('/') + '/';
//       const res = await fetch(url);

//       //TODO:: fix error handling
//       const linkHeaderText = res.headers.get('Link')
//       const linkHeaders = linkHeaderText && LinkHeader.parse(linkHeaderText).refs || []
      
//       for (let header of linkHeaders) {
//         if (header.rel = "type" && header.uri === "http://www.w3.org/ns/pim/space#Storage") {
//           dataRoot = url;
//           break;
//         }
//       }
//       currentIndex -= 1;
//     }
//     if (!dataRoot) {
//       console.error('Could not discover a pod root directory to post data to.')
//       return;
//     }

//     if (!dataRoot.endsWith('/')) dataRoot = dataRoot + "/";

//     // Extract files to put on pod
//     const files = readDirectoryRecursively(directory, '', [])
//     console.log('files', files)
    
//     // Populate datapod
//     for (let fileItem of files) {
//       const data = fs.readFileSync(fileItem.absolutePath, {encoding:'utf8', flag:'r'});

//       let destination = dataRoot + fileItem.relativePath

//       // TODO:: ERROR HANDLING
//       const res = await fetch(destination, {
//         method: 'PUT',
//         body: data,
//       })
//       console.log('Uploaded file to:', destination, res)
//       // fetch()
//     }
//   }
// }

// type FileItem = { absolutePath: string, relativePath: string }

// function readDirectoryRecursively(root_path: string, local_path: string, files: FileItem[]): FileItem[] {
//   // Make sure directory path always ends with a /
//   if (local_path && !local_path.endsWith('/')) local_path = local_path + '/'
//   if (root_path && !root_path.endsWith('/')) root_path = root_path + '/'
  
//   let path = root_path + local_path
  
//   const dir = fs.readdirSync(path)
//   const subdirLocalPaths: string[] = []

//   dir.forEach(function(resource: any) {
//     if (fs.statSync(path + "/" + resource).isDirectory()) {
//       subdirLocalPaths.push(local_path + resource) // Push the updated local path
//     } else {
//       files.push( { absolutePath: path + resource, relativePath: local_path + resource });
//     }
//   })

//   for (let subdirLocalPath of subdirLocalPaths) {
//     files = readDirectoryRecursively(root_path, subdirLocalPath, files);
//   }
  
//   return files;
// }

// // path.join(__dirname, dirPath, "/", resource)