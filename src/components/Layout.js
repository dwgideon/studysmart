
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image src="/logo-icon.png" alt="StudySmart Logo" width={32} height={32} />
            <span className="text-xl font-bold">StudySmart</span>
          </div>
          <nav className="hidden md:flex gap-6 font-medium">
            <Link href="/" className="hover:underline">Dashboard</Link>
            <Link href="/flashcards" className="hover:underline">Flashcards</Link>
            <Link href="/quizzes" className="hover:underline">Quizzes</Link>
            <Link href="/games" className="hover:underline">Games</Link>
          </nav>
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <nav className="md:hidden px-4 pb-4 flex flex-col gap-2 font-medium">
            <Link href="/" className="hover:underline">Dashboard</Link>
            <Link href="/flashcards" className="hover:underline">Flashcards</Link>
            <Link href="/quizzes" className="hover:underline">Quizzes</Link>
            <Link href="/games" className="hover:underline">Games</Link>
          </nav>
        )}
      </header>

      <main className="flex-grow bg-white text-gray-900">{children}</main>
    </div>
  );
}

