# Access Management
The `access` command is used to manage access of resources on a Solid pod.
Solid has two competing authorization proposals, Web Access Controls that use `.acl` resources, 
and Access Control Policies that use `.acp` resources.

Bashlib implements full support for the management of WAC resources, and partial support for the management of ACP resources using the Inrupt universalAccess libraries.
<br />
The access command has thee subcommands: `list`, `set` and `delete`

## List
The `list` subcommand provides a listing of all access information for the targeted (container) resource.

#### arguments
```
Arguments:
  url            Resource URL
```
The `url` argument is the target (container) resource for which access is to be listed.

#### options
```
Options:
  -p, --pretty   Pretty format
  -v, --verbose  Log all operations
```
Depending on if the target Solid pod is managed using the `WAC` or `ACP`
authorization system, options such as showing `default` access indicating 
that the authorization is recursively enforced on child resources without their own `.acl` file
or `inhereted` access indicating that the access rules are derived from the default access of a parent resource
will be restricted to `WAC` based Solid servers.
<br />
The `--pretty` option outputs the information in a table format
<br />
The `--verbose` option outputs operation logs.


#### examples
List the pod root access in a pretty format
```
sld access list --pretty https://mypod.org/
```

## Set 
The `set` subcommand is used to edit resource access.

#### arguments
```
Arguments:
  url            Resource URL
  permissions    Permission format when setting permissions. 
        Format according to id=[a][c][r][w]. 
        For public permissions please set id to "p". 
        For the current authenticated user please set id to "u".
        For specific agents, set id to be the agent webid.
```
The `url` argument is the target (container) resource for editing access rules.
<br />
The `permissions` argument is a formatted string containing the identifier for
which rules are defined, and the associated permissions that are to be set for the
given identifier. Using `p` as the identifier targets public permissions and using `u`
as the identifier targets the current WebID of the authenticated Bashlib session.
<br />
The `a` is append rights, allowing PATCH operations to be made.
<br />
The `c` is control rights, allowing the editing of access controls for a resource (for ACP this includes both readControl and writeControl)
<br />
The `r` is read rights, allowing a GET request to a resource.
<br />
The `p` is write rights. For a resource this allows it to be overwritten using a PUT request. 
For a container this allows resources to be added using both PUT and POST requests.

#### options
```
Options:
  --default      Set the defined permissions as default (only when target pod is hosted on a WAC-based instance)
  --group        Process identifier as a group identifier (only when target pod is hosted on a WAC-based instance)
  -v, --verbose  Log all operations
  -h, --help     display help for command
```
The `--default` option makes the current access rules default for all children resources when defined on a container. Only available for pods hosted on a `WAC`-based Solid server.
<br />
The `--group` option indicates that the identifier represents a group identifier. Only available for pods hosted on a `WAC`-based Solid server.
<br />
The `--verbose` option outputs operation logs.

#### examples
Setting default public read permissions for a resource hosted on a WAC-based solid pod
```
sld access set https://mypod.org/resource p=r --default
```

Giving access to alice to write to a container
```
sld access set http://mypod.org/container/ http://people.org/alice/webid=w
```

Removing all public permissions from a resource (making it effectively private).
Note that this will also remove any default permissions set on the resource.
```
sld access set https://mypod.org/resource p=
```



## Delete
The `delete` subcommand is only available for WAC based pods using `.acl` resources.
Note that removing a resource using the `rm` command also removes the associated `.acl` resource on the CSS automatically.

#### arguments
```
Arguments:
  url            Resource URL
```
The `url` argument is the target `.acl` resource that will be deleted.

#### options
```
Options:
  -v, --verbose  Log all operations
```
The `--verbose` option output operation logs.

### example
Removing an acl resource.
```
sld access remove https://mypod.org/resource.acl
```


#### examples

