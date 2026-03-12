
import React, { useState, useMemo, useEffect } from 'react';
import { Product, OrderItem, Order, StaffMember, UserRole, PendingOrder, SystemConfig, PaymentMethod, Customer, Category } from '../types';
import { translations } from '../translations';
import toast from 'react-hot-toast';

interface POSProps {
  products: Product[];
  categories: Category[];
  customers: Customer[]; 
  onCompleteOrder: (order: Order, pendingOrderId?: string) => void;
  onAddPendingOrder: (po: PendingOrder) => void;
  onUpdatePendingOrder: (po: PendingOrder) => void;
  onDeletePendingOrder: (id: string) => void;
  onAddCategory: (c: Category) => void;
  onUpdateCategory: (c: Category) => void;
  onDeleteCategory: (id: string) => void;
  onLogout: () => void;
  pendingOrders: PendingOrder[];
  currentUser: StaffMember;
  taxRate: number;
  globalTaxEnabled: boolean;
  config: SystemConfig;
}

const DefaultLogoSVG = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className || "w-12 h-12 fill-brand-primary"}>
    <path d="M45,35 c0,0,5-10,0-15 c-5,5,0,15,0,15 M55,35 c0,0,5-10,0-15 c-5,5,0,15,0,15 M35,40 h30 v15 c0,10-10,15-15,15 s-15-5-15-15 V40 z M65,45 h5 c5,0,5,10,0,10 h-5 M25,70 c0,0,10,20,50,0 c-20,10-50,0-50,0" />
  </svg>
);

