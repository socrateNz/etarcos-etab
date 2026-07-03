import { Zap } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-[#e5d8c6] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      {/* Central Mockup Device Box */}
      <div className="w-full max-w-[1100px] min-h-[700px] bg-[#0c0c0e] rounded-[36px] border border-white/5 shadow-2xl flex flex-col lg:flex-row p-4 gap-4 overflow-hidden relative">
        
        {/* Left Side Panel - Banner Image & Slogan */}
        <div className="lg:w-[48%] min-h-[350px] lg:min-h-0 rounded-[28px] relative overflow-hidden shrink-0 flex flex-col justify-between p-8 lg:p-10 select-none">
          {/* Background cover image with overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 hover:scale-105"
            style={{ backgroundImage: "url('/auth_banner.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/35 z-0" />

          {/* Logo & Branding */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Zap className="w-4.5 h-4.5 text-[#0c0c0e] fill-[#0c0c0e]" />
            </div>
            <div>
              <span className="text-base font-extrabold text-white tracking-wide">Etarcos</span>
              <span className="text-xs text-amber-400 font-bold ml-1.5 font-mono">Etab</span>
            </div>
          </div>

          {/* Bottom Content / Slogan */}
          <div className="relative z-10 space-y-5">
            {/* Carousel progress bar lines */}
            <div className="flex gap-2 w-32">
              <div className="h-1 w-10 bg-white rounded-full" />
              <div className="h-1 w-10 bg-white/20 rounded-full" />
              <div className="h-1 w-10 bg-white/20 rounded-full" />
            </div>

            <div className="space-y-2.5">
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-[1.15]">
                Pilotez votre école. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">
                  Élevez vos ambitions.
                </span>
              </h1>
              <p className="text-slate-300/80 text-sm leading-relaxed max-w-sm">
                La plateforme académique assistée par IA conçue pour orchestrer la scolarité et propulser votre réussite.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side Panel - Authentication Form Content */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative z-10">
          <div className="w-full max-w-[390px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
