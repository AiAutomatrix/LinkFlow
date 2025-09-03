# Architecture: Public Profile Page (`profile-client-page.tsx`)

This document provides a detailed technical breakdown of the `src/app/u/[username]/profile-client-page.tsx` file. It explains the unique rendering architecture chosen to solve complex UI challenges related to third-party scripts, browser security, and user interactions.

---

## 1. Core Challenge: The Iframe Sandbox

The public profile page has two conflicting requirements:

1.  **Embed a Third-Party Chatbot**: A Botpress chatbot needs to be embedded, which uses its own scripts to create a "chat bubble" that overlays the page and opens a full-screen chat window.
2.  **Secure Clipboard Actions**: "Support Me" links (like E-Transfer and crypto addresses) require a "copy to clipboard" function, which is a browser-restricted security action.

Early attempts to build a standard React page led to two major issues:
*   **Z-Index/Layering Bugs**: The chatbot would either appear underneath other UI elements or, if placed on top, its invisible container would block clicks to the links behind it.
*   **Clipboard API Restrictions**: When the profile was rendered inside an `iframe` to contain the chatbot, the "copy" buttons inside the `iframe` could not access the browser's clipboard due to security sandboxing.

---

## 2. The Solution: A Self-Contained `iframe` with a `postMessage` Bridge

To solve all issues simultaneously, we adopted a hybrid architecture where the *entire* profile page is rendered inside a dynamically generated `iframe`. This `iframe` then communicates with the parent window for secure actions.

### a. Dynamic Iframe Generation

Instead of rendering JSX directly, the `ProfileClientPage` component dynamically builds a complete HTML document as a string and sets it as the `srcDoc` of an `iframe`.

**How it Works:**
1.  **Render to String**: React components for the page (`Avatar`, `SocialIcon`, `SupportLinks`, etc.) are rendered into a static HTML string using `ReactDOMServer.renderToStaticMarkup`.
2.  **Inject Assets**: This HTML string is embedded into a full `<html>` document structure. Crucially, all necessary CSS and JavaScript are injected directly into this document.
3.  **Set `srcDoc`**: The final, self-contained HTML document is passed to the `srcDoc` attribute of the `iframe` element, which then renders it.

This technique treats the profile page as a self-contained "microsite" within the main page, effectively solving all layout and `z-index` problems related to the chatbot.

```jsx
// Simplified example from profile-client-page.tsx

export default function ProfileClientPage({ user, links }) {
  const [srcDoc, setSrcDoc] = useState('');

  useEffect(() => {
    // 1. Render React components to an HTML string
    const staticContent = ReactDOMServer.renderToStaticMarkup(
      <ProfileLayout user={user} links={links} />
    );

    // 2. Inject content, styles, and scripts into a full HTML document
    const finalHtml = `
      <html>
        <head>
          <style>${globalCSS}</style>
          <script>${iframeScript}</script>
        </head>
        <body>
          <div id="root" data-theme="${user.theme}">
            ${staticContent}
          </div>
        </body>
      </html>
    `;

    // 3. Set the iframe source
    setSrcDoc(finalHtml);
  }, [user, links]);

  return (
    <iframe
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-same-origin"
      title={user.displayName}
    />
  );
}
```

### b. The `postMessage` Bridge for Clipboard Actions

This is the key to solving the clipboard security restriction.

**The Workflow:**
1.  **User Clicks "Copy" in Iframe**: The user clicks a button (e.g., "Copy BTC Address"). The `onclick` handler does *not* try to access the clipboard.
2.  **Iframe Sends Message**: The `onclick` handler calls a JavaScript function embedded within the `iframe`'s `<script>` tag. This function sends a message to its parent window using `window.parent.postMessage()`.
3.  **Parent Page Listens**: The main `ProfileClientPage` component has a `useEffect` hook that adds an event listener for `message` events.
4.  **Parent Page Acts**: When the listener receives a message with the correct `type` (e.g., `COPY_TO_CLIPBOARD`), it safely executes `navigator.clipboard.writeText()` with the data from the message payload.
5.  **Parent Page Shows Feedback**: After a successful copy, the parent page triggers a toast notification to inform the user.

#### Code Example: Iframe-Side (Embedded Script)
This script is injected into the `<head>` of the `iframe`'s HTML.

```javascript
// This function lives inside the iframe
function handleCopy(text, linkId) {
  // Send a message to the parent window requesting a copy action
  window.parent.postMessage({
    type: 'COPY_TO_CLIPBOARD',
    payload: { text, linkId }
  }, '*'); // In production, replace '*' with the actual parent origin for security
}

// The button in the iframe calls this function
// <button onclick="handleCopy('THE_BTC_ADDRESS', 'btc-link-id')">Copy</button>
```

#### Code Example: Parent-Side (React Component)
This listener lives in the main `ProfileClientPage` React component.

```jsx
// This useEffect hook runs in the main React component
useEffect(() => {
  const handleMessage = (event) => {
    // Optional: Add event.origin check for security
    // if (event.origin !== "https://your-domain.com") return;

    const { type, payload } = event.data;

    if (type === 'COPY_TO_CLIPBOARD') {
      navigator.clipboard.writeText(payload.text).then(() => {
        // Show a success toast
        toast({ title: "Copied to clipboard!" });
        // Optionally track the click event
        trackClick(payload.linkId, true);
      });
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, [toast]); // Dependency array ensures the listener has access to the `toast` function
```

This architecture effectively creates a secure communication channel, allowing the sandboxed `iframe` to request actions that only the main page has the permission to execute. This solves the clipboard issue without re-introducing any of the UI layering problems.