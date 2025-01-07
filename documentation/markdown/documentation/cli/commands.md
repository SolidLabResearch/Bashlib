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


#### example

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

#### example
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
The default copying behavior ignores 
The default behavior is to overwrite files, the `--interactive-override` and `--no-override` options provide alternative behaviors.

#### arguments
```
Arguments:
  src                         file or directory to be copied
  dst                         destination to copy file or directory to
```
The `src` argument is the location of the source file to be copied. If the URL does not start with `http(s)://`, the resource is assumed to be a local resource and matched with the local file system. The `dst` argument is the destination to which the source resource is to be copied. Similarly it uses the `http(s)://` prefix to decide if the location is local or remote.
The default behavior ignores context resources such as `.meta`, `.acl` and `.acp` present in the directories. The `--all` flag ignores this behavior, though note that for authorization resources, as the target URIs are not edited, copying resources with these authorization resources does not imply they will result in the same access controls as the location they were copied from!

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

#### example
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
sld cp https://mypod.org/alice/container1/ https://mypod.org/bob/container2/
```

To copy the source container into the target container, we need to add the container in the target URI as follows: `https://mypod.org/bob/container2/container1/`.
```
sld cp https://mypod.org/alice/container1/ https://mypod.org/bob/container2/container1/
```

Copy a resource from a solid pod to the local filesystem
```
sld cp https://mypod.org/container/resource.ttl ./resource.ttl
```


## Move

#### arguments

#### options

#### example


## Remove

#### arguments

#### options

#### example


## Mkdir

#### arguments

#### options

#### example


## Touch

#### arguments

#### options

#### example


## Tree

#### arguments

#### options

#### example



## Find

#### arguments

#### options

#### example


## Query

#### arguments

#### options

#### example


## Edit

#### arguments

#### options

#### example


## Access
The access command is used to manage resource access.
This is explained in <a href="../access">the access management section</a>.







