# Bashlib
This repository contains a suite of functionality to facilitate use and development for Solid, mainly focused on supporting the [Community Solid Server](https://github.com/CommunitySolidServer/CommunitySolidServer).
The library provides functionality to interact with Solid environments from Node.JS and the CLI, providing shell-like functionality to facilitate the use of and development for Solid for people without knowledge of Solid or LDP.
It provides support for Solid authentication in the CLI environment.


*note: `Access Control Policies (ACP)` files `(.acp)`, used by the Enterprised Solid Server and on the Inrupt Pod Spaces, are currently not supported by this lib! Only `Web Access Controls (WAC)` files `(.acl)` are supported.


## Setup
To setup bashlib, use the following command.
``` 
npm install -g solid-bashlib
```
This will setup bashlib globally on your system, and allow you to use the command line tool from everywhere.
You can however also install it locally for a single project using:
``` 
npm install solid-bashlib
```
However, in this case the CLI interface will not be available globally unless specifically pointed to in the node_modules.
<hr>

## Tutorial
A tutorial for the CLI interface for Bashlib can be found [here](https://github.com/SolidLabResearch/Bashlib/blob/master/Tutorial-cli.md).

<hr>

# Javascript interface
The Javascript interface of the library exposes most functions that are available over the CLI interface.

## Handling authentication
This library does not handle authentication over the Javascript interface.
For authentication, please make use of the official [inrupt authentication libraries](https://github.com/inrupt/solid-client-authn-js).
When you have an authenticated fetch function using this authentication library, uou can pass this as an option parameter to the available functions to enable authentication requests.

## Available Functions



import copy from "./commands/solid-copy"
import list from "./commands/solid-list"
import remove from "./commands/solid-remove"
import move from "./commands/solid-move"
import find from "./commands/solid-find"
import query from './commands/solid-query'
import makeDirectory from "./commands/solid-mkdir"
import shell from "./commands/solid-shell"
import { listPermissions, changePermissions, deletePermissions } from './commands/solid-perms'

export { copy, list, remove, move, find, query, listPermissions, changePermissions, deletePermissions, makeDirectory, shell }
### fetch
This library DOES NOT expose a fetch function over its Javascript interface.
The authenticated fetch function is a result of authenticating using the [inrupt authentication libraries](https://github.com/inrupt/solid-client-authn-js). You can pass this fetch function to the other functions to make all requests happen authenticated.

### list
The [list](#list) function can be used to list resources in a container in a Solid environment.

```typescript
async function list(url: string, options: ListingOptions) 
```

**options:**
```typescript
type ListingOptions = {
  fetch,  // authenticated fetch function
  all? = false,   // also list authorization and metadata files in the listing
}
```

**returns:** 
```typescript
Promise<ResourceInfo>
```
```typescript
type ResourceInfo = {
  url: string,                // url of the resource
  relativePath?: string,      // relative url to the resource based on the url parameter given to the function. (e.g. /profile/card when given your pod base.)
  isDir: boolean,             // resource is a directory
  modified?: Date | null,     // modification date of the resource as date
  mtime?: number | null,      // modification date of the resource as mtime
  size?: number | null,       // size of the resource
  types?: string[],           // types of the resource
  metadata?: ResourceInfo     // ResourceInfo of found metadata file
  acl?: ResourceInfo,         // ResourceInfo of found acl file
}>
```


### copy
The [copy](#copy) function provides functionality to copy files to and from both the local filesystem and a Solid environement. Recursive copying of containers is set as a default.

*function behavior*
This function copies the given source resource to the given destination resource. It will by default overwrite existing files, unless the `noOverwrite` option is set. 

| source/destination | resource                                    | container                                                                  |
|----------------------|---------------------------------------------|----------------------------------------------------------------------------|
| resource             | copies resource to destination resource URL | copies resource into target container/directory (will retain resource name)          |
| container            | X                                           | copies all resources from source container/directory to target container/directory recursively |



```typescript
async function copy(
  src: string,          // source URL
  dst: string,          // destination URL
  options: CopyOptions  // options
) 
```
```typescript
type CopyOptions = {
  fetch,                // authenticated fetch function
  all? = false,         // also copy authorization and metadata files in the listing
  noOverwrite? = false, // do not overwrite any existing files
} 
```
**returns**
```typescript
Promise<void>
```

### move
The move function provides functionality to move files to and from both the local filesystem and a Solid environement. 

*function behavior*
This function follows the same behavior as the [copy](#copy) command.
It removes the source file(s) after copying them to their destination ONLY if the source files are stored on the Solid pod. It wil NOT remove source files stored on the local file system (in this case it's the same as the copy command).

```typescript
move(
  source: string,       // source URL
  destination: string,  // destination URL
  options: MoveOptions  // options
)
```

```typescript
 type MoveOptions = {
  fetch,          // authenticated fetch function
  all? = false,   // also move authorization and metadata files in the listing
}
```

**returns**
```typescript
Promise<void>
```
### remove

### find

### query

### makeDirectory

### |Permissions|
#### listPermissions

#### changePermissions

#### deletePermissions






















## CLI interface
The CLI interface is automatically installed on globally installing the library
You can use it as follows from your command line:

```
solid --help
```
or use a shorter form:
```
sld --help
```

## Handling authentication


### CLI


### Javascript



























### [Generating Client Credentials tokens for authentication](/bashlib/css#client-credentials-token-generation)
*Compatibility: CSSv4.0.0 - current*
The [create-token](/bashlib/css#client-credentials-token-generation) module handles the creation of [Client Credentials tokens](https://github.com/CommunitySolidServer/CommunitySolidServer/blob/main/documentation/client-credentials.md), a CSS-specific authentication mechanism that does not require browser interaction. The resulting tokens are stored on the file system, and can be used to automatically authenticate users in Node.JS and on the CLI.

### [Building an authenticated fetch using Node.JS or CLI](/bashlib/css#creating-an-authenticated-fetch)
This module handles the building of an authenticated fetch function for Node.JS.
It provides multiple options to authenticate the user.

#### [Interactive](/bashlib/css#interactive)
*compatibility: all versions of all pods*
The interactive login option authenticates the user via an interactive prompt in the browser. This follows the default [Inrupt Node.JS authentication flow](https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/authenticate-nodejs/). The active session information is stored, resulting in subsequent runs of the application re-using previous sessions where possible.


#### [From Client Credentials token](/bashlib/css#from-client-credentials-token)
*compatibility: CSSv4.0.0 - current*
The Client Credentials Token generated by the [create-token]() module is used to automatically authenticate the user in Node.JS without any browser interaction. The active session information is stored, resulting in subsequent runs of the application re-using previous sessions where possible.

#### [From User Credentials](/bashlib/css#from-client-credentials)

*compatibility: CSSv2.x.x -* **deprecated**
This authentication option makes use of user credentials being passed to authenticate the user. For this, it hijacks the browser flow for this specific CSS version. Using a [Client Credentials token]() authentication flow with a more up-to-date version of the CSS is advised.

<hr>

## [Bashlib-solid](/bashlib/solid)
[Bashlib-solid](/bashlib/solid) provides a set of functions to interact with Solid environments from Node.JS and the CLI, providing shell-like functionality to facilitate the use of and development for Solid for people without knowledge of Solid or LDP. All modules provide their functionality both on the CLI interface, as well as through Node.JS.

### CLI-Interface
The CLI-interface exposes all functions as commands on the CLI. 
It makes use of the [Authentication module of Bashlib-css](/bashlib/css#creating-an-authenticated-fetch) to authenticate the user.

### Node.JS Interface
All functions are exposed in Node.JS as exports of the Bashlib-solid library.
Authentication can be done using the [Authentication module of Bashlib-css](/bashlib/css#creating-an-authenticated-fetch), or you can provide a custom authenticated fetch function.

### Functions
This is a listing of all the functions made available on the CLI and Node.JS.

#### [Fetch](/bashlib/solid#fetch)
The [fetch](/bashlib/solid#fetch) function can be used to fetch authenticated resources from a Solid environment.

#### [List](/bashlib/solid#list)
The [list](/bashlib/solid#list) function can be used to list resources in a container in a Solid environment.
It provides additional CLI options include .acl files and more if needed.

#### [Tree](/bashlib/solid#tree)
The [tree](/bashlib/solid#tree) function can be used to write a tree-structure of all resources in a container in a Solid environment to the command line. In Node.JS, this function writes the same output to the console, and returns nothing. When listing files in Node.JS, please use the [find](#find) function.

#### [Copy](/bashlib/solid#copy)
The [copy](/bashlib/solid#copy) function provides functionality to copy files to and from both the local filesystem and a Solid environement. Recursive copying of containers is set as a default.

#### [Move](/bashlib/solid#move)
The [move](/bashlib/solid#move) function provides functionality to move files to and from both the local filesystem and a Solid environement. Recursive moving of containers is set as a default.

#### [Remove](/bashlib/solid#remove)
The [remove](/bashlib/solid#remove) function provides functionality to remove files on a Solid environement. Recursive removing of containers is added with a flag to prevent accidents.

#### [Mkdir](/bashlib/solid#mkdir)
The [mkdir](/bashlib/solid#mkdir) function provides functionality to create empty containers in a Solid environment.

#### [Touch](/bashlib/solid#touch)
The [Touch](/bashlib/solid#touch) function provides functionality to create empty resources in a Solid environment.

#### [Find](/bashlib/solid#find)
The [find](/bashlib/solid#find) function allows you to recursively find resources in a container in a Solid environment matching a given file name regex.

#### [Query](/bashlib/solid#query)
The [query](/bashlib/solid#query) function allows you to recursively query resources in a container in a Solid environment using a given [SPARQL](https://www.w3.org/TR/rdf-sparql-query/) query.

#### [Perms](/bashlib/solid#perms)
The [perms](/bashlib/solid#perms) function provides functionality for the listing and editing of resource permissions in a Solid environment.

#### [Edit](/bashlib/solid#edit)
The [edit](/bashlib/solid#edit) function is only available on the CLI interface! 
It can be used to fetch a remote resource, edit it locally in your editor, and put the result back on the resource location.
