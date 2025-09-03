
"use client";
import type { Link as LinkType, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Logo from '@/components/logo';
import AnimatedBackground from '@/components/animated-background';
import { Mail, Instagram, Facebook, Github, Coffee, Banknote, Bitcoin, ClipboardCopy, ClipboardCheck } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ---------- Helper Components ----------
const SocialIcon = ({ platform }: { platform: string }) => {
  switch (platform.toLowerCase()) {
    case 'email': return <Mail className="h-6 w-6" />;
    case 'instagram': return <Instagram className="h-6 w-6" />;
    case 'facebook': return <Facebook className="h-6 w-6" />;
    case 'github': return <Github className="h-6 w-6" />;
    default: return null;
  }
};

const EthIcon = () => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0">
    <title>Ethereum</title>
    <path d="M11.944 17.97L4.58 13.62 11.943 24l7.365-10.38-7.364 4.35zM12.056 0L4.69 12.223l7.366-4.354 7.365 4.354L12.056 0z" />
  </svg>
);

const SolIcon = () => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0">
    <title>Solana</title>
    <path d="M4.236.427a.6.6 0 00-.532.127.6.6 0 00-.28.49v4.54a.6.6 0 00.28.491.6.6 0 00.532.127l4.54-1.12a.6.6 0 00.49-.28.6.6 0 00.128-.533V-.001a.6.6 0 00-.128-.532.6.6 0 00-.49-.28L4.236.427zm10.02 6.046a.6.6 0 00-.532.127a.6.6 0 00-.28.491v4.54a.6.6 0 00.28.49.6.6 0 00.532.128l4.54-1.12a.6.6 0 00.49-.28.6.6 0 00.128-.532V5.76a.6.6 0 00-.128-.532.6.6 0 00-.49-.28l-4.54 1.12zm-4.383 6.64a.6.6 0 00-.532.127a.6.6 0 00-.28.49v4.54a.6.6 0 00.28.491.6.6 0 00.532.127l4.54-1.12a.6.6 0 00.49-.28.6.6 0 00.128-.533v-4.54a.6.6 0 00-.128-.532.6.6 0 00-.49-.28l-4.54 1.12z" />
  </svg>
);

const toDate = (date: any): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (date instanceof Timestamp) return date.toDate();
  if (typeof date === 'string') return new Date(date);
  return null;
};

type CryptoLogProps = {
  icon: React.ReactNode;
  name: string;
  address: string;
  onCopy: () => void;
  copied: boolean;
};

const CryptoLog = ({ icon, name, address, onCopy, copied }: CryptoLogProps) => (
  <div className="flex items-center justify-between gap-4 text-sm font-mono">
    <div className="flex items-center gap-2 text-muted-foreground shrink-0">
      {icon}
      <span className="font-sans font-medium text-foreground">{name}</span>
    </div>
    <p className="overflow-hidden truncate text-muted-foreground">{address}</p>
    <button onClick={onCopy} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
      {copied ? <ClipboardCheck className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
    </button>
  </div>
);

const trackClick = (userId: string, linkId: string) => {
  const data = { userId, linkId };
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/clicks', JSON.stringify(data));
    } else {
      fetch('/api/clicks', {
        method: 'POST',
        body: JSON.stringify(data),
        keepalive: true,
      });
    }
  } catch (e) {
    console.error("Error tracking click: ", e);
  }
};

