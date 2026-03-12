
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Staff from './components/Staff';
import Finance from './components/Finance';
import Settings from './components/Settings';
import Login from './components/Login';
import Reports from './components/Reports';
import CustomerBook from './components/CustomerBook';
import { View, UserRole, Product, StaffMember, Order, Expense, PendingOrder, SystemConfig, Customer, Language, Category, Settlement, StaffLog } from './types';
import { INITIAL_PRODUCTS, INITIAL_STAFF, MOCK_EXPENSES } from './constants';
import { translations } from './translations';
import { db } from './db';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Coffee' },
  { id: 'cat-2', name: 'Tea' },
  { id: 'cat-3', name: 'Snacks' },
  { id: 'cat-4', name: 'Cold Drinks' },
  { id: 'cat-5', name: 'Bakery' }
];

const DEFAULT_CONFIG: SystemConfig = {
  name: 'Koob Coffee',
  description: 'The Best Coffee & Snacks Experience in Mogadishu.',
  primaryColor: '#3d2b1f',
  secondaryColor: '#c6a07d',
  logoUrl: '', 
  loginBgUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80',
  appBgUrl: '',
  currencySymbol: '$',
  address: 'Mogadishu, Somalia',
  phone: '+252 61 XXX XXXX',
  accountNumbers: 'EVC: 61XXXX, Dahab: 12345',
  enabledModules: ['DASHBOARD', 'POS', 'INVENTORY', 'STAFF', 'REPORTS', 'FINANCE', 'SETTINGS', 'CUSTOMER_BOOK'],
  version: '3.0.0-DB', 
  autoUpdate: true,
  autoPrintReceipts: false,
  language: 'Somali',
  dayShiftStart: 6,
  nightShiftStart: 18,
  autoLogoutMinutes: 3
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(null);
  const [dbReady, setDbReady] = useState(false);

  const [systemConfig, setSystemConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [staffLogs, setStaffLogs] = useState<StaffLog[]>([]);
  const [taxRate, setTaxRate] = useState<number>(5);
  const [isTaxEnabled, setIsTaxEnabled] = useState<boolean>(true);

  // Global Keydown Listener for Ctrl+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        // Browser handles print natively, but we ensure we are in a printable state
        console.log("Print requested via shortcut...");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize Database on Mount
  useEffect(() => {
    const initDB = async () => {
      try {
        const savedConfig = await db.getAll('config');
        if (savedConfig.length > 0) {
          setSystemConfig({ ...DEFAULT_CONFIG, ...savedConfig[0] });
        } else {
          await db.put('config', { ...DEFAULT_CONFIG, id: 'main' });
        }

        const loadedProducts = await db.getAll('products');
        if (loadedProducts.length === 0) {
          for (const p of INITIAL_PRODUCTS) await db.put('products', p);
          setProducts(INITIAL_PRODUCTS);
        } else {
          setProducts(loadedProducts);
        }

        const loadedCategories = await db.getAll('categories');
        if (loadedCategories.length === 0) {
          for (const c of DEFAULT_CATEGORIES) await db.put('categories', c);
          setCategories(DEFAULT_CATEGORIES);
        } else {
          setCategories(loadedCategories);
        }

        const loadedStaff = await db.getAll('staff');
        if (loadedStaff.length === 0) {
          for (const s of INITIAL_STAFF) await db.put('staff', s);
          setStaff(INITIAL_STAFF);
        } else {
          setStaff(loadedStaff);
        }

        const loadedCustomers = await db.getAll('customers');
        setCustomers(loadedCustomers);

        const loadedOrders = await db.getAll('orders');
        setOrders(loadedOrders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

        const loadedExpenses = await db.getAll('expenses');
        setExpenses(loadedExpenses);

        const loadedSettlements = await db.getAll('settlements');
        setSettlements(loadedSettlements);

        const loadedLogs = await db.getAll('staffLogs');
        setStaffLogs(loadedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

        setDbReady(true);
      } catch (err) {
        console.error("Database initialization failed:", err);
      }
    };

    initDB();
  }, []);

  const t = translations[systemConfig.language];

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-primary', systemConfig.primaryColor);
    document.documentElement.style.setProperty('--brand-secondary', systemConfig.secondaryColor);
  }, [systemConfig]);

  const getShift = (date: Date): 'Day' | 'Night' => {
    const hours = date.getHours();
    const { dayShiftStart, nightShiftStart } = systemConfig;
    
    if (dayShiftStart < nightShiftStart) {
      // Normal case: Day shift is e.g. 6 to 18
      return (hours >= dayShiftStart && hours < nightShiftStart) ? 'Day' : 'Night';
    } else {
      // Overlapping midnight case: Day shift is e.g. 18 to 6
      return (hours >= dayShiftStart || hours < nightShiftStart) ? 'Day' : 'Night';
    }
  };

  const handleLogin = async (matchedStaff: StaffMember, authMethod: 'PIN' | 'FINGERPRINT') => {
    const now = new Date();
    const log: StaffLog = {
      id: `LOG-${Date.now()}`,
      staffId: matchedStaff.id,
      staffName: matchedStaff.name,
      type: 'LOGIN',
      timestamp: now,
      shift: getShift(now),
      authMethod: authMethod
    };
    await db.put('staffLogs', log);
    setStaffLogs(prev => [log, ...prev]);

    const updatedStaff = { ...matchedStaff, lastLogin: now };
    await db.put('staff', updatedStaff);
    setStaff(prev => prev.map(s => s.id === matchedStaff.id ? updatedStaff : s));

    setCurrentUser(updatedStaff);
    if (matchedStaff.role === UserRole.WAITER || matchedStaff.role === UserRole.CASHIER) {
      setCurrentView('POS');
    } else {
      setCurrentView('DASHBOARD');
    }
  };

  const handleLogout = async () => {
    if (currentUser) {
      const now = new Date();
      const log: StaffLog = {
        id: `LOG-${Date.now()}`,
        staffId: currentUser.id,
        staffName: currentUser.name,
        type: 'LOGOUT',
        timestamp: now,
        shift: getShift(now),
        authMethod: 'SYSTEM'
      };
      await db.put('staffLogs', log);
      setStaffLogs(prev => [log, ...prev]);

      const staffMember = staff.find(s => s.id === currentUser.id);
      if (staffMember) {
        const updatedStaff = { ...staffMember, lastLogout: now };
        await db.put('staff', updatedStaff);
        setStaff(prev => prev.map(s => s.id === staffMember.id ? updatedStaff : s));
      }
    }
    setCurrentUser(null);
    setCurrentView('DASHBOARD');
  };

  // Auto-logout timer: based on config (whether used or not)
  useEffect(() => {
    if (currentUser && systemConfig.autoLogoutMinutes > 0) {
      const timer = setTimeout(() => {
        handleLogout();
      }, systemConfig.autoLogoutMinutes * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, systemConfig.autoLogoutMinutes]);

  const handleCompleteOrder = async (order: Order, pendingOrderId?: string) => {
    await db.put('orders', order);
    setOrders(prev => [order, ...prev]);
    
    const updatedProducts = products.map(p => {
      const itemInOrder = order.items.find(oi => oi.productId === p.id);
      if (itemInOrder) {
        const updated = { ...p, stock: p.stock - itemInOrder.quantity };
        db.put('products', updated);
        return updated;
      }
      return p;
    });
    setProducts(updatedProducts);

    if (order.paymentMethod === 'Credit' && order.customerName) {
      const existing = order.customerId 
          ? customers.find(c => c.id === order.customerId)
          : customers.find(c => c.name.toLowerCase() === order.customerName?.toLowerCase());

      if (existing) {
        const updated = { ...existing, totalDebt: existing.totalDebt + order.total, lastTransaction: new Date() };
        await db.put('customers', updated);
        setCustomers(prev => prev.map(c => c.id === existing.id ? updated : c));
      } else {
        const newCust: Customer = {
          id: `C-${Date.now()}`,
          name: order.customerName!,
          phone: 'N/A',
          gender: 'Male',
          creditLimit: 500,
          registrationDate: new Date(),
          expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          totalDebt: order.total,
          lastTransaction: new Date()
        };
        await db.put('customers', newCust);
        setCustomers(prev => [...prev, newCust]);
      }
    }

    if (pendingOrderId) {
      setPendingOrders(prev => prev.filter(po => po.id !== pendingOrderId));
    }
  };

  const renderView = () => {
    if (!currentUser || !dbReady) return (
      <div className="h-full flex items-center justify-center p-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black text-brand-primary uppercase tracking-widest text-xs">Database Loading...</p>
        </div>
      </div>
    );

    switch (currentView) {
      case 'DASHBOARD': return <Dashboard products={products} orders={orders} systemName={systemConfig.name} config={systemConfig} />;
      case 'POS': return (
        <POS 
          products={products} 
          categories={categories}
          customers={customers}
          onCompleteOrder={handleCompleteOrder} 
          onAddPendingOrder={(po) => setPendingOrders(prev => [po, ...prev])}
          onUpdatePendingOrder={(upd) => setPendingOrders(prev => prev.map(po => po.id === upd.id ? upd : po))}
          onDeletePendingOrder={(id) => setPendingOrders(prev => prev.filter(po => po.id !== id))}
          onAddCategory={async (c) => { await db.put('categories', c); setCategories(prev => [...prev, c]); }}
          onUpdateCategory={async (c) => { 
            const oldCat = categories.find(x => x.id === c.id);
            await db.put('categories', c); 
            setCategories(prev => prev.map(x => x.id === c.id ? c : x)); 
            if (oldCat && oldCat.name !== c.name) {
              const updatedProducts = products.map(p => {
                if (p.category === oldCat.name) {
                  const updated = { ...p, category: c.name };
                  db.put('products', updated);
                  return updated;
                }
                return p;
              });
              setProducts(updatedProducts);
            }
          }}
          onDeleteCategory={async (id) => { 
            const catToDelete = categories.find(x => x.id === id);
            await db.delete('categories', id); 
            setCategories(prev => prev.filter(c => c.id !== id)); 
            if (catToDelete) {
              const updatedProducts = products.map(p => {
                if (p.category === catToDelete.name) {
                  const updated = { ...p, category: 'Uncategorized' };
                  db.put('products', updated);
                  return updated;
                }
                return p;
              });
              setProducts(updatedProducts);
            }
          }}
          onLogout={() => setCurrentUser(null)}
          pendingOrders={pendingOrders}
          currentUser={currentUser}
          taxRate={taxRate}
          globalTaxEnabled={isTaxEnabled}
          config={systemConfig}
        />
      );
      case 'CUSTOMER_BOOK': 
        return (
          <CustomerBook 
            customers={customers} 
            orders={orders} 
            config={systemConfig} 
            onUpdateCustomer={async (c) => { await db.put('customers', c); setCustomers(prev => prev.map(x => x.id === c.id ? c : x)); }}
            onAddCustomer={async (c) => { await db.put('customers', c); setCustomers(prev => [...prev, c]); }}
            onDeleteCustomer={async (id) => { await db.delete('customers', id); setCustomers(prev => prev.filter(c => c.id !== id)); }}
            onClearDebt={async (id, amt) => {
              const customer = customers.find(c => c.id === id);
              if (customer) {
                const updated = { ...customer, totalDebt: Math.max(0, customer.totalDebt - amt), lastTransaction: new Date() };
                await db.put('customers', updated);
                setCustomers(prev => prev.map(c => c.id === id ? updated : c));
                const paymentOrder: Order = {
                  id: `PAY-${Date.now()}`,
                  items: [],
                  subtotal: 0,
                  tax: 0,
                  total: amt,
                  discount: 0,
                  paymentMethod: 'Cash',
                  timestamp: new Date(),
                  staffId: currentUser?.id || 'System',
                  customerName: customer.name,
                  customerId: customer.id
                };
                await db.put('orders', paymentOrder);
                setOrders(prev => [paymentOrder, ...prev]);
              }
            }}
            onAddManualDebt={async (id, amt) => {
               const c = customers.find(x => x.id === id);
               if(c) {
                  const upd = {...c, totalDebt: c.totalDebt + amt};
                  await db.put('customers', upd);
                  setCustomers(prev => prev.map(x => x.id === id ? upd : x));
               }
            }}
          />
        );
      case 'INVENTORY': return (
        <Inventory 
          products={products} 
          categories={categories}
          onAddProduct={async (p) => { await db.put('products', p); setProducts(prev => [p, ...prev]); }} 
          onUpdateProduct={async (u) => { await db.put('products', u); setProducts(prev => prev.map(p => p.id === u.id ? u : p)); }}
          onDeleteProduct={async (id) => { if(confirm(t.reset_system + "?")) { await db.delete('products', id); setProducts(prev => prev.filter(p => p.id !== id)); } }}
          onAddCategory={async (c) => { await db.put('categories', c); setCategories(prev => [...prev, c]); }}
          onUpdateCategory={async (c) => { 
            const oldCat = categories.find(x => x.id === c.id);
            await db.put('categories', c); 
            setCategories(prev => prev.map(x => x.id === c.id ? c : x)); 
            
            if (oldCat && oldCat.name !== c.name) {
              const updatedProducts = products.map(p => {
                if (p.category === oldCat.name) {
                  const updated = { ...p, category: c.name };
                  db.put('products', updated);
                  return updated;
                }
                return p;
              });
              setProducts(updatedProducts);
            }
          }}
          onDeleteCategory={async (id) => { 
            const catToDelete = categories.find(x => x.id === id);
            await db.delete('categories', id); 
            setCategories(prev => prev.filter(c => c.id !== id)); 
            
            if (catToDelete) {
              const updatedProducts = products.map(p => {
                if (p.category === catToDelete.name) {
                  const updated = { ...p, category: 'Uncategorized' };
                  db.put('products', updated);
                  return updated;
                }
                return p;
              });
              setProducts(updatedProducts);
            }
          }}
          currentUser={currentUser}
          config={systemConfig}
        />
      );
      case 'STAFF': return (
        <Staff 
          staff={staff} 
          onAddStaff={async (s) => { await db.put('staff', s); setStaff(prev => [...prev, s]); }} 
          onUpdateStaff={async (u) => { await db.put('staff', u); setStaff(prev => prev.map(s => s.id === u.id ? u : s)); }} 
          onDeleteStaff={async (id) => { await db.delete('staff', id); setStaff(prev => prev.filter(s => s.id !== id)); }}
          currentUser={currentUser} 
          config={systemConfig}
        />
      );
      case 'FINANCE': return (
        <Finance 
          orders={orders} 
          expenses={expenses} 
          onAddExpense={async (e) => { await db.put('expenses', e); setExpenses(prev => [e, ...prev]); }} 
          config={systemConfig} 
        />
      );
      case 'SETTINGS': return (
        <Settings 
          taxRate={taxRate} 
          onUpdateTaxRate={setTaxRate}
          isTaxEnabled={isTaxEnabled}
          onToggleTax={setIsTaxEnabled}
          systemConfig={systemConfig}
          onUpdateConfig={async (config) => {
            setSystemConfig(config);
            await db.put('config', { ...config, id: 'main' });
          }}
          onResetData={async () => { 
            await db.clearStore('products');
            await db.clearStore('orders');
            await db.clearStore('customers');
            await db.clearStore('staff');
            await db.clearStore('expenses');
            await db.clearStore('config');
            await db.clearStore('staffLogs');
            window.location.reload(); 
          }}
        />
      );
      case 'REPORTS': return (
        <Reports 
          orders={orders} 
          products={products} 
          staff={staff} 
          config={systemConfig} 
          expenses={expenses} 
          settlements={settlements}
          onAddSettlement={async (s) => { 
            await db.put('settlements', s); 
            setSettlements(prev => [s, ...prev]);
            
            // Update orders that were settled
            const updatedOrders = orders.map(o => {
              if (o.staffId === s.staffId && !o.settlementId) {
                const updated = { ...o, settlementId: s.id };
                db.put('orders', updated);
                return updated;
              }
              return o;
            });
            setOrders(updatedOrders);
          }}
          currentUser={currentUser}
          staffLogs={staffLogs}
        />
      );
      default: return <Dashboard products={products} orders={orders} systemName={systemConfig.name} config={systemConfig} />;
    }
  };

  if (!currentUser) {
    return <Login staffMembers={staff} onLogin={handleLogin} config={systemConfig} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 relative overflow-hidden">
      {systemConfig.appBgUrl && (
        <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
          <img src={systemConfig.appBgUrl} className="w-full h-full object-cover" alt="" />
        </div>
      )}

      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        userRole={currentUser.role} 
        currentUser={currentUser} 
        config={systemConfig} 
        onLanguageChange={async (lang) => {
          const newConfig = { ...systemConfig, language: lang };
          setSystemConfig(newConfig);
          await db.put('config', { ...newConfig, id: 'main' });
        }}
      />
      
      <main className="flex-1 overflow-y-auto relative z-10 no-scrollbar">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex items-center justify-between no-print">
          <h2 className="text-lg font-bold text-gray-700 uppercase tracking-widest text-xs">
            {t[currentView.toLowerCase()] || currentView.replace('_', ' ')}
          </h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
               <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Database Ready</span>
            </div>

            <button onClick={handleLogout} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
              <i className="fas fa-sign-out-alt"></i> {t.logout}
            </button>
            <div className="h-8 w-[1px] bg-gray-200"></div>
            <div className="flex items-center gap-2">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-800">{currentUser.name}</p>
                  <p className="text-[10px] text-brand-secondary uppercase font-bold tracking-widest">{currentUser.role}</p>
               </div>
               <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg border border-white/20">
                  <i className="fas fa-user-check"></i>
               </div>
            </div>
          </div>
        </header>
        <div className="animate-fadeIn">
          {renderView()}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --brand-primary: ${systemConfig.primaryColor};
          --brand-secondary: ${systemConfig.secondaryColor};
        }
        .bg-brand-primary { background-color: var(--brand-primary); }
        .bg-brand-secondary { background-color: var(--brand-secondary); }
        .text-brand-primary { color: var(--brand-primary); }
        .text-brand-secondary { color: var(--brand-secondary); }
        .border-brand-primary { border-color: var(--brand-primary); }
        .border-brand-secondary { border-color: var(--brand-secondary); }
        .ring-brand-secondary:focus { --tw-ring-color: var(--brand-secondary); }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
};

export default App;
