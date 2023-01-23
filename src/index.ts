import copy from "./commands/solid-copy"
import list from "./commands/solid-list"
import remove from "./commands/solid-remove"
import move from "./commands/solid-move"
import find from "./commands/solid-find"
import query from './commands/solid-query'
import makeDirectory from "./commands/solid-mkdir"
import shell from "./commands/solid-shell"
import { listPermissions, changePermissions, deletePermissions } from './commands/solid-perms'

export { copy, list, remove, move, find, query, listPermissions, changePermissions, deletePermissions, makeDirectory, shell }

import { authenticateWithTokenFromJavascript } from "./authentication/AuthenticationToken"
import { generateCSSToken } from "./authentication/TokenCreationCSS"
export { authenticateWithTokenFromJavascript as authenticateToken, generateCSSToken }

// Type exports
export type { Logger } from './logger';
