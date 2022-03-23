#!/bin/bash

cd tools/

cd css/
npm install;
npm run build;
cd ../

cd solid/
npm install;
npm run build;
cd ../

# cd solid-shell/
# npm install;
# npm run build;
# cd ../

# Exit packages folder
cd ..
