import inquirer from 'inquirer';

export async function requestUserCLIConfirmationDefaultNegative(request: string) : Promise<boolean> { 
  console.log(`${request} [y/N]`);
  return await new Promise((resolve, reject) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', (chk) => {
      process.stdin.pause();
      if (chk.toString('utf8') === "y") {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

export async function requestUserCLIConfirmationDefaultPositive(request: string) : Promise<boolean> { 
  console.log(`${request} [Y/n]`);
  return await new Promise((resolve, reject) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', (chk) => {
      process.stdin.pause();
      if (chk.toString('utf8') === "n") {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

export async function requestUserIdp() {
  console.log(``);
  
  let answers = await inquirer.prompt([{ 
    type: 'input', 
    name: 'idp',  
    message: `Could not discover OIDC issuer\nPlease provide OIDC issuer:`}])
  return answers.idp;
}