
"use client";
import type { Link as LinkType, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Logo from '@/components/logo';
import AnimatedBackground from '@/components/animated-background';
import { Mail, Instagram, Facebook, Github, Linkedin, Coffee, Banknote, Bitcoin, ClipboardCopy, ClipboardCheck } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import ReactDOMServer from 'react-dom/server';

const globalCSS = `
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', sans-serif;
  overflow-x: hidden; /* Prevent horizontal scroll */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
body::-webkit-scrollbar {
  display: none; /* Safari and Chrome */
}

@layer base {
  :root, [data-theme="light"] {
    --background: 0 0% 100%;
    --foreground: 220 15% 25%;
    --card: 0 0% 100%;
    --card-foreground: 220 15% 25%;
    --popover: 0 0% 100%;
    --popover-foreground: 220 15% 25%;
    --primary: 220 90% 60%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  [data-theme="dark"] {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
  
  [data-theme="charcoal"] { --background: 220 10% 20%; --foreground: 220 10% 90%; --card: 220 10% 25%; --card-foreground: 220 10% 90%; --primary: 220 15% 70%; --primary-foreground: 220 10% 10%; --secondary: 220 10% 30%; --secondary-foreground: 220 10% 90%; --muted: 220 10% 30%; --muted-foreground: 220 10% 60%; --accent: 210 20% 80%; --accent-foreground: 220 10% 10%; --border: 220 10% 35%; --input: 220 10% 35%; --ring: 220 15% 70%; }
  [data-theme="slate"] { --background: 220 30% 25%; --foreground: 220 20% 95%; --card: 220 30% 30%; --card-foreground: 220 20% 95%; --primary: 210 40% 75%; --primary-foreground: 220 20% 10%; --secondary: 220 30% 40%; --secondary-foreground: 220 20% 95%; --muted: 220 30% 40%; --muted-foreground: 220 20% 60%; --accent: 200 50% 80%; --accent-foreground: 220 30% 10%; --border: 220 30% 45%; --input: 220 30% 45%; --ring: 210 40% 75%; }
  [data-theme="neon-green"] { --background: 300 5% 8%; --foreground: 120 100% 80%; --card: 300 5% 12%; --card-foreground: 120 100% 80%; --primary: 120 100% 50%; --primary-foreground: 300 5% 8%; --secondary: 120 95% 15%; --secondary-foreground: 120 100% 80%; --muted: 120 95% 15%; --muted-foreground: 120 100% 70%; --accent: 120 100% 50%; --accent-foreground: 300 5% 8%; --border: 120 95% 20%; --input: 120 95% 20%; --ring: 120 100% 50%; }
  [data-theme="neon-pink"] { --background: 300 10% 10%; --foreground: 320 100% 85%; --card: 300 10% 14%; --card-foreground: 320 100% 85%; --primary: 320 100% 60%; --primary-foreground: 300 10% 10%; --secondary: 320 100% 18%; --secondary-foreground: 320 100% 85%; --muted: 320 100% 18%; --muted-foreground: 320 100% 70%; --accent: 320 100% 60%; --accent-foreground: 300 10% 10%; --border: 320 100% 25%; --input: 320 100% 25%; --ring: 320 100% 60%; }
  [data-theme="cyberpunk"] { --background: 272 90% 7%; --foreground: 182 100% 80%; --card: 272 90% 10%; --card-foreground: 182 100% 80%; --primary: 182 100% 50%; --primary-foreground: 272 90% 7%; --secondary: 272 90% 15%; --secondary-foreground: 182 100% 80%; --muted: 272 90% 15%; --muted-foreground: 182 100% 70%; --accent: 300 100% 60%; --accent-foreground: 272 90% 7%; --border: 272 90% 20%; --input: 272 90% 20%; --ring: 182 100% 50%; }
  [data-theme="retro-wave"] { --background: 270 70% 15%; --foreground: 300 90% 80%; --card: 270 70% 18%; --card-foreground: 300 90% 80%; --primary: 300 90% 70%; --primary-foreground: 270 70% 15%; --secondary: 270 70% 25%; --secondary-foreground: 300 90% 80%; --muted: 270 70% 25%; --muted-foreground: 300 90% 70%; --accent: 180 90% 60%; --accent-foreground: 270 70% 15%; --border: 270 70% 30%; --input: 270 70% 30%; --ring: 300 90% 70%; }
  [data-theme="gradient-sunset"] { --background: 20 100% 98%; --foreground: 20 80% 20%; --card: 0 0% 100%; --card-foreground: 20 80% 20%; --primary: 340 90% 60%; --primary-foreground: 0 0% 100%; --secondary: 20 90% 92%; --secondary-foreground: 20 80% 20%; --muted: 20 90% 92%; --muted-foreground: 20 80% 50%; --accent: 340 90% 60%; --accent-foreground: 0 0% 100%; --border: 20 90% 85%; --input: 20 90% 85%; --ring: 340 90% 60%; }
  [data-theme="ocean-blue"] { --background: 210 100% 98%; --foreground: 215 80% 25%; --card: 210 100% 100%; --card-foreground: 215 80% 25%; --primary: 210 90% 55%; --primary-foreground: 210 100% 98%; --secondary: 210 95% 90%; --secondary-foreground: 215 80% 25%; --accent: 190 90% 50%; --accent-foreground: 215 80% 25%; --border: 210 80% 85%; --input: 210 80% 85%; --ring: 210 90% 55%; }
  [data-theme="lavender"] { --background: 250 80% 98%; --foreground: 250 40% 30%; --card: 250 80% 100%; --card-foreground: 250 40% 30%; --primary: 250 60% 70%; --primary-foreground: 250 40% 10%; --secondary: 250 70% 95%; --secondary-foreground: 250 40% 30%; --muted: 250 70% 95%; --muted-foreground: 250 40% 50%; --accent: 270 70% 75%; --accent-foreground: 250 40% 30%; --border: 250 70% 90%; --input: 250 70% 90%; --ring: 250 60% 70%; }
  [data-theme="cherry-blossom"] { --background: 345 100% 98%; --foreground: 345 50% 25%; --primary: 345 80% 70%; --primary-foreground: 345 50% 15%; --secondary: 345 80% 96%; --secondary-foreground: 345 50% 25%; --muted: 345 80% 96%; --muted-foreground: 345 50% 55%; --accent: 345 90% 80%; --accent-foreground: 345 50% 25%; --border: 345 80% 92%; --input: 345 80% 92%; --ring: 345 80% 70%; }
  [data-theme="seafoam"] { --background: 160 70% 97%; --foreground: 160 50% 20%; --card: 160 70% 100%; --card-foreground: 160 50% 20%; --primary: 160 60% 50%; --primary-foreground: 160 70% 97%; --secondary: 160 60% 92%; --secondary-foreground: 160 50% 20%; --muted: 160 60% 92%; --muted-foreground: 160 50% 50%; --accent: 170 60% 65%; --accent-foreground: 160 50% 20%; --border: 160 60% 88%; --input: 160 60% 88%; --ring: 160 60% 50%; }
  [data-theme="candy-floss"] { --background: 330 80% 98%; --foreground: 330 60% 25%; --card: 330 80% 100%; --card-foreground: 330 60% 25%; --primary: 330 85% 75%; --primary-foreground: 330 60% 15%; --secondary: 330 80% 95%; --secondary-foreground: 330 60% 25%; --muted: 330 80% 95%; --muted-foreground: 330 60% 50%; --accent: 340 85% 80%; --accent-foreground: 330 60% 25%; --border: 330 80% 92%; --input: 330 80% 92%; --ring: 330 85% 75%; }
  [data-theme="sky-blue"] { --background: 220 100% 98%; --foreground: 220 80% 25%; --card: 220 100% 100%; --card-foreground: 220 80% 25%; --primary: 220 90% 60%; --primary-foreground: 220 100% 98%; --secondary: 220 100% 94%; --secondary-foreground: 220 80% 25%; --muted: 220 100% 94%; --muted-foreground: 220 80% 50%; --accent: 210 90% 70%; --accent-foreground: 220 80% 25%; --border: 220 100% 90%; --input: 220 100% 90%; --ring: 220 90% 60%; }
  [data-theme="amethyst"] { --background: 270 30% 12%; --foreground: 270 80% 90%; --primary: 270 80% 80%; --primary-foreground: 270 30% 12%; --secondary: 270 30% 20%; --secondary-foreground: 270 80% 90%; --muted: 270 30% 20%; --muted-foreground: 270 80% 70%; --accent: 290 80% 85%; --accent-foreground: 270 30% 12%; --border: 270 30% 30%; --input: 270 30% 30%; --ring: 270 80% 80%; }
  [data-theme="royal-purple"] { --background: 270 50% 98%; --foreground: 270 50% 20%; --card: 270 50% 100%; --card-foreground: 270 50% 20%; --primary: 270 60% 60%; --primary-foreground: 270 50% 98%; --secondary: 270 50% 92%; --secondary-foreground: 270 50% 20%; --muted: 270 50% 92%; --muted-foreground: 270 50% 50%; --accent: 290 70% 70%; --accent-foreground: 270 50% 20%; --border: 270 50% 88%; --input: 270 50% 88%; --ring: 270 60% 60%; }
  [data-theme="indigo"] { --background: 240 60% 15%; --foreground: 240 50% 90%; --card: 240 60% 20%; --card-foreground: 240 50% 90%; --primary: 240 70% 75%; --primary-foreground: 240 60% 15%; --secondary: 240 50% 30%; --secondary-foreground: 240 50% 90%; --muted: 240 50% 30%; --muted-foreground: 240 50% 60%; --accent: 220 80% 80%; --accent-foreground: 240 60% 10%; --border: 240 50% 35%; --input: 240 50% 35%; --ring: 240 70% 75%; }
  [data-theme="velvet"] { --background: 270 20% 10%; --foreground: 270 80% 85%; --card: 270 20% 13%; --card-foreground: 270 80% 85%; --primary: 270 70% 65%; --primary-foreground: 270 20% 10%; --secondary: 270 20% 20%; --secondary-foreground: 270 80% 85%; --muted: 270 20% 20%; --muted-foreground: 270 80% 70%; --accent: 0 60% 60%; --accent-foreground: 270 20% 10%; --border: 270 20% 25%; --input: 270 20% 25%; --ring: 270 70% 65%; }
  [data-theme="copper"] { --background: 20 20% 15%; --foreground: 20 60% 85%; --primary: 25 70% 60%; --primary-foreground: 20 20% 10%; --secondary: 20 20% 25%; --secondary-foreground: 20 60% 85%; --muted: 20 20% 25%; --muted-foreground: 20 60% 70%; --accent: 30 70% 65%; --accent-foreground: 20 20% 10%; --border: 20 20% 35%; --input: 20 20% 35%; --ring: 25 70% 60%; }
  [data-theme="crimson-red"] { --background: 0 50% 98%; --foreground: 0 60% 25%; --card: 0 50% 100%; --card-foreground: 0 60% 25%; --primary: 0 70% 55%; --primary-foreground: 0 50% 98%; --secondary: 0 60% 94%; --secondary-foreground: 0 60% 25%; --muted: 0 60% 94%; --muted-foreground: 0 60% 50%; --accent: 20 80% 60%; --accent-foreground: 0 60% 25%; --border: 0 60% 90%; --input: 0 60% 90%; --ring: 0 70% 55%; }
  [data-theme="forest-green"] { --background: 120 20% 98%; --foreground: 120 60% 20%; --card: 120 20% 100%; --card-foreground: 120 60% 20%; --primary: 120 50% 40%; --primary-foreground: 120 20% 98%; --secondary: 120 40% 90%; --secondary-foreground: 120 60% 20%; --muted: 120 40% 90%; --muted-foreground: 120 60% 50%; --accent: 100 50% 50%; --accent-foreground: 120 60% 20%; --border: 120 30% 85%; --input: 120 30% 85%; --ring: 120 50% 40%; }
  [data-theme="jungle"] { --background: 150 20% 97%; --foreground: 150 80% 20%; --card: 150 20% 100%; --card-foreground: 150 80% 20%; --primary: 150 80% 40%; --primary-foreground: 150 20% 97%; --secondary: 150 20% 90%; --secondary-foreground: 150 80% 20%; --muted: 150 20% 90%; --muted-foreground: 150 80% 50%; --accent: 100 60% 50%; --accent-foreground: 150 20% 97%; --border: 150 20% 85%; --input: 150 20% 85%; --ring: 150 80% 40%; }
  [data-theme="earthy-tones"] { --background: 45 30% 90%; --foreground: 35 80% 20%; --card: 45 30% 95%; --card-foreground: 35 80% 20%; --primary: 35 80% 30%; --primary-foreground: 45 30% 90%; --secondary: 45 25% 80%; --secondary-foreground: 35 80% 20%; --muted: 45 25% 80%; --muted-foreground: 35 80% 50%; --accent: 80 50% 40%; --accent-foreground: 45 30% 90%; --border: 45 25% 75%; --input: 45 25% 75%; --ring: 35 80% 30%; }
  [data-theme="olive"] { --background: 80 20% 96%; --foreground: 80 40% 20%; --card: 80 20% 100%; --card-foreground: 80 40% 20%; --primary: 80 30% 45%; --primary-foreground: 80 20% 96%; --secondary: 80 25% 90%; --secondary-foreground: 80 40% 20%; --muted: 80 25% 90%; --muted-foreground: 80 40% 50%; --accent: 60 30% 55%; --accent-foreground: 80 40% 20%; --border: 80 25% 85%; --input: 80 25% 85%; --ring: 80 30% 45%; }
  [data-theme="sandstone"] { --background: 40 80% 95%; --foreground: 40 80% 20%; --card: 40 80% 98%; --card-foreground: 40 80% 20%; --primary: 40 90% 40%; --primary-foreground: 40 80% 95%; --secondary: 40 80% 85%; --secondary-foreground: 40 80% 20%; --muted: 40 80% 85%; --muted-foreground: 40 80% 50%; --accent: 25 70% 50%; --accent-foreground: 40 80% 95%; --border: 40 80% 80%; --input: 40 80% 80%; --ring: 40 90% 40%; }
  [data-theme="mocha"] { --background: 30 25% 95%; --foreground: 30 40% 20%; --card: 30 25% 100%; --card-foreground: 30 40% 20%; --primary: 30 40% 50%; --primary-foreground: 30 40% 95%; --secondary: 30 30% 90%; --secondary-foreground: 30 40% 20%; --muted: 30 30% 90%; --muted-foreground: 30 40% 50%; --accent: 40 30% 60%; --accent-foreground: 30 40% 20%; --border: 30 30% 85%; --input: 30 30% 85%; --ring: 30 40% 50%; }
  [data-theme="goldenrod"] { --background: 45 100% 97%; --foreground: 40 80% 20%; --card: 45 100% 100%; --card-foreground: 40 80% 20%; --primary: 45 100% 50%; --primary-foreground: 40 80% 10%; --secondary: 45 90% 90%; --secondary-foreground: 40 80% 20%; --muted: 45 90% 90%; --muted-foreground: 40 80% 50%; --accent: 55 95% 60%; --accent-foreground: 40 80% 20%; --border: 45 90% 85%; --input: 45 90% 85%; --ring: 45 100% 50%; }
  [data-theme="minty-fresh"] { --background: 150 70% 97%; --foreground: 150 50% 25%; --card: 150 70% 100%; --card-foreground: 150 50% 25%; --primary: 150 55% 50%; --primary-foreground: 150 70% 97%; --secondary: 150 60% 92%; --secondary-foreground: 150 50% 25%; --muted: 150 60% 92%; --muted-foreground: 150 50% 50%; --accent: 170 60% 60%; --accent-foreground: 150 50% 25%; --border: 150 60% 88%; --input: 150 60% 88%; --ring: 150 55% 50%; }
  [data-theme="coral"] { --background: 10 100% 97%; --foreground: 10 80% 30%; --card: 10 100% 100%; --card-foreground: 10 80% 30%; --primary: 10 90% 65%; --primary-foreground: 10 80% 15%; --secondary: 10 90% 94%; --secondary-foreground: 10 80% 30%; --muted: 10 90% 94%; --muted-foreground: 10 80% 50%; --accent: 350 90% 70%; --accent-foreground: 10 80% 30%; --border: 10 90% 90%; --input: 10 90% 90%; --ring: 10 90% 65%; }
  [data-theme="sunrise-orange"] { --background: 30 100% 97%; --foreground: 25 80% 30%; --card: 30 100% 99%; --card-foreground: 25 80% 30%; --primary: 25 90% 60%; --primary-foreground: 25 80% 10%; --secondary: 30 100% 92%; --secondary-foreground: 25 80% 30%; --muted: 30 100% 92%; --muted-foreground: 25 80% 50%; --accent: 15 95% 65%; --accent-foreground: 25 80% 30%; --border: 30 100% 88%; --input: 30 100% 88%; --ring: 25 90% 60%; }
  [data-theme="bubblegum"] { --background: 330 80% 98%; --foreground: 330 80% 30%; --card: 330 80% 100%; --card-foreground: 330 80% 30%; --primary: 330 80% 60%; --primary-foreground: 330 80% 98%; --secondary: 330 80% 94%; --secondary-foreground: 330 80% 30%; --muted: 330 80% 94%; --muted-foreground: 330 80% 50%; --accent: 280 80% 70%; --accent-foreground: 330 80% 98%; --border: 330 80% 90%; --input: 330 80% 90%; --ring: 330 80% 60%; }
  [data-theme="gothic"] { --background: 0 0% 9%; --foreground: 0 0% 85%; --card: 0 0% 12%; --card-foreground: 0 0% 85%; --primary: 0 0% 60%; --primary-foreground: 0 0% 9%; --secondary: 0 0% 20%; --secondary-foreground: 0 0% 85%; --muted: 0 0% 20%; --muted-foreground: 0 0% 70%; --accent: 0 70% 50%; --accent-foreground: 0 0% 9%; --border: 0 0% 25%; --input: 0 0% 25%; --ring: 0 0% 60%; }
  [data-theme="rose-gold"] { --background: 25 80% 96%; --foreground: 25 50% 30%; --card: 25 80% 100%; --card-foreground: 25 50% 30%; --primary: 350 70% 75%; --primary-foreground: 25 50% 15%; --secondary: 25 70% 92%; --secondary-foreground: 25 50% 30%; --muted: 25 70% 92%; --muted-foreground: 25 50% 50%; --accent: 30 80% 80%; --accent-foreground: 25 50% 30%; --border: 25 70% 88%; --input: 25 70% 88%; --ring: 350 70% 75%; }
  [data-theme="vintage-paper"] { --background: 30 20% 97%; --foreground: 30 10% 30%; --card: 30 20% 100%; --card-foreground: 30 10% 30%; --primary: 30 15% 55%; --primary-foreground: 30 20% 97%; --secondary: 30 10% 90%; --secondary-foreground: 30 10% 30%; --muted: 30 10% 90%; --muted-foreground: 30 10% 50%; --accent: 40 20% 65%; --accent-foreground: 30 10% 30%; --border: 30 10% 85%; --input: 30 10% 85%; --ring: 30 15% 55%; }
  [data-theme="deep-space"] { --background: 220 90% 5%; --foreground: 220 80% 90%; --card: 220 90% 8%; --card-foreground: 220 80% 90%; --primary: 220 90% 60%; --primary-foreground: 220 80% 5%; --secondary: 220 90% 15%; --secondary-foreground: 220 80% 90%; --muted: 220 90% 15%; --muted-foreground: 220 80% 60%; --accent: 260 90% 70%; --accent-foreground: 220 90% 5%; --border: 220 90% 20%; --input: 220 90% 20%; --ring: 220 90% 60%; }
  [data-theme="nordic-blue"] { --background: 210 25% 15%; --foreground: 210 30% 90%; --primary: 200 80% 75%; --primary-foreground: 210 25% 15%; --secondary: 210 25% 25%; --secondary-foreground: 210 30% 90%; --muted: 210 25% 25%; --muted-foreground: 210 30% 70%; --accent: 200 80% 75%; --accent-foreground: 210 25% 15%; --border: 210 25% 35%; --input: 210 25% 35%; --ring: 200 80% 75%; }
  [data-theme="teal"] { --background: 180 50% 96%; --foreground: 180 70% 20%; --card: 180 50% 100%; --card-foreground: 180 70% 20%; --primary: 180 60% 40%; --primary-foreground: 180 50% 96%; --secondary: 180 50% 90%; --secondary-foreground: 180 70% 20%; --muted: 180 50% 90%; --muted-foreground: 180 70% 50%; --accent: 170 70% 50%; --accent-foreground: 180 70% 20%; --border: 180 50% 85%; --input: 180 50% 85%; --ring: 180 60% 40%; }
  [data-theme="beach-vibes"] { --background: 45 100% 96%; --foreground: 35 80% 30%; --card: 45 100% 98%; --card-foreground: 35 80% 30%; --primary: 200 90% 55%; --primary-foreground: 35 80% 10%; --secondary: 45 100% 90%; --secondary-foreground: 35 80% 30%; --muted: 45 100% 90%; --muted-foreground: 35 80% 50%; --accent: 25 95% 65%; --accent-foreground: 35 80% 30%; --border: 45 100% 85%; --input: 45 100% 85%; --ring: 200 90% 55%; }
  
  [data-theme="custom"] {
    --background: transparent;
    background-image: linear-gradient(to bottom, var(--background-gradient-from, #FFFFFF), var(--background-gradient-to, #AAAAAA));
    --foreground: #111827;
    --card: transparent;
    --card-foreground: #111827;
    --popover: #FFFFFF;
    --popover-foreground: #111827;
    --primary: var(--btn-gradient-to, #AAAAAA);
    --primary-foreground: #FFFFFF;
    --secondary: #FFFFFF30;
    --secondary-foreground: #111827;
    --muted: #FFFFFF50;
    --muted-foreground: #374151;
    --accent: #FFFFFF80;
    --accent-foreground: #111827;
    --border: #E5E7EB;
    --input: #E5E7EB;
    --ring: var(--btn-gradient-to, #AAAAAA);
  }

}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* ------------------------------ */
/* ----- Button Style Logic ----- */
/* ------------------------------ */

/* Default Gradient Style */
[data-style="gradient"] .link-button {
    background-image: linear-gradient(to right, hsl(var(--secondary)), hsl(var(--primary)));
    border: none;
    color: hsl(var(--primary-foreground));
}

/* Custom Solid Button Styles for Specific Themes */
[data-style="solid"][data-theme="gradient-sunset"] .link-button {
  background-image: linear-gradient(to right, hsl(340, 90%, 60%), hsl(20, 95%, 60%));
  color: #fff;
  border: none;
}
[data-style="solid"][data-theme="retro-wave"] .link-button {
  background-image: linear-gradient(to right, #f86cf5, #64d8f8);
  color: #000;
  border: none;
}
[data-style="solid"][data-theme="amethyst"] .link-button {
  background-color: hsl(270 80% 80% / 0.8);
  color: #fff;
  border-color: hsl(270 80% 80% / 0.5);
  text-shadow: 0 1px 2px #00000050;
}
[data-style="solid"][data-theme="nordic-blue"] .link-button {
  background-color: hsl(200 80% 75%);
  color: hsl(210 25% 15%);
  border-color: hsl(200 80% 85%);
}
[data-style="solid"][data-theme="copper"] .link-button {
  background-image: linear-gradient(to right, #da8a67, #a96e56);
  color: #fff;
  border: 1px solid #ffffff30;
}

[data-theme="custom"][data-style="gradient"] .link-button {
    background-image: linear-gradient(to right, var(--btn-gradient-from), var(--btn-gradient-to));
    border: none;
}

/* This is needed for the main page background to be transparent when a custom gradient is active */
[data-theme="custom"] > .bg-background {
    background-color: transparent;
}
`;


// ---------- Helper Components ----------
const SocialIcon = ({ platform }: { platform: string }) => {
  switch (platform.toLowerCase()) {
    case 'email': return <Mail className="h-6 w-6" />;
    case 'instagram': return <Instagram className="h-6 w-6" />;
    case 'facebook': return <Facebook className="h-6 w-6" />;
    case 'github': return <Github className="h-6 w-6" />;
    case 'linkedin': return <Linkedin className="h-6 w-6" />;
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
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 fill-current">
        <title>Solana</title>
        <path d="M4.236.427a.6.6 0 00-.532.127.6.6 0 00-.28.49v4.54a.6.6 0 00.28.491.6.6 0 00.532.127l4.54-1.12a.6.6 0 00.49-.28.6.6 0 00.128-.533V-.001a.6.6 0 00-.128-.532.6.6 0 00-.49-.28L4.236.427zm10.02 6.046a.6.6 0 00-.532.127a.6.6 0 00-.28.491v4.54a.6.6 0 00.28.49.6.6 0 00.532.128l4.54-1.12a.6.6 0 00.49-.28.6.6 0 00.128-.532V5.76a.6.6 0 00-.128-.532.6.6 0 00-.49-.28l-4.54 1.12zm-4.383 6.64a.6.6 0 00-.532.127a.6.6 0 00-.28.49v4.54a.6.6 0 00.28.491.6.6 0 00.532.127l4.54-1.12a.6.6 0 00.49-.28.6.6 0 00.128-.533v-4.54a.6.6 0 00-.128-.532.6.6 0 00-.49-.28l-4.54 1.12z" />
    </svg>
);


const CryptoLog = ({ icon, name, address, linkId }: { icon: React.ReactNode, name: string, address: string, linkId: string }) => (
  <div data-cryptolog-id={linkId} className="flex items-center justify-between gap-4 text-sm font-mono">
    <div className="flex items-center gap-2 text-muted-foreground shrink-0">
      {icon}
      <span className="font-sans font-medium text-foreground">{name}</span>
    </div>
    <p className="overflow-hidden truncate text-muted-foreground">{address}</p>
    <button className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
      <ClipboardCopy className="h-4 w-4" />
    </button>
  </div>
);

const SupportLinks = ({ links }: { links: LinkType[] }) => {
    const bmcLink = links.find(l => l.title === 'Buy Me A Coffee');
    const etLink = links.find(l => l.title === 'E-Transfer');
    const btcLink = links.find(l => l.title === 'BTC');
    const ethLink = links.find(l => l.title === 'ETH');
    const solLink = links.find(l => l.title === 'SOL');
    const hasCrypto = btcLink || ethLink || solLink;

    if (!bmcLink && !etLink && !hasCrypto) {
        return null;
    }

    return (
        <div className="mt-6 w-full max-w-md mx-auto">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground text-center mb-3">Support Me</h3>
            <div className="grid grid-cols-1 gap-3">
                {bmcLink && (
                    <a href={bmcLink.url} target="_blank" rel="noopener noreferrer" data-link-id={bmcLink.id}
                    className="w-full text-center bg-yellow-400 text-black font-semibold p-3 rounded-lg shadow-sm flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                        <Coffee className="h-5 w-5" /> Buy Me a Coffee
                    </a>
                )}
                {etLink && (
                    <button data-etransfer-id={etLink.id}
                    className="w-full text-center bg-secondary text-secondary-foreground font-semibold p-3 rounded-lg shadow-sm flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                         <Banknote className="h-5 w-5" />
                         <span>E-Transfer</span>
                    </button>
                )}
                {hasCrypto && (
                    <div className="bg-muted/50 rounded-lg p-3 space-y-3 font-mono text-sm">
                        <p className="text-xs text-muted-foreground font-sans text-center">CRYPTO LOGS</p>
                        {btcLink && <CryptoLog icon={<Bitcoin className="h-5 w-5 shrink-0" />} name="BTC" address={btcLink.url} linkId={btcLink.id} />}
                        {ethLink && <CryptoLog icon={<EthIcon />} name="ETH" address={ethLink.url} linkId={ethLink.id} />}
                        {solLink && <CryptoLog icon={<SolIcon />} name="SOL" address={solLink.url} linkId={solLink.id} />}
                    </div>
                )}
            </div>
        </div>
    );
};

// This is a self-contained layout component that mirrors the logic of PublicProfilePreview
// It correctly handles applying preset theme attributes and custom gradient styles.
const ProfileLayout = ({ user, links }: { user: UserProfile, links: LinkType[]}) => {
  const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).join('');

  const socialLinks = links.filter(l => l.isSocial);
  const supportLinks = links.filter(l => l.isSupport);
  const regularLinks = links.filter(l => !l.isSocial && !l.isSupport);

  const customStyles: React.CSSProperties = {};
  if (user.theme === 'custom') {
    if (user.customThemeGradient?.from && user.customThemeGradient?.to) {
      (customStyles as any)['--background-gradient-from'] = user.customThemeGradient.from;
      (customStyles as any)['--background-gradient-to'] = user.customThemeGradient.to;
    }
    if (user.customButtonGradient?.from && user.customButtonGradient?.to) {
      (customStyles as any)['--btn-gradient-from'] = user.customButtonGradient.from;
      (customStyles as any)['--btn-gradient-to'] = user.customButtonGradient.to;
    }
  }

  return (
    <div
      id="root"
      data-theme={user.theme || 'light'}
      data-style={user.buttonStyle || 'solid'}
      className="relative flex flex-col bg-background h-full"
      style={customStyles}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
          {user.animatedBackground && <AnimatedBackground />}
      </div>
      <div style={{ position: 'relative', zIndex: 10, flexGrow: 1, overflowY: 'auto', backgroundColor: 'transparent' }} className="w-full flex flex-col items-center pt-12 text-center p-4">
          <Avatar className="h-24 w-24 border-2 border-white/50">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName} />
              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold mt-3 text-foreground">{user.displayName}</h1>
          <p className="text-md text-muted-foreground">@{user.username}</p>
          <p className="mt-2 text-sm max-w-xs text-foreground/80">{user.bio}</p>
          
          <div className="flex gap-4 justify-center mt-3 text-foreground/80">
            {socialLinks.map(link => (
              <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.id} data-link-id={link.id} aria-label={`My ${link.title}`} className="hover:text-primary transition-colors">
                <SocialIcon platform={link.title} />
              </a>
            ))}
          </div>

          <div className="mt-6 space-y-3 w-full max-w-xs mx-auto">
            {regularLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                data-link-id={link.id}
                className={cn(
                  "block w-full text-center bg-secondary text-secondary-foreground font-semibold p-4 rounded-lg shadow-md transition-transform transform hover:scale-105 active:scale-[0.98] truncate",
                  "link-button"
                )}
              >
                {link.title}
              </a>
            ))}
          </div>
          
          <SupportLinks links={supportLinks} />
      </div>
      <footer className="w-full text-center py-4 shrink-0 text-foreground relative z-10">
        <a href="/" target="_blank" rel="noopener noreferrer"><Logo /></a>
      </footer>
    </div>
  );
}


