# Bashlib Tutorial
This tutorial provides a quick setup of a Community Solid Server,
and some useful interactions to manage resources on a created Solid pod.


## Setting up a Solid Server
To use Bashlib, we first explain how to setup your own local Solid Server on which 
you can create your first Solid pod.
In case you already have a Solid pod, feel free to skip this section.
Alteratively, you may want to create a Solid pod on one of 
<a href="https://solidproject.org/for-developers#hosted-pod-services">the free Pod provider services</a>.
Note that when using a free provider, if something goes wrong you might not be able to recover
your data, or that service may be relatively slow, as there are free and community hosted.
Additionally, only server running the Community Solid Server or Inrupt Enterprise Solid Server versions
will be able to make client credentials to authenticate automatically without needing an interactive browser session.
A free CSS hosting service <a href="https://solidweb.me/.account/login/password/register/">can be found here</a>.
A free ESS hosting service <a href="https://start.inrupt.com/profile">can be found here</a>.

<br />
To setup your own local Community Solid Server,
we make use in this tutorial of the [Community Solid Server](https://github.com/CommunitySolidServer/CommunitySolidServer). 
The full tutorial can be found [here](https://github.com/KNowledgeOnWebScale/solid-linked-data-workshops-hands-on-exercises/blob/main/css-tutorial.md).
When you are done with the tutorial, you are free to remove the current folder to delete all created files!


We use NPX to setup a CSS instance, and use a file config to store all data in the `data/` folder.
Ideally execute the tutorial in an empty directory, so afterwards you can remove all tutorial data by removing this directory!
```
npx @solid/community-server -c @css:config/file.json -f data/
```

Congratulations! Your own CSS instance is now running on localhost on port 3000! Keep this shell open during the tutorial!
You can confirm this by browsing to `http://localhost:3000` in the browser, and you will be greeted with a setup screen.

### Creating an account
Now we will create an account and associated WebID on this local CSS instance.
Navigating to `http://localhost:3000` in the browser, and you will be greeted with a setup screen.
Press the <a href="http://localhost:3000/.account/login/password/register/">Sign up for an account</a>
link to create an account on this local CSS instance. As this is a local instance, the email does not 
really matter, as this is only used for authentication purposes and recovering a pod, but is never verified.

For now, we make an example person Bob using his email `bob@test.com` and password `bob`.
Next, we make a pod for this account by pressing the `Create pod` link!
Here, we provide a pod name, for example `mydatapod`.
Congratulations, you just created a new data pod at `http://localhost:3000/mydatapod/`
and associated WebID at `http://localhost:3000/mydatapod/profile/card#me`!



## Setting up Bashlib
With our Solid pod and WebID created, now it is time to setup Bashlib!
For a quick setup, we use NPX
```
npx solid-bashlib curl http://localhost:3000/mydatapod/profile/card#me
```
which prompts to install bashlib, and on installation with show your WebID profile.

Alternatively, a local setup can be cloned from github.
```
git clone https://github.com/SolidLabResearch/Bashlib.git
cd Bashlib
npm install
npm run build;

node bin/solid.js curl http://localhost:3000/mydatapod/profile/card#me
```

**For the remainder of this tutorial, we will use `sld` as the alias for `npx solid-bashlib`.**

## Managing Authentication 
As Solid aims to provide secure online data management, 
working with secured resources requires users to be 
authenticated for the system to evaluate their access.

The full documentation on the authentication options
for bashlib can be found in the <a href="../documentation/cli/authentication/">authentication management section</a>.

### Executing commands without authentication

To run commands over public data without any authentication,
we can start bashlib with the `--auth` flag set to none to
prevent it from automatically trying to authenticate requests.
We can for example make an unauthenticated request to our 
created WebID as follows (WebID resources are always public):
```
sld --auth none curl --header "Accept: application/n-triples" http://localhost:3000/mydatapod/profile/card#me
```
This creates unauthenticated fetch request to the WebID resource
and outputs the result on the command line. As we passed a `--header`
option that requests the result in an n-triples format, the returned
data is formatted in an n-triples format.

### Setting a WebId and interactive authentication

However, for most personal use resource operations will require
the user to be authenticated. To start, we pass our created WebID
to Bashlib. This can either be done using the interactive interface
by running:
```
sld auth set
```
and selecting the option: `Authenticate using new WebID` and providing
your WebID here. Alternatively, the WebID option can be provided 
directly in the arguments as follows:
```
sld auth set http://localhost:3000/mydatapod/profile/card#me
```

To see the WebID used by Bashlib to authenticate requests, we can run
```
sld auth show --pretty
```
which shows us that our WebID is now used by bashlib to authenticate requests.

However, now we've only told Bashlib our WebID, we have not yet given it the
means to authenticate a request using this WebID. There are two options for 
authenticating with Bashlib to be able to make authenticated requests.
We can use an interactive authentication flow that uses our browser to authenticate,
or we can create a credentials token that we can store which will allow us to create
authenticated requests directly without needing an interactive browser session.

Per default, Bashlib will use a dynamic authentication approach, where it will first look
if there is an active authenticated session it can reuse. If not, it will try to create a 
new session using any stored credentials token. If none can be found, it will open a browser
window and have the user authenticate themselves interactively using the browser.

To create a listing of the profile directory of our Solid pod, run the following command:
```
npx solid-bashlib ls base:/profile/
```
This `base:` is an alias for our pod root (`http://localhost:3000/mydatapod/`), 
if it can be discovered from the user WebID.
Upon running the command, a browser window will pop-up asking the user to authenticate themselves.
Once logged in, looking back at the command line we see that a listing is displayed of the profile
container, which is only visible to the user WebID, so the authentication was successful.

Additionally, running the listing command again, we see that no authentication is required, 
as Bashlib stored the previous session, and reuses this session to authenticate subsequent 
requests made for the same WebID.
```
npx solid-bashlib ls base:/profile --pretty
```

Looking at the current authentication status
```
sld auth show --pretty
```
we see that an active session is available now.


### Creating a credentials token to automate authentication
However, having to authenticate interactions can be an overhead,
especially if commands are to be executed automatically from a script.
To automate the authentication flow, we need to make a token that will
allow us to do an authentication flow that does not require a browser window.

**Currently the generation of credential tokens that can directly authenticate a user session is only provided by the Community Solid Server and the Enterprise Solid Server.**
Both implementations differ however. In this section we only address the creation
of a token for the Community Solid Server. If you have a pod on an Enterprise Solid Server,
you can follow the documentation for <a href="../documentation/cli/authentication/#create-token-ess">
ESS token creation in the authentication section</a>.

To create the credentials token for our current WebID in Bashlib, we execute the following command:
```
sld auth create-token-css
```
This will prompt us on if the token we want to create is for our currently logged in user. 
Press `y` to continue. Now we are prompted for our email (bob@test.com) and password (bob).

To confirm the generation of our token, we run the show command again, which now indicates we have an auth token present.
```
npx solid-bashlib auth show --pretty
```
From now on, after session expiration, new sessions will be automatically generated through 
this token without going through an interactive browser session.

**All authentication information is stored per default at ~/.solid/**


## Managing authorization
Now that we have an authorized user, we can manage the authorization rules for the resources 
on our Solid pod. Note that Solid has two competing authorization systems. The Web Access Controls
specification that uses `.acl` resources to manage resource access, and the Access Control Protocol
that uses `.acp` resources to manage resource access.

Bashlib implements two different access management regimes: It fully implements the WAC suite for 
listing and editing permissions and removing permission resources, and it implements the universal
access suite that can work with both WAC and ACP access management systems. However this universal 
system is less expressive in its functionality.
Bashlib will automatically detect the used access control mechanism, but enables additional functionality
when working with pods hosted on a WAC-based Solid Server such as access propagation and identity groups.

### Listing authorization
To list the permissions set on the root of our pod, run:
```
sld access list --pretty base:/
```
We see that our WebID has full permissions to read, write, append and control resources on our pod
(deleting a resource requires write permissions).
We also notice public read permissions on our root container, which we will change in the next section.
If our pod is hosted on a WAC-based Solid Server (such as the Community Solid Server we setup above),
we see the WebID permissions on our root are set as `default`,
meaning they are enforced on all sub-containers and resources of this root container
unless otherwise specified by these sub-containers or resources.
Additionally, the `inherited` field shows if this authorization state is
defined by an `.acl` file tied directly to the resource itself (in that case the value is no),
or if it was derived of a default permissions set by one of the resource parents (in that case the value is yes).


### Editing authorization

As shown above, currently our pod root container is set to be
publicly readable. To change these permissions, we set the public
access rights to our root container to be nothing.
When interacting pods hosted on a WAC-based Solid Server, we can use the `--default` flag to make
these access rules the default, however as the default access defined
by the system is no access, this makes no real difference in this case.
To do this, we run the following command:
```
sld access set base:/ p=
```
The `base:/` value targets our pod root container. 
The `p` value sets the access target as `public`, 
and the empty space after the `=` symbol indicates 
that the permissions given to the public are none.

We confirm this by listing the permissions again:
```
sld access list --pretty base:/
```
showing public read permissions are not set anymore.
Additionally, we see that a resource request to the
full URI gives us a `401 Unauthenticated` response.
```
sld --auth none curl http://localhost:3000/mydatapod/
```

If we now want to create an inbox container, to which
people can write resources but not read resources, 
we first make a new directory
```
sld mkdir base:/inbox/
```
that we can confirm in our listing to exist now:
```
sld ls base:/
```

Listing permissions for this created container, we see 
that no public permissions are set for this container.
```
sld access list --pretty base:/inbox/ 
```

Now, we set public read permissions for this resource:
```
sld access set base:/inbox/ p=w
```
Listing permissions again shows that now only read permissions
are assigned to this container.
```
sld access list --pretty base:/inbox/ 
```

Note that setting permissions for an identifier removes 
any existing permissions. Setting read permissions as follows
```
sld access set base:/inbox/ p=r
```
will remove the existing write permission, as we did not renew it
in this operation.
```
sld access list --pretty base:/inbox/ 
```

To give access to our contact to also read our inbox, 
we assign access rules for their WebID.
```
sld access set base:/inbox/ https://poeple.org/alice/webid=r
```
Listing the permissions now we see Alice has been given read access to our inbox container.


## Requesting and querying resources
In addition to authentication and authorization management, Bashlib provides a set of
commands aimed at the requesting and querying of resources that we will go over here.
The documentation for every command can be found <a href="../documentation/cli/authentication">here</a>.

The first command we have already touched upon is `curl`. It mimics the curl command provided by BASH
and provides options for choosing the HTTP method, the body and more. 
Simply executing a curl on a URL performs a GET request.
```
sld curl base:/
```

The next command we have seen before is the `ls` command. 
It outputs a listing of the targeted container, and can be 
made to include access control and metadata resources present
in the container as well.
```
sld ls -la base:/
```

The `tree` command allows us to create a directory tree 
starting from the targeted container. 
```
sld tree base:/
```

The `cp` command allows the copying of resources on the same pod,
between pods, or from and to the local file system. It per default 
is fully recursive, and will copy the whole underlying resource
tree to the target destination.
```
sld cp /path/to/img.png base:/images/img.png
```

The `mv` command is similar to the copy command, but it removes the 
source resources after the move (except for when moving from the local
file system).
```
sld mv base:/images/img.png base:/photos/.
```

The `rm` command can be used to remove resources and containers from 
a Solid pod. It requires an explicit flag to work recursive.
```
sld rm -r base:/photos/
```

The `mkdir` command creates an empty container on a Solid pod.
```
sld mkdir base:/documents/
```

The `touch` command creates an empty resource
```
sld touch base:/documents/work/file.txt
```

The `find` command searches all resources in the given container and its sub-containers for a name match.
```
sld find base:/ file.txt
```

The `find` command evaluates a query over all resources in the given container and its sub-containers individually.
The `--federated` flag can be used to evaluate the query over the combined knowledge graph of all found resources.
```
sld query --all base:/ "Select ?person where { ?person <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://xmlns.com/foaf/0.1/Person> . }" 
```

The `edit` command opens a remote resource in a local editor. It copies the resource to a temporary file, 
after which changes can be committed to this file. Upon pressing a button in the Bashlib program, this 
temporary file is synced again with the remote resource.
```
sld edit base:/documents/work/file.txt
```


## Setting up a profile image on your pod 

Let's end with a concrete task, setting a profile picture.
We choose our profile picture located at `~/Pictures/my_nice_picture.png`.

To start, we copy the image to our pod at the location `base:/profile/img.png` using the following command:
```
sld cp ~/Pictures/my_nice_picture.png base:/profile/img.png
```

As profile pictures need to be publicly readable, so everyone can see your profile picture,
we set public read permissions for this resource.
```
sld access set base:/profile/img.png p=r
```

With our image uploaded to our pod and made public, 
we will now have to edit our profile document to link the new profile image to our WebID
(use the `--editor` option to choose an alternative editor)
```
sld edit webId:
```
This will open our profile document in our default editor (or our editor of choice).
We now add the following line to the document (replace `imageurl` with the url of the newly uploaded image):
```
<http://localhost:3000/mydatapod/profile/card#me> <http://xmlns.com/foaf/0.1/img> <http://localhost:3000/mydatapod/profile/img.png> .
```

Now save the document, and exit the editor.
Press on any key to continue, and your profile document is now updated with a link to your newly added profile image 

Congratulations, you just set your profile image!

If you were using a web-hosted Solid pod, you should be able to see your result when looking at your profile 
<a href="https://linkeddata.github.io/profile-editor/#/profile/view">here</a>. For locally hosted pods however,
most likely your browser will stop you from looking at localhost links because of CORS errors.





