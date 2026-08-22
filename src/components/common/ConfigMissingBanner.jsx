import React from "react";
import { Database, AlertTriangle, Key, ShieldAlert } from "lucide-react";

export const ConfigMissingBanner = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 select-none">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-amber-200 max-w-lg w-full text-center space-y-6">
        <div className="h-16 w-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <Database className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">Supabase Configuration Required</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The DSC Guidance Admin Web App has been successfully migrated to Supabase. Please specify your Supabase project credentials in your environment setup.
          </p>
        </div>

        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-left space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Add the following variables to your <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono text-amber-900">.env</code> file:</span>
          </div>

          <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs font-mono overflow-x-auto select-all leading-snug">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-publishable-key`}
          </pre>
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          After saving your credentials in <code className="font-mono text-slate-600">.env</code>, restart the Vite server (<code className="font-mono text-slate-600">npm run dev</code>).
        </div>
      </div>
    </div>
  );
};

export default ConfigMissingBanner;
