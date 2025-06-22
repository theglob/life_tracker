import bcrypt from 'bcryptjs';

async function generateHash() {
  const password = process.argv[2];

  if (!password) {
    console.error('Please provide a password as an argument.');
    console.error('Usage: node generateHash.js <password>');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  console.log('Generated hash:', hash);
}

generateHash(); 