import os from "os";
import path from "path"
import copy from "./solid-copy";
import fs from 'fs';
const md5 = require('md5');
const child_process = require('child_process')

export default async function edit(url: string, options: any) { 
  const systemTmpDir = os.tmpdir()
  const fileName = url.split('/').slice(-1)[0]
  const solidTmpDir = path.join(systemTmpDir, '.solid/')

  let tmpFilePath: string | undefined;
  try {
    let copiedData = await copy(url, solidTmpDir, options);
    if (!copiedData.destination.files.length) { throw new Error(`Could not retrieve ${url}`) };
    tmpFilePath = copiedData.destination.files[0].absolutePath
    let oldMd5 = await fileMD5(tmpFilePath);
    let remoteFileUrl = copiedData.source.files[0].absolutePath;

    await new Promise<void>((resolve, reject) => {
      var child = child_process.spawn(options.editor, [tmpFilePath], {
        stdio: 'inherit'
      });

      child.on('exit', function (e: any, code: any) {
        resolve();
      });
    })

    // Wait for the user to finish editing the
    console.log('Press any key to continue');
    await new Promise<void>((resolve, reject) => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', () => resolve());
    })

    let newMd5 = await fileMD5(tmpFilePath);
    
    let updateChanges = true;
    // Request user update -> required for editors that leave the terminal and continue the program.
    if (oldMd5 === newMd5) {
      console.log('Update without changes? [y/N] ');
      updateChanges = await new Promise((resolve, reject) => {
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

    if (updateChanges) {
      await copy(tmpFilePath, remoteFileUrl, options)
      if (options.verbose) console.log('Remote file updated!');
    }
    else {
      if (options.verbose) console.log('Remote file untouched');
    }
  } catch (e) { 
    throw e
    // TODO::
  } finally { 
    if(tmpFilePath) fs.unlinkSync(tmpFilePath);
  }
}


async function fileMD5(path: string) {
    return new Promise( (resolve, reject) => {  
      fs.readFile(path, (err,buf) => {
          if (err) {
            reject(err)
          }
          else {
            resolve(md5(buf));
          }
      });
    });
}