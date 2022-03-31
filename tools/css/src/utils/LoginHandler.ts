const EventEmitter = require('events');

export default abstract class LoginHandler extends EventEmitter {
  abstract login(oidcIssuer: string, appName?: string, port?: number) : Promise<unknown>;
}