// ---------- Main Component ----------
export default function ProfileClientPage({ user, links: serverLinks }: { user: UserProfile; links: LinkType[] }) {
  const [srcDoc, setSrcDoc] = useState('');
  const { toast } = useToast();
  
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        // IMPORTANT: Add origin check in production
        // if (event.origin !== 'https://your-domain.com') return;
        
        const { type, payload } = event.data;

        if (type === 'COPY_TO_CLIPBOARD') {
            navigator.clipboard.writeText(payload.text).then(() => {
                toast({ title: "Copied to clipboard!" });
                if (payload.linkId) {
                    // Clicks for copy actions are tracked via postMessage
                     fetch('/api/clicks', {
                        method: 'POST',
                        body: JSON.stringify({ userId: user.uid, linkId: payload.linkId }),
                        keepalive: true,
                    }).catch(e => console.error("Error tracking copy click:", e));
                }
            }).catch(err => {
                console.error("Failed to copy from parent: ", err);
                toast({ title: "Failed to copy", variant: "destructive" });
            });
        }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast, user.uid]);


  useEffect(() => {
    const toDate = (date: any): Date | null => {
        if (!date) return null;
        if (date instanceof Date) return date;
        if (date instanceof Timestamp) return date.toDate();
        if (typeof date === 'string') return new Date(date);
        return null;
    };

    const now = new Date();
    const activeLinks = serverLinks.filter(link => {
      if (!link.active) return false;
      const startDate = toDate(link.startDate);
      const endDate = toDate(link.endDate);
      if (startDate && now < startDate) return false;
      if (endDate && now > endDate) return false;
      return true;
    });

    const unescapeHtml = (html: string) => {
        if (typeof window === 'undefined' || !html) return html;
        const ta = document.createElement("textarea");
        ta.innerHTML = html;
        return ta.value;
    }
    
    const iframeScript = `
        function trackClick(linkId) {
            const data = { userId: '${user.uid}', linkId };
            try {
                fetch('/api/clicks', {
                    method: 'POST',
                    body: JSON.stringify(data),
                    keepalive: true,
                });
            } catch (e) {
                console.error("Error tracking click from iframe: ", e);
            }
        }
        
        function handleCopy(text, linkId) {
            // The parent window will handle the clipboard and tracking
            window.parent.postMessage({
                type: 'COPY_TO_CLIPBOARD',
                payload: { text, linkId }
            }, '*'); // Use a specific origin in production
        }
    `;

    // Render the ProfileLayout component to a static HTML string.
    let pageContent = ReactDOMServer.renderToStaticMarkup(
      <ProfileLayout user={user} links={activeLinks} />
    );
    
    // Add onclick handlers for tracking clicks.
    // This is done via string replacement on the static HTML.
    pageContent = pageContent.replace(/data-link-id="([^"]+)"/g, (match, linkId) => {
        const link = activeLinks.find(l => l.id === linkId);
        // Exclude support links from this generic tracker; they're handled separately.
        if (link && !link.isSupport) {
            return `${match} onclick="trackClick('${linkId}')"`;
        }
        return match;
    });

    const etLink = activeLinks.find(l => l.isSupport && l.title === 'E-Transfer');
    if (etLink) {
        pageContent = pageContent.replace(`data-etransfer-id="${etLink.id}"`, `data-etransfer-id="${etLink.id}" onclick="handleCopy('${etLink.url.replace('mailto:', '')}', '${etLink.id}')"`);
    }

    activeLinks.filter(l => l.isSupport && ['BTC', 'ETH', 'SOL'].includes(l.title)).forEach(link => {
        pageContent = pageContent.replace(`data-cryptolog-id="${link.id}"`, `data-cryptolog-id="${link.id}" onclick="handleCopy('${link.url}', '${link.id}')"`);
    });

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
            window.addEventListener('load', initBotpress);
        </script>
    ` : '';

    const finalHtml = `
      <html style="height: 100vh; overflow: hidden;">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
          <script src="https://cdn.tailwindcss.com"></script>
          <style>${globalCSS}</style>
          ${embedScript}
        </head>
        <body style="height: 100%; margin: 0; background-color: transparent;">
          ${pageContent}
          <script>
            ${iframeScript}
          </script>
          ${autoOpenScript}
        </body>
      </html>
    `;

    setSrcDoc(finalHtml);

  }, [user, serverLinks, toast]);

  return (
    <div className="relative w-full h-full">
        <iframe
            srcDoc={srcDoc}
            className="absolute inset-0 w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            title={user.displayName}
        />
    </div>
  );
}

    