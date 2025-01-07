# Commands

Bashlib provides a set of commands to manage resources and containers on your Solid pod.
All examples make use of the abstraction `sld` as an alias for `node bin/solid.js`, 
and for all example we expect the user to be authenticated as documented in <a href="../authentication">the Authentication section</a>.

## Curl
The `curl` command wraps the internal authenticated `fetch` function with functionality that mimics the curl command found on most linux shells.

#### arguments
```
Arguments:
  url                    file to be fetched
```
The `url` argument for this command is the URL of the resource that is the target of the curl command.

#### options
```
Options:
  -v, --verbose          Write out full response and all headers
  -H, --only-headers     Only write out headers
  -m, --method <string>  GET, POST, PUT, DELETE, ...
  -b, --body <string>    The request body
  -F, --file <string>    File containing the request body. Ignored when the --body flag is set.
  -h, --header <string>  The request header. Multiple headers can be added separately. e.g. -h "Accept: application/json" -h "..."
```
The `--verbose` option writes out all response headers for a request.
<br />
The `--only-headers` option only writes out response headers and ignores the response body.
<br />
The `--method` option sets the HTTP request method.
<br />
The `--body` option sets the HTTP request body.
<br />
The `--file` option allows passing the file contents as the body of the request.
<br /> 
The `--header` option allows the setting of a request header. Setting multiple headers requires multiple `--header` options to be set.


#### examples

A simple fetch request to a resource requesting a JSON-LD format
```
sld curl https://mypod.org/resource --header "Accept: application/ld+json"
```

A POST request using a file contents as request body
```
sld curl -m POST -f /path/to/file https://mypod.org/resource
```

## List
The `ls` command provides the listing of a container on a Solid pod.

#### arguments
```
Arguments:
  url            URL of container to be listed
```
The `url` argument for this command is the URL of the container for which a listing is to be made. 
This will only work if the url targets a container. It is important to add the trailing slash of the container URL!


#### options
```
Options:
  -a, --all      List all files including acl files
  -f, --full     List files with their full uri
  -l, --long     List in long format
  -v, --verbose  
```
The `--all` option includes `.meta`, `.acl` and `.acp`  files in the listing.
<br />
The `--full` option writes full resource URIs, not only the resource name.
<br />
The `--long` option writes the listing in a table format, including available information about size, latest modification, related metadata resource and related acl resource.
<br />
The `--verbose` option shows warnings.

#### examples
A listing of a container
```
sld ls https://mypod.org/container/
```

A listing of a container showing all resources in a long format
```
sld ls --long --all https://mypod.org/container/
```


## Copy
The `cp` command can copy resources between Solid pod locations, across Solid pods, or between the local file system and a Solid pod.
If the source location is a container or directory, it will recursively copy the container and all sub-containers recursively copying the whole underlying resource tree, including empty containers.
<!-- todo: check if empty containers are included. -->
The default copying behavior ignores `.meta`, `.acl` and `.acp` resources, which can be changed using the `--all` flag.
The default behavior is to overwrite files, the `--interactive-override` and `--no-override` options provide alternative behaviors.

#### arguments
```
Arguments:
  src                         file or directory to be copied
  dst                         destination to copy file or directory to
```
The `src` argument is the location of the resource or container to be moved. If the URL starts with `http(s)://`, the resource is assumed to be a remote resource, if not the resource is assumed to be local and matched with the local file system. The `dst` argument is the destination to which the source resource is to be copied. Similarly it uses the `http(s)://` prefix to decide if the location is local or remote.
The default behavior ignores context resources such as `.meta`, `.acl` and `.acp` present in the directories. The `--all` flag ignores this behavior, though note that for authorization resources, as the target URIs are not edited, copying resources with these authorization resources does not imply they will result in the same access controls as the location they were copied from!
The default behavior always automatically works recursively. At the moment this behavior cannot be altered.

#### options
```
Options:
  -a, --all                   Copy .acl files in recursive directory copies
  -i, --interactive-override  Interactive confirmation prompt when overriding existing resource
  -n, --no-override           Do not override existing files
  -v, --verbose               Log all read and write operations
```
The `--all` option includes `.meta`, `.acl` and `.acp` files in the listing.
<br />
The `--interactive-override` option provides an interactive prompt when a copy will override an existing resource.
<br />
The `--no-override` option ignores existing resources.
<br />
The `--verbose` option shows warnings.

#### examples
Copying a local resource into a Solid pod container.
```
sld cp /path/to/file https://mypod.org/container/
```

Copying a local resource to a specific remote resource
```
sld cp /path/to/file.ttl https://mypod.org/container/resource.ttl
```

Copy the contents of container 1 of alice's pod to container 2 of bob's pod.

