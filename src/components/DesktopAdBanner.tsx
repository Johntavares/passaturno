'use client';

import React, { useState, useEffect } from 'react';

interface DesktopAdBannerProps {
  adClient?: string;
  adSlot?: string;
  className?: string;
}

export const DesktopAdBanner: React.FC<DesktopAdBannerProps> = ({
  adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-XXXXXXXXXXXXXXXX',
  adSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID || 'YYYYYYYYYY',
  className = '',
}) => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileUserAgent = /mobile|android|iphone|ipad|tablet/.test(userAgent);
        const isLargeScreen = window.innerWidth >= 1024;
        setIsDesktop(isLargeScreen && !isMobileUserAgent);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isDesktop && typeof window !== 'undefined') {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (err) {
        console.warn('Google AdSense error:', err);
      }
    }
  }, [isDesktop]);

  // Se não for dispositivo desktop, não renderiza absolutamente nada (0% de impacto no celular)
  if (!isDesktop) return null;

  return (
    <div className={`hidden lg:block my-4 w-full text-center ${className}`}>
      <div className="max-w-[1200px] mx-auto bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-3 shadow-2xs">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">
          Publicidade (Exibição Exclusiva no Desktop)
        </span>
        
        {/* Bloco Oficial Google AdSense */}
        <ins
          className="adsbygoogle"
          style={{ display: 'block', minHeight: '90px' }}
          data-ad-client={adClient}
          data-ad-slot={adSlot}
          data-ad-format="auto"
          data-full-width-responsive="false"
        />
      </div>
    </div>
  );
};
