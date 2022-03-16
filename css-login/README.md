# css-login
### Community Solid Server Login Handler

This is a login handler script made for the [Community Solid Server](https://github.com/solid/community-server)
The curent implementation only supports v2 of the server, and is created for testing purposes.
A v3 implementation should not require a lot of extra effort, and may come in the near future.
Other pod server implementations have not been tested.

## Usage
Currently this code is not hosted on npm, as it is only used for testing purposes.
```
$ git clone git@github.com:MellonScholarlyCommunication/css-suite.git
$ cd css-suite/css-login/
$ npm install
$ npm run build
```

From here, the CLI tool can be used to make authenticated fetch requests from the command line, or you can import the project using javascript / typescript.

### CLI

The login script can be run from CLI to make authenticated fetches from the command line to a Solid pod running the [Community Solid Server](https://github.com/solid/community-server) v2.x.x

```
node bin/css-fetch.js [options] <resource_url>
```
The process requires at least the following values to be present
- user email
- user password
- user identity provider

These values can be passed using command line options, or passed through a config file of the format: 
```
{
  email: <user email>,
  password: <user password>,
  idp: <user identity provider> // This is e.g. "http://localhost:3000" for a locally hosted data pod server.
}
```
Missing values in the command line options will be filled from the passed config file.

All parameters accepted by the internal fetch function can be passed using the command line options. For more information, please run:

```
node bin/css-fetch.js --help
```


### Node
This library can be called directly from your own Nodejs projects.
For this, you will currently need to locally import the library from the location where it is stored.
```
import NodeSolidSessionProvider from "install/location/"

const sessionProvider = new NodeSolidSessionProvider({
  idp: "http://localhost:3000", // The identity provider URL
  email: "alice@test.edu",
  password: "alicePassword"
});

const session = await handler.login(); // This is a Session object from the @inrupt/solid-client-authn-node library.

// Now that we have our session object, we can fetch authenticated resources.
const options = {
  ...
}
const res = await session.fetch('http://localhost:3000/alice/profile/', options)
```