import bcrypt from 'bcryptjs';

async function generateHash() {
    const password = 'M31nSup3r4dm1nP455w0rt';
    const hash = await bcrypt.hash(password, 10);
    console.log('Generated hash:', hash);
}

generateHash(); 