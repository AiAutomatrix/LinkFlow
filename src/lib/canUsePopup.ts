
"use client";

export function canUsePopup(): boolean {
  if (typeof window === 'undefined') {
    // Default to false in SSR environments
    return false;
  }
  
  const ua = navigator.userAgent || navigator.vendor || "";

  // Detect known problematic environments for popups
  const isFacebookInApp = ua.includes("FBAN") || ua.includes("FBAV");
  const isInstagramInApp = ua.includes("Instagram");
  const isTwitterInApp = ua.includes("Twitter");
  const isLinkedInInApp = ua.includes("LinkedIn");
  const isTikTokInApp = ua.includes("Tiktok");
  
  // A more reliable way to detect Safari on iOS
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !((window as any).MSStream);
  const isSafari = ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('CriOS');


  // Avoid popups in in-app browsers or restricted mobile browsers
  if (isFacebookInApp || isInstagramInApp || isTwitterInApp || isLinkedInInApp || isTikTokInApp) {
    return false;
  }

  // Older Safari on iOS is known for popup issues
  if (isIOS && isSafari) {
    return false;
  }

  return true;
}
