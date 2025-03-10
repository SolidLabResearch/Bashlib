# Bashlib

**For [documentation](https://solidlabresearch.github.io/Bashlib/documentation/overview/) and a [tutorial](https://solidlabresearch.github.io/Bashlib/tutorial/),
please visit the [Bashlib Website](https://solidlabresearch.github.io/Bashlib/).**


The Bashlib-solid library provides a set of functions for interacting with Solid environments from Node.JS and the CLI. 
The aim is to provide shell-like functionality to facility the use of and development for the Solid ecosystem with a low requirement of specific knowledge of Solid and LDP. 

This library makes use of the [Developer tools by inrupt for Solid](https://docs.inrupt.com/developer-tools/javascript/client-libraries/using-libraries/) to support authorization, authentication and resource loading.
To support querying requirements, this library makes use of the [Comunica Query engine](https://comunica.dev/).

### Bashlib features in progress

- [X] Improve token management
- [X] Improve session management
- [X] Handle metadata
- [ ] Handling multiple pods for a given WebID (pim:storage)
- [X] multi parameter removes: rm file1 file2 file3
- [ ] Fixing session refresh. Current implementation can have time-out isssues with longer commands.
- [ ] Make sure discovery of pim:storage and ldp:inbox are according to spec!
- [X] Resource verification on edit (compare before / after hash and notify if something may have changed)
- [ ] Write concrete test cases and spin up local pod server to test
- [ ] Improve consistency of internal logging
- [ ] Improve consistency of exported Javascript interface
- [ ] Add WebID parameter to force using specific webid
- [ ] Add output parameter to log to specified file
- [ ] Improve error handling messaging
- [X] npm release
- [ ] Refactor to use components.js for dynamic extension with new utilities

