import { useTheme } from '../hooks/useTheme';
import { Icons } from '../components/icons';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  
  // Settings mock state
  const [dataDensity, setDataDensity] = useState('comfortable');

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-surface-400 mt-1">Manage your application preferences and account settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar Nav (Settings) */}
        <div className="space-y-1">
          <button className="w-full text-left px-4 py-2.5 rounded-xl bg-primary-500/10 text-primary-400 font-medium text-sm">
            Appearance
          </button>
          <button className="w-full text-left px-4 py-2.5 rounded-xl text-surface-400 hover:bg-primary-500/10 hover:text-primary-400 transition-colors font-medium text-sm">
            Notifications
          </button>
          <button className="w-full text-left px-4 py-2.5 rounded-xl text-surface-400 hover:bg-primary-500/10 hover:text-primary-400 transition-colors font-medium text-sm">
            Account Preferences
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-6">
          
          <section className="glass rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white border-b border-[var(--divider)] pb-4">Appearance</h2>
            
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-surface-200">Theme Preference</h3>
                <p className="text-xs text-surface-400 mt-1">Choose your preferred visual mode.</p>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 px-4 py-2 rounded-xl glass-light text-sm font-medium transition-all hover:scale-[1.02]"
              >
                {theme === 'dark' ? <Icons.Moon className="h-4 w-4 text-primary-400" /> : <Icons.Sun className="h-4 w-4 text-amber-400" />}
                <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
            </div>

            {/* Density */}
            <div className="pt-4 border-t border-[var(--divider)]">
              <h3 className="text-sm font-medium text-surface-200 mb-3">Data Density</h3>
              <div className="flex gap-3">
                {['compact', 'comfortable', 'spacious'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setDataDensity(t)}
                    className={`flex-1 py-2 text-sm font-medium rounded-xl capitalize transition-colors ${
                      dataDensity === t ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30' : 'glass-light text-surface-400 hover:text-surface-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="glass rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white border-b border-[var(--divider)] pb-4">Profile Info</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase mb-1">Name</label>
                <div className="text-sm text-surface-200 glass-light px-3 py-2 rounded-lg">{user?.name}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase mb-1">Role</label>
                <div className="text-sm text-surface-200 glass-light px-3 py-2 rounded-lg">{user?.role}</div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
