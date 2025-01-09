# Bashlib
This repository contains a suite of functionality to facilitate use and development for Solid


## Requirements

- Node >= 16.0.0

## Setup
**Using github**
``` 
git clone git@github.com:SolidLabResearch/Bashlib.git
cd Bashlib
npm install 
npm run build
```
After the install, add an alias to your `.bashrc` for convenience:
```
alias sld="node /path/to/folder/.../bin/solid.js"
```
**Using NPX**
```
npx solid-bashlib
```
This will automatically install any dependencies.
You can add an alias to your `.bashrc` for convenience:
```
alias sld="npx solid-bashlib"
```

**Note that while more straightforward, using NPX incurs a performance penalty of up to 1 second!
Consider a github install if you plan to use this tool regularly!**


## Documentation
For a tutorial and documentation, see [the documentation website](solidlabresearch.github.io/Bashlib/)

<!--

## Synopsis

```
node bin/solid.js ls https://somepod.org/
node bin/solid.js cat https://somepod.org/public.txt

# Create an authenticated session (for CSS 4.0.0 and up)
node bin/solid.js auth create-token
# -- and fill in all the questions

# Set the webid you want to use for authenticated session
node bin/solid.js auth set <your-web-id>

# Now you can read some private data
node bin/solid.js ls https://somepod.org/private/secret.txt

# Or, shorten this to 
node bin/solid.js ls root:/private/secret.txt

# Upload some data
node bin/solid.js cp local.txt root:/private/
```

## Available features

- Reading resources
- Fetch resources 
- Container listing
- Tree listing
- Copy/move resources local to remote
- Copy/move resources remote to local
- Copy/move resources remote to remote
- Remote resources
- Create/touch an empty resource 
- SPARQL query a resource
- List ACL permissions of resources
- Change ACL permissions of resources
- Authenticate against a Pod
- Make long lasting client credentials (CSS >=4.0.0 only)

## Contributors: how to release

This repo uses [release-it](https://www.npmjs.com/package/release-it) to manage SemVer version numbers, create GitHub releases and publish to npm.

Run `npm run release` and follow the intructions on the CLI. Don't forget to create a [personal access token](https://github.com/settings/tokens) and expose it through the `GITHUB_TOKEN` environment variable, or the github release won't work. For more information, visit the `release-it` docs.

-->

### Bashlib features in progress

- [X] Improve token management
- [X] Improve session management
- [X] Handle metadata
- [ ] Handling multiple pods for a given WebID (pim:storage)
- [X] multi parameter removes: rm file1 file2 file3
- [ ] Session refreshing on longer commands where session may time-out in the middle of command!
- [ ] Make sure discovery of pim:storage and ldp:inbox are according to spec!
- [X] Resource verification on edit (compare before / after hash and notify if something may have changed)
- [ ] Write concrete test cases and spin up local pod server to test
- [ ] Improve consistency of internal logging
- [ ] Improve consistency of exported Javascript interface
- [ ] Interactive Solid shell? -> Not sure if this will be useful.
- [X] npm release

