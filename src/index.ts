import { SessionInfo } from './authentication/CreateFetch';
import copy, {ICommandOptionsCopy} from "./commands/solid-copy"
import list, {ICommandOptionsList} from "./commands/solid-list"
import remove, {ICommandOptionsRemove} from "./commands/solid-remove"
import move, {ICommandOptionsMove} from "./commands/solid-move"
import find, {ICommandOptionsFind} from "./commands/solid-find"
import query, {ICommandOptionsQuery} from './commands/solid-query'
import makeDirectory, { ICommandOptionsMakeDirectory } from "./commands/solid-mkdir"
import touch, {ICommandOptionsTouch} from "./commands/solid-touch"
// import shell from "./commands/solid-shell"
import createSolidPods, {IAccountData} from "./commands/solid-pod-create"
import { listPermissions, changePermissions, deletePermissions, ICommandOptionsPermissions, IPermissionOperation, IPermissionListing, Record } from './commands/solid-perms'
import { authenticateWithTokenFromJavascript } from "./authentication/AuthenticationToken"
import { generateCSSToken, IClientCredentialsTokenGenerationOptions, CSSToken } from "./authentication/TokenCreationCSS"
import { FileInfo, ResourceInfo } from './utils/util';

// General Solid functionality
export { copy, list, remove, move, find, query, listPermissions, changePermissions, deletePermissions, makeDirectory, touch }

// Authentication Functionality
export { authenticateWithTokenFromJavascript as authenticateToken, generateCSSToken }

// CSS-specific Functionalitys
export { createSolidPods }

// Type exports
export type { Logger } from './logger';

// Type exports of commands options
export type { ICommandOptionsCopy, ICommandOptionsList, ICommandOptionsRemove, ICommandOptionsMove, ICommandOptionsFind, ICommandOptionsQuery, ICommandOptionsPermissions, ICommandOptionsMakeDirectory, ICommandOptionsTouch }

// Type exports 
export type { IAccountData, IClientCredentialsTokenGenerationOptions, CSSToken, IPermissionOperation, FileInfo, ResourceInfo, SessionInfo, IPermissionListing, Record }