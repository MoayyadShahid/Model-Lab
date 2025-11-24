"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function RootPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Check for current session and redirect appropriately
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push('/chat');
      } else {
        router.push('/login');
      }
    };
    
    checkSession();
  }, [router]);
  
  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <Image src="/logo.png" alt="Model Lab Logo" width={96} height={96} className="rounded-xl" priority style={{ width: 'auto', height: 'auto' }} />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">Loading Model Lab</h2>
        <div className="animate-pulse flex space-x-1 justify-center">
          <div className="w-2 h-2 bg-[#7A4BE3] rounded-full"></div>
          <div className="w-2 h-2 bg-[#7A4BE3] rounded-full"></div>
          <div className="w-2 h-2 bg-[#7A4BE3] rounded-full"></div>
        </div>
      </div>
    </div>
  );
}