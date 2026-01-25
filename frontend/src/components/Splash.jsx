import { useEffect, useState } from 'react';

export default function Splash() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-white dark:bg-[#101922] text-[#111418] dark:text-white">
      
      <div className="w-full h-12 flex items-center justify-between px-8 pt-4">
        <span className="text-sm font-semibold">9:41</span>
        <div className="flex gap-1 items-center">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
          </svg>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
          </svg>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center flex-grow -mt-20">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#137fec]/5 rounded-full scale-125"></div>
          <div className="relative z-10 w-24 h-24 bg-white dark:bg-[#101922] border-4 border-[#137fec] rounded-2xl flex items-center justify-center shadow-sm">
            <div className="relative flex items-center justify-center">
              <span className="text-[#137fec] text-6xl font-bold leading-none" style={{ fontFamily: 'Lexend, sans-serif' }}>A</span>
              <div className="absolute -bottom-1 flex items-end gap-0.5">
                <div className="w-1 h-3 bg-[#137fec] rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-5 bg-[#137fec] rounded-full animate-pulse" style={{ animationDelay: '100ms' }}></div>
                <div className="w-1 h-7 bg-[#137fec] rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                <div className="w-1 h-4 bg-[#137fec] rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                <div className="w-1 h-6 bg-[#137fec] rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <h1 className="text-2xl font-bold tracking-tight text-[#111418] dark:text-white">Pronounce</h1>
        </div>
      </div>

      <div className="w-full max-w-xs flex flex-col items-center pb-16 px-6">
        <div className="w-full flex flex-col gap-3 mb-10">
          <div className="flex justify-center">
            <p className="text-[#111418] dark:text-white/60 text-xs font-medium uppercase tracking-widest leading-normal">Loading</p>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#f0f2f4] dark:bg-white/10 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#137fec]/60 to-[#137fec] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[#637588] dark:text-white/40 text-sm font-normal leading-relaxed">
            Perfecting your accent...
          </p>
        </div>
      </div>

      <div className="absolute bottom-1.5 w-32 h-1 bg-[#dbe0e6] dark:bg-white/20 rounded-full left-1/2 -translate-x-1/2"></div>
    </div>
  );
}
