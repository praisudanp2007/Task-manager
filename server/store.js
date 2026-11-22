import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, 'data');

async function readCollection(name) {
  await mkdir(dataDir, { recursive: true });
  try {
    return JSON.parse(await readFile(path.join(dataDir, `${name}.json`), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return [];
  }
}

async function writeCollection(name, records) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(path.join(dataDir, `${name}.json`), JSON.stringify(records, null, 2));
}

export const users = {
  all: () => readCollection('users'),
  save: (records) => writeCollection('users', records),
};

export const tasks = {
  all: () => readCollection('tasks'),
  save: (records) => writeCollection('tasks', records),
};
