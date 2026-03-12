
import React from 'react';
import { View, UserRole, StaffMember, SystemConfig, Language } from '../types';
import { translations } from '../translations';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  userRole: UserRole;
  currentUser: StaffMember;
  config: SystemConfig;
  onLanguageChange: (lang: Language) => void;
}

const DefaultLogo = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 fill-brand-primary">
    <path d="M45,35 c0,0,5-10,0-15 c-5,5,0,15,0,15 M55,35 c0,0,5-10,0-15 c-5,5,0,15,0,15 M35,40 h30 v15 c0,10-10,15-15,15 s-15-5-15-15 V40 z M65,45 h5 c5,0,5,10,0,10 h-5 M25,70 c0,0,10,20,50,0 c-20,10-50,0-50,0" />
  </svg>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, userRole, currentUser, config, onLanguageChange }) => {
  const t = translations[config.language];
  
  const menuItems = [
    { id: 'DASHBOARD' as View, icon: 'fa-gauge', label: t.dashboard, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'POS' as View, icon: 'fa-cash-register', label: t.pos, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER] },
    { id: 'CUSTOMER_BOOK' as View, icon: 'fa-book-open', label: t.customer_book, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'INVENTORY' as View, icon: 'fa-boxes-stacked', label: t.inventory, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STORE_KEEPER] },
    { id: 'STAFF' as View, icon: 'fa-users-gear', label: t.staff, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'REPORTS' as View, icon: 'fa-chart-line', label: t.reports, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'FINANCE' as View, icon: 'fa-money-bill-trend-up', label: t.finance, roles: [UserRole.ADMIN] },
    { id: 'SETTINGS' as View, icon: 'fa-cog', label: t.settings, roles: [UserRole.ADMIN] },
  ];

  const allowedItems = menuItems.filter(item => {
    const isRoleAllowed = item.roles.includes(userRole);
    const isModuleEnabled = item.id === 'SETTINGS' || item.id === 'DASHBOARD' || item.id === 'CUSTOMER_BOOK' || config.enabledModules.includes(item.id);
    return isRoleAllowed && isModuleEnabled;
  });

  return (
    <div className="w-64 bg-brand-primary text-white flex flex-col min-h-screen sticky top-0 shadow-2xl z-40">
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 border border-brand-secondary/30 overflow-hidden shrink-0">
          {config.logoUrl ? (
            <img src={config.logoUrl} className="w-full h-full object-cover" alt="Logo" />
          ) : (
            <DefaultLogo />
          )}
        </div>
        <h1 className="text-xl font-playfair tracking-wide uppercase font-black text-white truncate flex-1">{config.name}</h1>
      </div>
      
      <div className="px-6 py-4 flex items-center justify-between">
         <div className="flex gap-2">
            <button 
              onClick={() => onLanguageChange('Somali')}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${config.language === 'Somali' ? 'bg-brand-secondary border-brand-secondary text-white shadow-lg scale-110' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
              title="Af-Soomaali"
            >
              SO
            </button>
            <button 
              onClick={() => onLanguageChange('English')}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${config.language === 'English' ? 'bg-brand-secondary border-brand-secondary text-white shadow-lg scale-110' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
              title="English"
            >
              EN
            </button>
         </div>
         <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{config.language}</span>
      </div>

      <nav className="flex-1 mt-2 px-4 space-y-1 overflow-y-auto no-scrollbar">
        {allowedItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 ${
              currentView === item.id 
                ? 'bg-brand-secondary text-white shadow-xl scale-105' 
                : 'text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${currentView === item.id ? 'bg-white/20' : 'bg-transparent'}`}>
              <i className={`fas ${item.icon} text-sm`}></i>
            </div>
            <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="flex items-center justify-center gap-2 py-2 px-4 bg-black/20 rounded-xl border border-white/5">
           <div className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
           <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Database: Connected</span>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-white/10 rounded-2xl border border-white/5 backdrop-blur-sm">
          <img src={currentUser.image || `https://i.pravatar.cc/150?u=${currentUser.id}`} alt="Avatar" className="w-10 h-10 rounded-xl bg-white/20 object-cover" />
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate">{currentUser.name}</p>
            <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
               <p className="text-[9px] text-white/50 uppercase font-bold tracking-wider">{currentUser.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
