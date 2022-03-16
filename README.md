# CSS-Suite
This repository contains a suite of functionality created for the Community Solid Server.
These tools are developed for the Mellon project on Decentralized Scholarly Communication.

## css-login
This tool enables you to login to your a Solid Pod (currently only CSS v2) from the CLI and NodeJS.
It provides a CLI tool ```css-fetch``` that enables you to fetch authenticated resources from the command line by passing credentials as flags or using a config file.


## css-pod-create
This tool enables the creation of Solid Pod instances from the command line or NodeJs (currently only tested for CSS v2).
It provides a CLI tool ```css-pod-create``` enabling the creation of data pods from the command line.


## css-scp
This tool provides file copying functionality for Solid Pod instances.
It enables you to copy resources from the local filesystem to a remote data pod, from a remote data pod to the local filesystem, or even between data pods.
It provides a CLI tool ```css-scp``` enabling the copying of files to and form data pods from the command line.


# Setup
To setup all the projects, please run the setup script.
``` 
git clone git@github.com:MellonScholarlyCommunication/css-suite.git
cd css-suite
bash setup.sh
```