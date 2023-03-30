import authenticateInteractive from "./AuthenticationInteractive";
import { authenticateToken } from "./AuthenticationToken";
import type { Logger } from '../logger';

export const DEFAULTPORT = 3435
export const APPNAME = "Solid-cli"

export interface IInteractiveAuthOptions {
  idp?: string,
  sessionInfoStorageLocation?: string, // Storage location of session information to reuse in subsequent runs of the application.
  port?: number, // Used for redirect url of Solid login sequence
  verbose?: boolean,
  logger?: Logger,
}

export interface IUserCredentialsAuthOptions {
  idp: string,
  email: string,
  password: string,
  port?: number, // Used for redirect url of Solid login sequence
  verbose?: boolean,
  logger?: Logger,
}

export interface IClientCredentialsTokenAuthOptions {
  idp?: string, // This value is stored with the created client credentials token.
  sessionInfoStorageLocation?: string, // Storage location of session information to reuse in subsequent runs of the application.
  verbose?: boolean,
  logger?: Logger,
}

export interface IClientCredentialsTokenGenerationOptions {
  name: string,
  email: string,
  password: string,
  idp: string,
  logger?: Logger,
}

export interface SessionInfo {
  fetch: typeof fetch
  webId?: string
}

class SolidFetchBuilder {
  private webId: undefined | string;
  private fetch: undefined | typeof fetch;

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