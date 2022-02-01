export {
  getGapiClient,
  isLoggedIn,
  userName,
  setLogginCallback,
  getUserName,
  getOAuthInstance,
  getOauthToken,
  logout,
  appId,
  gapiClientInit,
  revokeAccess
}

declare var gapi: any;

const googleApiKey = 'AIzaSyDpVnC9nF-bCsgfgJW7_gsrvenqX27S-c0';
const clientId = '833733111006-t1ohltmjic3spr0r47j6nn6t4hvdt4tb.apps.googleusercontent.com';
const appId = 'tally-anything-338816'
const scopes = [
  'profile',
  'email',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata'
].join(' ');
const discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const gapiScriptSrcUrl = "https://apis.google.com/js/api.js";

let isLoggedIn = false
let userName = ""
let logginCallback = (loggedIn: boolean) => { }

function handleLoginError(err: any){
  /* Do nothing */
  throw err;
}

const gapiClientInit = new Promise((resolve, reject) => {

  console.log("Loading Google API");

  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = gapiScriptSrcUrl;
  script.onload = () => {
    resolve(true)
  };
  script.onerror = error => {
    reject(error)
  };
  document.getElementsByTagName('head')[0].appendChild(script);

}).then(() => {

  console.log("Loading Google OAuth2 Client");

  return new Promise((resolve, reject) => {
    gapi.load('client:auth2', {
      callback: () => resolve(true),
      onerror: (err: any) => reject(err),
      timeout: 5000, // 5 seconds.
      ontimeout: () => reject("isGapiClientAuth2Loaded Timeout Error")
    })
  })

} ).then(() => {

  console.log("Initializing Google OAuth2 Client");

  return gapi.client.init({
    'apiKey': googleApiKey,
    'clientId': clientId,
    'discoveryDocs': discoveryDocs,
    'scope': scopes
  });

}).then(() => {

  // GAPI Client is initialized

  // Listen for loggin state changes.
  gapi.auth2.getAuthInstance().isSignedIn.listen(handleLogin);

  // Handle the initial loggin state.
  handleLogin(gapi.auth2.getAuthInstance().isSignedIn.get());

  return true
}).catch(handleLoginError);

function handleLogin(isSignedIn: boolean) {

  console.log("Handle loggin state - isSignedIn:", isSignedIn);

  isLoggedIn = isSignedIn;
  userName = gapi?.auth2?.getAuthInstance()?.currentUser?.get()?.getBasicProfile()?.getGivenName() || ""
  logginCallback(isSignedIn);
}

function setLogginCallback(fn: (isLoggedIn: boolean) => void) {
  logginCallback = fn;
}

// Retrieve an Oauth Instance for the current user. Load APIs
// and/or initialize OAuth flow if nessesary.
async function getOAuthInstance() {
  const instance = gapi.auth2.getAuthInstance()

  if (!isLoggedIn) {

    console.log("User is logging in");

    await gapiClientInit;
    return Promise.resolve(instance.signIn())
      .then(() => instance)
      .catch(handleLoginError);
  }

  return instance;
}

async function logout(): Promise<boolean> {
  if (isLoggedIn) {

    console.log("User is logging out");

    return gapi.auth2.getAuthInstance()
      .signOut()
      .then(() => true)
      .catch(handleLoginError);
  }
  return true;
}

async function getOauthToken(): Promise<string> {
  const instance = await getOAuthInstance();
  return instance.currentUser.get().getAuthResponse().access_token
}

async function getGapiClient(): Promise<any> {
  await gapiClientInit
  return gapi.client
}

async function getUserName(): Promise<string> {
  const instance = await getOAuthInstance();
  return instance.currentUser.get().getBasicProfile().getGivenName()
}

async function revokeAccess(): Promise<boolean> {

  console.log("User is revoking access to google drive");

  const instance = await getOAuthInstance();
  instance.disconnect()
  return true
}
