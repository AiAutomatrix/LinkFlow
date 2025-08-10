import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, UserCredential } from "firebase/auth";
import { canUsePopup } from "./canUsePopup";

export async function loginWithGoogle(): Promise<UserCredential | void> {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  if (canUsePopup()) {
    try {
      // signInWithPopup resolves with a UserCredential
      const result = await signInWithPopup(auth, provider);
      return result;
    } catch (err: any) {
      console.warn("Popup failed, falling back to redirect:", err.code);
      // Fallback to redirect if popup fails for any reason (e.g. closed by user)
      await signInWithRedirect(auth, provider);
      // signInWithRedirect does not resolve, it navigates away.
      // So no return value here.
    }
  } else {
    // Use redirect for environments that don't support popups well
    await signInWithRedirect(auth, provider);
    // No return value here either.
  }
}
