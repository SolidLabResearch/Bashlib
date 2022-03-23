# Solid tools
This is a set of tools for Solid environments designed for the CLI and Node.js.
It aims to port a default set of commands for use in a Solid environment.

## Installing
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

currently available commands:
- fetch
- list
- copy
- remove

### config
You can pass a config file with authentication credentials for your pod
This config file may contain the following info in a JSON format:
```
{
  "email": "bob@test.edu",
  "password": "bob",
  "idp": "http://localhost:3456"
}
```
This info will be used to fill in the missing credentials from the ```[authentication_options]```
Note: Currently for every command, a new authentication procedure is started!



## Node.js
All available commands are exposed as functions from this lib.

```
include { list, remove, ... } from '/install/location'
```

currently available functions:
- authenticatedFetch (i would recommend just using session.fetch, this is mainly a helper for the command line interface)
- list
- copyData
- remove