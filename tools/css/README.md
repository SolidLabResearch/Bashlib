# CSS tools
This is a set of tools specifically for the Community Solid Server (v2.x.x) environment designed for use in the CLI and Node.js.

## Installing
```
npm run build;
```

## Usage
You can use the created tools both from the CLI, as well as from Node.js


## CLI
All available commands are present in `bin/css.js`

```
node bin/css.js command [command_options] <command_args>
```

currently available commands:
- create-pod (Create new pod on the given CSS server)


## Node.js
All available commands are exposed as functions from this lib.

```
include { createAuthenticatedSession, createPods, ... } from '/install/location'
```

currently available functions:
- createPods (Create new pod on the given CSS server)
- createAuthenticatedSession (Create an authenticated session from a given configuration)