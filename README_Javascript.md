
# Javascript interface
The Javascript interface of the library exposes most functions that are available over the CLI interface.

## Handling authentication
This library does not handle authentication over the Javascript interface.
For authentication, please make use of the official [inrupt authentication libraries](https://github.com/inrupt/solid-client-authn-js).
When you have an authenticated fetch function using this authentication library, uou can pass this as an option parameter to the available functions to enable authentication requests.

## Available Functions

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
This function removes resources from a Solid environment.
You can remove containers with all contained resources using the `recursive` option.

```typescript
async function remove(
  url: string,            // resource to remove
  options: RemoveOptions  // options
)
```

```typescript
type RemoveOptions = {
  fetch:              // authenticated fetch function
  recursive? = false  // allow recursive deletion for containers   
}
```

**returns**
```typescript
Promise<void>
```


### find
This function finds the resources contained by the url argument matching the passed string argument.
The passed URL argument MUST be a container!

*function behavior*
The function will try to match all resources found under the rootcontainer argument of the function. It will per default try to match on the relative paths starting from the rootcontainer argument.

```typescript
async function* find (
  rootcontainer: string,  // container to start search in. This string MUST be the URL of a container
  filename: string,       // filename to search for. This function uses the String.match function to match the filename.
  options: FindOptions    // options
  ) 
```

```typescript
type FindOptions = {
  fetch,          // authenticated fetch function
  all? = false,   // also move authorization and metadata files in the listing
  full? = false   // match on the full resource URL instead of the relative path from the rootcontainer argument,
}
```

**return**


**processing the return**
As this function returns an async iterator, you can process this using:
```typescript
let iterator = find(url)
for await (resource of iterator) {
  ...
} 
```

### query

### makeDirectory

### |Permissions|
#### listPermissions

#### changePermissions

#### deletePermissions






