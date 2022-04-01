# Solid tools
This is a set of tools for Solid environments designed for the CLI and Node.js.
It aims to port a default set of commands for use in a Solid environment.
It makes heavy use of the [authentication and developer tools provided by inrupt for Solid](https://docs.inrupt.com/developer-tools/javascript/client-libraries/using-libraries/).

## Installing
Navigate to the `tools/solid` folder and run the following command
```
npm run build;
```

## Usage
You can use the created tools both from the CLI, as well as from Node.js


## CLI
All available commands are present in `bin/solid.js`

```
node bin/solid.js [authentication_options] command [command_options] <command_args>
```
### auth options
In this section we detail the available authentication options. There are 2 authentication. options given. 

Using **interactive login**, you can authenticate to all pod providers that support OpenID Connect](https://openid.net/connect/) (This includes at least: [Community Solid Server](https://github.com/CommunitySolidServer/CommunitySolidServer), [pod.inrupt.com](https://pod.inrupt.com), and the [inrupt ESS](https://inrupt.com/products/enterprise-solid-server/) should also be supported (not tested) ). Note that this will store credentials encrypted on the local machine in the default path ```~/.solid/.solid-css-credentials```, to prevent having to re-login for every command.

Using **non-interactive login**, the program tries to login using the provided *email*, *password* and *identityprovider* values. This **currently only supports v2.x.x of the Community Solid Server**, and works using the [inrupt script to generate an oidc token](https://github.com/inrupt/generate-oidc-token), after which all browser interactions are simulated using Node.js.

On failing to authenticate, the program will try to continue unauthenticated.


#### cli authentication options
The following options are available for authentication on the CLI interface. *These options take precedence over the options defined in the config file and environment variables*. 

- `-i, --interactive`                                   Use interactive Login. This opens a browser window to handle authentication. **This option requires an identity provider value to be set either via the command line options, via the config file or via the environment variables!** 
- `-idp, --identityprovider <string>`                   The URL of the identity provider.
- `-e, --email <string>`                                USer email address.
- `-p, --password <string>`                             User password.
- `-c, --config <string>`                               Config file location.
- `-s, --storage <string>`                              Credentials storage location (*only for interactive login,* **defaults to `~/.solid/.solid-cli-credentials`)**
- `--silent`                                            Silence authentication errors

#### config file
The config file must be a JSON file formatted as follows:

```
{
  idp: <user identity provider>,
  email: <user email>,
  password: <user password>,
  storage: <prefered storage location>,
}
```
(Not all values have to be present in the config)


#### environment variables
Finally, the following environment variables can be set.
```
SOLID_SUITE_SESSION_STORAGE=<session_storage_location> (= --storage option) 
SOLID_SUITE_CONFIG=<config_file_location>
```
These can be used to pass the location of the config file, and the location of the session storage file to use.

### commands

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