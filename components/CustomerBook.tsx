
import React, { useState, useMemo } from 'react';
import { Customer, Order, SystemConfig } from '../types';
import toast from 'react-hot-toast';

interface CustomerBookProps {
  customers: Customer[];
  orders: Order[];
  config: SystemConfig;
  onUpdateCustomer: (customer: Customer) => void;
  onAddCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onClearDebt: (customerId: string, amount: number) => void;
  onAddManualDebt: (customerId: string, amount: number, note: string) => void;
}

const CustomerBook: React.FC<CustomerBookProps> = ({ 
  customers, 
  orders, 
  config, 
  onUpdateCustomer, 
  onAddCustomer, 
  onDeleteCustomer,
  onClearDebt,
  onAddManualDebt
}) => {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingDebt, setIsAddingDebt] = useState(false);

  // Form State
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    gender: 'Male' as 'Male' | 'Female',
    creditLimit: '500',
    registrationDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    guarantorName: '',
    guarantorPhone: '',
    notes: ''
  });

  // Manual Debt Form State
  const [manualDebt, setManualDebt] = useState({
    amount: '',
    note: ''
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.includes(search)
    ).sort((a, b) => b.totalDebt - a.totalDebt);
  }, [customers, search]);

  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return orders.filter(o => o.customerId === selectedCustomer.id || o.customerName === selectedCustomer.name)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [selectedCustomer, orders]);

  const totalGlobalDebt = customers.reduce((sum, c) => sum + c.totalDebt, 0);

  const handleClearDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return toast.error("Fadlan geli lacag sax ah.");
    
    onClearDebt(selectedCustomer.id, amount);
    setPaymentAmount('');
    toast.success(`Waxaad ka jartay ${config.currencySymbol}${amount} deynta ${selectedCustomer.name}`);
  };

  const handleManualDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !manualDebt.amount) return;
    const amount = parseFloat(manualDebt.amount);
    if (isNaN(amount) || amount <= 0) return toast.error("Fadlan geli lacag sax ah.");

    if (selectedCustomer.totalDebt + amount > selectedCustomer.creditLimit) {
      if (!confirm(`DIGNIIN: Macmiilkan wuxuu dhaafayaa xadka deynta (${config.currencySymbol}${selectedCustomer.creditLimit}). Ma rabtaa inaad sii wadid?`)) {
        return;
      }
    }
    
    onAddManualDebt(selectedCustomer.id, amount, manualDebt.note);
    setManualDebt({ amount: '', note: '' });
    setIsAddingDebt(false);
    toast.success(`Waxaad ku dartay ${config.currencySymbol}${amount} deynta ${selectedCustomer.name}`);
  };

  const handleOpenAdd = () => {
    setCustomerForm({ 
      name: '', 
      phone: '', 
      gender: 'Male',
      creditLimit: '500', 
      registrationDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      guarantorName: '', 
      guarantorPhone: '', 
      notes: '' 
    });
    setIsAdding(true);
  };

  const handleOpenEdit = () => {
    if (!selectedCustomer) return;
    setCustomerForm({
      name: selectedCustomer.name,
      phone: selectedCustomer.phone,
      gender: selectedCustomer.gender,
      creditLimit: selectedCustomer.creditLimit.toString(),
      registrationDate: new Date(selectedCustomer.registrationDate).toISOString().split('T')[0],
      expiryDate: new Date(selectedCustomer.expiryDate).toISOString().split('T')[0],
      guarantorName: selectedCustomer.guarantorName || '',
      guarantorPhone: selectedCustomer.guarantorPhone || '',
      notes: selectedCustomer.notes || ''
    });
    setIsEditing(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name) return toast.error("Fadlan geli magaca macmiilka.");

    const limit = parseFloat(customerForm.creditLimit) || 0;

    if (isEditing && selectedCustomer) {
      const updated: Customer = {
        ...selectedCustomer,
        ...customerForm,
        registrationDate: new Date(customerForm.registrationDate),
        expiryDate: new Date(customerForm.expiryDate),
        creditLimit: limit
      };
      onUpdateCustomer(updated);
      setIsEditing(false);
      setSelectedCustomer(updated);
    } else {
      const customer: Customer = {
        id: `C-${Date.now()}`,
        name: customerForm.name,
        phone: customerForm.phone || 'N/A',
        gender: customerForm.gender,
        creditLimit: limit,
        registrationDate: new Date(customerForm.registrationDate),
        expiryDate: new Date(customerForm.expiryDate),
        totalDebt: 0,
        lastTransaction: new Date(),
        notes: customerForm.notes,
        guarantorName: customerForm.guarantorName,
        guarantorPhone: customerForm.guarantorPhone
      };
      onAddCustomer(customer);
      setIsAdding(false);
    }
    resetForm();
  };

  const resetForm = () => {
    setCustomerForm({ 
      name: '', 
      phone: '', 
      gender: 'Male',
      creditLimit: '500', 
      registrationDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      guarantorName: '', 
      guarantorPhone: '', 
      notes: '' 
    });
  };

  const handleDelete = () => {
    if (!selectedCustomer) return;
    if (selectedCustomer.totalDebt > 0) {
      return toast.error("Ma tirtiri kartid macmiil deyn lagu leeyahay. Fadlan marka hore deynta ka sifee.");
    }
    if (confirm(`Ma hubtaa inaad tirtirto akoonka macmiilka: ${selectedCustomer.name}?`)) {
      onDeleteCustomer(selectedCustomer.id);
      setSelectedCustomer(null);
    }
  };

  const isExpired = (expiryDate: Date) => {
    return new Date() > new Date(expiryDate);
  };

  return (
    <div className="p-8 space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Buugga Macaamiisha (Ledger)</h2>
          <p className="text-gray-500 font-medium">Maamul macaamiisha amaahda kugu leh iyo diiwaanka lacagaha.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleOpenAdd}
            className="px-6 py-4 bg-brand-secondary text-brand-primary rounded-2xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <i className="fas fa-user-plus"></i> Fura Akoon Cusub
          </button>
          <div className="bg-red-50 px-6 py-4 rounded-3xl border border-red-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <i className="fas fa-hand-holding-dollar text-xl"></i>
             </div>
             <div>
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Deynta Guud</p>
                <h3 className="text-2xl font-black text-red-600 leading-none">{config.currencySymbol}{totalGlobalDebt.toFixed(2)}</h3>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Customer List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input 
              type="text" 
              placeholder="Raadi macmiil..." 
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-[2rem] shadow-sm focus:ring-2 focus:ring-brand-secondary outline-none font-bold text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden max-h-[600px] overflow-y-auto no-scrollbar">
            <div className="p-6 border-b border-gray-50">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Liiska Macaamiisha</h4>
            </div>
            <div className="divide-y divide-gray-50">
              {filteredCustomers.map(c => {
                const limitUsage = c.creditLimit > 0 ? (c.totalDebt / c.creditLimit) * 100 : 0;
                const expired = isExpired(c.expiryDate);
                return (
                  <button 
                    key={c.id} 
                    onClick={() => setSelectedCustomer(c)}
                    className={`w-full text-left p-6 transition-all hover:bg-gray-50 flex flex-col gap-2 ${selectedCustomer?.id === c.id ? 'bg-gray-50 border-l-4 border-brand-secondary' : ''}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full ${c.gender === 'Female' ? 'bg-pink-500' : 'bg-brand-primary'} text-white flex items-center justify-center font-black text-xs relative`}>
                          {c.name.charAt(0)}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] ${c.gender === 'Female' ? 'bg-pink-400' : 'bg-blue-400'}`}>
                            <i className={`fas ${c.gender === 'Female' ? 'fa-venus' : 'fa-mars'}`}></i>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <p className="font-bold text-gray-800 text-sm truncate max-w-[120px]">{c.name}</p>
                             {expired && <span className="bg-red-500 text-white text-[7px] font-black px-1 rounded uppercase tracking-tighter">Expired</span>}
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium">{c.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-sm ${c.totalDebt > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {config.currencySymbol}{c.totalDebt.toFixed(2)}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Balance</p>
                      </div>
                    </div>
                    <div className="w-full mt-1">
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${limitUsage > 90 ? 'bg-red-500' : limitUsage > 50 ? 'bg-orange-400' : 'bg-green-400'}`} 
                          style={{ width: `${Math.min(100, limitUsage)}%` }}
                        ></div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredCustomers.length === 0 && (
                <div className="p-12 text-center text-gray-400 italic text-sm">Macmiil lama helin</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Detail View */}
        <div className="lg:col-span-2 space-y-8">
          {selectedCustomer ? (
            <div className="animate-fadeIn space-y-8">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className={`w-20 h-20 rounded-[2rem] ${selectedCustomer.gender === 'Female' ? 'bg-pink-500 shadow-pink-100' : 'bg-brand-primary shadow-brand-primary/10'} text-white flex items-center justify-center text-3xl font-black shadow-xl shrink-0`}>
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-black text-gray-800">{selectedCustomer.name}</h3>
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${selectedCustomer.gender === 'Female' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                        {selectedCustomer.gender === 'Female' ? 'Dumar' : 'Rag'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 mb-2">
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{selectedCustomer.phone}</p>
                      <div className="flex items-center gap-3 mt-1">
                         <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                            <i className="fas fa-calendar-check text-green-500 text-[9px]"></i>
                            <p className="text-gray-500 font-black uppercase tracking-widest text-[9px]">Bilow: {new Date(selectedCustomer.registrationDate).toLocaleDateString()}</p>
                         </div>
                         <div className={`flex items-center gap-1.5 px-2 py-1 ${isExpired(selectedCustomer.expiryDate) ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'} rounded-lg border`}>
                            <i className={`fas fa-calendar-times ${isExpired(selectedCustomer.expiryDate) ? 'text-red-500' : 'text-gray-400'} text-[9px]`}></i>
                            <p className={`${isExpired(selectedCustomer.expiryDate) ? 'text-red-600' : 'text-gray-500'} font-black uppercase tracking-widest text-[9px]`}>Dhammaad: {new Date(selectedCustomer.expiryDate).toLocaleDateString()}</p>
                         </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      {selectedCustomer.guarantorName && (
                        <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
                           <span className="text-[9px] font-black text-brand-secondary uppercase tracking-widest">Damiinka (Guarantor)</span>
                           <p className="text-xs font-bold text-gray-700">{selectedCustomer.guarantorName} - <span className="font-mono">{selectedCustomer.guarantorPhone}</span></p>
                        </div>
                      )}
                      <div className="flex gap-2 p-3 items-center">
                        <button onClick={handleOpenEdit} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                          <i className="fas fa-edit mr-1"></i> Bedel (Edit)
                        </button>
                        <button onClick={handleDelete} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
                          <i className="fas fa-user-minus mr-1"></i> Xir (Close)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 text-right">
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mugga Deynta</p>
                      <p className="text-4xl font-black text-red-600">{config.currencySymbol}{selectedCustomer.totalDebt.toFixed(2)}</p>
                   </div>
                   <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Xadka (Limit)</p>
                      <p className="text-sm font-black text-gray-700">{config.currencySymbol}{selectedCustomer.creditLimit.toFixed(2)}</p>
                   </div>
                   {isExpired(selectedCustomer.expiryDate) && (
                     <div className="mt-2 bg-red-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg animate-pulse">
                        Waqtigu waa dhammaaday
                     </div>
                   )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Repayment Form */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-money-check-dollar text-green-500"></i> Bixi Deynta (Repayment)
                  </h4>
                  <form onSubmit={handleClearDebt} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lacagta la bixinayo</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00"
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-black text-2xl text-center"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="w-full py-4 bg-green-600 text-white rounded-2xl font-black shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                      Xaqiiji Lacag bixinta
                    </button>
                  </form>
                </div>

                {/* Manual Debt Form Button */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6 flex flex-col justify-center">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-file-invoice-dollar text-red-500"></i> Diiwaangeli Amaah Cusub
                  </h4>
                  <p className="text-xs text-gray-500">Haddii macmiilku qaatay wax ka baxsan POS-ka, halkan kaga dar deynta.</p>
                  <button 
                    onClick={() => setIsAddingDebt(true)}
                    className="w-full py-4 bg-red-500 text-white rounded-2xl font-black shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <i className="fas fa-plus mr-2"></i> Amaah ku dar (Add Credit)
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                 <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs">Diiwaanka Dalabyada</h3>
                    <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-lg text-[10px] font-bold uppercase">{customerOrders.length} Dalab</span>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                             <th className="px-8 py-5">Order ID</th>
                             <th className="px-8 py-5">Alaabta</th>
                             <th className="px-8 py-5">Total</th>
                             <th className="px-8 py-5">Status</th>
                             <th className="px-8 py-5">Taariikh</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                          {customerOrders.map(o => (
                             <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-8 py-5 font-mono text-xs text-brand-secondary font-bold">#{o.id.split('-')[1]}</td>
                                <td className="px-8 py-5 text-xs text-gray-600 truncate max-w-[150px] font-medium">
                                  {o.items.length > 0 ? o.items.map(i => i.name).join(', ') : 'Manual Adjustment'}
                                </td>
                                <td className="px-8 py-5 font-black text-gray-800 text-sm">{config.currencySymbol}{o.total.toFixed(2)}</td>
                                <td className="px-8 py-5">
                                   <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${o.paymentMethod === 'Credit' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                      {o.paymentMethod === 'Credit' ? 'Amaah' : 'Paid'}
                                   </span>
                                </td>
                                <td className="px-8 py-5 text-[10px] text-gray-400 font-bold whitespace-nowrap">{new Date(o.timestamp).toLocaleDateString()}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50 p-24 text-center">
               <div className="w-32 h-32 bg-gray-100 rounded-[2.5rem] flex items-center justify-center mb-8 border-4 border-white shadow-inner">
                  <i className="fas fa-book-open text-5xl"></i>
               </div>
               <h3 className="text-2xl font-black uppercase tracking-widest text-gray-400">Buugga Macaamiisha</h3>
               <p className="max-w-xs text-sm font-medium mt-4">Fadlan ka dooro macmiil dhinaca bidix si aad u aragto deynta iyo xogtiisa buuxda.</p>
            </div>
          )}
        </div>
      </div>

      {/* ADD/EDIT CUSTOMER MODAL */}
      {(isAdding || isEditing) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 animate-scaleIn shadow-2xl overflow-y-auto max-h-[95vh] no-scrollbar">
              <div className="flex justify-between items-center mb-8">
                 <div>
                   <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{isEditing ? 'Bedel Macluumaadka' : 'Akoon Cusub'}</h3>
                   <p className="text-sm text-gray-500">Geli xogta macmiilka, jinsiga, iyo waqtiga deynta.</p>
                 </div>
                 <button onClick={() => { setIsAdding(false); setIsEditing(false); }} className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                    <i className="fas fa-times text-xl"></i>
                 </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Magaca Macmiilka</label>
                        <input required value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-secondary font-bold" placeholder="Ahmed Ali" />
                    </div>
                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Telefoonka</label>
                        <input value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-secondary font-bold" placeholder="+252 61..." />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jinsiga (Sex)</label>
                    <div className="grid grid-cols-2 gap-4">
                       <button type="button" onClick={() => setCustomerForm({...customerForm, gender: 'Male'})} className={`flex items-center justify-center gap-3 py-4 rounded-2xl font-black border-2 transition-all ${customerForm.gender === 'Male' ? 'bg-blue-500 border-blue-600 text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-blue-200'}`}>
                          <i className="fas fa-mars"></i> RAG (MALE)
                       </button>
                       <button type="button" onClick={() => setCustomerForm({...customerForm, gender: 'Female'})} className={`flex items-center justify-center gap-3 py-4 rounded-2xl font-black border-2 transition-all ${customerForm.gender === 'Female' ? 'bg-pink-500 border-pink-600 text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-pink-200'}`}>
                          <i className="fas fa-venus"></i> DUMAR (FEMALE)
                       </button>
                    </div>
                 </div>

                 <div className="p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100 space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <i className="fas fa-history"></i> Waqtiga Diiwaanka (Account Period)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2 text-left">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Taariikhda Bilowga</label>
                          <input type="date" value={customerForm.registrationDate} onChange={e => setCustomerForm({...customerForm, registrationDate: e.target.value})} className="w-full px-5 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-brand-secondary font-bold text-xs" />
                       </div>
                       <div className="space-y-2 text-left">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Taariikhda Dhammaadka</label>
                          <input type="date" value={customerForm.expiryDate} onChange={e => setCustomerForm({...customerForm, expiryDate: e.target.value})} className="w-full px-5 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-brand-secondary font-bold text-xs" />
                       </div>
                    </div>
                    <div className="space-y-2 text-left pt-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Limit-ka Amaahda ($)</label>
                        <input type="number" value={customerForm.creditLimit} onChange={e => setCustomerForm({...customerForm, creditLimit: e.target.value})} className="w-full px-6 py-4 bg-white border-none rounded-2xl focus:ring-2 focus:ring-brand-secondary font-bold text-center text-xl" placeholder="500" />
                    </div>
                 </div>

                 <div className="p-6 bg-brand-secondary/5 rounded-3xl border border-brand-secondary/10 space-y-4">
                    <h4 className="text-[10px] font-black text-brand-secondary uppercase tracking-widest mb-2 flex items-center gap-2">
                       <i className="fas fa-user-shield"></i> Xogta Damiinka (Guarantor)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                       <input value={customerForm.guarantorName} onChange={e => setCustomerForm({...customerForm, guarantorName: e.target.value})} className="w-full px-5 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-brand-secondary font-bold text-xs" placeholder="Magaca damiinka" />
                       <input value={customerForm.guarantorPhone} onChange={e => setCustomerForm({...customerForm, guarantorPhone: e.target.value})} className="w-full px-5 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-brand-secondary font-bold text-xs" placeholder="Tel-ka damiinka" />
                    </div>
                 </div>

                 <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notes (Faahfaahin)</label>
                    <textarea value={customerForm.notes} onChange={e => setCustomerForm({...customerForm, notes: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-secondary font-bold min-h-[80px]" placeholder="Warbixin dheeri ah..."></textarea>
                 </div>

                 <button type="submit" className="w-full bg-brand-primary text-white py-5 rounded-3xl font-black text-xl shadow-xl hover:opacity-95 transition-all">
                    {isEditing ? 'Keydi Isbeddellada' : 'Fura Akoonka'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* MANUAL DEBT MODAL */}
      {isAddingDebt && selectedCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 animate-scaleIn shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-red-600 uppercase tracking-tight">Deym ku dar</h3>
                <p className="text-xs text-gray-500">{selectedCustomer.name}</p>
              </div>
              <button onClick={() => setIsAddingDebt(false)} className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleManualDebtSubmit} className="space-y-6">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lacagta deynta ah</label>
                <input 
                  required 
                  type="number" 
                  step="0.01" 
                  value={manualDebt.amount} 
                  onChange={e => setManualDebt({...manualDebt, amount: e.target.value})} 
                  className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500 font-black text-2xl text-center" 
                  placeholder="0.00" 
                />
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sababta / Note</label>
                <textarea 
                  value={manualDebt.note} 
                  onChange={e => setManualDebt({...manualDebt, note: e.target.value})} 
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500 font-bold min-h-[100px]" 
                  placeholder="Sababta deynta loo qorayo..."
                ></textarea>
              </div>

              <button type="submit" className="w-full bg-red-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl hover:opacity-95 transition-all">
                Keydi Amaahda
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerBook;
