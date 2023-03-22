# TypeScript Interface
The commands available for the CLI are nearly all exported as functions by the `Bashlib-solid` library in Node.JS. For more information on the working of the functions, please look above in the explanation of the CLI commands. 

### Functions
The following is a list of available functions that are exported by the Node.js library.
#### list
This command lists the resources contained by the url argument.
The passed URL should be a container, or the command will fail.

The option `all` can be set to include `.acl` files in the listing.

*usage*
```
import { list } from "/install/location"

let url = ...                       // container URL
let options = {
// general command options
  fetch?: typeof globalThis.fetch,  // An (authenticated) fetch function
  verbose?: boolean,                // Log all operations
  logger?: Logger,                  // Custom logging object, logs are sent to the terminal if this is left empty
// options specific to list
  all?: boolean,                    // Include .acl resources in the listing
  full?: boolean                    // Return full URL's instead of relative URL's
}

await list(url, options)
```

*returns*

An array of objects of the `ResourceInfo` interface:
```
ResourceInfo: {
  url: string,              // the full resource URL
  relativePath?: string,    // the resource relative URL
  isDir: boolean,           // flag if directory or not
  modified?: Date | null,   // last modified date
  mtime?: number | null,    // last modified date as mtime
  size?: number | null,     // resource size
  types?: string[],         // resource types
  metadata?: ResourceInfo   // resourceInfo of metadata resource
  acl?: ResourceInfo,       // resourceInfo of .acl resource
}
```

#### copy

This command copies files/resources from and to both the local filesystem and solid pods.
Both the source and destination arguments can be either a local path or a URL on a solid pod. Resources that cannot be read due to lack of authorization will be ignored, but can be notified by setting the `verbose` option to `true`.
Containers/directories are copied recursively by default.
The command will return an error when it's trying to copy a container to a file.
Copying a file/resource to a container/directory will create a new file in the container/directory with the same name, and **overwrite it if it already exists.**

*usage*
```
import { copy } from "/install/location"

let src = ...
let dst = ...

let options = {
// general command options
  fetch?: Function,                // an (authenticated) fetch function
  verbose?: boolean,               // log all operations
  logger?: Logger                  // Custom logging object, logs are sent to the terminal if this is left empty
// options specific to copy
  all?: boolean,                   // include .acl resources in the listing
  interactiveOverride?: boolean,   // Determine which if the file should be overwritten, using CLI
  noOverride?: boolean,            // don't override files that already exist
}

await copy(src, dst, options)
```

*returns*

`copy` returns an object with a property `source`, that consists of a `resourceToTransfer` object, and a property `destination`, that consists of a `destinationInfo` object. Below is some more information about these two objects:
```
let resourcesToTransfer : { 
  files: FileInfo[],            // an array of files that have been copied
  directories: FileInfo[],      // an array of directories that have been copied
  aclfiles: FileInfo[]          // an array of .acl files that have been copied
};

let destinationInfo : { 
  files: FileInfo[],            // an array of info about the destination of the files that have been copied
  directories: FileInfo[],      // an array of info about the destination of the directories that have been copied
  aclfiles: FileInfo[]          // an array of info about the destination of the .acl files that have been copied
};
```


#### move

This command moves files/resources from and to both the local filesystem and solid pods.
Its functionality is equal to copying the files/resources from the source to the destination, and then removing the source. **note: if the source is the local filesystem, files will not be removed, and the command will be identical to a copy.**
Resources that cannot be read due to lack of authorization will be ignored, but can be notified setting the `verbose` option to `true`.
Containers/directories are always be moved recursively  by default.
The command will return an error when it's trying to move a container to a file.
Moving a file to a container will create a new file in the container with the same name, and **overwrite it if it already exists.**

*usage*

```
import { move } from "/install/location"

let src = ...
let dst = ...

let options = {
// general command options
  fetch?: any,         // an (authenticated) fetch function
  verbose?: boolean,  // log all operations
  logger?:            // Custom logging object, logs are sent to the terminal if this is left empty
// options specific to move
  all?: boolean,      // include .acl resources in the listing
} 

await move(src, dst, options)
```

*returns*
The command returns when the source has been moved


#### remove

This command removes resources from solid environments.
**Removing a container requires the `recursive` option to be set to `true` to recursively remove resources from containers! This is in contrast to copy and move commands that set this automatically.**
`.acl` resources are not explicitly removed by this command. We expect these auxiliary resources to be deleted by the Pod Provider on resource deletion.

