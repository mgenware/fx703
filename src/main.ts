#!/usr/bin/env node
import * as np from 'node:path';
import meow from 'meow';
import * as fs from 'fs';
import chalk from 'chalk';
import sharp from 'sharp';
import { throwIfEmpty } from 'throw-if-arg-empty';

interface Config {
  imageDir: string;
  outDir: string;
  width: number;
  height: number;
  backgroundColor: string;
}

function log(s: unknown) {
  // eslint-disable-next-line no-console
  console.log(s);
}

function logError(s: unknown) {
  return log(chalk.red(s));
}

function composite(src: string, dest: string, background: string, width: number, height: number) {
  throwIfEmpty(src, 'src');
  throwIfEmpty(dest, 'dest');
  throwIfEmpty(background, 'background');
  throwIfEmpty(width, 'width');
  throwIfEmpty(height, 'height');
  return sharp({
    create: {
      width,
      height,
      background,
      channels: 3,
    },
  })
    .composite([{ input: src }])
    .png()
    .toFile(dest);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const cli = meow(
    `
  Usage
    $ npx fx703 <config_file>
  
  Examples
    $ npx fx703 ./my_project.json
  `,
    {
      importMeta: import.meta,
    },
  );

  const confPath = cli.input[0];
  if (!confPath) {
    logError('Missing <config_file>. See --help for help');
    process.exit(1);
  }

  const config = JSON.parse(await fs.promises.readFile(confPath, 'utf8')) as Config;
  const absConfPath = np.resolve(confPath);
  const workingDir = np.dirname(absConfPath);
  const outDir = np.resolve(workingDir, config.outDir);

  const imgDir = np.resolve(workingDir, config.imageDir);
  const imgFileNames = await fs.promises.readdir(imgDir);
  await fs.promises.mkdir(outDir, { recursive: true });
  await Promise.all(
    imgFileNames.map((imgFileName) =>
      composite(
        np.join(imgDir, imgFileName),
        np.join(outDir, imgFileName),
        config.backgroundColor,
        config.width,
        config.height,
      ),
    ),
  );
})();
