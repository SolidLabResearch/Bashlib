import authenticateInteractive from "./AuthenticationInteractive";
import { authenticateToken } from "./AuthenticationToken";

export const DEFAULTPORT = 3435
export const APPNAME = "Solid-cli"

export type IInteractiveAuthOptions = {
  idp?: string,
  sessionInfoStorageLocation?: string, // Storage location of session information to reuse in subsequent runs of the application.
  port?: number, // Used for redirect url of Solid login sequence
  verbose?: boolean,
}

export type IUserCredentialsAuthOptions = {
  idp: string,
  email: string,
  password: string,
  port?: number, // Used for redirect url of Solid login sequence
  verbose?: boolean,
}

export type IClientCredentialsTokenAuthOptions = {
  idp?: string, // This value is stored with the created client credentials token.
  sessionInfoStorageLocation?: string, // Storage location of session information to reuse in subsequent runs of the application.
  clientCredentialsTokenStorageLocation?: string,  // Storage location of the stored client credentials token.
  verbose?: boolean,
}

export type IClientCredentialsTokenGenerationOptions = {
  name: string,
  email: string,
  password: string,
  idp: string,
  clientCredentialsTokenStorageLocation?: string // Storage location of the output client credentials token.
}

export type SessionInfo = {
  fetch: (input: RequestInfo, init?: RequestInit | undefined) => Promise<Response>
  webId?: string
}

class SolidFetchBuilder {
  private webId: undefined | string;
  private fetch: undefined | ((input: RequestInfo, init?: RequestInit | undefined) => Promise<Response>);

  buildFromClientCredentialsToken = async (options: IClientCredentialsTokenAuthOptions) => {
    const sessionInfo = await authenticateToken(options);
    this.webId = sessionInfo.webId;
    this.fetch = sessionInfo.fetch;
  }

  buildInteractive = async (options: IInteractiveAuthOptions) => {
    const sessionInfo = await authenticateInteractive(options);
    this.webId = sessionInfo.webId;
    this.fetch = sessionInfo.fetch;
  }

  getFetch() { return this.fetch }

  getSessionInfo() { return ({ webId: this.webId, fetch: this.fetch }) }
}


export default SolidFetchBuilder;