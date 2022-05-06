# Bashlib-solid
The Bashlib-solid library provides a set of functions for interacting with Solid environments from Node.JS and the CLI. The aim is to provide shell-like functionality to facility the use of and development for the Solid ecosystem with a low requirement of specific knowledge of Solid and LDP.
This library makes heavy use of the [Developer tools by inrupt for Solid](https://docs.inrupt.com/developer-tools/javascript/client-libraries/using-libraries/).

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
  -U, --unauthenticated                Skip authentication step
  -a, --auth <string>                  token | credentials | interactive - Authentication type (defaults to "token")
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
  auth: "token" | "credentials" | "interactive",
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
node bin/solid.js -a "interactive" fetch webid:
``` 
Be sure to include the `:` at the end of the prefix!
### commands
In this section, all available commands in the CLI interface are listed and explained.

#### fetch
This command enables authenticated fetching of resources from the CLI.

usage
```
node bin/solid.js [auth_options] fetch [options] <url>
```
options
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

usage
```
node bin/solid.js [auth_options] list [options] <url>
```
options
```
  -a, --all      List all resources (includes .acl and .meta resources)
  -f, --full     List resources with their full uri (defaults to showing only resource name)
  -l, --long     List in long format
  -v, --verbose  Log all operations to cli
```

#### tree
This command gives a recursive overview of the resources contained by the url argument.
The passed URL should be a container, or the command will fail.

usage
```
node bin/solid.js [auth_options] tree [options] <url>
```
options
```
  -a, --all      List all resources (includes .acl and .meta resources)
  -f, --full     List resources with their full uri (defaults to showing only resource name)
  -v, --verbose  Log all operations to cli
```

#### find
This command finds the resources contained by the url argument matching the passed string argument.
The passed URL should be a container, or the command will fail.

usage
```
node bin/solid.js [auth_options] find [options] <url> <match>
```
options
```
  -a, --all      Match all resources (includes .acl and .meta resources)
  -f, --full     Match resources with their full uri (defaults to matching with their relative path compared to the passed URI argument)
  -v, --verbose  Log all operations to cli
```

#### query
This command queries over the given resource, or recursively over all contained resources in case the given url is a container. The query parameter MUST be a valid SPARQL query. All non-rdf resources will be ignored.

usage
```
node bin/solid.js [auth_options] query [options] <url> <query>
```
options
```
  -a, --all      Query all resources (includes .acl and .meta resources)
  -f, --full     List resources with their full uri (defaults to showing only relative URI to the passed url argument)
  -p, --pretty   Pretty format
  -v, --verbose  Log all operations to cli
```

#### copy
This command copies files/resources from and to solid environments.
Both the source and destination arguments can be either a local path or a URI on a solid pod. Resources that cannot be read due to lack of authorization will be ignored.
Containers / directories are always be copied recursively.
The command will error on trying to copy a container to a file.
Copying a file to a container will create a new file in the container with the same name, and **overwrite it if it already exists.**

usage
```
node bin/solid.js [auth_options] copy [options] <source> <destination>
```
options
```
  -a, --all      Copy all resources (includes .acl and .meta resources)
  -v, --verbose  Log all operations to cli
```

#### move
This command moves files/resources from and to solid environments.
Its functionality is equal to copying the files/resources from the source to the destination, and then removing the source.
Resources that cannot be read due to lack of authorization will be ignored.
Containers / directories are always be moved recursively.
The command will error on trying to move a container to a file.
Moving a file to a container will create a new file in the container with the same name, and **overwrite it if it already exists.**

usage
```
node bin/solid.js [auth_options] move [options] <url> <query>
```
options
```
  -a, --all      Copy all resources (includes .acl and .meta resources)
  -v, --verbose  Log all operations to cli
```

#### remove
This command removes files/resources from solid environments.
Its functionality is equal to copying the files/resources from the source to the destination, and then removing the source.
**removing a container requires the -r flag to be set to recursively remove resources from containers, in contrast to copy and move**
*Acl files are deleted on resource deletion* (not sure about ACP resources!)

usage
```
node bin/solid.js [auth_options] remove [options] <url>
```
options
```
  -a, --all      Copy all resources (includes .acl and .meta resources)
  -r, --recursive  Recursively removes all files in given container
  -v, --verbose  Log all operations to cli
```

#### parms
This command enables the listing, editing and removing of ACL resources connected to a resource.
**This command only works with ACL resources. It does not support ACP**
usage
```
node bin/solid.js [auth_options] perms [options] <operation> [permissions]
```
options
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

Permissions are ignored when the operation is not *edit*.
Permissions are formatted according to the following options:

formatting:
```
setting public permissions
p=[d][a][c][r][w]

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

example: setting default read and write permissions for http://pod.com/bob/profile/card#me results in:

node bin/solid.js [auth_options] perms edit http://pod.com/bob/profile/card#me=rwd
```



## Node.js
All available commands are exported as functions from this lib.

```
include { list, remove, ... } from '/install/location'
```

currently available functions:
- authenticatedFetch (i would recommend just using session.fetch, this is mainly a helper for the command line interface)
- list
- copyData
- remove
- authenticatedFetch
- move
- find
- query
- tree
- listPermissions
- changePermissions
- deletePermissions


These functions are identical to their CLI counterparts above.