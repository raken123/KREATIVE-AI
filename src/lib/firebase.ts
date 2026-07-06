import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google OAuth provider with Google Drive scopes
export const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/drive");
provider.addScope("https://www.googleapis.com/auth/drive.file");
provider.addScope("https://www.googleapis.com/auth/drive.metadata");
provider.addScope("https://www.googleapis.com/auth/drive.readonly");

// Memory cache for the OAuth access token
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // Look in session/memory or let the component trigger login if token is missing
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // If there's a logged-in user but no token cached yet, we might need a fresh token.
        // We will notify the listener of success but let the app request token if needed.
        if (onAuthSuccess) onAuthSuccess(user, "");
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google Sign In popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Kunde inte hämta OAuth-åtkomsttoken från Google Auth");
    }

    cachedAccessToken = credential.accessToken;
    // Save in session storage to persist across page refreshes (optional but helpful)
    try {
      sessionStorage.setItem("gdrive_access_token", cachedAccessToken);
    } catch (e) {
      console.warn("Kunde inte spara token i sessionStorage", e);
    }
    
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Inloggningsfel:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Retrieve current access token (checks cache, then sessionStorage)
export const getAccessToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const saved = sessionStorage.getItem("gdrive_access_token");
    if (saved) {
      cachedAccessToken = saved;
      return saved;
    }
  } catch (e) {}
  return null;
};

// Set token manually (e.g. if restored from state)
export const setAccessToken = (token: string) => {
  cachedAccessToken = token;
  try {
    sessionStorage.setItem("gdrive_access_token", token);
  } catch (e) {}
};

// Sign out
export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  try {
    sessionStorage.removeItem("gdrive_access_token");
  } catch (e) {}
};
