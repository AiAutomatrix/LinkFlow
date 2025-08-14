
"use client";

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Logo from '@/components/logo';
import { useState, useEffect } from 'react';

export default function Home() {
  const [year, setYear] = useState<number | null>(null);

  // This prevents a hydration mismatch. The year is only rendered on the client.
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <div className="relative flex flex-col min-h-screen w-full overflow-hidden bg-gray-900 text-white">
      {/* Animated Blob Background */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-xl opacity-40 animate-blob"></div>
          <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-pink-500 rounded-full mix-blend-screen filter blur-xl opacity-40 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-500 rounded-full mix-blend-screen filter blur-xl opacity-40 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Logo className="text-white" />
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="bg-white text-gray-900 hover:bg-gray-200">
              <Link href="/signup">
                Signup
              </Link>
            </Button>
          </div>
        </header>

        <main className="flex-grow flex items-center">
          <section className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              
              <div className="text-center md:text-left">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-300">
                  One Link to Rule Them All
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto md:mx-0">
                  LinkFlow is the ultimate solution to consolidate all your online content into a single, beautifully designed profile. Share it anywhere, and watch your engagement grow.
                </p>
                <div className="mt-8 flex justify-center md:justify-start">
                  <Button size="lg" asChild className="bg-white text-gray-900 hover:bg-gray-200 shadow-lg transform transition-transform hover:scale-105">
                    <Link href="/signup">
                      Claim Your Username
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="relative w-[350px] h-[700px] bg-black/30 backdrop-blur-md border border-white/20 rounded-3xl p-4 shadow-2xl">
                    <div className="w-full h-full flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4" data-ai-hint="avatar placeholder"></div>
                        <h2 className="text-xl font-bold">@username</h2>
                        <p className="text-sm text-gray-300 mb-8">Your bio goes here. Make it short and sweet!</p>

                        <div className="w-full space-y-4 px-4">
                            <div className="w-full h-14 rounded-lg bg-white/20 animate-pulse"></div>
                            <div className="w-full h-14 rounded-lg bg-white/20 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-full h-14 rounded-lg bg-white/20 animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                    </div>
                </div>
              </div>

            </div>
          </section>
        </main>

        <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-400">
          {/* This now renders null on server and the correct year on client */}
          <div className="h-6">{year && <p>&copy; {year} LinkFlow. All rights reserved.</p>}</div>
        </footer>
      </div>
    </div>
  );
}