*usage*
```
import { remove } from "/install/location"

let url = ...

let options = {
// general command options
  fetch?: any,          // an (authenticated) fetch function
  verbose?: boolean,    // log all operations
  logger?: Logger       // Custom logging object, logs are sent to the terminal if this is left empty
// options specific to remove
  recursive?: boolean,  // include .acl resources in the listing
} 

await remove(url, options)
```

*returns*
The command reutns when the source has been removed.

#### makeDirectory
This command creates a new empty container on a Solid pod on the given URL.
Missing parent containers are created automatically.

*usage*
```
import { makeDirectory } from "/install/location"

let url = ...

let options = {
// general command options
  fetch?: any,         // an (authenticated) fetch function
  verbose?: boolean,   // log all operations
  logger?: Logger      // Custom logging object, logs are sent to the terminal if this is left empty
} 

await makeDirectory(url, options)
```

*returns*
<!-- TODO: dexa moet eerst fixen dat deze functie niet teveel internal stuff teruggeeft -->

#### find

This command finds the resources contained by the URL argument matching the passed string argument.
The passed URL should be a container, or the command will fail.

The `--all` flag can be set to include `.acl` files in the results.

Given a container, the find function will look for all the files that have a matching filename to the provided one.

*usage*
```
import { find } from "/install/location"

let container = ...
let filename = ... (string that is converted into a RegEx internally to match filenames)

let options = {
// general command options
  fetch?: any,                 // an (authenticated) fetch function
  verbose?: boolean,           // log all operations
  logger?: Logger              // Custom logging object, logs are sent to the terminal if this is left empty
// options specific to find
  all?: boolean,               // include .acl resource in search
  full?: boolean,              // look for name matches in the full resource URL instead of relative
  listDirectories?: boolean,   // also match container names in find
} 

await find(url, options)
```

*returns*

`find` returns an **async** iterator of FileInfo objects, where the filename of the file matches the `filename` provided when calling the function. Nothing is returned whan no files are found with a matching name in `container`. More info about the structure of `FileInfo` is listed below:
```
type FileInfo = { 
  absolutePath: string, 
  relativePath?: string,
  directory?: string, 
  contentType?: string,
  buffer?: Buffer,
  blob?: Blob,
  loadFile?: FileLoadingFunction
}
```


#### query
Execute SPARQL queries against resources located at the given URL, either as a single resource or as a collection of resources (the URL will then need to be the location of the container).

*usage*
```
import { query } from "/install/location"


let url = ...         // location of the resource(s)
let query = ...       // represents a SPARQL query

let options = {
// general command options
  fetch?: any,         // an (authenticated) fetch function
  verbose?: boolean,  // log all operations
  logger?: Logger     // Custom logging object, logs are sent to the terminal if this is left empty
// options specific to query
  all?: boolean,      // include .acl resources in querying

} 

await query(url, query, options)
```

*returns*

An **async** iterator is returned with objects with the properties `fileName` and `bindings`. The `fileName` property contains the URL of the file that was queried.