```
sld cp https://mypod.org/alice/container1/. https://mypod.org/bob/container2/
```

Copy the source container into the target container: `https://mypod.org/bob/container2/container1/`.
```
sld cp https://mypod.org/alice/container1/ https://mypod.org/bob/container2/
```

Copy a resource from a solid pod to the local filesystem
```
sld cp https://mypod.org/container/resource.ttl ./resource.ttl
```


## Move
The `mv` command moves resources between Solid pod locations, across Solid pods, or between the local file system and a Solid pod.
If the source location is a container or directory, it will recursively move the container and all sub-containers recursively copying the whole underlying resource tree, including empty containers.
When moving from the local file system, files will not be deleted!
<!-- todo: check if empty containers are included. -->
The default copying behavior ignores `.meta`, `.acl` and `.acp` resources, which can be changed using the `--all` flag.
The default behavior is to overwrite files, the `--interactive-override` and `--no-override` options provide alternative behaviors.
The default behavior always automatically works recursively. At the moment this behavior cannot be altered.

#### arguments
```
Arguments:
  src                         file or directory to be moved
  dst                         destination of the move
```
The `src` argument is the location of the resource or container to be moved. If the URL starts with `http(s)://`, the resource is assumed to be a remote resource, if not the resource is assumed to be local and matched with the local file system. The `dst` argument is the destination to which the source resource is to be copied. Similarly it uses the `http(s)://` prefix to decide if the location is local or remote.
The default behavior ignores context resources such as `.meta`, `.acl` and `.acp` present in the directories. The `--all` flag ignores this behavior, though note that for authorization resources, as the target URIs are not edited, copying resources with these authorization resources does not imply they will result in the same access controls as the location they were copied from!



#### options
```
Options:
  -a, --all                   Move .acl files when moving directories recursively
  -i, --interactive-override  Interactive confirmation prompt when overriding existing files
  -n, --no-override           Do not override existing files
  -v, --verbose               Log all operations
```
The `--all` option includes `.meta`, `.acl` and `.acp` files in the listing.
<br />
The `--interactive-override` option provides an interactive prompt when a copy will override an existing resource.
<br />
The `--no-override` option ignores existing resources.
<br />
The `--verbose` option shows warnings.

#### examples
Moving a local resource into a Solid pod container. This does not remove the local resource!
```
sld mv /path/to/file https://mypod.org/container/
```

Moving a local resource to a specific remote resource. This does not remove the local resource!
```
sld mv /path/to/file.ttl https://mypod.org/container/resource.ttl
```

Move the contents of container1 into container2. This removes container 1.

```
sld cp https://mypod.org/alice/container1/. https://mypod.org/bob/container2/
```

Move the source container into the target container.
```
sld cp https://mypod.org/alice/container1/ https://mypod.org/bob/container2/container1/
```

Move a resource from a solid pod to the local filesystem
```
sld cp https://mypod.org/container/resource.ttl ./resource.ttl
```


## Remove
The `rm` command can remove resources and/or directories from a remote Solid pod.

#### arguments
```
Arguments:
  urls             URL of container to be listed
```
The `urls` parameter accepts a sequence of urls that need to be removed.

#### options
```
Options:
  -r, --recursive  Recursively removes all files in given container (.acl files are removed on resource removal)
  -v, --verbose    Log all operations
```
The `--recursive` flag must be set when removing container resources. This automatically also removes any contained `.acl`, `.acp` and `.meta` resources.
<br /> 
The `--verbose` flag outputs operation logs.

#### examples

Remove two resources
```
sld rm https://mypod.org/resource1 https://mypod.org/resource2
```

Remove a container
```
sld rm https://mypod.org/container/
```


## Mkdir
The `mkdir` command creates a new container on a remote Solid pod.
The command automatically creates all parent directories that do not exist when specifying a subdirectory to create, 
and fails if the target container already exists.

#### arguments
```
Arguments:
  url            Container to start the search
```
The `url` argument is the target container to be created.

#### options

```
Options:
  -v, --verbose  Log all operations
```
The `--verbose` flag outputs operation logs.

#### examples

Create a new container
```
sld mkdir https://mypod.org/container/
```


## Touch
The `touch` command creates an empty resource at the target location. This cannot create containers, for this use the `mkdir` command.
The content type of the created resource is derived from the content type flag or if that is missing from the file extension. 
If neither can be found an error is thrown.

#### arguments
```
Arguments:
  url                          resource to be created
```
The `url` argument is the target resource that is to be created.

#### options

```
Options:
  -c, --content-type <string>  Content type of the created resource
  -v, --verbose                Log all operations
```
the `--content-type` flag provides 
The `--verbose` flag outputs operation logs.

#### examples

