import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-black border-t border-zinc-800/80 py-10 px-4 lg:px-8 mt-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        
        {/* Brand Info */}
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
            <Image
              src="/images/Profile.png"
              alt="Logo"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-wide">ASYNC DEVELOPMENT</span>
            <p className="text-xs text-zinc-400">Developer Tools & Automation Platform</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-6 text-xs text-zinc-400 font-medium">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/generator" className="hover:text-white transition-colors">Generator</Link>
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
        </div>

        {/* Copyright */}
        <div className="text-xs text-zinc-500 flex items-center gap-1">
          <span>Built for</span>
          <span className="text-zinc-400 font-medium">ASYNC DEVELOPMENT</span>
          <span>© {new Date().getFullYear()}</span>
        </div>

      </div>
    </footer>
  );
}
