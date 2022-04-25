import { stringify } from 'querystring';
import { Session } from '@inrupt/solid-client-authn-node';
import type { Cookie } from 'set-cookie-parser';
import { parse, splitCookiesString } from 'set-cookie-parser';
import LoginHandler from '../utils/LoginHandler'
import CSSConfigLoginHandler from '../utils/CSSConfigLoginHandler';
const fetch = require("node-fetch")

const APPLICATION_X_WWW_FORM_URLENCODED = 'application/x-www-form-urlencoded';

export type LoginOptions = {
  version?: string,
  idp?: string,
  email?: string,
  password?: string,
  storage?: string,
}

type SessionInfo = {
  fetch: (input: RequestInfo, init?: RequestInit | undefined) => Promise<Response>
  webId?: string
}

export default async function createAuthenticatedSessionInfoCSSv2(options: LoginOptions) : Promise<SessionInfo> {
  const sessionProvider = new NodeSolidSessionProvider(options);
  const session = await sessionProvider.login()
  return {
    fetch: session.fetch,
    webId: session.info.webId
  }
}

class NodeSolidSessionProvider {
  options: LoginOptions
  loginHandler: LoginHandler 

  public session?: Session;
  private readonly cookies: Map<string, Cookie>;
  private cookie?: string;

  constructor(options: LoginOptions) {
   this.loginHandler = new CSSConfigLoginHandler();
   this.loginHandler.on('redirect', (url: string) => this.handleRedirect(url));
   this.options = options;
   this.cookies = new Map();
  }

  async login() : Promise<Session> {
    if (!this.options.idp) throw new Error('Cannot login: no identity provider option given.')
    let session = await this.loginHandler.login(this.options.idp, undefined, undefined, this.options.storage) as Session;
    this.session = session;
    return session;
  }

  async handleRedirect(url: string) {
    if (!this.options.email || !this.options.password || !this.options.idp) {
      throw new Error("Cannot authenticate without full credentials. Please provide a user email, password and IDP to authenticate.")
    }
    // Get redirect URL and extract the received cookies.
    let res = await this.fetchIdp(url)
    let nextUrl = res.headers.get('location')
    // Follow the extracted location to the idp page to login with new cookies
    if (!nextUrl) {
      throw new Error('Could not login. No redirect given.')
    }
    // Send login form to login page
    let redirect = await this.handleLoginScreen(nextUrl, this.options.email, this.options.password)

    // Final ack to the auth that everything is in order
    let finalRes = await this.fetchIdp(redirect)
  }


  /**
   * Performs a fetch call while keeping track of the stored cookies and preventing redirects.
   * @param url - URL to call.
   * @param method - Method to use.
   * @param body - Body to send along.
   * @param contentType - Content-Type of the body.
   */
  async fetchIdp(url: string, method = 'GET', body?: string, contentType?: string): Promise<any> { // Cant user Response type as this requires node-fetch@3, which is a hassle im not willing to even try
    const options = { method, headers: { cookie: this.cookie }, body, redirect: 'manual' } as any;
    if (contentType) {
      options.headers['content-type'] = contentType;
    }
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP Error Response requesting ${url}: ${res.status} ${res.statusText}`);

    // Parse the cookies that need to be set and convert them to the corresponding header value
    // Make sure we don't overwrite cookies that were already present
    if (res.headers.get('set-cookie')) {
      const newCookies = parse(splitCookiesString(res.headers.get('set-cookie')!));
      for (const cookie of newCookies) {
        this.cookies.set(cookie.name, cookie);
      }
      // eslint-disable-next-line unicorn/prefer-spread
      this.cookie = Array.from(this.cookies, ([ , nom ]): string => `${nom.name}=${nom.value}`).join('; ');
    }
    return res;
  }

  /**
   * Logs in by sending the corresponding email and password to the given form action.
   * The URL should be extracted from the login page.
   */
   public async handleLoginScreen(url: string, email: string, password: string): Promise<string> {
     // Post login form to login screen
    const formData = stringify({ email, password });
    let res = await this.fetchIdp(url, 'POST', formData, APPLICATION_X_WWW_FORM_URLENCODED);
    let location = res.headers.get('location')
    if (!location) { throw new Error('No redirect location given by login screen on form submission.') }
    
    // Follow redirect to retrieve login cookies
    res = await this.fetchIdp(location);
    let newlocation = res.headers.get('location')
    if (!newlocation) { throw new Error('Incorrect redirect returned by login screen redirect page.') }
    return newlocation;
  }

//   /**
//    * Handles the consent screen at the given URL and the followup redirect back to the client.
//    */
//   public async handleConsentScreen(url: string): Promise<void> {
//     let res = await this.fetchIdp(url, 'POST', '', APPLICATION_X_WWW_FORM_URLENCODED);
//     if (res.status !== 200) { throw new Error('Incorrect status code returned by consent screen.')}
//     const json = await res.json();

//     res = await this.fetchIdp(json.location);
//     if (res.status !== 303) { throw new Error('Incorrect status code returned by consent screen.')}
//     const mockUrl = res.headers.get('location')!;

//     const info = await this.session.handleIncomingRedirect(mockUrl);
//     expect(info?.isLoggedIn).toBe(true);
//   }

}

