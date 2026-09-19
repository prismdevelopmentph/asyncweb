import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full glass-panel border-t border-purple-500/20 py-10 px-4 lg:px-8 mt-20 relative overflow-hidden">
      <div className="purple-glow-bg top-0 right-1/4 opacity-40"></div>
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        
        {/* Brand Info */}
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-purple-500/30">
            <Image
              src="/images/Profile.png"
              alt="Logo"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <span className="text-sm font-bold purple-gradient-text">ASYNC TAGABASAG</span>
            <p className="text-xs text-purple-400/60">FiveM Asset Recovery & Web Management</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-6 text-xs text-purple-300/80 font-medium">
          <Link href="/" className="hover:text-purple-200 transition-colors">Home</Link>
          <Link href="/dashboard" className="hover:text-purple-200 transition-colors">Dashboard</Link>
        </div>

        {/* Copyright */}
        <div className="text-xs text-purple-400/60 flex items-center gap-1">
          <span>Built with</span>
          <Heart className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
          <span>for ASYNC TAGABASAG © {new Date().getFullYear()}</span>
        </div>

      </div>
    </footer>
  );
}
