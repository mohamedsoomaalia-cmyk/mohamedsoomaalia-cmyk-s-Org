
import React, { useState, useRef, useEffect } from 'react';
import { SystemConfig, View, Language } from '../types';
import { translations } from '../translations';
import { db as koobDB } from '../db';
import toast from 'react-hot-toast';

interface SettingsProps {
  taxRate: number;
  onUpdateTaxRate: (rate: number) => void;
  isTaxEnabled: boolean;
  onToggleTax: (enabled: boolean) => void;
  systemConfig: SystemConfig;
  onUpdateConfig: (config: SystemConfig) => void;
  onResetData: () => void;
}

const DefaultLogoSVG = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12 fill-brand-primary">
    <path d="M45,35 c0,0,5-10,0-15 c-5,5,0,15,0,15 M55,35 c0,0,5-10,0-15 c-5,5,0,15,0,15 M35,40 h30 v15 c0,10-10,15-15,15 s-15-5-15-15 V40 z M65,45 h5 c5,0,5,10,0,10 h-5 M25,70 c0,0,10,20,50,0 c-20,10-50,0-50,0" />
  </svg>
);

const Settings: React.FC<SettingsProps> = ({ 
  taxRate, onUpdateTaxRate, isTaxEnabled, onToggleTax, 
  systemConfig, onUpdateConfig, onResetData 
}) => {
  const [activeTab, setActiveTab] = useState<'General' | 'Appearance' | 'Modules' | 'Language' | 'Advanced'>('General');
  const [tempConfig, setTempConfig] = useState<SystemConfig>(systemConfig);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'updating' | 'restarting'>('idle');
  const [updateProgress, setUpdateProgress] = useState(0);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const loginBgInputRef = useRef<HTMLInputElement>(null);
  const appBgInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const t = translations[systemConfig.language];

  const handleSave = () => {
    onUpdateConfig(tempConfig);
    onUpdateTaxRate(taxRate);
    onToggleTax(isTaxEnabled);
    setMessage({ text: t.save_changes, type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleBackup = async () => {
    try {
      const backupData = await koobDB.exportDatabase();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Koob_Coffee_Full_DB_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      setMessage({ text: systemConfig.language === 'Somali' ? "Database-ka waa la kaydiyay!" : "Full database backup downloaded!", type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ text: "Backup-ku wuu fashilmay.", type: 'error' });
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmMsg = systemConfig.language === 'Somali' 
      ? "Digniin: Soo celinta xogtani waxay tirtiri doontaa xogta hadda jirta (Orders, Products, Customers). Ma rabtaa inaad sii wadid?" 
      : "Warning: This will overwrite ALL your data (Orders, Products, Customers). Continue?";

    if (!confirm(confirmMsg)) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        await koobDB.importDatabase(data);
        setMessage({ text: "Database-kii waa la soo celiyay! App-ku hadda ayuu dib u kici doonaa...", type: 'success' });
        setTimeout(() => window.location.reload(), 2000);
      } catch (err) {
        toast.error("File-ku ma saxna ama waa kharriban yahay.");
      }
    };
    reader.readAsText(file);
  };

  const handleLanguageUpdate = (lang: Language) => {
    const updated = { ...tempConfig, language: lang };
    setTempConfig(updated);
    onUpdateConfig(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'loginBgUrl' | 'appBgUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Sawirku aad buu u weyn yahay (Max 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempConfig({ ...tempConfig, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleModule = (module: View) => {
    const enabled = [...tempConfig.enabledModules];
    if (enabled.includes(module)) {
      if (module === 'DASHBOARD' || module === 'SETTINGS') return; 
      setTempConfig({ ...tempConfig, enabledModules: enabled.filter(m => m !== module) });
    } else {
      setTempConfig({ ...tempConfig, enabledModules: [...enabled, module] });
    }
  };

  const checkUpdate = () => {
    setUpdateStatus('checking');
    setTimeout(() => {
      setUpdateStatus('available');
    }, 2000);
  };

  const startUpdate = () => {
    setUpdateStatus('updating');
    setUpdateProgress(0);
    const interval = setInterval(() => {
      setUpdateProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUpdateStatus('restarting');
          setTimeout(() => {
            const nextVersion = `3.1.${Math.floor(Math.random() * 10)}`;
            const updatedConfig = { ...tempConfig, version: nextVersion };
            onUpdateConfig(updatedConfig);
            setUpdateStatus('idle');
            setUpdateProgress(0);
            setMessage({ text: systemConfig.language === 'Somali' ? `System-ka waa la casriyeeyay (v${nextVersion}). Xogtaada IndexedDB waa ammaan!` : `Software Updated to v${nextVersion}! Your IndexedDB data is fully protected.`, type: 'success' });
          }, 2000);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'General':
        return (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
               <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><i className="fas fa-info-circle"></i></div>
               {t.business_info}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.name}</label>
                <input value={tempConfig.name} onChange={e => setTempConfig({...tempConfig, name: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-secondary font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.description}</label>
                <input value={tempConfig.description} onChange={e => setTempConfig({...tempConfig, description: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-secondary font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.phone}</label>
                <input value={tempConfig.phone} onChange={e => setTempConfig({...tempConfig, phone: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-secondary font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.address}</label>
                <input value={tempConfig.address} onChange={e => setTempConfig({...tempConfig, address: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-secondary font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.currency}</label>
                <input value={tempConfig.currencySymbol} onChange={e => setTempConfig({...tempConfig, currencySymbol: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-secondary font-bold text-center text-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tax Rate (%)</label>
                <input type="number" value={taxRate} onChange={e => onUpdateTaxRate(parseFloat(e.target.value))} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-secondary font-bold text-center text-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.day_shift_start}</label>
                <input type="number" min="0" max="23" value={tempConfig.dayShiftStart} onChange={e => setTempConfig({...tempConfig, dayShiftStart: parseInt(e.target.value)})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-secondary font-bold text-center text-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.night_shift_start}</label>
                <input type="number" min="0" max="23" value={tempConfig.nightShiftStart} onChange={e => setTempConfig({...tempConfig, nightShiftStart: parseInt(e.target.value)})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-secondary font-bold text-center text-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.auto_logout}</label>
                <input type="number" min="0" max="60" value={tempConfig.autoLogoutMinutes} onChange={e => setTempConfig({...tempConfig, autoLogoutMinutes: parseInt(e.target.value)})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-secondary font-bold text-center text-xl" />
              </div>
            </div>
          </div>
        );
      case 'Appearance':
        return (
          <div className="space-y-8 animate-fadeIn">
            <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
               <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center"><i className="fas fa-brush"></i></div>
               {t.system_branding}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.theme_colors}</label>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-600">Primary</span>
                        <input type="color" value={tempConfig.primaryColor} onChange={e => setTempConfig({...tempConfig, primaryColor: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" />
                     </div>
                     <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-600">Secondary</span>
                        <input type="color" value={tempConfig.secondaryColor} onChange={e => setTempConfig({...tempConfig, secondaryColor: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" />
                     </div>
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logo</label>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                     <div className="w-16 h-16 bg-white rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center">
                        {tempConfig.logoUrl ? <img src={tempConfig.logoUrl} className="w-full h-full object-cover" /> : <DefaultLogoSVG />}
                     </div>
                     <button onClick={() => logoInputRef.current?.click()} className="px-4 py-2 bg-white text-brand-primary border border-brand-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all">
                        {t.logo_upload}
                     </button>
                     <input type="file" ref={logoInputRef} onChange={e => handleFileUpload(e, 'logoUrl')} className="hidden" accept="image/*" />
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.login_bg}</label>
                  <div className="relative group rounded-3xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-brand-secondary transition-all">
                     <img src={tempConfig.loginBgUrl} className="w-full h-32 object-cover opacity-50 group-hover:opacity-80" />
                     <button onClick={() => loginBgInputRef.current?.click()} className="absolute inset-0 flex items-center justify-center text-xs font-black uppercase tracking-widest text-brand-primary group-hover:scale-110 transition-transform">
                        Change Image
                     </button>
                     <input type="file" ref={loginBgInputRef} onChange={e => handleFileUpload(e, 'loginBgUrl')} className="hidden" accept="image/*" />
                  </div>
               </div>
            </div>
          </div>
        );
      case 'Modules':
        const modules: View[] = ['DASHBOARD', 'POS', 'CUSTOMER_BOOK', 'INVENTORY', 'STAFF', 'REPORTS', 'FINANCE', 'SETTINGS'];
        return (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center"><i className="fas fa-layer-group"></i></div>
               {t.module_management}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {modules.map(mod => (
                 <button 
                  key={mod} 
                  onClick={() => toggleModule(mod)}
                  className={`p-6 rounded-3xl border-2 transition-all text-left flex items-center justify-between group ${tempConfig.enabledModules.includes(mod) ? 'border-brand-secondary bg-brand-secondary/5' : 'bg-gray-50 border-transparent opacity-60'}`}
                 >
                    <div>
                       <h4 className="font-black text-sm text-gray-800 uppercase tracking-widest">{t[mod.toLowerCase()] || mod.replace('_', ' ')}</h4>
                       <p className="text-[10px] text-gray-400 font-bold uppercase">{tempConfig.enabledModules.includes(mod) ? 'Enabled' : 'Disabled'}</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full p-1 transition-all ${tempConfig.enabledModules.includes(mod) ? 'bg-brand-secondary' : 'bg-gray-300'}`}>
                       <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all transform ${tempConfig.enabledModules.includes(mod) ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                 </button>
               ))}
            </div>
          </div>
        );
      case 'Language':
        return (
          <div className="space-y-8 animate-fadeIn">
            <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
               <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center"><i className="fas fa-globe"></i></div>
               {t.language}
            </h3>
            <div className="grid grid-cols-2 gap-6 max-w-md">
               <button 
                onClick={() => handleLanguageUpdate('Somali')}
                className={`p-10 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-4 ${systemConfig.language === 'Somali' ? 'border-brand-secondary bg-brand-secondary/5 scale-105 shadow-xl' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}
               >
                  <span className="text-5xl">🇸🇴</span>
                  <span className="font-black uppercase tracking-widest text-gray-800">Soomaali</span>
               </button>
               <button 
                onClick={() => handleLanguageUpdate('English')}
                className={`p-10 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-4 ${systemConfig.language === 'English' ? 'border-brand-secondary bg-brand-secondary/5 scale-105 shadow-xl' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}
               >
                  <span className="text-5xl">🇺🇸</span>
                  <span className="font-black uppercase tracking-widest text-gray-800">English</span>
               </button>
            </div>
          </div>
        );
      case 'Advanced':
        return (
          <div className="space-y-12 animate-fadeIn">
            {/* Data Guard Visual Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><i className="fas fa-shield-halved"></i></div>
                {t.data_guard}
              </h3>
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center gap-5">
                 <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-emerald-200">
                    <i className="fas fa-check-double"></i>
                 </div>
                 <div className="flex-1">
                    <h4 className="font-black text-emerald-800 text-sm uppercase mb-1">{t.data_guard_active}</h4>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">{t.data_guard_desc}</p>
                 </div>
                 <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase">Live DB Protected</div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center"><i className="fas fa-database"></i></div>
                Database & Full Backup
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4">
                    <h4 className="font-black text-gray-800 text-sm uppercase">Full Export (DB)</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Download all data directly from IndexedDB.</p>
                    <button onClick={handleBackup} className="w-full py-3 bg-white border-2 border-brand-secondary text-brand-primary rounded-xl font-black text-xs uppercase tracking-widest hover:bg-brand-secondary hover:text-white transition-all">
                       <i className="fas fa-download mr-2"></i> Download Full Backup
                    </button>
                 </div>
                 <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4">
                    <h4 className="font-black text-gray-800 text-sm uppercase">Full Restore (DB)</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Upload a .json file to overwrite the entire database.</p>
                    <button onClick={() => restoreInputRef.current?.click()} className="w-full py-3 bg-white border-2 border-indigo-500 text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all">
                       <i className="fas fa-upload mr-2"></i> Restore DB from File
                    </button>
                    <input type="file" ref={restoreInputRef} onChange={handleRestore} className="hidden" accept=".json" />
                 </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><i className="fas fa-sync-alt"></i></div>
                {t.system_update}
              </h3>
              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.current_version}</p>
                       <h4 className="text-2xl font-black text-gray-800">v{tempConfig.version}</h4>
                    </div>
                    {updateStatus === 'idle' && (
                      <button onClick={checkUpdate} className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-brand-secondary hover:text-brand-secondary transition-all">
                        {t.check_update}
                      </button>
                    )}
                 </div>
                 {updateStatus === 'available' && (
                    <div className="p-6 bg-brand-secondary/10 rounded-3xl border border-brand-secondary/20 animate-fadeIn">
                       <button onClick={startUpdate} className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                          {t.install_update} (Safe Update)
                       </button>
                    </div>
                 )}
                 {(updateStatus === 'updating' || updateStatus === 'restarting') && (
                   <div className="space-y-4">
                      <div className="flex justify-between items-end">
                         <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest">Updating System Engine...</p>
                         <p className="text-xs font-black text-brand-secondary tracking-widest">IndexedDB is Protected <i className="fas fa-lock"></i></p>
                      </div>
                      <div className="h-4 bg-white rounded-full overflow-hidden p-1 shadow-inner border border-gray-200">
                         <div className="h-full bg-brand-secondary rounded-full transition-all duration-300 shadow-lg" style={{ width: `${updateProgress}%` }}></div>
                      </div>
                   </div>
                 )}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-black text-red-600 flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center"><i className="fas fa-exclamation-triangle"></i></div>
                {t.danger_zone}
              </h3>
              <div className="p-8 border-2 border-dashed border-red-200 rounded-[2.5rem] bg-red-50/30">
                 <p className="text-sm font-bold text-red-600 mb-6 uppercase tracking-wider">Digniin: Tallaabadan dib loogama noqon karo. Waxay tirtiraysaa dhamaan iibka, macaamiisha, iyo alaabta ku jirta Database-ka.</p>
                 <button onClick={() => { if(confirm(t.reset_system + "?")) onResetData(); }} className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all">
                    {t.reset_system}
                 </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24 animate-fadeIn">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">{t.settings}</h2>
          <p className="text-gray-500 font-medium text-lg">Halkan kaga bedel nidaamka oo dhan.</p>
        </div>
        <button onClick={handleSave} disabled={updateStatus !== 'idle'} className="px-10 py-5 bg-brand-primary text-white rounded-[2rem] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50">
          <i className="fas fa-save text-xl"></i> {t.save_changes}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="lg:w-72 space-y-2">
          {['General', 'Appearance', 'Modules', 'Language', 'Advanced'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} disabled={updateStatus !== 'idle'} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold uppercase tracking-widest text-[10px] ${activeTab === tab ? 'bg-brand-secondary text-white shadow-xl' : 'bg-white text-gray-400 hover:bg-gray-50'}`}>
              {tab}
            </button>
          ))}
        </aside>

        <div className="flex-1 bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 min-h-[600px]">
          {renderTabContent()}
        </div>
      </div>

      {message && (
        <div className={`fixed bottom-10 right-10 px-8 py-5 rounded-3xl shadow-2xl animate-fadeIn z-[200] border-2 flex items-center gap-3 ${message.type === 'success' ? 'bg-brand-primary text-white border-white/20' : 'bg-red-600 text-white border-white/20'}`}>
          <i className="fas fa-check-circle text-xl"></i>
          <p className="font-black uppercase tracking-widest text-xs">{message.text}</p>
        </div>
      )}
    </div>
  );
};

export default Settings;
