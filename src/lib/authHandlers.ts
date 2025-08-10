import { GoogleAuthProvider, signInWithRedirect } from "firebase/auth";
import { auth } from "./firebase";

export async function signInWithGoogleRedirect() {
  const provider = new GoogleAuthProvider();
  // optional: provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithRedirect(auth, provider);
  } catch (err) {
    console.error("signInWithRedirect error:", err);
    throw err;
  }
}
