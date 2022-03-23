import cat from './commands/cat';
import rm from './commands/rm';
import cd from './commands/cd';
import cp from './commands/cp';
import edit from './commands/edit';
import ls from './commands/ls';
import mkdir from './commands/mkdir';
import mv from './commands/mv';
import touch from './commands/touch';
import { program } from 'commander';
import { Session } from '@inrupt/solid-client-authn-node';
export default async function processShellCommand(session: Session, commandString: string, directory: string) {
  console.log('Processing Shell Command', commandString, "in directory", directory) 
  let command = commandString.split(' ')[0]
  console.log('command', command);
  const f = commandMapping.get(command);
  if (!f) {
    console.error(`Unknown command: ${command}`)
    return;
  } else {
    let args = commandString.split(' ');
    let fopts = {args, session }
    return await f(fopts);
  }
}

export type FunctionOptions = {
  args: string[],
  session: Session,
}

const commandMapping : Map<string, Function> = new Map([
  ["rm", rm], 
  ["cd", cd], 
  ["cp", cp], 
  ["ls", ls], 
  ["mv", mv], 
  ["cat", cat], 
  ["touch", touch], 
  ["mkdir", mkdir], 
  ["edit", edit], 
])