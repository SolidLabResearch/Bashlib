export async function requestUserCLIConfirmation(request: string) : Promise<boolean> { 
  console.log(`${request} [y/N]`);
  return await new Promise((resolve, reject) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', (chk) => {
      if (chk.toString('utf8') === "y") {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}