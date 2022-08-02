#!/bin/bash

cd bashlib/


cd solid/
echo "building /bashlib/solid/"
npm install;
npm run build;
cd ../

# Exit packages folder
cd ..
