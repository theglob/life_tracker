const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// If you use ESM, change to import ...
// const { google } = await import('googleapis');

const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');
const TOKEN_PATH = path.join(__dirname, '../../token.json');
const DATA_DIR = path.join(__dirname, '../data');

const FILES_TO_BACKUP = ['categories.json', 'entries.json'];

function getTimestampFolder() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;
}

async function authorize() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function ensureBackupFolder(drive, parentId, folderName) {
  const res = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });
  if (res.data.files.length > 0) {
    return res.data.files[0].id;
  }
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId],
  };
  const folder = await drive.files.create({
    resource: fileMetadata,
    fields: 'id',
  });
  return folder.data.id;
}

async function uploadFile(drive, filePath, parentId) {
  const fileName = path.basename(filePath);
  const fileMetadata = {
    name: fileName,
    parents: [parentId],
  };
  const media = {
    mimeType: 'application/json',
    body: fs.createReadStream(filePath),
  };
  await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id',
  });
}

async function main() {
  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });

  // Find or create the Backup root folder
  let backupRootId;
  const res = await drive.files.list({
    q: "name='Backup' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: 'files(id, name)',
    spaces: 'drive',
  });
  if (res.data.files.length > 0) {
    backupRootId = res.data.files[0].id;
  } else {
    const folder = await drive.files.create({
      resource: {
        name: 'Backup',
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    });
    backupRootId = folder.data.id;
  }

  // Create timestamped subfolder
  const timestampFolder = getTimestampFolder();
  const backupFolderId = await ensureBackupFolder(drive, backupRootId, timestampFolder);

  // Upload files
  for (const file of FILES_TO_BACKUP) {
    const filePath = path.join(DATA_DIR, file);
    if (fs.existsSync(filePath)) {
      await uploadFile(drive, filePath, backupFolderId);
      console.log(`Uploaded ${file} to Google Drive folder ${timestampFolder}`);
    } else {
      console.warn(`File not found: ${filePath}`);
    }
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Backup to Drive failed:', err);
    process.exit(1);
  });
} 