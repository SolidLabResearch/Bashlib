# Bashlib Tutorial - CLI edition
This tutorial aims to teach the basics of the Solid Bashlib library.
This tutorial only regards the CLI interface of the Bashlib library. For the Node.JS interface, please look at the [Bashlib tutorial - Node.JS edition]()!



## Index
- [Bashlib Tutorial - CLI edition](#bashlib-tutorial---cli-edition)
  - [Index](#index)
  - [Setting up a Solid Server](#setting-up-a-solid-server)
  - [Setting up Bashlib](#setting-up-bashlib)
  - [Bashlib-css](#bashlib-css)
    - [Creating a new Solid account + data pod](#creating-a-new-solid-account--data-pod)

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
*compatbility: CSSv.0.0 - current*

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
This will result in the message that a pod for bob has been created succesfully on [http://localhost:3000/Bob/profile/card#me](http://localhost:3000/Bob/profile/card#me). If you navigate to this URL, you can now see the profile document of the newly created Solid account on the newly created Solid pod.

If you do not want an interactive promt, you can call the function with all 