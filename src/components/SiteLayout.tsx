'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingMapButton from '@/components/FloatingMapButton';

interface SiteLayoutProps {
  children: React.ReactNode;
}

export default function SiteLayout({ children }: SiteLayoutProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return <main className="flex-1 w-full min-h-screen">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-[56px] pb-[calc(64px+env(safe-area-inset-bottom,0px)+1.5rem)] md:pt-[68px] md:pb-6">
        {children}
      </main>
      <Footer />
      <FloatingMapButton />
    </>
  );
}
