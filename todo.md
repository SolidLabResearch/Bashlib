# README
## CLI
- [x] nagaan welke commands er gebruikt worden
- [x] documentatie per command nagaan
- [x] environment variables 1 per 1 nagaan
  - BASHLIB_AUTH wordt gebruikt om options.auth the initten, maar dit wordt nergens opgevraagd 
  - BASHLIB_IDP wordt gebruikt om options.envIdp te initten, dit wordt effectief gebruikt
  - BASHLIB_TOKEN_STORAGE wordt gebruikt om options.tokenStorage te initten, maar dit wordt nergens gebruikt
  - BASHLIB_SESSION_STORAGE wordt gebruikt om options.sessionStorage te initten, waarna ook options.sessionInfoStorageLocation ingevuld wordt met zelfde waarde? idk why. maar beide worden niet meer gebruikt in de code.
  - BASHLIB_CONFIG wordt gebruikt om options.config te initten, dit wordt effectief gebruikt
  - BASHLIB_AUTH_PORT wordt gebruikt om options.port te initten, en dit wordt ook gebruikt dan.

- [x] nagaan wat een option is en wat een argument is
- [x] nagaan welke commands zelfde functionality hebben en namen toevoegen in de readme
## Node.js
- [x] options nagaan welke nu optional zijn
- [x] nagaan welke commands er gebruikt worden
- [x] documentatie per command nagaan
- [x] duidelijke uitleg wat wat doet bij commando's
- [x] remove gaat nooit verwijderen van local disk
- [ ] mkdir later doen
- [x] bijzetten wanneer nodig dat async iterator wordt teruggegeven
- [x] onderscheid maken tussen standard options en function specific options
# code
- [ ] move baseren op copy in solid-move.ts
- [ ] copy en move moeten enkel destination, aanpassen in solid-copy en solid-move teruggeven
- [ ] meegeven welk soort file je wilt aanmaken bij touch
- [ ] auth remove geeft nog geen melding wanneer je een webid meegeeft dat niet bijgehouden wordt.
- [ ] misschien fixen dat bij list van auth options dat de token name er staat?
# site
## general
- [x] documentation updaten
## API
- [ ] bij interfaces de standard value van dingen zetten, nog outfiguren hoe ik dat erbij moet plaatsen
- [ ] in typedocs kijken "npm run typedocs:dev", is te fixen in de code zelf
## tutorial
- [x] uitschrijven hoe authenticatie werkt
  - --auth none werkt, --auth interactive werkt, enkel token werkt niet denk ik
  - bij de usage van solid.js staat bij auth een request option, maar in de solid.js file staat   .option('-a, --auth <string>', 'token | credentials | interactive | none - Authentication type (defaults to "none")')

- [x] checken wat er nog werkt bij die tutorial en fixen wat ik kan


# pod info

email:  bauke@blomme.be

pass:   b_a_u_k_e

idp:    https://publicpod.rubendedecker.be/

webId:  https://publicpod.rubendedecker.be/bauke/profile/card#me

# Vragen
- geen idee wat een OIDC user is: 
```
[boterham@brooddoos] $ node bin/solid.js fetch webid:

? Could not discover OIDC issuer
Please provide OIDC issuer: 
```
dit blijft errors geven voor eender welke user ik ingeef
