import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Logo from '@/components/logo';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
       <div className="absolute inset-0 -z-10 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)]"></div>
       <div
        style={{
          backgroundSize: '200% 200%',
          animation: 'gradient-animation 15s ease infinite',
        }}
        className="absolute inset-0 -z-20 h-full w-full bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500"
      ></div>
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="bg-white text-gray-900 hover:bg-gray-200">
            <Link href="/signup">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-300">
              One Link to Rule Them All
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
              LinkFlow is the ultimate solution to consolidate all your online content into a single, beautifully designed profile. Share it anywhere, and watch your engagement grow.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild className="bg-white text-gray-900 hover:bg-gray-200 shadow-lg transform transition-transform hover:scale-105">
                <Link href="/signup">
                  Claim Your Username
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="relative flex justify-center">
            <Image
              src="https://placehold.co/350x700.png"
              alt="LinkFlow profile preview"
              width={350}
              height={700}
              className="rounded-3xl shadow-2xl z-10 border-4 border-gray-800/50"
              data-ai-hint="mobile phone app"
            />
          </div>
        </section>

        <section className="bg-white/5 py-16 sm:py-24 mt-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold">Why You'll Love LinkFlow</h2>
              <p className="mt-4 text-lg text-gray-400">Everything you need to grow your online presence.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-gray-300">
              <div className="flex flex-col items-center text-center p-6 rounded-lg bg-white/5">
                <CheckCircle className="h-12 w-12 text-pink-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-white">Easy Link Management</h3>
                <p>Add, edit, and reorder your links with a simple and intuitive interface.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-lg bg-white/5">
                <CheckCircle className="h-12 w-12 text-blue-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-white">Customizable Profiles</h3>
                <p>Make your page yours with custom usernames, bios, and profile pictures.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-lg bg-white/5">
                <CheckCircle className="h-12 w-12 text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-white">Powerful Analytics</h3>
                <p>Understand your audience better with detailed click tracking and insights.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} LinkFlow. All rights reserved.</p>
      </footer>
    </div>
  );
}
