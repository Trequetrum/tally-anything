import {
  GAPI_SCRIPT_URL,
  GOOGLE_API_KEY,
  GOOGLE_CLIENT_ID,
  GOOGLE_DISCOVERY_DOCS,
  GOOGLE_API_SCOPES,
} from "./gdrive-config";

export type { GoogleAPIAuthenticator };
export { getGoogleAPIAuthenticator };

interface GoogleAPIAuthenticator {
  login(): Promise<void>;
  logout(): Promise<void>;
  getOAuthInstance(): gapi.auth2.GoogleAuthBase;
  getOAuthToken(): string;
  getGapiClient(): typeof gapi.client;
  getUserName(): string;
  revokeAccess(): void;
}

/*******
 * This is a class wrapping GAPI. GoogleAPIAuthenticator_Impl must 
 * remain private to this module as it assumes the nesseary Global 
 * GAPI scripts have been loaded. 
 * 
 * I use the smart-constructor pattern to ensure the appropriate
 * invarients hold before returning an instance of this class safely
 *******/
class GoogleAPIAuthenticator_Impl implements GoogleAPIAuthenticator {
  login(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("User log in started");

      this.getOAuthInstance()
        .signIn()
        .then(
          () => {
            console.log("User log in success");
            resolve();
          },
          (e) => {
            console.error("User log in error", e);
            reject(e);
          }
        );
    });
  }

  logout(): Promise<void> {
    console.log("User logging out");

    return gapi.auth2
      .getAuthInstance()
      .signOut()
      .then(
        () => console.log("User loggout success"),
        (e: any) => console.error("User loggout error", e)
      );
  }
  getOAuthInstance(): gapi.auth2.GoogleAuthBase {
    return gapi.auth2.getAuthInstance();
  }
  getOAuthToken(): string {
    return this.getOAuthInstance().currentUser.get().getAuthResponse()
      .access_token;
  }
  getGapiClient(): typeof gapi.client {
    return gapi.client;
  }

  getUserName(): string {
    return (
      gapi?.auth2
        ?.getAuthInstance()
        ?.currentUser?.get()
        ?.getBasicProfile()
        ?.getGivenName() || ""
    );
  }

  revokeAccess(): void {
    console.log(
      "Revoking Access Scopes & Disconnecting Google's Signin Client"
    );
    this.getOAuthInstance().disconnect();
  }
}

// Inject GAPI into the DOM and wait for it to load, then load the 
// appropriate code 
function loadAndInitGoogleScripts(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log("Loading Google API");

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = GAPI_SCRIPT_URL;
    script.onload = () => resolve(true);
    script.onerror = (error) => reject(error);

    document.getElementsByTagName("head")[0].appendChild(script);
  })
    .then(() => {
      console.log("Loading Google OAuth2 Client");

      return new Promise((resolve, reject) => {
        gapi.load("client:auth2", {
          callback: () => resolve(true),
          onerror: (err: any) => reject(err)
          //timeout: 5000, // 5 seconds.
          //ontimeout: () => reject("isGapiClientAuth2Loaded Timeout Error"),
        });
      });
    })
    .then(() => {
      console.log("Initializing Google OAuth2 Client");

      return gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        clientId: GOOGLE_CLIENT_ID,
        discoveryDocs: GOOGLE_DISCOVERY_DOCS,
        scope: GOOGLE_API_SCOPES,
      });
    });
}

// Remember whether the script is loaded. This can be improved, to
// include error management a such, but for now we only allowone 
// attempt. 
let scriptLoadingCashe: null | Promise<void> = null;

// Smart constructor ensures scripts are loaded before returning an
// implementaiton of GoogleAPIAuthenticator
function getGoogleAPIAuthenticator(
  logginCallback: (isLoggedIn: boolean) => void
): Promise<GoogleAPIAuthenticator> {

  if(scriptLoadingCashe === null){
    scriptLoadingCashe = loadAndInitGoogleScripts();
  }

  return scriptLoadingCashe.then(() => {
    // GAPI Client is initialized
    // Listen for loggin state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(logginCallback);
    // Handle the initial loggin state.
    logginCallback(gapi.auth2.getAuthInstance().isSignedIn.get());

    return new GoogleAPIAuthenticator_Impl();
  });
}
