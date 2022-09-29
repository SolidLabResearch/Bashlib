# Bashlib Tutorial - CLI edition
This tutorial aims to teach the basics of the Solid Bashlib library.
This tutorial only regards the CLI interface of the Bashlib library. For the Node.JS interface, please look at the [Bashlib tutorial - Node.JS edition]()!


**Used aliases in this document:**
All aliases are calculated from the root of the cloned bashlib repo.
  - bashlib-css  - `alias bashlib-css="node bashlib/css/bin/css.js"`
  - bashlib-solid  - `alias bashlib-solid="node bashlib/solid/bin/solid.js"`
  - bashlib-auth - `alias bashlib-auth="node bashlib/solid/bin/solid.js --auth interactive --idp <your pod identity provider>"`
Feel free to use a different authentication scheme for the `bashlib-auth` alias.


## Index
- [Bashlib Tutorial - CLI edition](#bashlib-tutorial---cli-edition)
  - [Index](#index)
  - [Setting up a Solid Server](#setting-up-a-solid-server)
  - [Setting up Bashlib](#setting-up-bashlib)
  - [Bashlib-css](#bashlib-css)
    - [Creating a new Solid account + data pod](#creating-a-new-solid-account--data-pod)
    - [Creating a Client Credentials token](#creating-a-client-credentials-token)
    - [Authentication options](#authentication-options)
  - [Bashlib-solid](#bashlib-solid)
    - [Authentication](#authentication)
      - [Authenticate using Client Credentials token](#authenticate-using-client-credentials-token)
      - [Interactive authentication](#interactive-authentication)
      - [No authentication](#no-authentication)
    - [Commands](#commands)
      - [URL Prefixes](#url-prefixes)
      - [fetch / cat](#fetch--cat)
      - [list / ls](#list--ls)
      - [copy / cp](#copy--cp)
      - [move / mv](#move--mv)
      - [remove / rm](#remove--rm)
      - [mkdir](#mkdir)
      - [touch](#touch)
      - [find](#find)
      - [query](#query)
      - [perms](#perms)
      - [edit](#edit)
  - [Examples](#examples)
    - [Creating a new pod and authentication token](#creating-a-new-pod-and-authentication-token)
    - [Setting up a profile image on your pod](#setting-up-a-profile-image-on-your-pod)

## Setting up a Solid Server
Before we use the Bashlib library, we need a Solid account and accompanying data pod to use the library. In case you already own a Solid pod, you may still want to follow the setup process, as some of the functionality will only be available for pods created on a [Community Solid Server](https://github.com/CommunitySolidServer/CommunitySolidServer) instance.

To setup a Solid Server where we can register an account and get an accompanying data pod, we will make use in this tutorial of the [Community Solid Server](https://github.com/CommunitySolidServer/CommunitySolidServer). 

To setup a local Community Solid Server instance, please execute the code below.
More information on the setup process can be found [here](https://github.com/KNowledgeOnWebScale/solid-linked-data-workshops-hands-on-exercises/blob/main/css-tutorial.md).
When you are done with the tutorial, you can remove the current folder to delete all created files.

```
git clone https://github.com/CommunitySolidServer/CommunitySolidServer.git
cd CommunitySolidServer/
npm install
npm start
```

Congratulations! Your own CSS instance is now running on localhost on port 2323. 
You can confirm this by browsing to `http://localhost:3000` in the browser, and you will be greeted with a setup screen.
You do not have to do anything on this screen for now! 

## Setting up Bashlib
To setup the `Bashlib` library, we execute the following code:
```
git clone https://github.com/SolidLabResearch/Bashlib.git
cd Bashlib
bash setup.sh
```
This code does the setup for Bashlib, and installs the available modules.
Your `Bashlib` library is now setup and ready to use!


## Bashlib-css
To start with `Bashlib`, we first take a look at the `Bashlib-css` module.
The `Bashlib-css` module gives a set of functions specifically designed for the Community Solid Server. 
It handles functionality that is currently not included in the spec for Solid and may vary between implementations of the Solid specification.
The CLI interface for `Bashlib-css` can be accessed here:
```
node bashlib/css/bin/css.js
```
**optional:** You can create an alias for this path so you do not have to write the full command every time. From here on, I will assume the alias `alias bashlib-css="node bashlib/css/bin/css.js"` to be set!
### Creating a new Solid account + data pod
*compatbility: CSSv2.0.0 - current*

A first function of the `Bashlib-css` module is the creation of a new Solid-account and accompanying data pod on a CSS instance.
This serves as an to having to use the browser interface to register a new user, which can be found on [http://localhost:3000/idp/register/](http://localhost:3000/idp/register/).

To create a new Solid account and pod, please execute the following code:
```
bashlib-css create-pod 
```
An interactive prompt will be shown, requiring you to enter the information of your to-be-created Solid account.

e.g. 
```
? CSS instance base url   http://localhost:3000/
? Pod and user name       Bob
? User email              bob@test.edu
? User password           bobIsTheBest123 
```
This will result in the message that a pod for bob has been created succesfully on [http://localhost:3000/bob/profile/card#me](http://localhost:3000/bob/profile/card#me). If you navigate to this URL, you can now see the profile document of the newly created Solid account on the newly created Solid pod.

If you do not want an interactive prompt, you can use the command with all options enabled 
```
bashlib-css create-pod -b "http://localhost:3000/" -n Carol -e carol@test.edu -p carolIsTheBest123
```
to automatically create a new pod without requiring manual interaction.


### Creating a Client Credentials token
*compatbility: CSSv4.0.0 - current*

A second function of the `Bashlib-css` module is the creation of a [Client Credentials token](https://github.com/CommunitySolidServer/CommunitySolidServer/blob/main/documentation/client-credentials.md). 
These tokens allow the user to authenticate without requiring user interaction by having them authenticate using a browser window. 

To create such a token, please execute the following code:
```
bashlib-css create-token
```

This will again open an interactive prompt, requiring you to enter the information of the user registered on this Solid server for which you want to create the token:
```
? Token name        bobs-auth-token
? Pod baseuri       http://localhost:3000/
? User email        bob@test.edu
? User password     bobIsTheBest123
? Token location    .tokens/.bobs-auth-token
```

You just succesfully created a Client Credentials token for Bob!
You can inspect the newly created token using `cat .tokens/.bobs-auth-token` to verify this.

This command can again be executed without an interactive prompt by providing values for all options:
```
bashlib-css create-token -v -b "http://localhost:3000/" -n carols-auth-token -e carol@test.edu -p carolIsTheBest123 -o .tokens/.carols-auth-token
```

### Authentication options
The `Bashlib-css` module exposes a set of authentication options.
These are however not exposed over the CLI interface, but are available in the Node.JS interface to use in your own Node.JS projects.
The `Bashlib-solid` module makes use of these options to authenticate the user on the CLI.


## Bashlib-solid
The `Bashlib-solid` module provides a set of functions to facilitate usage of and development for Solid from Node.JS and the CLI.
The CLI interface for `Bashlib-solid` can be accessed here:
```
node bashlib/solid/bin/solid.js
```
**optional**: You can create an alias for this path so you do not have to write the full command every time. From here on, I will assume the alias `alias bashlib-solid="node bashlib/solid/bin/solid.js"` to be set!

### Authentication
Authentication in the `Bashlib-solid` module is done using the authentication options exposed by the `Bashlib-css` module. 
We will quickly go over the available authentication options:



#### Authenticate using Client Credentials token
*compatbility: CSSv4 - current*
We can now use the client credentials token we made in [the previous step](#creating-a-client-credentials-token) to authenticate our user from the CLI. We can do this using the following authentication options:
```
 bashlib-solid --auth token <command> [options]
```
Your identity provider is stored together with the token on your local filesystem, and does not have to be provided explicitly anymore.

We can now use the authenticated fetch command on private resources:
```
  bashlib-solid --auth token -t .tokens/.bobs-auth-token fetch http://localhost:3000/bob/profile/
```

**note: This method of authentication is restricted to pods hosted on a Community Solid Server instance of v4.0.0 and later. If you have another provider, please use the interactive login option described below.**



#### Interactive authentication
*compatbility: all*

An alternative authentication method is the interactive login.
This option provides the default [Inrupt Node.JS authentication flow](https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/authenticate-nodejs/), and is compatible with all pods.
The interactive authentication requires the user to manually authenticate using their browser.
```
 bashlib-solid --auth interactive --idp http://localhost:3000 <command> [options]
```
We can now use the authenticated fetch command on private resources:
```
  bashlib-solid --auth interactive --idp http://localhost:3000 fetch http://localhost:3000/bob/profile/
```

#### No authentication
*compatbility: all*

Finally, you can just make use of the library without authenticating yourself.
This is the default option when no auth option is specified.
```
 bashlib-solid --auth none  <command> [options]
```
We can now use fetch public resources as such:
```
  bashlib-solid --auth none fetch http://localhost:3000/bob/profile/card
```

### Commands
Now that we have created a Solid account and pod and learned how to authenticate, we will look at the available commands in `Bashlib-solid`. In this section, we will do a runthrough for all available commands, and how they can be used.
These commands will help you see solid not only as a Web technology, but as something you can easily include in existing workflows, while enabling ease of access and sharing of resources in between systems and users.
**We use the alias `alias bashlib-auth = "node bashlib/solid/bin/solid.js --auth token -t .tokens/.bobs-auth-token"` as a shortcut to make authenticated requests from here. In case you use another authentication method feel free to choose your own alias!**

#### URL Prefixes
All commands support URL prefixes for all URL parameters.
**Prefixes only work when the user is authenticated!**
Accepted prefixes are:
  - `webid:`  - The user WebID
  - `inbox:`  - The user inbox (if available) 
  - `root:`   - The user storage root (only found if the WebID is inside te data pod)
  - `base:`   - Identical to `root:`

For our user bob, we can now write the following url
```
  base:/public/resource1.ttl
```
to define the resource located at
```
  http://localhost:3000/bob/public/resource1.ttl
```
From here on out, we will make use of the prefixes, so feel free to authenticate with your own data pod, and follow the steps on your own pod environment.

#### fetch / cat
The first command is the `fetch` command, with its twin the `cat` command.
Both commands have an identical result, of fetching and displaying the remote resource to `stdout`, 
but the `fetch` command can take additional flags to pass custom headers and more.

To fetch the user webId, we can now call the following function:
```
  bashlib-auth fetch webid:
```
As the authenticated user is Bob (see the alias we created), we just fetched bob's WebID.
Additional options can be found by calling the help function.
```
  bashlib-auth fetch --help
```
If we want to fetch the file in an other RDF format, we can add custom headers:
```
  bashlib-auth fetch -h "Accept: application/ld+json" webid:
```

#### list / ls
The `list` or `ls` command displays a listing of a container on a Solid pod.
The url argument should end in a `/` as it must be a container.
Options can be discovered using the help command. 

To list the resources in our profile folder, we use the following command:
```
  bashlib-auth ls base:/profile/
```

By looking at the help function, we now will add the `--all` flag to also include any .acl files in the directory, and the `--long` flag to show a table overview of the result

```
  bashlib-auth ls --all --long base:/profile/
```


#### copy / cp
The `copy` or `cp` command copies resources form and to both the local filesystem and a data pod.
**Make sure you have read permissisons for the source location and write permissions for the destination location when they are on a pod.**

We will demonstrate the copy command by uploading a profile image form our local disk.
If you have chosen a local image file, we can now upload this to our pod as follows:
```
 bashlib-auth cp contacts.ttl base:/profile/
```
This copies the `contacts.ttl` file to the container at the url `http://localhost:3000/bob/profile/`, and creates the contacts.ttl resource in this container.
We can now request the copied file as follows:
```
 bashlib-auth cat base:/profile/contacts.ttl
```
We can also copy resources from one location on our pod to another location as follows:
```
 bashlib-auth cp base:/profile/contacts.ttl base:/test/
```
and can now fetch the resource at the target location
```
 bashlib-auth fetch base:/test/contacts.ttl
```
We see that the missing containers were automatically created.

Notes:
- Directories are always copied recursively as a default.
- Copying files without an extension from the data pod will result in <filename>$.<extension>, with the extension value based on the file contenttype.
- Copying a file `card$.ttl` to your data pod will result in a file `card` with a content type of `text/turtle`.
- Copying a file to a directory will place that file with the given filename in the destination directory.
- When directly copying an .acl file, the `--all` flag must not be set. 
- Missing containers are automatically created.

#### move / mv
The `move` or `mv` command moves resources between different locations on a data pod or between data pods. It is equal to a `cp` operation followed by a `rm` operation on the source. 
**Make sure that the correct permissions are set to read and remove the source resources, and write to the desintation resources.**

In the last section, we made a `contacts.ttl` resource in our `base:/test/` container. 
We can now move the test resource we just made as a demonstration:
```
bashlib-auth mv base:/test/contacts.ttl base:/test/demo_contacts.ttl
```


#### remove / rm
The `remove` or `rm` command removes resources from a data pod.

With this command, we can now remove the `demo_contacts.ttl` file in the `/test` folder:
```
bashlib-auth rm base:/test/demo_contacts.ttl
```
If we now look at the container listing:
```
bashlib-auth ls base:/test/
```
we see that the resource has been removed.
We can also remove the container now as follows:
```
bashlib-auth rm base:/test/
```
To remove a container together with the contained resources, the `-r, --recursive` flag has to be set.


#### mkdir
The `mkdir` command creates a target container.

```
bashlib-auth mkdir base:/Pictures/
```
creates a new `Pictures/` container in the root of your pod.

#### touch
The `touch` command creates a target resource in a container.

```
bashlib-auth touch base:/test.txt
```
creates a new resource `test.txt` in the root of your pod.

#### find
The `find` command enables you to find specific files in a given container based on a given filename regex.

If we want to find where our profile card is located on our data pod, we can use the following command:
```
bashlib find --full base: card
```
This command looks to match all found files in the `base:` container with the given filename match `card`.
We use the `--full` flag to match with and display the full url of the found resources.

#### query
The `query` command is a convenience command that lets the user query all files in a given container based on a given SPARQL query.

To return all triples from our WebID, we can use the following command:
```
bashlib-auth query webid: "Select * WHERE { ?s ?p ?o . }"
```

This command also works on containers to recursively query all contained resources.
To test this, we first make a new file containing a SPARQL query:
```
echo "Select * WHERE { ?s ?p ?o . }" > queryFile.txt
```
Now, we can use this query to get all triples of all files on our data pod. We use the `--pretty` flag to receive the results in a table format:
```
bashlib-auth query -q -p base: queryFile.txt
```


#### perms
The `perms` command provides three operations to list, edit and delete permissions for a resource on a Solid pod.
**This command only works for pods implementing the WAC protocols. Pods implementing the ACP protocol (Inrupt) are currently not supported.**

***listing***

To list the permissions of your profile resource, we can use the following command:
```
bashlib-auth perms list webid:https://github.com/CommunitySolidServer/CommunitySolidServer
```
Here, we see the permissions written out for all agents, groups and the public for the given resource.
This also works for containers. The following command prints the permissions of the pod root in a table format:
```
bashlib-auth perms list --pretty base:
```

***editing***
**note: The editing of permissions for containers and other resources is exactly the same.**

To demonstrate the editing of permissions, we will first create a `Private` and `Public` folder on our pod.
```
bashlib-auth mkdir base:/Private/
bashlib-auth mkdir base:/Public/
```

We start by setting the permissions for the `base:/Public/` container to be publicly readable, and make this the default for all contained resources (only an option for WAC).
```
bashlib-auth perms edit base:/Public/ p=rd
```

When we now list the resource permissions, we see that public permissions are set to `read` and `default`.
```
bashlib-auth perms list --pretty base:/Public/
```

Now we want to make sure the public cannot read or interact in any way with out `Private` container.
For this we set public permissions to be nothing.
However, we want our currently authenticated user to have full permissions in this container and all contained resources as a default (append permissions are implicitly set by giving write permissions):
```
bashlib-auth perms edit base:/Private/ p= u=rwcd
```

When we now list the resource permissions, we see that no public permissions are set. We also see that the permissions are NOT inherited, meaning they are have been set for the resource successfully.
```
bashlib-auth perms list --pretty base:/Private/
```

Finally, we want to give permission to our friend with the WebID `https://my.friends.pod/profile/card#me` to read and write in our `Private` container.
For this we use the following command:
```
bashlib-auth perms edit base:/Private/ https://my.friends.pod/profile/card#me=rw
```

When we now list the resource permissions, we see that our friend `https://my.friends.pod/profile/card#me` had received read, write and append (implicitly given through write) permissions over our `Private` container.
```
bashlib-auth perms list --pretty base:/Private/
```

***deleting***
Finally, we can also delete resource permissions.
We can remove the permissions set for a given resource.

To remove the permissions set for the public container, we can use the following command:
```
bashlib-auth perms delete base:/Public/
```

If we now list the permissions for this container, we see that all current permissions are inherited from the parent container, as the permissions for the `Public` container have been deleted.
```
bashlib-auth perms list --pretty base:/Public/
```


#### edit
The edit command is a helper command to quickly allow you to edit resources on your pod.
The command takes the url of a resource (cannot be a container), copies the resource to your local filesystem and opens the resource with your given or your default editor.

We will now edit the file `base:/Public/test.txt` with our local vim editor. 
If you do not have vim installed, please select your prefered editor or do not use the flag to use the default system editor.
Using the `--touch` flag, we will create a new file if the resource does not exist yet.
```
bashlib-auth edit --editor vim --touch base:/Public/test.txt
```

Now your editor will open with an empty file.
You can now edit the file to contain a string of text, and then save the file in your editor.
On exiting the editor, and returning to the terminal, you must press any button to continue.
Now, the edited resource will be copied from your local filesystem to its location on the data pod, and be removed from the local filesystem.

If we now look at the created file
```
bashlib-auth cat base:/Public/test.txt
```
we see that the file has been created and contains the text that was written in the editor.





## Examples
In this section, we will go over some quick examples of how the CLI interface of `Bashlib` can be used to do some common tasks.
For all examples, we will make use of the following aliases:

- bashlib-css - `alias bashlib-css="node bashlib/css/bin/css.js"`
- bashlib-solid - `alias bashlib-auth="node bashlib/solid/bin/solid.js"`
- bashlib-auth - `alias bashlib-auth="node bashlib/solid/bin/solid.js" --auth <your_preferred_auth_option`


### Creating a new pod and authentication token 
*compatibility CSSv4 - current*

First, we need to have a Community Solid Server instance running. More info on how to setup a Community Solid Server can be found [here](https://github.com/CommunitySolidServer/CommunitySolidServer).

First, we create a new pod on our running CSS instance.
For this we run the `create-pod` command:
```
bashlib-css create-pod 
```
and we fill in the required information:
```
? CSS instance base url   your CSS server baseURL, e.g. http://localhost:3000/
? Pod and user name       the name for your pod
? User email              the email address to login to the pod
? User password           the password to login to the pod
```

On completion, you will receive the following message
```
Pod for <name> created succesfully on <baseurl>/<name>/profile/card#me
```
This `<baseurl>/<name>/profile/card#me` is the WebID of your newly created Solid account.

Now that we have created a Solid account, we will create an authentication token we can use to authenticate to our pod from the CLI. For this, we use the `create-token` command.
```
bashlib-css create-token
```
and fill in the required information:
```
? Token name        the name of the token e.g. my-cli-auth-token
? Pod baseuri       your CSS server baseURL, e.g. http://localhost:3000/
? User email        the email address to login to the pod
? User password     the password to login to the pod
? Token location    you can choose a custom location or leave this blank to default to ~/.solid/.css-auth-token
```

This creates a client-credentials-token you can use to authenticate at the `Token location` (default is `~/.solid/.css-auth-token`). With this token, we can now authenticate our commands, such as listing the permissions of our WebID profile resource.

In case the default location was used to store the token, we use the following command
```
bashlib-solid --auth "token" perms list --pretty webid:
```
In case a custom token location was given, we pass the `-t` flag to indicate where the token can be found:
```
bashlib-solid --auth "token" -t <path_to_token> perms list --pretty webid:
```

You can alias this to have a quick and easy way to use `Bashlib` from the cli (-t option only required if the default storage location was not used):
```
alias bashlib-auth=`bashlib-solid --auth "token" -t <path_to_token>
```
From here on, you can use this alias to make all your commands authenticated:
```
bashlib-auth perms list --pretty webid:
```



### Setting up a profile image on your pod 
Here we will discuss how we can quickly add a profile image to our profile, and store it on our pod. For this, we first need to choose a profile image. Say we have a nice image we want to use for this at `~/Pictures/my_nice_picture.png`.

First, we copy the image to our pod at the location `base:/profile/img.png`.
```
bashlib-auth cp ~/Pictures/my_nice_picture.png base:/profile/img.png
```

Next, we will make this image publicly readable, so everyone can see your profile picture. If you do not like this, feel free to only add read permissions for specific WebIDs.
```
bashlib-auth perms edit base:/profile/img.png p=r
```

With our image uploaded to our pod and made public, we will now have to edit our profile document to link the new profile image to our WebID.
```
bashlib-auth edit webId:
```
This will open our profile document in our default editor.
We now add the following line to the document (replace `imageurl` with the url of the newly uploaded image):
```
<#me> <http://xmlns.com/foaf/0.1/img> <imageurl> .
```

Now save the document, and exit the editor.
Press on any key to continue, and your profile document is now updated with a link to your newly added profile image 

Congratulations, you just set your profile image.