Create a new resource
```
sld touch --content-type text/turtle https://mypod.org/container/resource
```

## Tree
The `tree` command provides a tree-structured listing of the target container and all its subcontainers.

#### arguments
```
Arguments:
  url            Base container to construct tree over
```
The `url` argument is the target container for which the tree listing is to be made.


#### options
```
Options:
  -a, --all      Display .acl, .acp and .meta resources
  -f, --full     Display full resource URIs
  -v, --verbose  Log all operations
```
The `--all` flag includes the `.acl`, `.acp` and `.meta` context resources in the command output.
<br />
The `--full` flag displays the resulting resources using their full URIs
<br />
The `--verbose` flag outputs operation logs.

#### examples
Create tree listing on the root of a Solid pod.
```
sld tree https://mypod.org/
```


## Find
The `find` command can be used to find resources based on their name.

#### arguments
```
Arguments:
  url            Container to start the search
  filename       Filename to match, processed as RegExp(filename)
```
The `url` parameter is the container that forms the root of the resource tree in which the search is executed.
The `filename` parameter is the filename to match, processed as a javascript RegExp.

#### options
```
Options:
  -a, --all      Match .acl, .acp and .meta files
  -f, --full     Match full filename.
  -v, --verbose  Log all operations
```
The `--all` flag also matches access control and metadata files.
<br />
The `--full` flag matches on and returns the full URIs of resources.
<br />
The `--verbose` flag outputs operation logs.

#### examples

Find a resource named `card` in the `profile/` container.
```
sld find http://mypod.org/profile/ card
```


## Query
The `query` command executes a SPARQL query over a target resource or container.
In case a container is queried, all contained resources and subcontainers are recursively queried as well.
The query itself is not federated, each query is individually evaluated over every resource.
The following resources are included when querying: `.ttl, .trig .nt, .nq, .jsonld, .rdf` both on their resource extensions and their content type..
The <a hef="https://comunica.dev/">Comunica</a> engine is used for query evaluation.
Note that only SELECT queries are supported!

#### arguments
```
Arguments:
  url              Resource to query. In case of container recursively queries all contained files.
  query            SPARQL query string | file path containing SPARQL query when -q flag is active
```
The `url` argument is the target resource or container to query. Containers are queried recursively on all contained resources in its resource tree.
The `query` argument is either a SPARQL query in quotes, or the path to a file containing a sparql query if the `--queryfile` flag has been set.


#### options
```
Options:
  -a, --all        Match .acl and .meta files
  -q, --queryfile  Process query parameter as file path of SPARQL query
  -p, --pretty     Pretty format
  -f, --full       Return containing files using full filename.
  -v, --verbose    Log all operations
```
The `--all` flag includes `.acl`, `.acp` and `.meta` resources in the query targets.
<br />
The `--queryfile` flag changes the `query` argument to a file path for a resource containing a SPARQL query.
<br />
The `--pretty` flag outputs the results in a table.
<br />
The `--full` flag gives the full resource URIs of where the matches were found.
<br />
The `--verbose` outputs operation logs.

#### examples

Evaluating a federated query over all resources in the profile container to look for entites with a given name.
```
sld query https://mypod.org/profile/ "select ?entity ?name where { ?entity foaf:name ?name }" --federated 
```

Evaluating a query stored in a local resource over the resources in the profile container individually, including `.acl`, `.acp` and `.meta` resources.
```
sld query --queryfile https://mypod.org/profile/ /path/to/sparql_query_file --all
```


## Edit
The `edit` command enables the editing of remote resources using a local editor.
The command will remain in standby until changes are saved, after which
pressing a button in the shell will upload the resource to the Solid pod.

<br />
Note: there currently is still a bug for longer edits, where saving the changes when a client session has expired will not be able to save the resource back to the pod. This should not be a problem when using client credentials.

#### arguments
```
Arguments:
  url                                       Resource URL
```
The `url` argument is target resource that will be edited.

#### options
```
Options:
  -e, --editor <path_to_editor_executable>  Use custom editor
  -t, --touch                               Create file if not exists
  -v, --verbose                             Log all operations
```
The `--editor` option enables the use of a specific local editor to modify the resource.
<br />
The `--touch` option will create the resource if it does not exist yet.
<br />
The `--verbose` option outputs operation logs.

#### examples
Editing a resource using the default editor.
```
sld edit https://mypod.org/resource1
```

Creating and editing a resource using vs-code (code)
```
sld edit --touch --editor code  https://mypod.org/non_existing_resource
```


## Access
The `access` command is used to manage resource access.
This is explained in <a href="../access">the access management section</a>.


## Auth
The `auth` command is used to manage authentication in Bashlib.
This is explained in <a href="../authentication">the authentication management section</a>.







