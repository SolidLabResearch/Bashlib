import { Session, InMemoryStorage } from '@inrupt/solid-client-authn-node';
import LoginHandler from './LoginHandler';
const express = require('express')

export default class CSSConfigLoginHandler extends LoginHandler {

  async login(oidcIssuer: string, appName="Solid tooling", port = 3434, storageLocation=undefined) {
    // console.log(`Logging in to identity provider ${idp} for application ${appName} on port ${port}`)
    return new Promise((resolve, reject) => {
      const app = express();
      const iriBase = `http://localhost:${port}`;
      const storage = new InMemoryStorage();

      const session = new Session({
        insecureStorage: storage,
        secureStorage: storage,
      });
  
      const server = app.listen(port, async () => {
        // console.log(`Listening at: [${iriBase}].`);
        const loginOptions = {
          clientName: appName,
          oidcIssuer,
          redirectUrl: iriBase,
          tokenType: "DPoP" as "DPoP", // typescript fix
          handleRedirect: (url: string) => {
            this.emit('redirect', url)
            // console.log(`\nPlease visit ${url} in a web browser.\n`);
          },
        };
        let clientInfo;
        // console.log(`Logging in to Solid Identity Provider  ${idp} to get a refresh token.`);
        session.login(loginOptions).catch((e: Error) => {
          reject(
            `Logging in to Solid Identity Provider [${ oidcIssuer }] failed: ${e.toString()}`
          );
        });
      });
      
      app.get("/", async (_req: any, res: any) => {
        const redirectIri = new URL(_req.url, iriBase).href;
        // console.log(`Login into the Identity Provider successful, receiving request to redirect IRI [${redirectIri}].`);
        await session.handleIncomingRedirect(redirectIri);
        // NB: This is a temporary approach, and we have work planned to properly
        // collect the token. Please note that the next line is not part of the public
        // API, and is therefore likely to break on non-major changes.
        const rawStoredSession = await storage.get(
          `solidClientAuthenticationUser:${session.info.sessionId}`
        );
        if (rawStoredSession === undefined) {
          reject(
            `Cannot find session with ID [${session.info.sessionId}] in storage.`
          );
        }
        server.close();
        
        resolve(session)
      });
    })
  }
}


