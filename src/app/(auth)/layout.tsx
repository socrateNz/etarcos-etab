import { Zap } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Central Split-Screen Canvas Card */}
      <div className="w-full max-w-[1080px] min-h-[660px] bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl shadow-indigo-950/20 border border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Left Side Panel - Fluid Gradient Mesh Banner */}
        <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 p-10 lg:p-12 flex-col justify-between select-none shrink-0">
          {/* Ambient Organic Gradient Blobs */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-400/40 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent_70%)]" />

          {/* Logo & Branding */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg shadow-black/10">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-tight">Etarcos</span>
              <span className="text-xs font-semibold text-blue-200 ml-1 font-mono">Etab</span>
            </div>
          </div>

          {/* Hero Slogan Typography */}
          <div className="relative z-10 space-y-4 my-auto pr-4">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white leading-[1.25] tracking-tight">
              Gestion Écolière Intelligente: <br />
              <span className="text-blue-100 font-medium">
                Pilotez vos Établissements avec Précision.
              </span>
            </h1>
            <p className="text-indigo-100/80 text-sm leading-relaxed max-w-sm">
              Automatisez la scolarité, les présences, la comptabilité et les emplois du temps avec la plateforme SaaS assistée par l'IA Gemini.
            </p>
          </div>

          {/* Bottom Footer Note */}
          <div className="relative z-10 flex items-center justify-between text-xs text-indigo-200/70 font-medium">
            <span>SaaS Éducatif & Gestion Multi-Établissements</span>
            <span className="font-mono text-[11px] opacity-75">v2.0</span>
          </div>
        </div>

        {/* Right Side Panel - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 relative z-10 bg-white dark:bg-slate-900">
          <div className="w-full max-w-[380px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
