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
npm start -- -c @css:config/file.json -f ./data/ -p 2323
```

Congratulations! Your own CSS instance is now running on localhost on port 2323. Now browse to `http://localhost:2323` in the browser, and you will be greeted with a setup screen. Here you may click on `complete setup`, and the server setup is now done! (You will notice that when you click on the `homepage` link, this will give a `Not logged in` error. This is because the server root is no longer publicly available now, and you are not currently authenticated.)

## Setting up Bashlib
To setup the bahlib, we execute the following code:
```
git clone https://github.com/MellonScholarlyCommunication/css-suite/tree/master/bashlib/css
```

## Bashlib-css
The `Bashlib-css` module gives a set of functions specifically designed for the Community Solid Server. It handles functionality that is currently not included in the spec for Solid and may vary between implementations.


### Creating a new Solid account + data pod
The `Bashlib-css` module provides functionality to create a new data pod.
