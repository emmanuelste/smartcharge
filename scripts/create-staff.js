import bcrypt from 'bcryptjs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { initializeDatabase, pool } from '../server/database.js';

function askHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
      reject(new Error('Run this command in an interactive terminal that supports hidden input.'));
      return;
    }

    let value = '';
    const finish = (result, error) => {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdout.write('\n');
      if (error) reject(error);
      else resolve(result);
    };

    const onData = (chunk) => {
      const key = chunk.toString();
      if (key === '\u0003') {
        finish('', new Error('Cancelled.'));
      } else if (key === '\r' || key === '\n') {
        finish(value);
      } else if (key === '\u007f' || key === '\b') {
        value = value.slice(0, -1);
        stdout.write('\b \b');
      } else if (key >= ' ' && key !== '\u001b') {
        value += key;
        stdout.write('*');
      }
    };

    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

async function main() {
  if (!pool) {
    throw new Error('DATABASE_URL is required. Run this with `railway run npm run staff:create`.');
  }

  await initializeDatabase();
  const existingStaff = await pool.query('SELECT EXISTS (SELECT 1 FROM staff_users WHERE active = TRUE) AS configured');
  if (existingStaff.rows[0].configured) {
    throw new Error('A staff account already exists. Additional accounts must be created by an administrator in the app.');
  }

  const readline = createInterface({ input: stdin, output: stdout });
  const email = (await readline.question('Staff email: ')).trim().toLowerCase();
  readline.close();

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error('Enter a valid email address.');
  }

  const password = await askHidden('Password (12+ characters, hidden): ');
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO staff_users (email, password_hash, role)
     VALUES ($1, $2, 'admin')`,
    [email, passwordHash],
  );
  console.log(`Administrator account created for ${email}.`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool?.end();
  });