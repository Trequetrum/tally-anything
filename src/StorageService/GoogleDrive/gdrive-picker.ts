import { GOOGLE_APP_ID } from "./gdrive-config";
import { GoogleAPIAuthenticator } from "./gdrive-login";

export { showGoogleDrivePicker }

declare var gapi: any;
declare var google: any;

/***
 * An observable that returns true once the Picker
 * API is loaded.
 */
let loadPickerApiPromise: null | Promise<boolean> = null
function loadPickerApi(): Promise<boolean> {

  if (loadPickerApiPromise == null) {
    loadPickerApiPromise = new Promise((resolve, reject) => {
      gapi.load('picker', () => resolve(true));

      // Error if the picker takes too long to load.
      const timer = setTimeout(
        () => reject("Loading Google Picker Timed out after 5 seconds"),
        5000
      );
    });
  }

  return loadPickerApiPromise as Promise<boolean>;
}

/***
 * Opens a picker with 'application/json' files in view and a search for
 * gloomtools files.
 * 
 * Let the user pick files from their google drive or load files to their
 * google drive. Gives our app permission to read/edit those files as per
 * scropes requested by the oauthService.
 ***/
async function showGoogleDrivePicker(
  auth: GoogleAPIAuthenticator,
  onDocumentSelection: (documents: any) => void
): Promise<boolean> {

  await loadPickerApi();

  const pickerCallback = (response: any) => {
    // Check that the user picked at least one file
    if (response[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
      onDocumentSelection(response[google.picker.Response.DOCUMENTS]);
    }
  }

  // Now that we have an OAuthToken, we can load a new google picker and display it.
  const view = new google.picker.View(google.picker.ViewId.DOCS);
  view.setMimeTypes("application/json");
  view.setQuery("TA.json");
  const pickerBuilder = new google.picker.PickerBuilder();
  const picker = pickerBuilder
    /*.enableFeature(google.picker.Feature.NAV_HIDDEN)*/
    .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
    .setAppId(GOOGLE_APP_ID)
    .setOAuthToken(auth.getOAuthToken())
    .addView(view)
    .addView(new google.picker.DocsUploadView())
    .setCallback(pickerCallback)
    .build();
  picker.setVisible(true);

  return true
}