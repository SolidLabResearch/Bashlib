#!/bin/bash

cd css-login;
npm install;
npm run build;

cd css-scp;
npm install;
npm run build;

cd ../css-pod-create
npm install;
npm run build;

cd ..

