import { Command } from 'commander';
import SolidCommand from '../SolidCommand';
import inquirer from 'inquirer';
import createSolidPods from '../../../commands/solid-pod-create'
import { writeErrorString } from '../../../utils/authenticationUtils';

export default class CreatePodCommand extends SolidCommand { 

  public addCommand(program: Command) {
    this.programopts = program.opts();
    
    program
      .command('create-pod')
      .option('-u, --url <string>', 'URL of the CSS pod hosting service.')
      .option('-n, --name <string>', 'Name for the newly created Solid account.')
      .option('-e, --email <string>', 'Email adres for the user. Default to <uname>@test.edu')
      .option('-p, --password <string>', 'User password. Default to <uname>')
      .action( async (options) => {
        let questions = []
        if (!options.url) questions.push({ type: 'input', name: 'url',  message: 'URL of the CSS pod hosting service'})
        if (!options.name) questions.push({ type: 'input', name: 'name',  message: 'Pod and user name'})
        if (!options.email) questions.push({ type: 'input', name: 'email',  message: 'User email (defaults to <name>@test.edu)'})
        if (!options.password) questions.push({ type: 'password', name: 'password',  message: 'User password (defaults to <name>)'})
        if (questions.length) {
          let answers = await inquirer.prompt(questions)
          options = { ...options, ...answers }
        }
        
        let accountDataArray = [{
          name: options.name,
          email: options.email,
          password: options.password,
        }]
        try {
          await createSolidPods(options.url, accountDataArray)
        } catch (e) {
          writeErrorString(`Could not create pod`, e)
        }
      })


    return program
  }
}