const SupportLinks = ({ user, links }: { user: UserProfile, links: LinkType[] }) => {
  const { toast } = useToast();
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  const handleCopy = (link: LinkType) => {
    const textToCopy = link.title === 'E-Transfer' ? link.url.replace('mailto:', '') : link.url;
    navigator.clipboard.writeText(textToCopy);
    trackClick(user.uid, link.id);
    setCopiedStates(prev => ({ ...Object.fromEntries(Object.keys(prev).map(k => [k, false])), [link.id]: true }));
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopiedStates(prev => ({ ...prev, [link.id]: false })), 2000);
  };

  const buyMeACoffeeLink = links.find(l => l.title === 'Buy Me A Coffee');
  const eTransferLink = links.find(l => l.title === 'E-Transfer');
  const btcLink = links.find(l => l.title === 'BTC');
  const ethLink = links.find(l => l.title === 'ETH');
  const solLink = links.find(l => l.title === 'SOL');
  const hasCrypto = btcLink || ethLink || solLink;

  if (!buyMeACoffeeLink && !eTransferLink && !hasCrypto) return null;

  return (
    <div className="mt-6 w-full max-w-md mx-auto">
      <h3 className="text-xs font-semibold uppercase text-muted-foreground text-center mb-3">Support Me</h3>
      <div className="grid grid-cols-1 gap-3">
        {buyMeACoffeeLink && (
          <a href={buyMeACoffeeLink.url} target="_blank" rel="noopener noreferrer" onClick={() => trackClick(user.uid, buyMeACoffeeLink.id)}
            className="w-full text-center bg-yellow-400 text-black font-semibold p-3 rounded-lg shadow-sm flex items-center justify-center gap-2 hover:scale-105 transition-transform">
            <Coffee className="h-5 w-5" /> Buy Me a Coffee
          </a>
        )}
        {eTransferLink && (
          <button onClick={() => handleCopy(eTransferLink)}
            className="w-full text-center bg-secondary text-secondary-foreground font-semibold p-3 rounded-lg shadow-sm flex items-center justify-center gap-2 hover:scale-105 transition-transform">
            {copiedStates[eTransferLink.id] ? <ClipboardCheck className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
            {copiedStates[eTransferLink.id] ? "Copied E-Transfer Email" : "E-Transfer"}
          </button>
        )}
        {hasCrypto && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-3 font-mono text-sm">
            <p className="text-xs text-muted-foreground font-sans text-center">CRYPTO LOGS</p>
            {btcLink && <CryptoLog icon={<Bitcoin className="h-5 w-5 shrink-0" />} name="BTC" address={btcLink.url} onCopy={() => handleCopy(btcLink)} copied={!!copiedStates[btcLink.id]} />}
            {ethLink && <CryptoLog icon={<EthIcon />} name="ETH" address={ethLink.url} onCopy={() => handleCopy(ethLink)} copied={!!copiedStates[ethLink.id]} />}
            {solLink && <CryptoLog icon={<SolIcon />} name="SOL" address={solLink.url} onCopy={() => handleCopy(solLink)} copied={!!copiedStates[solLink.id]} />}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- Main Component ----------
export default function ProfileClientPage({ user, links: serverLinks }: { user: UserProfile; links: LinkType[] }) {
  const [activeLinks, setActiveLinks] = useState<LinkType[]>([]);
  const [srcDoc, setSrcDoc] = useState('');

  useEffect(() => {
    // This function must run on the client because it uses `document`.
    const unescapeHtml = (html: string) => {
        if (typeof window === 'undefined' || !html) return html;
        const ta = document.createElement("textarea");
        ta.innerHTML = html;
        return ta.value;
    }

    const rawEmbedScript = user.bot?.embedScript || '';
    const embedScript = unescapeHtml(rawEmbedScript);
    
    const autoOpenScript = user.bot?.autoOpen ? `
        <script>
        const initBotpress = () => {
            if (window.botpress) {
            window.botpress.on("webchat:ready", () => {
                window.botpress.open();
            });
            } else {
            setTimeout(initBotpress, 200);
            }
        };
        initBotpress();
        </script>
    ` : '';
    
    const newSrcDoc = embedScript ? `
        <html>
        <head>
            <style>
            html, body, #webchat, #webchat .bpWebchat {
                position: unset !important;
                width: 100% !important;
                height: 100% !important;
                max-height: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
            }
            #webchat .bp-widget-widget {
                display: ${user.bot?.autoOpen ? 'none !important' : 'block !important'};
                /* This re-enables clicks for the bot bubble */
                pointer-events: auto;
            }
            </style>
            ${embedScript}
        </head>
        <body>
            ${autoOpenScript}
        </body>
        </html>`
    : '';
    setSrcDoc(newSrcDoc);
  }, [user.bot?.embedScript, user.bot?.autoOpen]);

  useEffect(() => {
    const now = new Date();
    const filteredLinks = serverLinks.filter(link => {
      if (!link.active) return false;
      const startDate = toDate(link.startDate);
      const endDate = toDate(link.endDate);
      if (startDate && now < startDate) return false;
      if (endDate && now > endDate) return false;
      return true;
    });
    setActiveLinks(filteredLinks);
  }, [serverLinks]);

  const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).join('');
  const handleLinkClick = (link: LinkType) => {
    trackClick(user.uid, link.id);
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const socialLinks = activeLinks.filter(l => l.isSocial);
  const regularLinks = activeLinks.filter(l => !l.isSocial && !l.isSupport);
  const supportLinks = activeLinks.filter(l => l.isSupport);

  const customStyles: React.CSSProperties = {};
  if (user.theme === 'custom') {
    if (user.customThemeGradient?.from && user.customThemeGradient?.to) {
        (customStyles as any)['--background-gradient-from'] = user.customThemeGradient.from;
        (customStyles as any)['--background-gradient-to'] = user.customThemeGradient.to;
    }
    if (user.customButtonGradient?.from && user.customButtonGradient?.to) {
      (customStyles as any)["--btn-gradient-from"] = user.customButtonGradient.from;
      (customStyles as any)["--btn-gradient-to"] = user.customButtonGradient.to;
    }
  }

  return (
    <div
      data-theme={user.theme || 'light'}
      data-style={user.buttonStyle || 'solid'}
      className="h-full w-full bg-background"
      style={customStyles}
    >
      <div className="relative h-full w-full">
        {user.animatedBackground && <AnimatedBackground />}
        
        {/* Chatbot Iframe Container - Sits on top, but is click-through */}
        <div className={cn(
            "absolute inset-0 z-20 pointer-events-none",
            !srcDoc && "hidden"
        )}>
            <iframe
                srcDoc={srcDoc}
                className="h-full w-full border-0"
                title="Chatbot"
                sandbox="allow-scripts allow-same-origin"
            />
        </div>

        {/* Main Content (Links, Bio, etc.) - Sits underneath the iframe */}
        <div className="relative z-10 flex h-full flex-col p-4 text-foreground">
            <div className="w-full max-w-md mx-auto flex-grow flex flex-col items-center text-center pt-12 overflow-y-auto">
                <Avatar className="h-24 w-24 border-2 border-white/50">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
                <h1 className="text-2xl font-bold mt-3">{user.displayName}</h1>
                <p className="text-md text-muted-foreground">@{user.username}</p>
                <p className="mt-2 text-sm max-w-xs text-foreground/80">{user.bio}</p>
                <div className="flex gap-4 justify-center mt-3 text-foreground/80">
                    {socialLinks.map(link => (
                    <button key={link.id} aria-label={`My ${link.title}`} className="hover:text-primary transition-colors" onClick={() => handleLinkClick(link)}>
                        <SocialIcon platform={link.title} />
                    </button>
                    ))}
                </div>
                <div className="mt-6 space-y-3 w-full">
                    {regularLinks.map((link) => (
                    <button
                        key={link.id}
                        className={cn(
                        "w-full text-center bg-secondary text-secondary-foreground font-semibold p-4 rounded-lg shadow-md transition-transform transform hover:scale-105 active:scale-[0.98] truncate",
                        "link-button"
                        )}
                        onClick={() => handleLinkClick(link)}
                    >
                        {link.title}
                    </button>
                    ))}
                </div>
                <SupportLinks user={user} links={supportLinks} />
            </div>
            <footer className="w-full text-center py-2 shrink-0">
                <Logo />
            </footer>
        </div>
      </div>
    </div>
  );
}
