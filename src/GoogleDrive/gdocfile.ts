import { LteMobiledataTwoTone } from '@mui/icons-material';
import { getGapiClient } from './gdrive-login'

export type { GoogleFile }
export { getOrCreateEverythingFile }

declare var google: any;

const JSON_MIME_TYPE = "application/json"

interface GoogleFile {
  id: string,
  name: string,
  canEdit: boolean,
  modifiedTime: string
  content: any
}

/*****
 * Goes to the user's google drive and tries to retrieve a
 * file with the given ID. This does not cache the file.
 *****/
async function getFileFromDrive(docID: string): Promise<GoogleFile> {

  const client = await getGapiClient();
  const fileQuery = client.drive.files.get({
    fileId: docID,
    //'id, name, modifiedTime, capabilities(canRename, canDownload, canModifyContent)'
    fields: '*',
  })

  if (!fileQuery.result.capabilities.canDownload) {
    throw Error(
      'Cannot Download File (capabilities.canDownload) - ' +
      fileQuery.toString()
    );
  }

  const googleFile = {
    id: fileQuery.result.id,
    name: fileQuery.result.name,
    canEdit: fileQuery.result.capabilities.canRename &&
      fileQuery.result.capabilities.canModifyContent,
    modifiedTime: fileQuery.result.modifiedTime,
    content: null
  } as GoogleFile

  const fileContent = await client.drive.files.get({
    fileId: docID,
    alt: 'media',
  })

  try {
    googleFile.content = JSON.parse(fileContent.body);
  } catch (err: any) {
    googleFile.content = {
      error: {
        type: 'Parsing',
        message: err.message,
      },
    };
  }

  return googleFile;

}

const folderType = 'application/vnd.google-apps.folder';
// Name of the folder where we save documents created by this app
const folderName = 'TallyAnythingDocs';
// filename appended
const fileNameAffix = '-TA';
let folderId = ""

/***
 * Get the google drive folder id where we store our files.
 * Performs the nessesary calls to find or create the folder.
 ***/
async function getFolderId(): Promise<string> {

  console.log(">>>>>>>>>> getFolderId 1")
  // If we already have an ID for the folder, this is very straight forward.
  if (folderId.length > 0) {
    return folderId
  }

  const client = await getGapiClient();

  console.log(">>>>>>>>>> getFolderId 2")

  const folderQuery = await client.drive.files.list({
    q: `mimeType='${folderType}' and name='${folderName}' and trashed = false"`,
    fields: 'files(id)',
  })

  console.log(">>>>>>>>>> getFolderId 3")

  const folders = folderQuery.result.files;

  // Check if we already have access to a folder with the right name
  // I suppose there could be more than one folder. If so, emit the first one we find
  if (folders && folders.length > 0) {
    return folders[0].id;
  }

  // If we don't have access to such a folder, then create it and return the ID
  const metadata = {
    mimeType: folderType,
    name: folderName,
    fields: 'id',
  };

  const createdFolder = await client.drive.files.create({
    resource: metadata,
  })

  return createdFolder.result.id;

}

/***
 * Get's all JSON files that the user has given this app
 * access to. Doesn't verify contents or anything.
 ***/
async function getAllAccessibleFiles(): Promise<({ id: string, name: string })[]> {

  const client = await getGapiClient();
  const fileQuery = client.drive.files.list({
    q: "mimeType='application/json' and trashed = false", // and appProperties has { key='active' and value='true' }",
    fields: 'files(id, name)',
  })

  return fileQuery?.result?.files?.map(
    (file: any) => ({ id: file.id, name: file.name })
  ) || []
}

async function getOrCreateEverythingFile(): Promise<GoogleFile> {
  console.log(">>>>>>>>>> getOrCreateEverythingFile 1")
  const allFiles = await getAllAccessibleFiles()
  console.log(">>>>>>>>>> getOrCreateEverythingFile 2")
  const everythingFile = allFiles.find(({ name }) => name == `everything${fileNameAffix}.json`)

  if (everythingFile != null) {
    console.log(">>>>>>>>>> getOrCreateEverythingFile 3")
    return getFileFromDrive(everythingFile.id);
  } else {
    console.log(">>>>>>>>>> getOrCreateEverythingFile 4")
    return createAndSaveNewFile("everything")
  }
}

/***
 * Mostly for debugging.
 * Logs all accessible files to the console.
 */
function listAllAccessibleFiles(): void {
  console.log('Listing Files (Async): ');
  getAllAccessibleFiles().then(
    stringPairArr => stringPairArr.forEach((stringPair, i) =>
      console.log('File ' + i + ': ', stringPair)
    )
  );
}

/**
 * Update this file's metadata only.
 * This updates the file's
 *      - name
 */
async function saveFileMetadata(file: GoogleFile): Promise<boolean> {
  const client = await getGapiClient();

  const metadata = {
    name: file.name,
    mimeType: JSON_MIME_TYPE,
  };

  await client.request({
    path: '/drive/v3/files/' + file.id,
    method: 'PATCH',
    body: metadata,
  });

  return true;

}

function contentAsString(file: GoogleFile, pretty: boolean): string {
  const content = file.content || {}
  return pretty ?
    JSON.stringify(content, null, 2) :
    JSON.stringify(content);
}

async function saveFile(file: GoogleFile): Promise<boolean> {

  // Ready a call to Google drive
  const boundary = '-------314159265358979323846';
  const delimiter = '\r\n--' + boundary + '\r\n';
  const close_delim = '\r\n--' + boundary + '--';

  const client = await getGapiClient();

  const metadata = {
    name: file.name,
    mimeType: JSON_MIME_TYPE,
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: ' +
    JSON_MIME_TYPE +
    '\r\n\r\n' +
    contentAsString(file, true) +
    close_delim;

  await client.request({
    path: '/upload/drive/v3/files/' + file.id,
    method: 'PATCH',
    params: {
      uploadType: 'multipart',
    },
    headers: {
      'Content-Type': 'multipart/related; boundary="' + boundary + '"',
    },
    body: multipartRequestBody,
  });

  return true
}

async function createAndSaveNewFile(name: string, content?: any): Promise<GoogleFile> {

  console.log("createAndSaveNewFile 1")
  const [folder, client] = await Promise.all([getFolderId(), getGapiClient()]);
  console.log("createAndSaveNewFile 2")

  const newFile = {} as any
  newFile.name = `${name}${fileNameAffix}.json`;
  if (content !== null) {
    newFile.content = content;
  }

  // Ready a call to create this file on the user's Google drive
  const boundary = '-------314159265358979323846';
  const delimiter = '\r\n--' + boundary + '\r\n';
  const close_delim = '\r\n--' + boundary + '--';

  const metadata = {
    name: newFile.name,
    parents: [folder],
    mimeType: JSON_MIME_TYPE,
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: ' +
    JSON_MIME_TYPE +
    '\r\n\r\n' +
    contentAsString(newFile, true) +
    close_delim;

  const createdFile = client.request({
    path: '/upload/drive/v3/files',
    method: 'POST',
    params: {
      uploadType: 'multipart',
    },
    headers: {
      'Content-Type': 'multipart/related; boundary="' + boundary + '"',
    },
    body: multipartRequestBody,
  })

  newFile.id = createdFile.result.id;
  newFile.modifiedTime = createdFile.result.modifiedTime;

  return newFile
}