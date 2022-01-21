
export { 
  getGapiClient, 
  isLoggedIn, 
  userName, 
  setLogginCallback, 
  getUserName,
  getOAuthInstance,
  logout
}

declare var gapi: any;

const googleApiKey = 'AIzaSyDpVnC9nF-bCsgfgJW7_gsrvenqX27S-c0';
const clientId = '833733111006-t1ohltmjic3spr0r47j6nn6t4hvdt4tb.apps.googleusercontent.com';
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
let logginCallback = (loggedIn: boolean) => {}

const gapiClientInit = new Promise((resolve, reject) => {

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

}).then(() =>

  new Promise((resolve, reject) => {
    gapi.load('client:auth2', {
      callback: () => resolve(true),
      onerror: (err: any) => reject(err),
      timeout: 5000, // 5 seconds.
      ontimeout: () => reject("isGapiClientAuth2Loaded Timeout Error")
    })
  })

).then(() =>

  gapi.client.init({
    'apiKey': googleApiKey,
    'clientId': clientId,
    'discoveryDocs': discoveryDocs,
    'scope': scopes
  })

).then(() => {

  // Handle the initial loggin state.
  isLoggedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
  userName = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getGivenName()
  console.log(`>>>>>>>>>> Startup loggin is ${isLoggedIn}`)
  logginCallback(isLoggedIn)

  // GAPI Client is initialized
  // Listen for loggin state changes.
  gapi.auth2.getAuthInstance().isSignedIn.listen((isSignedIn:boolean) => {
    isLoggedIn = isSignedIn;
    userName = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getGivenName()
    console.log(">>>>>>>>>> Updating Login to ", isSignedIn)
    logginCallback(isSignedIn);
  });

})

function setLogginCallback(fn: (isLoggedIn: boolean) => void){
  logginCallback = fn;
}

// Retrieve an Oauth Instance for the current user. Load APIs
// and/or initialize OAuth flow if nessesary.
async function getOAuthInstance() {
  if (!isLoggedIn) {
    await gapiClientInit;
    await gapi.auth2.getAuthInstance().signIn();
  }
  return gapi.auth2.getAuthInstance();
}

async function logout() {
  if (isLoggedIn) {
    gapi.auth2.getAuthInstance().signOut()
  }
  return false;
}

async function getOauthToken() {
  const instance = await getOAuthInstance();
  return instance.currentUser.get().getAuthResponse().access_token
}

async function getGapiClient() : Promise<any> {
  await gapiClientInit
  return gapi.client
}

async function getUserName(): Promise<string> {
  const instance = await getOAuthInstance();
  return instance.currentUser.get().getBasicProfile().getGivenName()
}

