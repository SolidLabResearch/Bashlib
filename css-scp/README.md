# css-scp
### Solid scp

This is a fily copying script that includes solid autentication functionality.
The authentication functionality makes use of the login script in this suite, and is currently only working for pods hosted using the [Community Solid Server](https://github.com/solid/community-server)
The curent implementation only supports v2 of the server, and is created for testing purposes.

## Usage
Currently this code is not hosted on npm, as it is only used for testing purposes.
```
$ git clone git@github.com:MellonScholarlyCommunication/css-suite.git
$ cd css-suite/css-scp/
$ npm install
$ npm run build
```

From here, the CLI tool can be used to copy data from and to remote data pods and the local file system, or you can import the project using javascript / typescript.

### CLI

The file copying script can be run from CLI.

```
node bin/css-scp.js [options] <src> <dst>
```
The available options are used for authentication. If not all values are given, the process will continue unauthenticated:
- user email
- user password
- user identity provider
- config file containing these values in the following format:
```
{
  "idp": "http://your.identity.provider.org/,
  "email": "alice@test.edu",
  "password": "alicePassword"
}
```

### Node

```
import copyData from "install/location"

// Here, you can use your own session object, or get one using the css-login lib.
const options = { fetch: session.fetch }
const src = "source/data/path"
const dst = "destination/data/path"

await copyData(src, dst, options)
```

### Functionality

The copy script is able to copy both from and to the local file system and remote solid pods. The copy logic is dictated by the following table:

|src \ dst | **file** | **dir/container** |
|-------|---|---|
| **file**  | copies file to dst file location | copies file into target dir/container |
| **dir/containe**r   | *IMPOSSIBLE OPERATION* | copies files contained by source <br> dir/container into target dir/container |
