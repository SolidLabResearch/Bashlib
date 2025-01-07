# Authentication Management

The Bashlib CLI interface provides multiple options for authentication management.
It enables interactive login flows using the browser, that work with any Solid pod server.
Additionally, it includes the client credentials flow to generate authentication tokens without needing a browser login
both for the Community Solid Server v7 and the Enterprise Solid Server from Inrupt.

<br />
All examples make use of the abstraction `sld` as an alias for `node bin/solid.js`, 


## Enforcing specific authorization flows
When setting up test flows on Solid, it might be interesting to force a specific authentication flows to be used.
For this, the `--auth` option can be set on the bashlib program as such:]
```
sld --auth interactive
```
This examples forces authentication via an interactive browser session. Other options are `token` for only token based authentication,
`none` for no authentication and `request` to dynamically choose an authentication option during use, which is the default.
The `--port` option can be changed to change the port of the local service that is setup to manage interactive authentication flows with the browser.

## Auth command
The `auth` command contains all functionality to manage authentication options and create client credentials tokens.

### Set
The `set` subcommand is used to manage the authentication session for Bashlib.
It provides the ability to set a specific WebID as an argument, or if no argument is given starts an interactive selection dialog to change the active WebID.

#### arguments
```
Arguments:
  webid       Set active WebID directly, without requiring manual selection.
```
The `webid` argument directly sets the session to the provided WebID value.

#### examples
Interactive session management
```
sld auth set
```

Setting a specific active WebID
```
sld auth set https://people.org/alice/webid
```

### Show
The `show` subcommand shows the current authentication session. It shows the WebId, if there is an active authentication session and if a client credential token is available.


#### options
```
Options:
  -p, --pretty  Show listing in table format.
```
The `--pretty` option displays the result in a table formate.

#### examples
```
sld auth show
```

### Clear
The `clear` subcommand clears the current authentication session and active WebID. It does not remove any stored authentication information.

#### examples
```
sld auth clear
```


### List
The `list` subcommand lists the stored authentication information. It shows the WebIds, if there is an active authentication session and if a client credential token is available.

#### options
```
Options:
  -p, --pretty  Show listing in table format.
```
The `--pretty` option displays the result in a table formate.

#### examples
```
sld auth list
```

### Remove
The `remove` subcommand provides the ability to remove authentication information from Bashlib.
It provides an interactive menu if no argument is given, or can remove information for specific WebIDs or all information directly via the CLI arguments.

#### arguments
```
Arguments:
  string      webid | all
```
The command has an optional parameter. 
When passing the argument string `all`, all authentication information is removed.
Passing a specific WebID removes all authentication information tied to that WebID.
If no argument is passed, an interactive CLI menu is provided.

#### examples
Opening the interactive menu
```
sld auth remove
```

Removing all authentication information
```
sld auth remove all
```

Removing a specific WebID
```
sld auth remove https://people.org/alice/webid
```


### Create Token (CSS)
The token creation is divided in two subcommands, 
one for the Community Solid Server and one for the Inrupt Enterprise Solid Server,
as both have a different approach to token generation for client applications.

The `create-token-css` command creates a client credentials token for pods hosted on
a Community Solid Server version 7. The authentication options can be passed both
as command line arguments, or in an interactive dialog if they are not provided through
the CLI options.
The interactive creation menu will ask to use the WebID of the current session to create
a token when available.

#### options
```
Options:
  -w, --webid <string>     User WebID
  -n, --name <string>      Token name
  -e, --email <string>     User email
  -p, --password <string>  User password
  -v, --verbose            Log actions
  -h, --help               display help for command
```
The `--webid` option is the WebID for which the token is created.
<br />
The `--name` option is the name of the token (only important for token management).
<br />
The `--email` option is the email that was used to create the account tied to the WebID.
<br />
The `--password` option is the password tied to the account.
<br />
the `--verbose` option outputs operation logs.

#### examples
Open interactive dialog to create token
```
sld auth create-token-css
```

### Create Token (ESS)
The `create-token-ess` command creates a client credentials token for pods hosted on
an Inrupt Enterprise Solid Server. The authentication options can be passed both
as command line arguments, or in an interactive dialog if they are not provided through
the CLI options.
The interactive creation menu will ask to use the WebID of the current session to create
a token when available.
<br />
The Inrupt token generation relies on the registration of applications via their 
<a href="https://login.inrupt.com/registration.html">application registration service</a>.
After registering Bashlib, an `id` and `secret` value will be shown. These values need
to be provided to this command to be able to automatically create authenticated sessions
without needing interactive login.

#### options
```
Options:
  -w, --webid <string>     User WebID
  -i, --id <string>        application registration id
  -s, --secret <string>    application registration secret
  -v, --verbose            Log actions
  -h, --help               display help for command
```
The `--webid` option is the WebID for which the token is created.
<br />
The `--id` option is the `id` value retrieved from the registration flow described above.
<br />
The `--secret` option is the `secret` value retrieved from the registration flow described above.
<br />
the `--verbose` option outputs operation logs.

#### examples
Open interactive dialog to create token
```
sld auth create-token-ess
```