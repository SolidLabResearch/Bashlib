### Bashlib v0.2 features

- [X] Combining the css and solid functionality in one command
- [X] Token management
- [X] Session management
- [ ] Handling multiple pods for a given WebID (pim:storage)
- [X] Handle metadata
- [ ] Session refreshing on longer commands where session may time-out in the middle of command!
- [X] Resource verification on edit (compare before / after hash and notify if something may have changed)
- [ ] Interactive Solid shell
- [ ] Make sure discovery of pim:storage and ldp:inbox are according to spec!
- [ ] TESTINGINGINGING
- [ ] RELEASE ON NPM!



- session manager: handles active sessions (cfr solid auth client)
- token manager: handles creation of new session on session timeout with token
- 