# Bashlib-solid
The Bashlib-solid library provides a set of functions for interacting with Solid environments from Node.JS and the CLI. The aim is to provide shell-like functionality to facilitate the use of and development for the Solid ecosystem with a low requirement of specific knowledge of Solid and LDP.
This library makes heavy use of the [Developer tools by inrupt for Solid](https://docs.inrupt.com/developer-tools/javascript/client-libraries/using-libraries/).

*note: `Access Control Policies (ACP)` files `(.acp)`, used by the Enterprised Solid Server and on the Inrupt Pod Spaces, are not supported by this lib! Only `Web Access Controls (WAC)` files `(.acl)` are supported.

## Installing
Navigate to the `bashlib/solid` folder and run the following command:
```
npm run build;
```

## Usage
The developed functionality can be accessed from both the **[CLI](#cli)**, and in **[Node.js](#nodejs)**


## CLI
All available commands are presented through the CLI interface found in `bin/solid.js`

```
node bin/solid.js command [command_options] <command_args>
```
### authentication options
In this section we detail the available authentication options in the CLI interface. These make use of the [authentication module](../css#creating-an-authenticated-fetch) exposed by [Bashlib-css](../css).

The **interactive** auth option opens a browser window that can be used to interacitvely authenticate you through the browser for the given identity provider value. This follows the default [Inrupt Node.JS authentication flow](https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/authenticate-nodejs/). This option stores session information in your filesystem and re-uses a previous session where possible to speed up subsequent commands without requiring re-authentication.
*A custom port used for the redirect in the authentication flow can be set using [environment variables](#environment-variables).*

The **token** auth option makes use of [Client Credentials tokens](https://github.com/CommunitySolidServer/CommunitySolidServer/blob/main/documentation/client-credentials.md) available for the Community Solid Server as of version 4. The authentication flow using these tokens happens entirely in Node.JS, and requires **no browser interaction!** This option stores session information in your filesystem and re-uses a previous session where possible to speed up subsequent commands without requiring re-authentication. Information on how to create a Client Credentials token can be found in the [create-token](../css#client-credentials-token-generation) module of [Bashlib-css](../css).
**note: This option is only available for Solid-accounts hosted by a Community Solid Server version 4.0.0 and up.**

The **credentials** auth option uses client credentials to authenticate the user. It requires a valid *email*, *password* and *identityprovider* value to be given and hijacks the browser login flow used by the Community Solid Server version 2.x.x. When possible, please make use of the *token* authentication option, as this does not require the user credentials to be stored on the system! 
*A custom port used for the redirect in the authentication flow can be set using [environment variables](#environment-variables).*
**note: This option is deprecated, and only supports versions 2.x.x of the Community Solid Server.**

When failing to authenticate, the program will try to continue unauthenticated.

#### CLI authentication
Before being able to execute any commands, an authenticated connection needs to be made to the solid pod by uding the *auth* command

##### auth
Command to edit authentication options for Bashlib.

*usage*
```
node bin/solid.js auth [command] [options]
```
*commands*
###### show
Show current authentication settings.

*usage*
```
node bin/solid.js auth show [options]
```
*options*
```
  -p, --pretty     Display current authentication settings in table format 
```
###### list
List available authentication options.

*usage*
```
node bin/solid.js auth list [options]
```
*options*
```
  -p, --pretty     Display available authentication in table format 
```
###### set
Set current authentication option.

*usage*
```
node bin/solid.js auth show [webid]
```
*options*
```
  webid       Set active WebID directly, without requiring manual selection
```
###### remove
Removes the authentication information for a specific WebID or for all saved WebIDs.

*usage*
```
node bin/solid.js auth remove [string]
```
*options*
```
  string      webid | all
```
###### clear
Clear currently authenticated WebID.

*usage*
```
node bin/solid.js auth clear
```
###### create-token
create authentication token (only for WebIDs hosted on a Community Solid Server v4.0.0 and up).

*usage*
```
node bin/solid.js auth create-token [options]
```
*options*
```
  -b, --base-url <string>  URL of your CSS server
  -n, --name <string>      Token name
  -e, --email <string>     User email
  -p, --password <string>  User password
  -v, --verbose            Log actions to the CLI
```

#### The config file
You can use a config file with the `-c, --config <path>` option.
This config file will be used to autofill any missing authentication options.
The config file must adhere to the following format, and may include any of the following options:
```
{
  auth: "token" | "credentials" | "interactive" | "none",
  idp: "https://your.pod.identity.provider.org/",
  email: "User email address",
  password: "User password",
  tokenStorage: "/path/of/token/file",
  sessionStorage: "/path/of/session/storage/file",
  port: <number>
  silent: true | false,
}
```
This option is the preferred way to passing user credentials when using credentials based authentication.

#### environment variables
Finally, the environment variables can be used to pass the above authentication options.

```
BASHLIB_AUTH=<auth type> 
BASHLIB_IDP=<identity provider> 
BASHLIB_TOKEN_STORAGE=<client_credentials_token_storage_location>
BASHLIB_SESSION_STORAGE=<session_info_storage_location>
BASHLIB_CONFIG=<config_file_location>
BASHLIB_AUTH_PORT=<number>
```

### URL prefix options
The CLI interface provides some default prefixes you can use in all URL values for all commands. 
The prefix is replaced by the found value when running the command.

```
webid: (The user's WebID)
root: (The root of your data pod - This will not be found when you have a custom WebID that is not in the domain of your Solid pod!)
inbox: (The user inbox - when available)

example usage:
node bin/solid.js fetch webid:
``` 
Be sure to include the `:` at the end of the prefix!
### commands
In this section, all available commands in the CLI interface are listed and explained.

#### fetch /cat
This command enables authenticated fetching of resources from the CLI.

*usage*
```
node bin/solid.js fetch [options] <url>
```
*arguments*
```
  url                   URL of the file to be fetched
```
*options*
```
  -v, --verbose          Write out full response and all headers
  -H, --only-headers     Only write out headers
  -m, --method <string>  GET, POST, PUT, DELETE, ...
  -b, --body <string>    The request body
  -F, --file <string>    File containing the request body. Ignored when the --body flag is set.
  -h, --header <string>  The request header. Multiple headers can be added separately. e.g. -h "Accept: application/json" -h "..."
```

#### list / ls
This command lists the resources contained by the url argument.
The passed URL should be a container, or the command will fail.

The `--all` flag can be set to include `.acl` files in the listing.
The `--long` format provides a table of the resources, and indicates the connection between a resources and their `.acl` files.

*usage*
```
node bin/solid.js list [options] <url>
```
*arguments*
```
  url            URL of the container to be listed
```
*options*
```
  -a, --all      List all resources (includes .acl and .meta resources)
  -f, --full     List resources with their full uri (defaults to showing only resource name)
  -l, --long     List in long format
  -v, --verbose  Log all operations to the CLI
```

#### tree
This command gives a recursive overview of the resources contained by the URL argument.
The passed URL should be a container, or the command will fail.

The `--all` flag can be set to include `.acl` files in the listing.

*usage*
```
node bin/solid.js tree [options] <url>
```
*arguments*
```
  url            Base container to construct tree over
```
*options*
```
  -a, --all      List all resources (includes .acl and .meta resources)
  -f, --full     List resources with their full URL (defaults to showing only resource name)
  -v, --verbose  Log all operations to the CLI
```


#### copy
This command copies files/resources from and to both the local filesystem and solid pods.
Both the source and destination arguments can be either a local path or a URL on a solid pod. Resources that cannot be read due to lack of authorization will be ignored, but can be notified using the `--verbose` flag.
Containers/directories are copied recursively by default.
The command will return an error when it's trying to copy a container to a file.
Copying a file/resource to a container/directory will create a new file in the container/directory with the same name, and **overwrite it if it already exists.**

The `--all` flag can be set to include `.acl` files when copying.

*usage*
```
node bin/solid.js copy [options] <source> <destination>
```
*arguments*
```
  src                         File or directory to be copied
  dst                         Destination to copy file or directory to
```
*options*
```
  -a, --all                   Copy .acl files in recursive directory copies
  -i, --interactive-override  Interactive confirmation prompt when overriding existing files
  -n, --no-override           Do not override existing files
  -v, --verbose               Log all read and write operations to the CLI
```

#### move
This command moves files/resources from and to both the local filesystem and solid pods.
Its functionality is equal to copying the files/resources from the source to the destination, and then removing the source. **note: if the source is the local filesystem, files will not be removed, and the command will be identical to a copy.**
Resources that cannot be read due to lack of authorization will be ignored, but can be notified using the `--verbose` flag.
Containers/directories are always be moved recursively  by default.
The command will return an error when it's trying to move a container to a file.
Moving a file to a container will create a new file in the container with the same name, and **overwrite it if it already exists.**

The `--all` flag can be set to include `.acl` files when moving.

*usage*
```
node bin/solid.js move [options] <url> <query>
```
*arguments*
```
  src            File or directory to be moved
  dst            Destination of the move
```
*options*
```
  -a, --all                   Move .acl files when moving directories recursively
  -i, --interactive-override  Interactive confirmation prompt when overriding existing files
  -n, --no-override           Do not override existing files
  -v, --verbose               Log all operations to the CLI
```

#### remove / rm
This command removes resources from solid environments.
**Removing a container requires the -r flag to be set to recursively remove resources from containers! This is in contrast to copy and move commands that set this automatically.**
`.acl` resources are not explicitly removed by this command. We expect these auxiliary resources to be deleted by the Pod Provider on resource deletion.

*usage*
```
node bin/solid.js remove [options] <urls...>
```
*arguments*
```
  urls             URL's of resources to be listed
```
*options*
```
  -r, --recursive  Recursively removes all files in given container
  -v, --verbose    Log all operations to the CLI
```

#### mkdir
This command creates a new empty container on a Solid pod on the given URL.
Missing parent containers are created automatically.

*usage*
```
node bin/solid.js mkdir [options] <url>
```
*arguments*
```
  url            URL of the new container to be created
```
*options*
```
  -v, --verbose  Log all operations to the CLI
```

#### touch
This command creates a new empty resource on a Solid pod on a given URL.

*usage*
```
node bin/solid.js touch [options] <url>
```
*arguments*
```
  url            URL of the file to be created
```
*options*
```
  -v, --verbose  Log all operations to the CLI
```

#### find
This command finds the resources contained by the url argument matching the passed string argument.
The passed URL should be a container, or the command will fail.

The `--all` flag can be set to include `.acl` files in the results.

*usage*
```
node bin/solid.js find [options] <url> <match>
```
*arguments*
```
url              URL of the container to start the search
filename         Filename to match, processed as JavaScript RegExp(filename) function
```
*options*
```
  -a, --all      Match all resources (includes .acl and .meta resources)
  -f, --full     Match resources with their full uri (defaults to matching with their relative path compared to the passed URI argument)
  -v, --verbose  Log all operations to the CLI
```

#### query
This command queries over the given resource, or recursively over all contained resources in case the given url is a container. The query parameter MUST be a valid SPARQL query. All non-rdf resources will be ignored.

The `--all` flag can be set to include `.acl` files in the listing.
The `--full` flag will show the full file URL in the returned results, instead of the relative path to the queried container.
The `--pretty` flag will show the results in a table format.

*usage*
```
node bin/solid.js query [options] <url> <query>
```
*arguments*
```
  url              Resource to query; in case of container recursively queries all contained files
  query            SPARQL query string | file path containing SPARQL query when -q flag is active

```
*options*
```
  -a, --all        Query all resources (includes .acl and .meta resources)
  -q, --queryfile  Process query parameter as file path of SPARQL query
  -p, --pretty     Pretty format
  -f, --full       List resources with their full uri (defaults to showing only relative URI to the passed url argument)
  -p, --pretty     Return the results in a table format
  -v, --verbose    Log all operations to the CLI
```

#### perms / chmod
This command enables the listing, editing and removing of resource permisssions. This command only supports `Web Access Controls resources (.acl)`, and does not support `Access Control Policies resources (.acp)`. Editing permissions can be done by supplying a set of permissions. These permissions must be formatted according to the description below.
**note: Editing permissions for a specific WebID or public permissions will remove all prior assigned permissions.** E.g. editing permissions to assign read permissions to a WebID will remove prior assigned write permissions!

The `--pretty` flag can be set to display the results in a table format when listing resource permissions and is ignored for other options.

*usage*
```
node bin/solid.js perms [options] <operation> <url> [permissions]
```
*arguments*
```
  operation      list, edit, delete
  url            Resource URL
  permissions    Permission operations to edit resource permissions. 
                    Formatted according to id=[d][g][a][c][r][w]. 
                    For public permissions please set id to "p". 
                    For the current authenticated user please set id to "u".
                    To set updated permissions as default, please add the [d] option as follows: id=d[g][a][c][r][w]
                    To indicate the id as a group id, please add the [g] option as follows: id=g[d][a][c][r][w]```
```
*options*
```
  -p, --pretty   Return the results in a table format
  -v, --verbose  Log all operations to the CLI
```
*operations*
```
list            List the permissions for the current resource
edit            Edit the permissions for the current resource
remove          Remove the ACL file for the current resource
```
*permissions* 
```
setting public permissions
p=[d][a][c][r][w]

setting permissions for the currently authenticated webId
u=[d][a][c][r][w]

setting permissions for a specific webId
webId=[d][a][c][r][w]

permissions options: 
[d] : set as default (will be applied to contained resources recursively unless otherwise specified by the resource ACL).
[r] : apply read permissions (if this is not set, read permissions are set to false)
[w] : apply write permissions (if this is not set, write permissions are set to false)
[a] : apply append permissions (if this is not set, append permissions are set to false)
[c] : apply control permissions (if this is not set, control permissions are set to false)
[g] : defines the <webId> as a group id instead of a webId


example: setting default read and write permissions for http://pod.com/bob/profile/card#me on resource https://pod.com/resource results in:
> node bin/solid.js perms edit https://pod.com/resource http://pod.com/bob/profile/card#me=rwd

example2: setting personal and public default read access on resource https://pod.com/resource results in:
> node bin/solid.js perms edit https://pod.com/resource p=rd u=rd

```

#### edit
The edit command is a convenient command created to edit resources on your Solid pod locally.
The command will default to use the default system `$editor`. 
After editing, the result will be used to overwrite the original resource.
Please keep in mind that there is no locking mechanism for multiple users editing the same file simultaneously.

The `--header` flag can be used to pass custom headers when retrieving the resource to e.g. request the resource in a specific RDF format.
The `--editor` flag can be set to specify the path to the executable of the editor to be used.

*usage*
```
node bin/solid.js edit [options] <url>
```
*arguments*
```
  url                                       URL of the file to be edited
```
*options*
```
  -e, --editor <path_to_editor_executable>  Use custom editor
  -t, --touch                               Create the file if dosn't exist
  -h, --header <string>                     The request header. Multiple headers can be added separately. These follow the style of CURL. e.g. --header "Content-Type: application/json"
  -v, --verbose                             Log all operations to the CLI
```

## Node.js
The commands above are nearly all exported as functions by the `Bashlib-solid` library in Node.JS. For more information on the working of the functions, please look above in the explanation of the CLI commands. 

### Functions
The following is a list of available functions that are exported by the Node.js library.
#### list
Returns an array, containing information about the contents of the given container.

*usage*
```
import { list } from "/install/location"

let url = ...                       // container URL
let options = {
  fetch?: typeof globalThis.fetch,  // An (authenticated) fetch function
  verbose?: boolean,                // Log all operations
  logger?: Logger,                  // Custom logging object, logs are sent to the terminal if this is left empty

  all?: boolean,                    // Include .acl resources in the listing
  full?: boolean                    // Return full URL's instead of relative URL's
}

await list(url, options)
```

*returns*

An array of objects of the ```ResourceInfo``` interface:
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
<!-- todo: nog aanvullen wat dit exact doet -->
This command copies files/resources from and to both the local filesystem and solid pods.
*usage*
```
import { copy } from "/install/location"

let src = ...
let dst = ...

let options = {
  fetch?: Function,                // an (authenticated) fetch function
  verbose?: boolean,               // log all operations
  logger?: Logger                  // Custom logging object, logs are sent to the terminal if this is left empty

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

*usage*

<!-- todo: uitleg nog aanvullen -->

```
import { move } from "/install/location"

let src = ...
let dst = ...

let options = {
  fetch?: any,         // an (authenticated) fetch function
  verbose?: boolean,  // log all operations
  logger?:            // Custom logging object, logs are sent to the terminal if this is left empty

  all?: boolean,      // include .acl resources in the listing
} 

await move(src, dst, options)
```

*returns*
The command returns when the source has been moved


#### remove
<!-- todo: uitleg fixen -->
<!-- Remove verwijdert nooit local sources -->
*usage*
```
import { remove } from "/install/location"

let url = ...

let options = {
  fetch?: any,          // an (authenticated) fetch function
  verbose?: boolean,   // log all operations
  logger?: Logger      // Custom logging object, logs are sent to the terminal if this is left empty

  recursive?: boolean, // include .acl resources in the listing
} 

await remove(url, options)
```

*returns*
The command reutns when the source has been removed

#### makeDirectory
<!-- todo: uitleg hier fixen -->

*usage*
```
import { makeDirectory } from "/install/location"

let url = ...

let options = {
  fetch?: any,         // an (authenticated) fetch function
  verbose?: boolean,   // log all operations
  logger?: Logger      // Custom logging object, logs are sent to the terminal if this is left empty
} 

await makeDirectory(url, options)
```

*returns*
<!-- TODO: dexa moet eerst fixen dat deze functie niet teveel internal stuff teruggeeft -->

#### find

Given a container, the find function will look for all the files that have a matching filename to the provided one.

*usage*
```
import { find } from "/install/location"

let container = ...
let filename = ... (string that is converted into a RegEx internally to match filenames)

let options = {
  fetch?: any,                 // an (authenticated) fetch function
  verbose?: boolean,           // log all operations
  logger?: Logger              // Custom logging object, logs are sent to the terminal if this is left empty

  all?: boolean,               // include .acl resource in search
  full?: boolean,              // look for name matches in the full resource URL instead of relative
  listDirectories?: boolean,   // also match container names in find
} 

await find(url, options)
```

*returns*

`find` returns an iterator of FileInfo objects, where the filename of the file matches the `filename` provided when calling the function. Nothing is returned whan no files are found with a matching name in `container`. More info about the structure of `FileInfo` is listed below:
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
<!-- todo: geen idee wat query is in de code -->
```
import { query } from "/install/location"


let url = ...         // location of the resource(s)
let query = ...       // represents a SPARQL query

let options = {
// standard options
  fetch?: any,         // an (authenticated) fetch function
  verbose?: boolean,  // log all operations
  logger?: Logger     // Custom logging object, logs are sent to the terminal if this is left empty
// options specific to query
  all?: boolean,      // include .acl resources in querying

} 

await query(url, query, options)
```

*returns*

An async iterator is returned with objects with the properties `fileName` and `bindings`. The `fileName` property contains the URL of the file that was queried.

This function uses Comunica query engine under the hood. For more information about the resulting bindings, please consult [this page](https://comunica.dev/docs/query/advanced/bindings/).


#### perms

##### listPermissions
List permissions of a given resource.

*usage*
```
import { listPermissions } from "/install/location"

let url = ...

let options = {
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
Change the permissions of a specific resource

*usage*
```
import { changePermissions } from "/install/location"

let url = ...

let options = {
// standard options
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
Delete all of the permissions for a specific resource.

*usage*
```
import { deletePermissions } from "/install/location"

let url = ...

let options = {
// standard options
  fetch?: any,         // an (authenticated) fetch function
  verbose?: boolean,  // log all operations
  logger?: Logger     // Custom logging object, logs are sent to the terminal if this is left empty
} 

await deletePermissions(url, options)
```

*returns*

The function returns of the deletion of the permissions was successful.

##### authenticateWithTokenFromJavascript

##### generateCSSToken
