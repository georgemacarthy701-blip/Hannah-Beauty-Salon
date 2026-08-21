import { Settings, Shield, ToggleLeft, Save } from 'lucide-react'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-emerald-500" />
          System Settings
        </h1>
        <p className="text-sm text-zinc-500">Configure global settings, thresholds, and security parameters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Verification Settings */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 space-y-4">
          <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-emerald-500" />
            Moderation & Verifications
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-zinc-700 dark:text-zinc-300">Auto-verify Professionals</p>
                <span className="text-[10px] text-zinc-400">Instantly grant badges upon phone confirmation.</span>
              </div>
              <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4" />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-zinc-700 dark:text-zinc-300">Auto-suspend Abusive Profiles</p>
                <span className="text-[10px] text-zinc-400">Suspend automatically when flagged more than 5 times.</span>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Global Limits */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 space-y-4">
          <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
            <ToggleLeft className="h-4 w-4 text-emerald-500" />
            Marketplace Parameter Configuration
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-zinc-500 mb-1">Listing Expiry Threshold (Days)</label>
              <input
                type="number"
                defaultValue={30}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 text-xs text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">Max Daily Job Post Limit per Company</label>
              <input
                type="number"
                defaultValue={10}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 text-xs text-zinc-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button className="rounded-xl bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 px-5 py-3 text-xs font-bold text-white shadow flex items-center gap-1.5 transition-colors">
          <Save className="h-4 w-4" />
          Save Configurations
        </button>
      </div>
    </div>
  )
}
