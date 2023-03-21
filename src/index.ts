import copy, {SourceOptions, CopyOptions} from "./commands/solid-copy"
import list, {ListingOptions} from "./commands/solid-list"
import remove, {RemoveOptions} from "./commands/solid-remove"
import move, {MoveOptions} from "./commands/solid-move"
import find, {FindOptions} from "./commands/solid-find"
import query, {QueryOptions} from './commands/solid-query'
import makeDirectory from "./commands/solid-mkdir"
// import shell from "./commands/solid-shell"
import createSolidPods, {AccountData} from "./commands/solid-pod-create"
import { listPermissions, changePermissions, deletePermissions, QueryOptions as PermissionQueryOptions, PermissionOperation } from './commands/solid-perms'
import { authenticateWithTokenFromJavascript } from "./authentication/AuthenticationToken"
import { generateCSSToken, IClientCredentialsTokenGenerationOptions, CSSToken } from "./authentication/TokenCreationCSS"

// General Solid functionality
export { copy, list, remove, move, find, query, listPermissions, changePermissions, deletePermissions, makeDirectory }

// Authentication Functionality
export { authenticateWithTokenFromJavascript as authenticateToken, generateCSSToken }

// CSS-specific Functionalitys
export { createSolidPods }

// Type exports
export type { Logger } from './logger';

// Type exports of commands options
export type { SourceOptions, CopyOptions, ListingOptions, RemoveOptions, MoveOptions, FindOptions, QueryOptions, PermissionQueryOptions }

// Type exports 
export type { AccountData, IClientCredentialsTokenGenerationOptions, CSSToken, PermissionOperation }