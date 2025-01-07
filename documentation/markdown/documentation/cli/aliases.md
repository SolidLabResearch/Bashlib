# Using aliases

The current implementation of using aliases is weak, and may be changed in subsequent releases.
Alias management is a potential future addition.

## Base
The `base:` alias indicates the root of your Solid pod.
Executing a command using this alias will target the root of your pod, if it is known.
This value is taken from the `pim:storage` triple in the WebID.
In case multiple storage locations are available, results in using this may be inconsistent.
<br />
The following command wil make a listing of the root of the Solid pod of the current user.
```
sld ls base:/
```


## WebID
The `webid:` alias will target the user WebID.
<br />
The following command wil retrieve the user WebID.
```
sld curl webid:
```

## Inbox
The `inbox:` alias targets the user inbox, if known.
This value is taken from the `ldp:inbox` triple in the WebID.
<br />
The following command queries the inbox for events
```
sld query inbox:/ "Select ?event where { ?event a <http://example.org/Event> }
```
