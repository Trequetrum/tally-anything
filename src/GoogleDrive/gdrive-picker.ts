import { appId, gapiClientInit, getOauthToken } from "./gdrive-login";
export { showGoogleDrivePicker }

declare var gapi: any;
declare var google: any;

/***
 * An observable that returns true once the Picker
 * API is loaded.
 */
let loadPickerApiPromise: null | Promise<boolean> = null
function loadPickerApi(): Promise<boolean> {

  if(loadPickerApiPromise == null){
    loadPickerApiPromise = gapiClientInit.then(() => 
      new Promise((resolve, reject) => {
        gapi.load('picker', () => resolve(true));
    
        // Error if the picker takes too long to load.
        const timer = setTimeout(
          () => reject("Loading Google Picker Timed out after 5 seconds"), 
          5000
        );
      })
    );
  }
  
  return loadPickerApiPromise;
}

/***
 * Opens a picker with 'application/json' files in view and a search for
 * gloomtools files.
 * 
 * Let the user pick files from their google drive or load files to their
 * google drive. Gives our app permission to read/edit those files as per
 * scropes requested by the oauthService.
 ***/
async function showGoogleDrivePicker(): Promise<boolean> {

	const [oauthToken] = await Promise.all([
    getOauthToken(),
    loadPickerApi()
  ])
  
  // Now that we have an OAuthToken, we can load a new google picker and display it.
  const view = new google.picker.View(google.picker.ViewId.DOCS);
  view.setMimeTypes("application/json");
  view.setQuery("TA.json");
  const pickerBuilder = new google.picker.PickerBuilder();
  const picker = pickerBuilder
    /*.enableFeature(google.picker.Feature.NAV_HIDDEN)*/
    .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
    .setAppId(appId)
    .setOAuthToken(oauthToken)
    .addView(view)
    .addView(new google.picker.DocsUploadView())
    .setCallback(pickerCallback)
    .build();
  picker.setVisible(true);
			
  return true
}

/***
 * Takes a response object from a google picker.
 * Emits new documents into the gloomtoolsFileLoad$ Subject (multicast Observable). 
 * Users can select multiple documents or they can keep opening new pickers to select documents.
 * To anyone observing gloomtoolsFileLoad$, this should look the same.
 */
function pickerCallback(response: any): void {
  // Check that the user picked at least one file
  if (response[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
    response[google.picker.Response.DOCUMENTS].forEach(/* Do Something */);
  }
}
