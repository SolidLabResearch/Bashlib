# Bashlib-solid
The Bashlib-solid library provides a set of functions for interacting with Solid environments from Node.JS and the CLI. The aim is to provide shell-like functionality to facility the use of and development for the Solid ecosystem with a low requirement of specific knowledge of Solid and LDP.
This library makes heavy use of the [Developer tools by inrupt for Solid](https://docs.inrupt.com/developer-tools/javascript/client-libraries/using-libraries/).

*note: `Access Control Policies (ACP)` files `(.acp)`, used by the Enterprised Solid Server and on the Inrupt Pod Spaces, are not supported by this lib! Only `Web Access Controls (WAC)` files `(.acl)` are supported.

## Installing
Navigate to the `bashlib/solid` folder and run the following command
```
npm run build;
```

## Usage
The developed functionality can be accessed from both the **[CLI](#cli)**, as well as in **[Node.js](#nodejs)**


## CLI
All available commands are presented through the CLI interface found in `bin/solid.js`

```
node bin/solid.js [authentication_options] command [command_options] <command_args>
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

#### CLI authentication options
These are the authentication options that can be passed to the CLI interface.
Some options are only required for specific authentication types, shown by the `(auth: type)` description.

```
[authentication_options]
  -a, --auth <string>                  token | credentials | interactive | none - Authentication type (defaults to "none")
  -i, --idp <string>                   (auth: any) URL of the Solid Identity Provider
  -e, --email <string>                 (auth: credentials) Email adres for the user. Default to <uname>@test.edu
  -p, --password <string>              (auth: credentials) User password. Default to <uname>
  -t, --tokenStorage <string>          (auth: token) Location of file storing Client Credentials token. Defaults to ~/.solid/.css-auth-token
  -s, --sessionStorage <string>        (auth: token | interactive) Location of file storing session information. Defaults to ~/.solid/.session-info-<auth>
  -c, --config <string>                (auth: any) Location of config file with authentication info.
  --port                               (auth: interactive | credentials) Specify port to be used when redirecting in Solid authentication flow. Defaults to 3435.
  --silent                             Silence authentication errors
```

#### The config file
You can use a config file with the `-c, --config <path>` option.
This config file will be used to auto-fill any missing authentication options.
The config file must adhere to the following format, and may include any of the following options:
```
{
  auth: "token" | "credentials" | "interactive" | "none",
  idp: "https://your.pod.identity.provider.org/",
  email: "User email address",
  password: "User password,
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
The CLI interface provides some default prefixes you can use in all URL values for all commands. The prefix is replaced by the found value when running the command.

```
webid: (The user WebID)
root: (The root of your data pod - will not be found when you have a custom WebID that is not in the domain of your Solid pod!)
inbox: (The user inbox - when available)

example usage:
node bin/solid.js fetch webid:
``` 
Be sure to include the `:` at the end of the prefix!
### commands
In this section, all available commands in the CLI interface are listed and explained.

#### fetch
This command enables authenticated fetching of resources from the CLI.

*usage*
```
node bin/solid.js [auth_options] fetch [options] <url>
```
*options*
```
  -v, --verbose          Write out full response and all headers
  -H, --only-headers     Only write out headers
  -m, --method <string>  GET, POST, PUT, DELETE, ...
  -b, --body <string>    The request body
  -h, --header <string>  The request header. Multiple headers must be added separately: e.g. -h "A: value" -h "B: value"
```

#### list
This command lists the resources contained by the url argument.
The passed URL should be a container, or the command will fail.

The `--all` flag can be set to include `.acl` files in the listing.
The `--long` format provides a table of the resources, and indicates the connection between a resources and their `.acl` files.

*usage*
```
node bin/solid.js [auth_options] list [options] <url>
```
*options*
```
  -a, --all      List all resources (includes .acl and .meta resources)
  -f, --full     List resources with their full uri (defaults to showing only resource name)
  -l, --long     List in long format
  -v, --verbose  Log all operations to cli
```

#### tree
This command gives a recursive overview of the resources contained by the url argument.
The passed URL should be a container, or the command will fail.

The `--all` flag can be set to include `.acl` files in the listing.

*usage*
```
node bin/solid.js [auth_options] tree [options] <url>
```
*options*
```
  -a, --all      List all resources (includes .acl and .meta resources)
  -f, --full     List resources with their full uri (defaults to showing only resource name)
  -v, --verbose  Log all operations to cli
```


#### copy
This command copies files/resources from and to both the local filesystem and solid pods.
Both the source and destination arguments can be either a local path or a URI on a solid pod. Resources that cannot be read due to lack of authorization will be ignored, but can be notified using the `--verbose` flag.
Containers/directories are always be copied recursively  by default.
The command will error on trying to copy a container to a file.
Copying a file/resource to a container/directory will create a new file in the container/directory with the same name, and **overwrite it if it already exists.**

The `--all` flag can be set to include `.acl` files when copying.

*usage*
```
node bin/solid.js [auth_options] copy [options] <source> <destination>
```
*options*
```
  -a, --all      Copy all resources (includes .acl and .meta resources)
  -v, --verbose  Log all operations to cli
```

#### move
This command moves files/resources from and to both the local filesystem and solid pods.
Its functionality is equal to copying the files/resources from the source to the destination, and then removing the source. **note: if the source is the local filesystem, files will not be removed, and the command will be identical to a copy.**
Resources that cannot be read due to lack of authorization will be ignored, but can be notified using the `--verbose` flag.
Containers/directories are always be moved recursively  by default.
The command will error on trying to move a container to a file.
Moving a file to a container will create a new file in the container with the same name, and **overwrite it if it already exists.**

The `--all` flag can be set to include `.acl` files when moving.

*usage*
```
node bin/solid.js [auth_options] move [options] <url> <query>
```
*options*
```
  -a, --all      Move all resources (includes .acl and .meta resources)
  -v, --verbose  Log all operations to cli
```

#### remove
This command removes resources from solid environments.
**Removing a container requires the -r flag to be set to recursively remove resources from containers! This is in contrast to copy and move commands that set this automatically.**
`.acl` resources are not explicitly removed by this command. We expect these auxiliary resources to be deleted by the Pod Provider on resource deletion.

*usage*
```
node bin/solid.js [auth_options] remove [options] <url>
```
*options*
```
  -r, --recursive  Recursively removes all files in given container
  -v, --verbose  Log all operations to cli
```

#### mkdir
This command creates a new empty container on a Solid pod on given URL.
Missing parent containers are created automatically.

*usage*
```
node bin/solid.js [auth_options] mkdir [options] <url>
```
*options*
```
  -v, --verbose  Log all operations to cli
```

#### touch
This command creates a new empty resource on a Solid pod on a given URL.

*usage*
```
node bin/solid.js [auth_options] touch [options] <url>
```
*options*
```
  -v, --verbose  Log all operations to cli
```

#### find
This command finds the resources contained by the url argument matching the passed string argument.
The passed URL should be a container, or the command will fail.

The `--all` flag can be set to include `.acl` files in the results.

*usage*
```
node bin/solid.js [auth_options] find [options] <url> <match>
```
*options*
```
  -a, --all      Match all resources (includes .acl and .meta resources)
  -f, --full     Match resources with their full uri (defaults to matching with their relative path compared to the passed URI argument)
  -v, --verbose  Log all operations to cli
```

#### query
This command queries over the given resource, or recursively over all contained resources in case the given url is a container. The query parameter MUST be a valid SPARQL query. All non-rdf resources will be ignored.

The `--all` flag can be set to include `.acl` files in the listing.
The `--full` flag will show the full file URL in the returned results, instead of the relative path to the queried container.
The `--pretty` flag will show the results in a table format.

*usage*
```
node bin/solid.js [auth_options] query [options] <url> <query>
```
*options*
```
  -a, --all      Query all resources (includes .acl and .meta resources)
  -f, --full     List resources with their full uri (defaults to showing only relative URI to the passed url argument)
  -p, --pretty   Pretty format
  -v, --verbose  Log all operations to cli
```

#### perms
This command enables the listing, editing and removing of resource permisssions. This command only supports `Web Access Controls resources (.acl)`, and does not support `Access Control Policies resources (.acp)`. Editing permissions can be done by supplying a set of permissions. These permissions must be formatted according to the description below.
**note: Editing permissions for a specific WebID or public permissions will remove all prior assigned permissions.** E.g. editing permissions to assign read permissions to a WebID will remove prior assigned write permissions!

The `--pretty` flag can be set to display the results in a table format when listing resource permissions and is ignored for other options.

*usage*
```
node bin/solid.js [auth_options] perms [options] <operation> [permissions]
```
*options*
```
  -p, --pretty   Use pretty formatting
  -v, --verbose  Log all operations to cli
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
p=[d][a][c][r][w]*permission formatting:*

setting permissions for the currently authenticated webId
u=[d][a][c][r][w]

setting permissions for a specific webId
<webId>=[d][a][c][r][w]

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
The edit command is a convenience command created to edit resources on your Solid pod locally.
The command will default to use the default system `$editor`. 
After editing, the result will be used to overwrite the original resource.
Please keep in mind that there is not locking mechanism for multiple users editing the same file simultaneously.

The `--header` flag can be used to pass custom headers when retrieving the resource to e.g. request the resource in a specific RDF format.
The `--editor` flag can be set to specify the path to the executable of the editor to be used.
the `--wait` flag can be set to wait with uploading the file until a key is pressed. This allows the use of non-cli based editors. When done modifying the file, focus the CLI and press any key to upload the result.

*usage*
```
node bin/solid.js [auth_options] edit [options] <url>
```
*options*
```
  -h, --header <string>                     The request header. Multiple headers can be added separately. These follow the style of CURL. e.g. --header "Content-Type: application/json"
  -e, --editor <path_to_editor_executable>  Use custom editor
  -w, --wait                                Wait for user confirmation of file update before continuing
  -v, --verbose  Log all operations to cli
```



## Node.js
The commands above are nearly all exported as functions by the `Bashlib-solid` library in Node.JS. For more information on the working of the functions, please look above in the explanation of the CLI commands. 

### Functions
Here a list of the available functions exposed by the lib in Node.JS is given.

#### fetch
An authenticated fetch function can be created using the `Bashlib-css` library.

#### list

*usage*
```
import { list } from "/install/location"

let url = ...
let options = {
  fetch: any,         // an (authenticated) fetch function
  all?: boolean,      // include .acl resources in the listing
  full?: boolean,     // return full urls instead of relative urls
  verbose?: boolean,  // log all operations
} 

await list(url, options)
```

*returns*
```
ResourceInfo: {
  url: string,              // the resource full url
  relativePath?: string,    // the resource relative url
  isDir: boolean,           // flag if directory or not
  modified?: Date | null,   // last modified date
  mtime?: number | null,    // last modified date as mtime
  size?: number | null,     // resource size
  types?: string[],         // resource types
  metadata?: ResourceInfo   // resourceInfo of metadata resource
  acl?: ResourceInfo,       // resourceInfo of acl resource
}
```

#### copy

*usage*
```
import { copy } from "/install/location"

let src = ...
let dst = ...

let options = {
  fetch: any,         // an (authenticated) fetch function
  all?: boolean,      // include .acl resources in the listing
  verbose?: boolean,  // log all operations
} 

await copy(src, dst, options)
```

*returns*
```
TODO::
```


#### move

*usage*
```
import { move } from "/install/location"

let src = ...
let dst = ...

let options = {
  fetch: any,         // an (authenticated) fetch function
  all?: boolean,      // include .acl resources in the listing
  verbose?: boolean,  // log all operations
} 

await move(src, dst, options)
```

*returns*
```
TODO::
```


#### remove

*usage*
```
import { remove } from "/install/location"

let url = ...

let options = {
  fetch: any,          // an (authenticated) fetch function
  recursive?: boolean, // include .acl resources in the listing
  verbose?: boolean,   // log all operations
} 

await remove(url, options)
```

*returns*
```
TODO::
```


#### mkdir (makeDirectory)

*usage*
```
import { makeDirectory } from "/install/location"

let url = ...

let options = {
  fetch: any,         // an (authenticated) fetch function
  verbose?: boolean,  // log all operations
} 

await makeDirectory(url, options)
```

*returns*
```
TODO::
```

#### find

*usage*
```
import { find } from "/install/location"

let container = ...
let filename = ... (string that is converted into a regex internally to match filenames)

let options = {
  fetch: any,                 // an (authenticated) fetch function
  all?: boolean,              // include .acl resource in search
  full?: boolean,             // look for name matches in the full resource URL instead of relative
  listDirectories?: boolean,  // include container resources in search
  verbose?: boolean,          // log all operations
} 

await find(url, options)
```

*returns*
```
TODO::
```


#### query

*usage*
```
import { query } from "/install/location"

let url = ...

let options = {
  fetch: any,         // an (authenticated) fetch function
  all?: boolean,      // include .acl resources in querying
  verbose?: boolean,  // log all operations
} 

await query(url, options)
```

*returns*
```
TODO::
```


#### perms

##### listPermissions

*usage*
```
import { listPermissions } from "/install/location"

let url = ...

let options = {
  fetch: any,         // an (authenticated) fetch function
  verbose?: boolean,  // log all operations
} 

await listPermissions(url, options)
```

*returns*
```
TODO::
```

##### changePermissions

*usage*
```
import { changePermissions } from "/install/location"

let url = ...

let options = {
  fetch: any,         // an (authenticated) fetch function
  verbose?: boolean,  // log all operations
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
```
TODO::
```

##### deletePermissions
List user permissions
*usage*
```
import { deletePermissions } from "/install/location"

let url = ...

let options = {
  fetch: any,         // an (authenticated) fetch function
  verbose?: boolean,  // log all operations
} 

await deletePermissions(url, options)
```

*returns*
```
TODO::
```
