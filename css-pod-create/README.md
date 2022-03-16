# css-pod-create
### Community Solid Server Pod Creation

This is a pod creation script made for the [Community Solid Server](https://github.com/solid/community-server)
The curent implementation only supports v2 of the server, and is created for testing purposes.

## Usage
Currently this code is not hosted on npm, as it is only used for testing purposes.
```
$ git clone git@github.com:MellonScholarlyCommunication/css-suite.git
$ cd css-suite/css-pod-create/
$ npm install
$ npm run build
```

From here, the CLI tool can be used to make create data pods from the command line, or you can import the project using javascript / typescript.

### CLI

The pod creation script can be run from CLI to initialize new data pods from the command line on the [Community Solid Server](https://github.com/solid/community-server) v2.x.x

```
node bin/css-pod-create.js [options] <pod_base_uri> <acocunt_name>
```
The process requires at least the following values to be present
- user name
Optionally, aditional values can be provided
- user email
- user password
- user identity provider

These optional values can be passed through a config file of the format: 
```
{
  email: <user email>,
  password: <user password>,
  idp: <user identity provider> // This is e.g. "http://localhost:3000" for a locally hosted data pod server.
}
```
Missing values in the command line options will be filled from the passed config file.

For more information, please run:

```
node bin/css-pod-create.js --help
```

### Node
This library can be called directly from your own Nodejs projects.
For this, you will currently need to locally import the library from the location where it is stored.
```
import createPods from "install/location"

const options = {
  idp: http://pod.identityProvider.org,
}

const accountData = [
  {
    name: alice,
    email: alice@test.edu,
    password: alicePassword
  }, { 
    ... 
  }
]

await createPods(accountData, options)
```