This function uses Comunica query engine under the hood. For more information about the resulting bindings, please consult [this page](https://comunica.dev/docs/query/advanced/bindings/).


#### perms

These commands only support `Web Access Controls resources (.acl)`, and don't support `Access Control Policies resources (.acp)`.

##### listPermissions
This command enables the listing of resource permisssions.
*usage*
```
import { listPermissions } from "/install/location"

let url = ...

let options = {
// general command options
  fetch?: any,         // an (authenticated) fetch function
  verbose?: boolean,   // log all operations
  logger?: Logger      // Custom logging object, logs are sent to the terminal if this is left empty
} 

await listPermissions(url, options)
```

*returns*

An object containing the current permissions of the resource URL is returned. This object is of the IPermissinsListing interface, which has the following properties:
```
interface IPermissionListing {
  access: {
    agent?: null  | Record<string, Access>,   // the agent ID's that have acces to this resource
    group?: null  | Record<string, Access>,   // the group ID's that have acces to this resource
    public?: null | Access                    // the resource has public access
  },
  default?: {
    agent?: null  | AgentAccess,              // the agent ID's that have acces to this resource, inherited from a parent resource
    group?: null  | Record<string, Access>,   // the group ID's that have acces to this resource, inherited from a parent resource
    public?: null | Access                    // the resource has public access, inherited from a parent resource
  }
  resource?: {
    agent?: null  | AgentAccess,              // the agent ID's that have acces to this resource, not inherited but explicitely given
    group?: null  | Record<string, Access>,   // the group ID's that have acces to this resource, not inherited but explicitely given
    public?: null | Access                    // the resource has public access, not inherited but explicitely given
  }
}
```


##### changePermissions
This command enables the editing of resource permisssions.
**note: Editing permissions for a specific WebID or public permissions will remove all prior assigned permissions.** E.g. editing permissions to assign read permissions to a WebID will remove prior assigned write permissions!

*usage*
```
import { changePermissions } from "/install/location"

let url = ...

let options = {
// general command options
  fetch?: any,         // an (authenticated) fetch function
  verbose?: boolean,  // log all operations
  logger?: Logger     // Custom logging object, logs are sent to the terminal if this is left empty
} 

let operations = [ 
  {
    type: "agent" | 'group' | 'public', // type of permission to change
    id?: string,                        // (type: agent | group) WebID to change permissions for 
    read?: boolean,                     // assign read permissions
    write?: boolean,                    // assign write permissions
    append?: boolean,                   // assign append permissions
    control?: boolean,                  // assign control permissions
    default?: boolean,                  // set permissions as default
  }, ...
]

await changePermissions(url, operations, options)
```

*returns*

the function returns if the permissions are changed correctly.

##### deletePermissions
This deletes all of the permissions for a specific resource.

*usage*
```
import { deletePermissions } from "/install/location"

let url = ...

let options = {
// general command options
  fetch?: any,         // an (authenticated) fetch function
  verbose?: boolean,  // log all operations
  logger?: Logger     // Custom logging object, logs are sent to the terminal if this is left empty
} 

await deletePermissions(url, options)
```

*returns*

The function returns of the deletion of the permissions was successful.

##### generateCSSToken
Create an authentication token (only for WebIDs hosted on a Community Solid Server v4.0.0 and up).
*usage*
```
let options = IClientCredentialsTokenGenerationOptions {
  name: string,
  email: string,
  password: string,
  idp: string,
  clientCredentialsTokenStorageLocation?: string // Storage location of the output client credentials token.
}

await generateCSSToken(options)
```

*returns*
The generated CSS token ir returned as an object of the CSSToken type:

```
type CSSToken = {
  id: string,
  secret: string,
  controls: any,
  name: string,
  idp: string,
  email: string,
}
```

##### authenticateCSSToken
This function allows you to get authenticated access to a Solid Pod, using the token generated by `generateCSSToken`.

*usage*
```
import { authenticateCSSToken } from "/install/location"

let token: { 
  id = ...             // user ID generated by generateCSSToken
  secret = ...         // secret generated by generateCSSToken 
}

let idp = ...          // identityprovider

```

*returns*

Information about the current session is returned in the form of an object of the SessionInfo interface:
```
interface SessionInfo {
  fetch: typeof fetch   // a generic fetch function
  webId?: string        // WebId of the user
}
```

#### touch
This function creates a new empty resource on a Solid pod on a given URL.

<!-- todo: Als er geen file extension staat bij de resource dan gaat hij automatisch assumen dat je utrtle aan het aanmaken bent. -->

*usage*
```
import { touch } from "/install/location"

let url = ...          // URL of the new file

let options = {
// general command options
  fetch?: any,         // an (authenticated) fetch function
  verbose?: boolean,   // log all operations
  logger?: Logger      // Custom logging object, logs are sent to the terminal if this is left empty
} 

await touch(url, options)
```

*returns*

The function returns when the file has been created correctly.

#### edit

The edit command is a convenient command created to edit resources on your Solid pod locally.
The command will default to use the default system editor. 
After editing, the result will be used to overwrite the original resource.
Please keep in mind that there is no locking mechanism for multiple users editing the same file simultaneously.

The `editor` option can be set to specify the path to the executable of the editor to be used.

This command allows you to edit local and remote files.

*usage*
```
import { edit } from "/install/location"

let url = ...

let options = {
// general command options
  fetch?: any,         // an (authenticated) fetch function
  verbose?: boolean,   // log all operations
  logger?: Logger      // Custom logging object, logs are sent to the terminal if this is left empty
// options specific to edit
  editor?: string,     // path to the executable of the editor to be used
  touch?: boolean,     // set to true if the resource does not exist yet
} 

await edit(url, options)
```
*returns*

The function returns if the edit was executed correctly.

