import { program } from 'commander';
import { FunctionOptions } from '../commandProcessing';
export default async function ls(fopts: FunctionOptions) {

  return new Promise((resolve, reject) => {
    console.log('running ls with:', fopts.args)
    if (program.args.length < 2) {
      program.outputHelp(() => program.help());
    }
    program
    .name('ls')
    .description('list directory.')
    .option('-a, --all', 'Show all files including .acl files')
    .option('-l, --long', 'Use long listing format')
    .action(async (options) => {
  
      console.log('ACTION LS', options)
      resolve(undefined);
  
    })
    .parse(fopts.args);

  })

}