
"use client";

import type { Link, UserProfile } from "@/lib/types";
import { themes } from "@/app/(dashboard)/dashboard/appearance/page";

// This is a simplified version of the public profile page's rendering logic,
// designed to be injected into an iframe's srcDoc.
const generateProfileHtml = (profile: Partial<UserProfile>, links: Link[]) => {
    const getInitials = (name: string = "") => name.split(" ").map((n) => n[0]).join("");
    const socialLinks = links.filter(l => l.isSocial && l.active);
    const regularLinks = links.filter(l => !l.isSocial && !l.isSupport && l.active);

    const socialLinksHtml = socialLinks.map(link => `
        <a href="${link.url}" target="_blank" class="social-icon">
            <!-- Basic social icons as inline SVG for simplicity -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
        </a>
    `).join('');

    const regularLinksHtml = regularLinks.map(link => `
        <a href="${link.url}" target="_blank" class="link-button">
            ${link.title}
        </a>
    `).join('');

    return `
        <div class="profile-container">
            <img src="${profile.photoURL || `https://placehold.co/96x96.png`}" alt="Profile Picture" class="avatar">
            <h1 class="display-name">${profile.displayName || "Your Name"}</h1>
            <p class="username">@${profile.username || "username"}</p>
            <p class="bio">${profile.bio || "Your bio will appear here."}</p>
            <div class="social-links">${socialLinksHtml}</div>
            <div class="regular-links">${regularLinksHtml.length > 0 ? regularLinksHtml : '<div class="link-button">Example Link</div>'}</div>
        </div>
    `;
};

// Generates the CSS for the selected theme
const getThemeStyles = (themeId: string = 'light') => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return '';
    // A simplified CSS generation based on your globals.css structure
    // This is not a full CSS-in-JS solution but a direct way to style the iframe content
    return `
        :root {
            --background: ${theme.cssVars.background};
            --foreground: ${theme.cssVars.foreground};
            --primary: ${theme.cssVars.primary};
            --primary-foreground: ${theme.cssVars.primaryForeground};
            --secondary: ${theme.cssVars.secondary};
            --secondary-foreground: ${theme.cssVars.secondaryForeground};
        }
    `;
}

export default function PreviewIframe({ profile, links, embedScript }: { profile: Partial<UserProfile>, links: Link[], embedScript?: string }) {
    if (!profile) return null;

    const profileHtml = generateProfileHtml(profile, links);
    const themeStyles = getThemeStyles(profile.theme);
    
    // Construct the full HTML document for the iframe
    const srcDoc = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                ${themeStyles}
                body {
                    font-family: 'Inter', sans-serif;
                    background-color: hsl(var(--background));
                    color: hsl(var(--foreground));
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 2rem;
                    margin: 0;
                    height: 100vh;
                    overflow: auto;
                    box-sizing: border-box;
                }
                .profile-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    width: 100%;
                    max-width: 320px;
                }
                .avatar {
                    width: 96px;
                    height: 96px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid white;
                }
                .display-name {
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin-top: 1rem;
                }
                .username {
                    color: hsl(var(--foreground) / 0.7);
                }
                .bio {
                    margin-top: 0.5rem;
                    font-size: 0.9rem;
                    color: hsl(var(--foreground) / 0.9);
                }
                .social-links {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1rem;
                }
                .social-icon { color: hsl(var(--foreground)); }
                .regular-links {
                    margin-top: 2rem;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .link-button {
                    background-color: hsl(var(--secondary));
                    color: hsl(var(--secondary-foreground));
                    padding: 1rem;
                    border-radius: 0.5rem;
                    text-decoration: none;
                    font-weight: 600;
                    transition: transform 0.2s;
                }
                .link-button:hover { transform: scale(1.05); }
            </style>
        </head>
        <body>
            ${profileHtml}
            ${embedScript || ''}
        </body>
        </html>
    `;

    return (
        <iframe
            srcDoc={srcDoc}
            className="w-full h-full border rounded-md"
            title="Live Profile Preview"
            sandbox="allow-scripts allow-same-origin"
        />
    );
}