const POS: React.FC<POSProps> = ({ 
  products, categories, customers, onCompleteOrder, onAddPendingOrder, onUpdatePendingOrder, onDeletePendingOrder, 
  onAddCategory, onUpdateCategory, onDeleteCategory, onLogout,
  pendingOrders, currentUser, taxRate, globalTaxEnabled, config 
}) => {
  const t = translations[config.language];
  const [activeCategory, setActiveCategory] = useState(categories[0]?.name || 'All');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [search, setSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [paymentStep, setPaymentStep] = useState<'Category' | 'Method'>('Category');
  const [paymentType, setPaymentType] = useState<'CashMobile' | 'Credit' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [activePendingId, setActivePendingId] = useState<string | null>(null);
  const [applyTax, setApplyTax] = useState(globalTaxEnabled);
  
  // New state for right sidebar tabs
  const [rightTab, setRightTab] = useState<'CART' | 'OPEN'>('CART');
  const [isKitchenPrint, setIsKitchenPrint] = useState(false);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      c.phone.includes(customerSearch)
    ).slice(0, 5);
  }, [customers, customerSearch]);

  useEffect(() => {
    if (cart.length === 0) {
      setApplyTax(globalTaxEnabled);
      setSelectedCustomer(null);
      setManualCustomerName('');
      setCustomerSearch('');
      setPaymentStep('Category');
      setPaymentType(null);
      setActivePendingId(null);
    }
  }, [globalTaxEnabled, cart.length]);

  const canProcessPayment = [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER].includes(currentUser.role);
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const taxAmount = applyTax ? (subtotal * (taxRate / 100)) : 0;
  const total = subtotal + taxAmount;

  const filteredProducts = useMemo(() => 
    products.filter(p => (activeCategory === 'All' || p.category === activeCategory) && p.name.toLowerCase().includes(search.toLowerCase())),
    [activeCategory, search, products]
  );

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return toast.error(config.language === 'Somali' ? "Waa ka dhammaatay!" : "Out of stock!");
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error("Stock limit!");
          return prev;
        }
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
    setRightTab('CART'); // Switch to cart tab when adding items
  };

  const handleSelectCategory = (category: 'CashMobile' | 'Credit') => {
    setPaymentType(category);
    if (category === 'Credit') setPaymentMethod('Credit');
    setPaymentStep('Method');
  };

  const handleCompleteSale = () => {
    const finalCustomerName = selectedCustomer ? selectedCustomer.name : manualCustomerName;
    
    if (paymentMethod === 'Credit' && !finalCustomerName) {
      toast.error(config.language === 'Somali' ? "Fadlan dooro macmiil ama qor magaca si loogu diwaangeliyo Amaahda." : "Please select a customer or write name for credit registration.");
      return;
    }

    onCompleteOrder({
      id: `ORD-${Date.now()}`,
      items: [...cart], 
      subtotal, 
      tax: taxAmount, 
      total, 
      discount: 0, 
      paymentMethod, 
      timestamp: new Date(), 
      staffId: currentUser.id,
      customerName: finalCustomerName || undefined,
      customerId: selectedCustomer?.id
    }, activePendingId || undefined);
    
    setShowCheckout(false);
    setShowReceipt(true);
    setTimeout(() => window.print(), 500);
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setCart([]); 
    setActivePendingId(null); 
    setSelectedCustomer(null);
    setManualCustomerName('');
    setCustomerSearch('');
    setPaymentStep('Category');
    setPaymentType(null);
  };

  const handleOpenOrder = (po: PendingOrder) => {
    setCart(po.items);
    setActivePendingId(po.id);
    setApplyTax(po.tax > 0);
    setRightTab('CART'); // Switch back to cart view once loaded
  };

  const handleUpdateCurrentOrder = () => {
    if (!activePendingId) return;
    const updated: PendingOrder = {
      id: activePendingId,
      items: [...cart],
      subtotal,
      tax: taxAmount,
      total,
      waiterId: currentUser.id,
      waiterName: currentUser.name,
      timestamp: new Date()
    };
    onUpdatePendingOrder(updated);
    setShowReceipt(true);
    setTimeout(() => window.print(), 500);
  };

  const handleSendNewOrder = () => {
    const po: PendingOrder = {
      id: `PEND-${Date.now()}`,
      items: [...cart],
      subtotal,
      tax: taxAmount,
      total,
      waiterId: currentUser.id,
      waiterName: currentUser.name,
      timestamp: new Date()
    };
    onAddPendingOrder(po);
    setShowReceipt(true);
    setTimeout(() => window.print(), 500);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Product Grid Area (Main) */}
      <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden no-print">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <i className="fas fa-th-large text-brand-secondary"></i>
              {config.language === 'Somali' ? 'Qaybaha Dalabka' : 'Order Categories'}
            </h3>
            <div className="relative w-64">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input 
                type="text" placeholder={t.search_product} 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-secondary font-bold text-sm"
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-3 overflow-x-auto no-scrollbar items-center py-2">
            {categories.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => setActiveCategory(cat.name)} 
                className={`px-8 py-4 rounded-2xl text-sm font-black transition-all whitespace-nowrap flex items-center gap-3 border-2 ${activeCategory === cat.name ? 'bg-brand-primary border-brand-primary text-white shadow-xl scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-brand-secondary'}`}
              >
                {cat.name === 'Coffee' && <i className="fas fa-coffee text-lg"></i>}
                {cat.name === 'Tea' && <i className="fas fa-leaf text-lg"></i>}
                {cat.name === 'Snacks' && <i className="fas fa-cookie text-lg"></i>}
                {cat.name === 'Cold Drinks' && <i className="fas fa-glass-whiskey text-lg"></i>}
                {cat.name === 'Bakery' && <i className="fas fa-bread-slice text-lg"></i>}
                {cat.name}
              </button>
            ))}
            {[UserRole.ADMIN, UserRole.MANAGER].includes(currentUser.role) && (
              <button 
                onClick={() => setShowCategoryManager(true)} 
                className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-300 hover:bg-brand-secondary hover:text-white transition-all flex items-center justify-center shrink-0 border-2 border-dashed border-gray-200"
                title="Manage Categories"
              >
                <i className="fas fa-plus"></i>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map(product => (
            <button key={product.id} onClick={() => addToCart(product)} disabled={product.stock <= 0} className="bg-white p-3 rounded-2xl border border-gray-100 hover:shadow-xl transition-all flex flex-col text-left group">
              <img src={product.image} className="w-full h-28 object-cover rounded-xl mb-3 group-hover:scale-105 transition-transform" />
              <h4 className="font-bold text-gray-800 text-sm truncate">{product.name}</h4>
              <div className="mt-auto flex justify-between items-center pt-2">
                <span className="text-brand-secondary font-black text-sm">{config.currencySymbol}{product.price.toFixed(2)}</span>
                <span className="text-[10px] text-gray-400 font-bold">Qty: {product.stock}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Unified Right Sidebar */}
      <div className="w-96 bg-white border-l border-gray-100 flex flex-col shadow-2xl no-print">
        {/* Tab Headers */}
        <div className="p-4 border-b border-gray-100 flex bg-gray-50/50">
          <button 
            onClick={() => setRightTab('CART')}
            className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${rightTab === 'CART' ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <i className="fas fa-shopping-cart"></i> {config.language === 'Somali' ? 'Dambiisha' : 'Cart'}
            {cart.length > 0 && <span className="w-4 h-4 bg-brand-secondary text-white rounded-full flex items-center justify-center text-[8px]">{cart.length}</span>}
          </button>
          <button 
            onClick={() => setRightTab('OPEN')}
            className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${rightTab === 'OPEN' ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <i className="fas fa-clock"></i> {config.language === 'Somali' ? 'Furan' : 'Open'}
            {pendingOrders.length > 0 && <span className="w-4 h-4 bg-brand-secondary text-white rounded-full flex items-center justify-center text-[8px]">{pendingOrders.length}</span>}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {rightTab === 'CART' ? (
            <div className="space-y-3">
               <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-lg font-black text-brand-primary uppercase tracking-tight">
                      {activePendingId ? (config.language === 'Somali' ? 'Dalabka #' + activePendingId.slice(-4) : 'Order #' + activePendingId.slice(-4)) : (config.language === 'Somali' ? 'Dalab Cusub' : 'New Order')}
                    </h3>
                  </div>
                  <button onClick={() => { setCart([]); setActivePendingId(null); }} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-all"><i className="fas fa-trash-alt mr-1"></i> Clear</button>
               </div>

               {cart.map(item => (
                <div key={item.productId} className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-transparent hover:border-brand-secondary/20 transition-all animate-fadeIn">
                  <div className="flex-1"><h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4><p className="text-xs text-brand-secondary font-black">{config.currencySymbol}{(item.price * item.quantity).toFixed(2)}</p></div>
                  <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl shadow-sm">
                     <button onClick={() => {setCart(prev => prev.map(i => i.productId === item.productId ? {...i, quantity: Math.max(0, i.quantity - 1)} : i).filter(i => i.quantity > 0))}} className="w-6 h-6 flex items-center justify-center text-brand-secondary font-black">-</button>
                     <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                     <button onClick={() => addToCart(products.find(p => p.id === item.productId)!)} className="w-6 h-6 flex items-center justify-center text-brand-secondary font-black">+</button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-gray-200 opacity-50 text-center">
                  <i className="fas fa-shopping-basket text-6xl mb-4"></i>
                  <p className="text-sm font-black uppercase tracking-widest">{config.language === 'Somali' ? 'Dambiishu waa maran tahay' : 'Cart is empty'}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{t.pending_orders}</h4>
              {pendingOrders.map(po => (
                <div 
                  key={po.id} 
                  className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${activePendingId === po.id ? 'bg-brand-primary border-brand-primary text-white shadow-lg' : 'bg-white border-gray-100 hover:border-brand-secondary'}`}
                  onClick={() => handleOpenOrder(po)}
                >
                  <div className="flex justify-between items-start mb-1 text-[10px] font-bold">
                    <span className="opacity-60">#{po.id.slice(-4)}</span>
                    <span>{new Date(po.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="font-bold truncate text-sm">{po.waiterName}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs">{po.items.length} items</span>
                    <span className={`font-black ${activePendingId === po.id ? 'text-brand-secondary' : 'text-brand-primary'}`}>{config.currencySymbol}{po.total.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeletePendingOrder(po.id); }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-red-100 text-red-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500 hover:text-white"
                  >
                     <i className="fas fa-times text-xs"></i>
                  </button>
                </div>
              ))}
              {pendingOrders.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-gray-200 opacity-50 text-center">
                  <i className="fas fa-receipt text-6xl mb-4"></i>
                  <p className="text-xs font-bold uppercase tracking-widest">{t.no_pending}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons (Sticky at Bottom) */}
        {rightTab === 'CART' && (
          <div className="p-6 bg-gray-100/50 space-y-4 rounded-t-[2.5rem] shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
            <div className="space-y-2 text-sm font-medium">
              <div className="flex justify-between text-gray-500"><span>{t.subtotal}</span><span>{config.currencySymbol}{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between items-center group cursor-pointer" onClick={() => setApplyTax(!applyTax)}>
                <span className={`flex items-center gap-2 ${applyTax ? 'text-brand-primary' : 'text-gray-400'}`}><i className={`fas ${applyTax ? 'fa-check-circle text-brand-secondary' : 'fa-circle text-gray-200'}`}></i> {t.tax} ({taxRate}%)</span>
                <span className={applyTax ? 'font-bold' : 'text-gray-400'}>{config.currencySymbol}{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200"><span className="font-black text-lg text-brand-primary">{t.total}</span><span className="text-2xl font-black text-brand-primary">{config.currencySymbol}{total.toFixed(2)}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => setShowReceipt(true)} disabled={cart.length === 0} className="col-span-1 bg-white border-2 border-brand-secondary/20 text-brand-primary py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:border-brand-secondary transition-all flex items-center justify-center gap-2"><i className="fas fa-print"></i> {config.language === 'Somali' ? 'Biilka' : 'Bill'}</button>
               {activePendingId ? (
                  <button onClick={handleUpdateCurrentOrder} className="col-span-1 bg-indigo-600 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all"><i className="fas fa-sync mr-2"></i> Update</button>
               ) : (
                  <button onClick={handleSendNewOrder} disabled={cart.length === 0} className="col-span-1 bg-brand-secondary text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"><i className="fas fa-paper-plane mr-2"></i> {config.language === 'Somali' ? 'Diri' : 'Send'}</button>
               )}
            </div>

            {canProcessPayment ? (
              <button onClick={() => setShowCheckout(true)} disabled={cart.length === 0} className="w-full bg-brand-primary text-white py-5 rounded-3xl font-black text-xl shadow-xl hover:opacity-95 transition-all">{t.complete_order}</button>
            ) : (
              <div className="text-center p-2">
                 <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{config.language === 'Somali' ? 'Kaliya Cashier-ka iyo Manager-ka ayaa xiri kara dalabka' : 'Only Cashier and Manager can close orders'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showCategoryManager && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 animate-scaleIn shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
             <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-800">Maamul Qaybaha</h3>
                  <p className="text-sm text-gray-500">Ku dar ama tirtir qaybaha alaabta.</p>
                </div>
                <button onClick={() => { setShowCategoryManager(false); setEditingCategory(null); setNewCategoryName(''); }} className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-800 transition-all">
                  <i className="fas fa-times text-xl"></i>
                </button>
             </div>

             <form onSubmit={(e) => {
                e.preventDefault();
                if (!newCategoryName.trim()) return;
                if (editingCategory) {
                  onUpdateCategory({ ...editingCategory, name: newCategoryName.trim() });
                  setEditingCategory(null);
                } else {
                  const newCat: Category = {
                    id: `CAT-${Date.now()}`,
                    name: newCategoryName.trim()
                  };
                  onAddCategory(newCat);
                }
                setNewCategoryName('');
             }} className="mb-8">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newCategoryName} 
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder={editingCategory ? "Bedel magaca..." : "Magaca qaybta cusub..."}
                    className="flex-1 px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-secondary font-bold"
                  />
                  <button type="submit" className="px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:opacity-90 transition-all">
                    {editingCategory ? 'Bedel' : 'Ku dar'}
                  </button>
                  {editingCategory && (
                    <button 
                      type="button" 
                      onClick={() => { setEditingCategory(null); setNewCategoryName(''); }}
                      className="px-4 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-all"
                    >
                      Xir
                    </button>
                  )}
                </div>
             </form>

             <div className="space-y-3">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="font-bold text-gray-700">{cat.name}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingCategory(cat);
                          setNewCategoryName(cat.name);
                        }}
                        className="text-blue-400 hover:text-blue-600 transition-all"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        onClick={() => {
                          if(confirm(`Ma hubtaa inaad tirtirto qaybta "${cat.name}"?`)) {
                            onDeleteCategory(cat.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-600 transition-all"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {showReceipt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-[320px] rounded-3xl p-6 shadow-2xl animate-scaleIn">
            <div id="printable-receipt" className={`font-mono text-[10px] text-black bg-white uppercase ${isKitchenPrint ? 'kitchen-slip' : ''}`}>
              <div className="flex flex-col items-center mb-6 text-center border-b border-dashed border-gray-300 pb-4">
                 <div className="w-14 h-14 mb-2">
                   {config.logoUrl && !isKitchenPrint ? <img src={config.logoUrl} className="w-full h-full object-contain" /> : (!isKitchenPrint && <DefaultLogoSVG />)}
                 </div>
                 <h2 className="text-lg font-black tracking-tighter leading-none mb-1">{isKitchenPrint ? 'KITCHEN ORDER' : config.name}</h2>
                 {!isKitchenPrint && (
                   <>
                     <p className="text-[8px] opacity-70 italic mb-1">{config.description}</p>
                     <p className="text-[8px] opacity-70">{config.address}</p>
                     <p className="text-[8px] opacity-70">TEL: {config.phone}</p>
                   </>
                 )}
              </div>
              
              <div className="py-2 space-y-0.5 border-b border-dashed border-gray-300 mb-2">
                 <div className="flex justify-between"><span>{t.date}:</span><span>{new Date().toLocaleDateString()}</span></div>
                 <div className="flex justify-between"><span>{config.language === 'Somali' ? 'Saacadda' : 'Time'}:</span><span>{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>
                 <div className="flex justify-between"><span>{t.staff}:</span><span>{currentUser.name}</span></div>
                 <div className="flex justify-between"><span>{config.language === 'Somali' ? 'Dalabka' : 'Order'}:</span><span>#{activePendingId ? activePendingId.slice(-6) : Date.now().toString().slice(-6)}</span></div>
                 {(selectedCustomer?.name || manualCustomerName) && <div className="flex justify-between font-black"><span>{config.language === 'Somali' ? 'Macaamiil' : 'Customer'}:</span><span>{selectedCustomer?.name || manualCustomerName}</span></div>}
              </div>

              <div className="py-2 space-y-1">
                 <div className="flex font-black border-b border-black pb-1 mb-1">
                   <span className="flex-1">{config.language === 'Somali' ? 'Alaabta' : 'Item'}</span><span className="w-6 text-center">Qty</span>{!isKitchenPrint && <span className="w-12 text-right">Amt</span>}
                 </div>
                 {cart.map((i, idx) => (
                   <div key={idx} className="flex leading-tight">
                     <span className="flex-1 truncate">{i.name}</span><span className="w-6 text-center">{i.quantity}</span>{!isKitchenPrint && <span className="w-12 text-right">{(i.price * i.quantity).toFixed(2)}</span>}
                   </div>
                 ))}
              </div>

              {!isKitchenPrint && (
                <>
                  <div className="border-t border-dashed border-gray-300 pt-2 mt-2 space-y-1 font-black">
                     <div className="flex justify-between"><span>{t.subtotal}:</span><span>{config.currencySymbol}{subtotal.toFixed(2)}</span></div>
                     {applyTax && <div className="flex justify-between"><span>{t.tax} ({taxRate}%):</span><span>{config.currencySymbol}{taxAmount.toFixed(2)}</span></div>}
                     <div className="flex justify-between text-sm pt-2 border-t-2 border-black"><span>{t.total}:</span><span>{config.currencySymbol}{total.toFixed(2)}</span></div>
                     <div className="flex justify-between pt-1 opacity-70 italic text-[8px]"><span>{config.language === 'Somali' ? 'Lacag-bixinta' : 'Payment'}:</span><span>{paymentMethod}</span></div>
                  </div>

                  <div className="mt-4 p-2 bg-gray-100 border border-dashed border-gray-400 rounded text-center">
                    <p className="text-[7px] font-bold text-gray-600 mb-1 uppercase tracking-widest">{config.language === 'Somali' ? 'Xisaabaadka' : 'Payment Accounts'}</p>
                    <p className="text-[9px] font-black">{config.accountNumbers}</p>
                  </div>

                  <div className="text-center mt-6 space-y-1 border-t border-dashed border-gray-300 pt-4">
                     <p className="text-[9px] font-black">{config.language === 'Somali' ? 'MAHADSANID, SOO DHAWOOW!' : 'THANK YOU, WELCOME!'}</p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3 no-print">
              <button onClick={() => { setIsKitchenPrint(false); setTimeout(() => window.print(), 100); }} className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black text-sm uppercase shadow-lg flex items-center justify-center gap-2"><i className="fas fa-receipt"></i> {t.print_receipt}</button>
              <button onClick={() => { setIsKitchenPrint(true); setTimeout(() => { window.print(); setIsKitchenPrint(false); }, 100); }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase shadow-lg flex items-center justify-center gap-2"><i className="fas fa-utensils"></i> {config.language === 'Somali' ? 'Jikada (Kitchen)' : 'Kitchen Print'}</button>
              <button onClick={handleCloseReceipt} className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-bold text-xs uppercase">{config.language === 'Somali' ? 'Xir (Done)' : 'Close'}</button>
            </div>
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 no-print">
           <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 md:p-12 animate-scaleIn shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-start mb-8">
                 <div className="text-left">
                    <h3 className="text-3xl font-black text-brand-primary uppercase tracking-tight">
                      {paymentStep === 'Category' ? t.complete_order : t.confirm_payment}
                    </h3>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">{t.total}: {config.currencySymbol}{total.toFixed(2)}</p>
                 </div>
                 <div className="flex gap-2">
                   <button 
                     onClick={() => {
                       setShowReceipt(true);
                       setTimeout(() => window.print(), 500);
                     }} 
                     className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-brand-primary transition-all"
                     title={config.language === 'Somali' ? 'Daabac Biilka' : 'Print Bill'}
                   >
                     <i className="fas fa-print"></i>
                   </button>
                   <button onClick={() => setShowCheckout(false)} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                      <i className="fas fa-times"></i>
                   </button>
                 </div>
              </div>

              {paymentStep === 'Category' && (
                <div className="grid grid-cols-1 gap-6 animate-fadeIn">
                  <button onClick={() => handleSelectCategory('CashMobile')} className="flex items-center gap-6 p-8 bg-gray-50 rounded-[2rem] border-4 border-transparent hover:border-brand-secondary hover:bg-white transition-all group text-left">
                    <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center text-white text-3xl shadow-xl group-hover:scale-110 transition-transform shrink-0"><i className="fas fa-money-bill-transfer"></i></div>
                    <div className="flex-1"><h4 className="text-2xl font-black text-gray-800">{config.language === 'Somali' ? 'Cadaan / Mobile' : 'Cash / Mobile'}</h4><p className="text-sm text-gray-400 font-bold uppercase tracking-widest">EVC, Dahab, Merchant Code</p></div>
                    <i className="fas fa-chevron-right text-gray-300"></i>
                  </button>
                  <button onClick={() => handleSelectCategory('Credit')} className="flex items-center gap-6 p-8 bg-gray-50 rounded-[2rem] border-4 border-transparent hover:border-red-500 hover:bg-white transition-all group text-left">
                    <div className="w-20 h-20 bg-red-500 rounded-3xl flex items-center justify-center text-white text-3xl shadow-xl group-hover:scale-110 transition-transform shrink-0"><i className="fas fa-book"></i></div>
                    <div className="flex-1"><h4 className="text-2xl font-black text-gray-800">{config.language === 'Somali' ? 'Amaah (Credit)' : 'Credit'}</h4><p className="text-sm text-gray-400 font-bold uppercase tracking-widest">{config.language === 'Somali' ? 'Deyn / Ku qor Buugga' : 'Debt / Register on Book'}</p></div>
                    <i className="fas fa-chevron-right text-gray-300"></i>
                  </button>
                </div>
              )}

              {paymentStep === 'Method' && (
                <div className="animate-fadeIn space-y-8">
                  <button onClick={() => setPaymentStep('Category')} className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-brand-primary flex items-center gap-2"><i className="fas fa-arrow-left"></i> {config.language === 'Somali' ? 'Ka noqo' : 'Go back'}</button>
                  {paymentType === 'CashMobile' ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[
                          { id: 'Cash', icon: 'fa-money-bill-wave', label: 'Cash', color: 'bg-green-500' },
                          { id: 'EVC Plus', icon: 'fa-mobile-screen-button', label: 'EVC Plus', color: 'bg-blue-600' },
                          { id: 'E-Dahab', icon: 'fa-wallet', label: 'E-Dahab', color: 'bg-orange-500' },
                          { id: 'Merchant', icon: 'fa-building-columns', label: 'Merchant', color: 'bg-purple-600' }
                        ].map(m => (
                          <button key={m.id} onClick={() => setPaymentMethod(m.id as PaymentMethod)} className={`flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all group ${paymentMethod === m.id ? 'border-brand-secondary bg-brand-secondary/5 text-brand-primary scale-105 shadow-md' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${m.color}`}><i className={`fas ${m.icon} text-lg`}></i></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                          </button>
                        ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-red-50 p-6 rounded-3xl border border-red-100 text-center space-y-4">
                        <i className="fas fa-user-check text-4xl text-red-500"></i>
                        <h4 className="text-xl font-black text-red-600">{config.language === 'Somali' ? 'Raadi Macmiilka Buugga leh' : 'Search Credit Customer'}</h4>
                      </div>
                      <div className="relative">
                        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input 
                          type="text" 
                          value={customerSearch} 
                          onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            if (selectedCustomer) setSelectedCustomer(null);
                          }}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-secondary font-bold" 
                          placeholder={config.language === 'Somali' ? 'Raadi Macmiil (Magac ama Tel)...' : 'Search Customer (Name or Tel)...'} 
                        />
                        {filteredCustomers.length > 0 && !selectedCustomer && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[110] animate-fadeIn">
                             {filteredCustomers.map(c => (
                               <button 
                                key={c.id} 
                                onClick={() => {
                                  setSelectedCustomer(c);
                                  setCustomerSearch(c.name);
                                }}
                                className="w-full text-left p-4 hover:bg-gray-50 flex justify-between items-center transition-colors border-b last:border-none border-gray-50"
                               >
                                 <div>
                                    <p className="font-black text-gray-800 text-sm">{c.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold">{c.phone}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-xs font-black text-red-500">{config.currencySymbol}{c.totalDebt.toFixed(2)}</p>
                                    <p className="text-[9px] text-gray-400 uppercase font-black">Limit: {config.currencySymbol}{c.creditLimit.toFixed(0)}</p>
                                 </div>
                               </button>
                             ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 text-left">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        {paymentType === 'Credit' ? t.quick_add : t.customers}
                     </label>
                     <input 
                        type="text" 
                        value={selectedCustomer ? selectedCustomer.name : manualCustomerName} 
                        onChange={(e) => {
                          if (selectedCustomer) setSelectedCustomer(null);
                          setManualCustomerName(e.target.value);
                        }} 
                        className={`w-full px-6 py-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-secondary font-bold text-center text-xl ${selectedCustomer ? 'text-brand-primary bg-brand-secondary/5 border-2 border-brand-secondary ring-2 ring-brand-secondary ring-offset-2' : ''}`} 
                        placeholder={config.language === 'Somali' ? 'Magaca macmiilka...' : 'Customer name...'} 
                        readOnly={!!selectedCustomer}
                     />
                  </div>
                  
                  <button onClick={handleCompleteSale} className="w-full bg-brand-primary text-white py-6 rounded-3xl font-black text-2xl shadow-2xl active:scale-95 transition-all">{config.language === 'Somali' ? 'Xaqiiji & Xir Dalabka' : 'Confirm & Close Order'}</button>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default POS;
