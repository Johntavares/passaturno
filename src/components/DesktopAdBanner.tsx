'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Sparkles, ShieldCheck, Megaphone } from 'lucide-react';

export interface CustomAdProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
}

interface DesktopAdBannerProps {
  adClient?: string;
  adSlot?: string;
  className?: string;
  customAd?: CustomAdProps;
}

export const DesktopAdBanner: React.FC<DesktopAdBannerProps> = ({
  adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-5140224476422289',
  adSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID || '7732833518',
  className = '',
  customAd,
}) => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adEmpty, setAdEmpty] = useState(false);
  const adRef = useRef<HTMLModElement>(null);

  const isValidSlot = adSlot && adSlot.trim() !== '' && adSlot !== 'YYYYYYYYYY';

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileUserAgent = /mobile|android|iphone|ipad|tablet/.test(userAgent);
        const isLargeScreen = window.innerWidth >= 768; // Exibe no desktop e tablets grandes
        setIsDesktop(isLargeScreen && !isMobileUserAgent);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isDesktop && isValidSlot && typeof window !== 'undefined') {
      try {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
        setAdLoaded(true);
      } catch (err) {
        console.warn('[AdSense] Erro ao carregar anúncio:', err);
      }
    }
  }, [isDesktop, isValidSlot]);

  // Se o AdSense não preencher o anúncio em alguns segundos (conta em análise, domínio
  // não aprovado ou bloqueador de anúncios), exibe o card nativo no lugar do espaço vazio.
  useEffect(() => {
    if (!isDesktop || !isValidSlot) return;
    const t = setTimeout(() => {
      const el = adRef.current;
      const filled = el && (el.getAttribute('data-ad-status') === 'filled' || el.querySelector('iframe'));
      if (!filled) setAdEmpty(true);
    }, 4500);
    return () => clearTimeout(t);
  }, [isDesktop, isValidSlot]);

  if (!isDesktop) return null;

  return (
    <div className={`my-6 w-full text-center ${className}`}>
      <div className="max-w-[1200px] mx-auto overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-linear-to-r from-slate-900 via-slate-950 to-blue-950 p-4 text-white shadow-lg transition-all">
        
        {/* Cabeçalho de Identificação do Anúncio */}
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-400/30">
              <Sparkles className="w-3 h-3 text-amber-400" /> Publicidade
            </span>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Espaço Exclusivo de Anúncios
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> ID: {adClient}
            </span>
          </div>
        </div>

        {/* MODO 1: Se houver Slot ID do Google AdSense VÁLIDO configurado E o anúncio veio */}
        {isValidSlot && !adEmpty ? (
          <div className="min-h-[90px] flex items-center justify-center bg-white/5 rounded-xl p-2 border border-white/5">
            <ins
              ref={adRef}
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', minHeight: '90px' }}
              data-ad-client={adClient}
              data-ad-slot={adSlot}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        ) : (
          /* MODO 2: Banner Promocional Nativo / Card de Anúncios (Fallback & Preview) */
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-3 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-3.5 text-left">
              {customAd?.imageUrl ? (
                <img
                  src={customAd.imageUrl}
                  alt={customAd.title || 'Anúncio'}
                  className="h-12 w-12 rounded-xl object-cover shadow-md border border-white/20 shrink-0"
                />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0">
                  <Megaphone className="w-6 h-6 text-blue-400 animate-pulse" />
                </div>
              )}

              <div>
                <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                  {customAd?.title || 'Espaço Reservado para Anúncios Google AdSense'}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                  {customAd?.description || 'Para ativar os anúncios do AdSense em produção, defina o NEXT_PUBLIC_ADSENSE_SLOT_ID no .env com seu Slot ID de Bloco de Anúncios.'}
                </p>
              </div>
            </div>

            {customAd?.buttonUrl ? (
              <a
                href={customAd.buttonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {customAd.buttonText || 'Saiba Mais'} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <div className="shrink-0 text-[11px] font-semibold text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                Pronto para Receber Anúncios
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
