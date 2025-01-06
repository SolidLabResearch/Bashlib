export enum BashlibErrorMessage { 
  noWebIDOption = "No WebID option",
  noIDPOption = "No Identity Provider option",
  invalidIDPOption = "Invalid Identity Provider option",
  authFlowError = "Authentication flow error",
  cannotRestoreSession = "Cannot restore previous session",
  cannotCreateSession = "Could not create an authenticated session.",
  noValidToken = "No valid authentication token found.",
  httpResponseError = "HTTP Error Response requesting",
  cannotWriteResource = "Cannot write resource"
}

export default class BashlibError extends Error{ 
  constructor(message: BashlibErrorMessage, value?: string, errorMessage?: string) { 
    let fullMessage = message.toString()
    if (value) fullMessage += ` "${value}"`
    if (errorMessage) fullMessage += ` : ${errorMessage}`
    fullMessage += '.'
    super(fullMessage)
  }
}