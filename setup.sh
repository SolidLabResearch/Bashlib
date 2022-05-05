#!/bin/bash

cd bashlib/

cd css/
echo "building /bashlib/css/"
npm install;
npm run build;
cd ../

cd solid/
echo "building /bashlib/solid/"
npm install;
npm run build;
cd ../

# Exit packages folder
cd ..
