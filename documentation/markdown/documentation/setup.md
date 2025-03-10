# Setting up Bashlib


## Requirements

- Node >= 16.0.0

## Setup
**Using github**
``` 
git clone git@github.com:SolidLabResearch/Bashlib.git
cd Bashlib
npm install 
npm run build
```
After the install, add an alias to your `.bashrc` for convenience:
```
alias sld="node /path/to/folder/.../bin/solid.js"
```

**Using NPX**
```
npx solid-bashlib
```
This will automatically install any dependencies.
You can add an alias to your `.bashrc` for convenience:
```
alias sld="npx solid-bashlib"
```

**Note that while more straightforward, using NPX incurs a performance penalty of up to 1 second!
Consider installing the tool via Github to speed things up!**
