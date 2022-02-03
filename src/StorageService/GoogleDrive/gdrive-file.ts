import { GoogleAPIAuthenticator } from './gdrive-login'

export type { GoogleFile }
export {
  GoogleFileManager
}

const JSON_MIME_TYPE = "application/json"

interface GoogleFile {
  id: string,
  name: string,
  content: any
}

const FOLDER_TYPE = 'application/vnd.google-apps.folder';
// Name of the folder where we save documents created by this app
const FOLDER_NAME = 'TallyAnythingDocs';
// filename appended
const FILENAME_AFFIX = '-TA';

class GoogleFileManager {

  private folderId: string;

  constructor(public auth: GoogleAPIAuthenticator) {
    this.folderId = ''
  }

  getFilesRes(): gapi.client.drive.FilesResource {
    return this.auth.getGapiClient().drive.files
  }

  /********************************************************************
 * Goes to the user's google drive and tries to retrieve a file with 
 * the given ID.
 *******************************************************************/
  getFileFromDrive(docID: string): Promise<GoogleFile> {

    console.log("Retrieving Google Document (id):", docID);

    return this.getFilesRes().get({
      fileId: docID,
      //'id, name, modifiedTime, capabilities(canRename, canDownload, canModifyContent)'
      fields: '*',
    }).then((fileQuery: any) => {

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

      return this.getFilesRes().get({
        fileId: docID,
        alt: 'media',
      }).then((fileContent: any) => ({ googleFile, fileContent }));

    }).then((res: any) => {

      const { googleFile, fileContent } = res;

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

      console.log(
        "Loaded Google Document (name, id)",
        googleFile.name,
        googleFile.id
      );

      return googleFile;

    }).catch(handleGoogleClientError(this.auth));
  }
  /********************************************************************
 * Get the google drive folder id where we store our files.
 * Performs the nessesary calls to find or create the folder.
 *******************************************************************/
  getFolderId(): Promise<string> {

    // If we already have an ID for the folder, this is very straight forward.
    if (this.folderId.length > 0) {
      return Promise.resolve(this.folderId);
    }

    //const client = this.auth.getGapiClient();

    return this.getFilesRes().list({
      q: `mimeType='${FOLDER_TYPE}' and name='${FOLDER_NAME}' and trashed=false`,
      fields: 'files(id)',
    }).then((folderQuery: any) => {

      const folders = folderQuery.result.files;

      // Check if we already have access to a folder with the right name
      // I suppose there could be more than one folder. If so, emit the first one we find
      if (folders && folders.length > 0) {
        return folders[0].id;
      }

      // If we don't have access to such a folder, then create it and return the ID
      const metadata = {
        mimeType: FOLDER_TYPE,
        name: FOLDER_NAME,
        fields: 'id',
      };

      return this.getFilesRes().create({
        resource: metadata,
      }).then((createdFolder: any) => createdFolder.result.id);

    }).catch(handleGoogleClientError(this.auth));
  }

  /********************************************************************
   * Get's all JSON files that the user has given this app access to. 
   * Doesn't verify contents or anything.
   *******************************************************************/
  getAllAccessibleFiles(): Promise<({ id: string, name: string })[]> {
    return this.getFilesRes().list({
      q: "mimeType='application/json' and trashed = false", // and appProperties has { key='active' and value='true' }",
      fields: 'files(id, name)',
    }).then((fileQuery: any) =>
      fileQuery?.result?.files?.map(
        (file: any) => ({ id: file.id, name: file.name })
      ) || []
    ).catch(handleGoogleClientError(this.auth));

  }

  /********************************************************************
   * Update this file's metadata only.
   * This updates the file's
   *      - name
   *******************************************************************/
  saveFileMetadata(file: GoogleFile): Promise<void> {

    const metadata = {
      name: file.name,
      mimeType: JSON_MIME_TYPE,
    };

    return this.auth.getGapiClient().request({
      path: '/drive/v3/files/' + file.id,
      method: 'PATCH',
      body: metadata,
    }).then(() => { })

  }

  saveFile(file: GoogleFile): Promise<void> {

    console.log(
      "Saving Google Document (name, id):",
      file.name,
      file.id
    );

    // Ready a call to Google drive
    const boundary = '-------314159265358979323846';
    const delimiter = '\r\n--' + boundary + '\r\n';
    const close_delim = '\r\n--' + boundary + '--';

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

    return this.auth.getGapiClient().request({
      path: '/upload/drive/v3/files/' + file.id,
      method: 'PATCH',
      params: {
        uploadType: 'multipart',
      },
      headers: {
        'Content-Type': 'multipart/related; boundary="' + boundary + '"',
      },
      body: multipartRequestBody,
    }).then(() => { })

  }

  async createAndSaveNewFile(name: string, content?: any): Promise<GoogleFile> {

    const folder = await this.getFolderId();

    const newFile = {} as any
    newFile.name = `${name}${FILENAME_AFFIX}.json`;
    if (content !== null) {
      newFile.content = content;
    }

    console.log("Creating Google Document (name):", newFile.name);

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

    const createdFile = await this.auth.getGapiClient().request({
      path: '/upload/drive/v3/files',
      method: 'POST',
      params: {
        uploadType: 'multipart',
      },
      headers: {
        'Content-Type': 'multipart/related; boundary="' + boundary + '"',
      },
      body: multipartRequestBody,
    });

    newFile.id = createdFile.result.id;
    newFile.modifiedTime = createdFile.result.modifiedTime;

    return newFile
  }

}

/********************************************************************
 * Errors arn't really managed yet, this creates an alert with the
 * error and then re-throws. This is fine for a hobby project, but
 * should probably be imporved anyway as many of these errors should
 * be recoverable.
 *******************************************************************/
function handleGoogleClientError(auth: GoogleAPIAuthenticator) {
  return (err: any): never => {
    if (err?.result?.error?.errors[0]?.reason === "insufficientPermissions") {
      auth.revokeAccess();

      alert(`
      Tally Anything has insufficent permissions. 
      Don't worry, this app can only access files 
      that you've created using this app, your data 
      is safe. 
      
      To use this app, please grant the requested 
      permissions while signing in`
      );
    }

    throw err;
  }
}

function contentAsString(file: GoogleFile, pretty: boolean): string {
  const content = file.content || {}
  return pretty ?
    JSON.stringify(content, null, 2) :
    JSON.stringify(content);
}
