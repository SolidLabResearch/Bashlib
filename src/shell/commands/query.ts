import { Command } from 'commander';
import query from '../../commands/solid-query';
import authenticate from '../../authentication/authenticate';
import { addEnvOptions, changeUrlPrefixes, getAndNormalizeURL } from '../../utils/shellutils';
import { writeErrorString } from '../../utils/util';
import fs from 'fs';
import chalk from 'chalk';
import SolidCommand from './SolidCommand';
const Table = require('cli-table');

export default class QueryCommand extends SolidCommand { 

  public addCommand(program: Command) {
    this.programopts = program.opts();

    program
      .command('query')
      .description('Utility to query RDF resoures on your data pod.')
      .argument('<url>', 'Resource to query. In case of container recursively queries all contained files.')
      .argument('<query>', 'SPARQL query string | file path containing SPARQL query when -q flag is active')
      .option('-a, --all', 'Match .acl and .meta files')
      .option('-q, --queryfile', 'Process query parameter as file path of SPARQL query')
      .option('-p, --pretty', 'Pretty format')
      .option('-f, --full', 'Return containing files using full filename.')
      .option('-v, --verbose', 'Log all operations') // Should this be default?
      .action(async (url, queryString, options) => {
        let programOpts = addEnvOptions(program.opts() || {});
        const authenticationInfo = await authenticate(programOpts)
        options.fetch = authenticationInfo.fetch
        try {
          if (this.shell) url = getAndNormalizeURL(url, this.shell);
          url = await changeUrlPrefixes(authenticationInfo, url)
          if (options.queryfile) {
            queryString = fs.readFileSync(queryString, { encoding: "utf-8" })
          }
          for await (let result of query(url, queryString, options)) {
            formatBindings(result.fileName, result.bindings, options)
          }
        } catch (e) {
          writeErrorString(`Could not query resource at ${url}`, e, options)
          if (this.mayExit) process.exit(1)
        }
        if (this.mayExit) process.exit(0)
      })
    
    return program
  }
}



function formatBindings(fileName: string, bindings: any, options: any) {
  if (options.pretty) {
    let table;
    if (!bindings.length) {
      if (options.verbose) console.log(chalk.bold(`> ${fileName}`))
      if (options.verbose) writeErrorString(`No results for resource ${fileName}`, '-', options)
      return;
    }
    for (let binding of bindings) {
      if (!table) {
        table = new Table({
          head: Array.from(bindings[0].entries.keys())
        });
      }
      table.push(Array.from(binding.entries.values()).map(e => (e as any).value || ''))
    }
    console.log(`
${chalk.bold(`> ${fileName}`)}
${table.toString()}
    `)
  } else {
    let bindingsString = ""
    if (!bindings.length) {
      if (options.verbose) console.log(chalk.bold(`> ${fileName}`))
      if (options.verbose) writeErrorString(`No results for resource ${fileName}`, '-', options)
      return;
    }
    for (let binding of bindings) {
      for (let entry of Array.from(binding.entries.entries())) {
        bindingsString += `${(entry as any)[0]}: ${(entry as any)[1].value}\n`
      }
      bindingsString += `\n`
    }
    console.log(`${chalk.bold(`> ${fileName}`)}\n${bindingsString}`)
  }
}
