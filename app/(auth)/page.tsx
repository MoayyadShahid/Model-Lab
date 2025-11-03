"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Check if user is already logged in
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push('/chat');
      }
    };
    
    checkUser();
  }, [router]);
  
  if (!mounted) return null;
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left side - Main content */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 lg:px-16">
          <div className="max-w-md mx-auto lg:mx-0">
            <div className="flex items-center mb-8">
              <Image src="/logo.png" alt="Model Lab Logo" width={48} height={48} className="rounded-lg" />
              <h1 className="ml-3 text-3xl font-bold text-gray-900">Model Lab</h1>
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Access Every AI Model in One Place
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Connect with OpenAI, Anthropic, and DeepSeek models through a unified experience.
              Try different AI models, save your conversations, and explore what works best.
            </p>
            
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <h3 className="text-xl font-medium text-gray-900 mb-4">Get Started</h3>
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#7A4BE3',
                        brandAccent: '#6A3BD3',
                      },
                    },
                  },
                }}
                providers={['google']}
                redirectTo={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'}/auth/callback`}
                onlyThirdPartyProviders={false}
              />
            </div>
          </div>
        </div>
        
        {/* Right side - Image/Illustration */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#7A4BE3] to-[#9333EA] items-center justify-center p-12">
          <div className="max-w-lg">
            <Image
              src="/placeholder.svg"
              alt="AI Conversation Illustration"
              width={600}
              height={500}
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-50 py-8 px-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Image src="/logo.png" alt="Model Lab Logo" width={32} height={32} className="rounded-lg" />
            <span className="ml-2 text-sm text-gray-600">© 2025 Model Lab. All rights reserved.</span>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Terms</a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Privacy</a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
