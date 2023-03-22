import os from "os";
import path from "path"
import copy from "./solid-copy";
import fs from 'fs';
import { checkRemoteFileAccess, checkRemoteFileExists, getPodRoot } from "../utils/util";
import type { Logger } from '../logger';
import { ICommandOptions, setOptionDefaults } from './solid-command';

const md5 = require('md5');
const child_process = require('child_process')

export interface ICommandOptionsEdit extends ICommandOptions {
  editor?: string,
  touch?: boolean,
}

export default async function edit(url: string, options?: ICommandOptionsEdit) { 
  let commandOptions = setOptionDefaults<ICommandOptionsEdit>(options || {});

  let exists = await checkRemoteFileExists(url, commandOptions.fetch);
  let access = await checkRemoteFileAccess(url, commandOptions.fetch);

  if (exists && access) {
    await editRemoteFile(url, commandOptions)
  } else if (!exists) { 
    if (!commandOptions.touch) {
      throw new Error('Could not edit non-existing resource. Please use the --touch flag to create a new resource on edit.')
    }
    await editNewFile(url, commandOptions)
  } else { 
    throw new Error(`No access rights for editing resource at ${url}.`)
  }
}

async function editRemoteFile(url: string, options: ICommandOptionsEdit) { 
  const systemTmpDir = os.tmpdir()
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
    });

    // Wait for the user to finish editing the
    (options.logger || console).log('Press any key to continue');
    await new Promise<void>((resolve, reject) => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', () => resolve());
    })

    let newMd5 = await fileMD5(tmpFilePath);
    
    let updateChanges = true;
    // Request user update -> required for editors that leave the terminal and continue the program.
    if (oldMd5 === newMd5) {
      (options.logger || console).log('Update without changes? [y/N] ');
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
      if (options.verbose) (options.logger || console).log('Remote file updated!');
    }
    else {
      if (options.verbose) (options.logger || console).log('Remote file untouched');
    }
  } catch (e) { 
    throw e
    // TODO::
  } finally { 
    if(tmpFilePath) fs.unlinkSync(tmpFilePath);
    if (options.verbose) (options.logger || console).log(`Removing local file file ${tmpFilePath}!`);
  }
}

async function editNewFile(url: string, options: ICommandOptionsEdit) { 
  const systemTmpDir = os.tmpdir()
  const solidTmpDir = path.join(systemTmpDir, '.solid/')
  let filename = url.split('/').reverse()[0]
  const getRandomizedPrefix = () => (Math.random() + 1).toString(36).substring(7);
  filename = getRandomizedPrefix()+"-"+filename  

  let tmpFilePath: string | undefined;
  try {
    let tmpFilePath = path.join(solidTmpDir, filename);
    fs.writeFileSync(tmpFilePath, "")

    await new Promise<void>((resolve, reject) => {
      var child = child_process.spawn(options.editor, [tmpFilePath], {
        stdio: 'inherit'
      });

      child.on('exit', function (e: any, code: any) {
        resolve();
      });
    });

    // Wait for the user to finish editing the
    (options.logger || console).log('Press any key to continue');
    await new Promise<void>((resolve, reject) => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', () => resolve());
    })

    await copy(tmpFilePath, url, options)
    if (options.verbose) (options.logger || console).log('Remote file updated!');
  } catch (e) { 
    throw e
    // TODO::
  } finally { 
    if(tmpFilePath) fs.unlinkSync(tmpFilePath);
    if (options.verbose) (options.logger || console).log(`Removing local file file ${tmpFilePath}!`);
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