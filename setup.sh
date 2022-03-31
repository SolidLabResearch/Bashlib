#!/bin/bash

cd tools/

cd css/
echo "building /tools/css/"
npm install;
npm run build;
cd ../

cd solid/
echo "building /tools/solid/"
npm install;
npm run build;
cd ../

# cd solid-shell/
# echo "building /tools/solid-shell/"
# npm install;
# npm run build;
# cd ../

# Exit packages folder
cd ..
