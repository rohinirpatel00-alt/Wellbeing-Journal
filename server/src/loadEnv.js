import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectDirectory = path.resolve(serverDirectory, '..');

dotenv.config({ path: path.join(projectDirectory, '.env') });
dotenv.config({ path: path.join(serverDirectory, '.env') });
