import React, { useState, useMemo } from 'react';
import { Order, Product, StaffMember, SystemConfig, Expense, Settlement, UserRole, StaffLog } from '../types';
import toast from 'react-hot-toast';

interface ReportsProps {
  orders: Order[];
  products: Product[];
  staff: StaffMember[];
  config: SystemConfig;
  expenses: Expense[];
  settlements: Settlement[];
  onAddSettlement: (s: Settlement) => void;
  currentUser: StaffMember;
  staffLogs: StaffLog[];
}

const Reports: React.FC<ReportsProps> = ({ orders, products, staff, config, expenses, settlements, onAddSettlement, currentUser, staffLogs }) => {
  const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('today');
  const [closureMonth, setClosureMonth] = useState(new Date().getMonth() + 1);
  const [closureYear, setClosureYear] = useState(new Date().getFullYear());
  const [showClosure, setShowClosure] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'SALES' | 'SETTLEMENTS' | 'LOGS'>('SALES');

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return orders.filter(o => {
      const orderDate = new Date(o.timestamp);
      if (filter === 'today') return orderDate >= startOfToday;
      if (filter === 'week') return orderDate >= startOfWeek;
      if (filter === 'month') return orderDate >= startOfMonth;
      if (filter === 'year') return orderDate >= startOfYear;
      return true;
    });
  }, [orders, filter]);

  // Calculate unsettled sales per staff for settlement
  const staffUnsettledSales = useMemo(() => {
    const unsettledOrders = orders.filter(o => !o.settlementId);
    
    const salesMap: Record<string, { total: number, methods: Record<string, number> }> = {};
    
    unsettledOrders.forEach(o => {
      if (!salesMap[o.staffId]) {
        salesMap[o.staffId] = { total: 0, methods: {} };
      }
      salesMap[o.staffId].total += o.total;
      salesMap[o.staffId].methods[o.paymentMethod] = (salesMap[o.staffId].methods[o.paymentMethod] || 0) + o.total;
    });

    return salesMap;
  }, [orders]);

  const closureData = useMemo(() => {
    const targetOrders = orders.filter(o => {
      const d = new Date(o.timestamp);
      return d.getMonth() + 1 === closureMonth && d.getFullYear() === closureYear;
    });
    const targetExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === closureMonth && d.getFullYear() === closureYear;
    });

    const revenue = targetOrders.reduce((sum, o) => sum + o.total, 0);
    const expenseTotal = targetExpenses.reduce((sum, e) => sum + e.amount, 0);
    const tax = targetOrders.reduce((sum, o) => sum + o.tax, 0);
    
    return { revenue, expenseTotal, tax, profit: revenue - expenseTotal, orderCount: targetOrders.length };
  }, [orders, expenses, closureMonth, closureYear]);

  const yearlyClosureData = useMemo(() => {
    const targetOrders = orders.filter(o => new Date(o.timestamp).getFullYear() === closureYear);
    const targetExpenses = expenses.filter(e => new Date(e.date).getFullYear() === closureYear);

    const revenue = targetOrders.reduce((sum, o) => sum + o.total, 0);
    const expenseTotal = targetExpenses.reduce((sum, e) => sum + e.amount, 0);
    const tax = targetOrders.reduce((sum, o) => sum + o.tax, 0);
    
    return { revenue, expenseTotal, tax, profit: revenue - expenseTotal, orderCount: targetOrders.length };
  }, [orders, expenses, closureYear]);

  const stats = useMemo(() => {
    const totalSales = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalTax = filteredOrders.reduce((sum, o) => sum + o.tax, 0);
    const totalOrders = filteredOrders.length;
    const avgOrder = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    return { totalSales, totalTax, totalOrders, avgOrder };
  }, [filteredOrders]);

  const handlePrint = () => {
    window.print();
  };

  const handleSettle = () => {
    const staffMember = staff.find(s => s.id === selectedStaffId);
    if (!staffMember || !staffUnsettledSales[selectedStaffId]) return;

    const newSettlement: Settlement = {
      id: `SET-${Date.now()}`,
      staffId: selectedStaffId,
      staffName: staffMember.name,
      date: new Date().toISOString().split('T')[0],
      totalCollected: staffUnsettledSales[selectedStaffId].total,
      paymentMethods: staffUnsettledSales[selectedStaffId].methods,
      timestamp: new Date(),
      closedBy: currentUser.id
    };

    onAddSettlement(newSettlement);
    setShowSettlementModal(false);
    toast.success(config.language === 'Somali' ? "Xisaabta waa la xeray!" : "Account settled!");
  };

  const months = [
    "Janaayo", "Febraayo", "Maarso", "Abriil", "Maay", "Juun", 
    "Luulyo", "Agoosto", "Sebteembar", "Oktoobar", "Nofeembar", "Diseembar"
  ];

  return (
    <div className="p-8 space-y-8 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 no-print">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Warbixinta & Xisaab Xirka</h2>
          <p className="text-gray-500 font-medium">Falanqaynta iibka iyo xiritaanka xisaabaadka.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
            onClick={() => setShowSettlementModal(true)}
            className="px-6 py-4 bg-brand-primary text-white rounded-2xl font-black shadow-lg hover:scale-105 transition-all flex items-center gap-2"
           >
              <i className="fas fa-cash-register"></i> 
              <span>Xer Xisaabta Cashier</span>
           </button>
           <button 
            onClick={() => setShowClosure(true)}
            className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2"
           >
              <i className="fas fa-file-invoice-dollar"></i> 
              <span>Xisaab Xer Bille/Sanadle</span>
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-100 no-print">
        <button 
          onClick={() => setActiveTab('SALES')}
          className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'SALES' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Iibka (Sales)
        </button>
        <button 
          onClick={() => setActiveTab('SETTLEMENTS')}
          className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'SETTLEMENTS' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Xisaabaadka la Xeray
        </button>
        <button 
          onClick={() => setActiveTab('LOGS')}
          className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'LOGS' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Attendance & Logs
        </button>
      </div>

      {activeTab === 'SALES' ? (
        <>
          <div className="flex items-center justify-between no-print">
            <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 flex">
                {(['today', 'week', 'month', 'year', 'all'] as const).map((f) => (
                  <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-brand-primary text-white shadow-md' : 'text-gray-400 hover:text-brand-primary'}`}
                  >
                    {f === 'today' ? 'Maanta' : f === 'week' ? 'Toddobaad' : f === 'month' ? 'Bishan' : f === 'year' ? 'Sanadkan' : 'Dhammaan'}
                  </button>
                ))}
            </div>
            <button 
              onClick={handlePrint}
              className="px-6 py-4 bg-brand-secondary text-brand-primary rounded-2xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
                <i className="fas fa-print"></i> 
                <span className="hidden sm:inline">Print</span>
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
            <ReportStatCard title="Total Revenue" value={`${config.currencySymbol}${stats.totalSales.toFixed(2)}`} icon="fa-sack-dollar" color="bg-green-100 text-green-600" />
            <ReportStatCard title="Total Tax" value={`${config.currencySymbol}${stats.totalTax.toFixed(2)}`} icon="fa-percentage" color="bg-blue-100 text-blue-600" />
            <ReportStatCard title="Total Orders" value={stats.totalOrders} icon="fa-receipt" color="bg-purple-100 text-purple-600" />
            <ReportStatCard title="Avg. Sale" value={`${config.currencySymbol}${stats.avgOrder.toFixed(2)}`} icon="fa-chart-line" color="bg-orange-100 text-orange-600" />
          </div>

          {/* Main Table */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden no-print">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs">Transaction History</h3>
              <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-lg text-[10px] font-bold uppercase">{filteredOrders.length} Records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                    <th className="px-8 py-5">Order ID</th>
                    <th className="px-8 py-5">Alaabta (Items)</th>
                    <th className="px-8 py-5">Habka Lacagta</th>
                    <th className="px-8 py-5">Tax</th>
                    <th className="px-8 py-5 text-right">Total Amount</th>
                    <th className="px-8 py-5">Staff</th>
                    <th className="px-8 py-5">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOrders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5 font-mono text-xs text-brand-secondary font-bold">#{o.id.split('-')[1]}</td>
                      <td className="px-8 py-5">
                        <div className="max-w-[200px] truncate text-xs font-medium text-gray-600" title={o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}>
                          {o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${o.paymentMethod === 'Credit' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {o.paymentMethod}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-xs text-gray-400">{config.currencySymbol}{o.tax.toFixed(2)}</td>
                      <td className="px-8 py-5 text-right font-black text-gray-800 text-sm">{config.currencySymbol}{o.total.toFixed(2)}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-black uppercase">
                            {staff.find(s => s.id === o.staffId)?.name.charAt(0) || '?'}
                          </div>
                          <span className="text-xs font-bold text-gray-600">{staff.find(s => s.id === o.staffId)?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-[10px] text-gray-400 font-bold whitespace-nowrap">
                        {new Date(o.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOrders.length === 0 && (
                <div className="py-24 flex flex-col items-center justify-center text-gray-300">
                  <i className="fas fa-receipt text-5xl mb-4 opacity-20"></i>
                  <p className="font-black uppercase tracking-widest text-sm">Wax xog ah lagama helin</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : activeTab === 'SETTLEMENTS' ? (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden no-print">
          <div className="p-8 border-b border-gray-50">
            <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs">Settlement History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                  <th className="px-8 py-5">Staff Name</th>
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Total Collected</th>
                  <th className="px-8 py-5">Breakdown</th>
                  <th className="px-8 py-5">Closed By</th>
                  <th className="px-8 py-5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {settlements.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-gray-800">{s.staffName}</td>
                    <td className="px-8 py-5 text-xs text-gray-500">{s.date}</td>
                    <td className="px-8 py-5 font-black text-emerald-600">{config.currencySymbol}{s.totalCollected.toFixed(2)}</td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(s.paymentMethods).map(([method, amount]) => (
                          <span key={method} className="px-2 py-0.5 bg-gray-100 rounded text-[8px] font-bold text-gray-500">
                            {method}: {config.currencySymbol}{(amount as number).toFixed(2)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-xs text-gray-500">{staff.find(st => st.id === s.closedBy)?.name || 'Admin'}</td>
                    <td className="px-8 py-5 text-[10px] text-gray-400">{new Date(s.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {settlements.length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center text-gray-300">
                <i className="fas fa-history text-5xl mb-4 opacity-20"></i>
                <p className="font-black uppercase tracking-widest text-sm">Ma jiraan xisaabaad la xeray</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden no-print">
          <div className="p-8 border-b border-gray-50">
            <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs">Staff Attendance (Shift & Auth Method)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                  <th className="px-8 py-5">Staff Name</th>
                  <th className="px-8 py-5">Activity</th>
                  <th className="px-8 py-5">Shift</th>
                  <th className="px-8 py-5">Auth Method</th>
                  <th className="px-8 py-5">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {staffLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-gray-800">{log.staffName}</td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${log.type === 'LOGIN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${log.shift === 'Day' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {log.shift === 'Day' ? 'Maalin' : 'Habeen'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-2 py-1 bg-gray-100 rounded-md text-[9px] font-black uppercase text-gray-600">
                        {log.authMethod || 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {staffLogs.length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center text-gray-300">
                <i className="fas fa-user-clock text-5xl mb-4 opacity-20"></i>
                <p className="font-black uppercase tracking-widest text-sm">Ma jiraan wax logs ah</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cashier Settlement Modal */}
      {showSettlementModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-brand-primary/5">
              <div>
                <h3 className="text-2xl font-black text-brand-primary">Xer Xisaabta Cashier</h3>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Hubi lacagta uu qabtay cashier-ka maanta</p>
              </div>
              <button onClick={() => setShowSettlementModal(false)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Dooro Cashier-ka</label>
                <select 
                  value={selectedStaffId} 
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="">-- Dooro Shaqaale --</option>
                  {staff.filter(s => s.role === UserRole.CASHIER || s.role === UserRole.WAITER || s.role === UserRole.ADMIN).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              {selectedStaffId && staffUnsettledSales[selectedStaffId] ? (
                <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4">
                  <div className="flex justify-between items-end border-b border-gray-200 pb-4">
                    <span className="text-gray-500 font-bold">Total Unsettled Amount:</span>
                    <span className="text-3xl font-black text-brand-primary">{config.currencySymbol}{staffUnsettledSales[selectedStaffId].total.toFixed(2)}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Breakdown by Payment Method:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(staffUnsettledSales[selectedStaffId].methods).map(([method, amount]) => (
                        <div key={method} className="flex justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                          <span className="text-xs font-bold text-gray-500">{method}</span>
                          <span className="text-xs font-black text-gray-800">{config.currencySymbol}{(amount as number).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleSettle}
                    className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-check-circle"></i> Xer Xisaabta & Xir Shaqada
                  </button>
                </div>
              ) : selectedStaffId ? (
                <div className="p-12 text-center text-gray-400 bg-gray-50 rounded-[2rem]">
                  <i className="fas fa-info-circle text-3xl mb-3 opacity-20"></i>
                  <p className="font-bold">Shaqaalahan wax iib ah ma samayn maanta.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Financial Closure Modal */}
      {showClosure && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-emerald-50/30">
              <div>
                <h3 className="text-2xl font-black text-emerald-800">Xisaab Xer (Financial Closure)</h3>
                <p className="text-emerald-600/60 text-xs font-bold uppercase tracking-widest">Maamul xisaabaadka bisha iyo sanadka</p>
              </div>
              <button onClick={() => setShowClosure(false)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Dooro Bisha</label>
                  <select 
                    value={closureMonth} 
                    onChange={(e) => setClosureMonth(parseInt(e.target.value))}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500"
                  >
                    {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Dooro Sanadka</label>
                  <select 
                    value={closureYear} 
                    onChange={(e) => setClosureYear(parseInt(e.target.value))}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500"
                  >
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Warbixinta Bisha: {months[closureMonth-1]}</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span>Revenue:</span><span className="font-black">{config.currencySymbol}{closureData.revenue.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span>Expenses:</span><span className="font-black text-red-500">-{config.currencySymbol}{closureData.expenseTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200"><span>Net Profit:</span><span className={`font-black ${closureData.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{config.currencySymbol}{closureData.profit.toFixed(2)}</span></div>
                  </div>
                </div>
                <div className="p-6 bg-emerald-900 text-white rounded-[2rem] shadow-xl">
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4">Warbixinta Sanadka: {closureYear}</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span>Revenue:</span><span className="font-black">{config.currencySymbol}{yearlyClosureData.revenue.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span>Expenses:</span><span className="font-black text-emerald-300">-{config.currencySymbol}{yearlyClosureData.expenseTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm pt-2 border-t border-emerald-800"><span>Net Profit:</span><span className="font-black text-emerald-400 text-lg">{config.currencySymbol}{yearlyClosureData.profit.toFixed(2)}</span></div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => { window.print(); }}
                  className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-print"></i> Daabac Xisaab Xer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY VIEW (OPTIMIZED FOR THERMAL OR A4) */}
      <div id="printable-receipt" className="hidden print:block font-mono text-[10px] text-black bg-white uppercase p-4">
        <div className="text-center mb-6 border-b border-black pb-4">
          <h1 className="text-xl font-black">{config.name}</h1>
          <p className="text-sm">{showClosure ? `Xisaab Xer: ${months[closureMonth-1]} ${closureYear}` : `Warbixinta Iibka (${filter.toUpperCase()})`}</p>
          <p>Taariikhda la daabacay: {new Date().toLocaleString()}</p>
        </div>

        {showClosure ? (
          <div className="space-y-6">
            <div className="border border-black p-4">
              <h2 className="font-black border-b border-black mb-2">WARBIXINTA BISHA ({months[closureMonth-1]} {closureYear})</h2>
              <p>Total Revenue: {config.currencySymbol}{closureData.revenue.toFixed(2)}</p>
              <p>Total Expenses: {config.currencySymbol}{closureData.expenseTotal.toFixed(2)}</p>
              <p>Total Tax: {config.currencySymbol}{closureData.tax.toFixed(2)}</p>
              <p className="font-black mt-2 pt-2 border-t border-black">NET PROFIT: {config.currencySymbol}{closureData.profit.toFixed(2)}</p>
              <p>Total Orders: {closureData.orderCount}</p>
            </div>
            <div className="border border-black p-4">
              <h2 className="font-black border-b border-black mb-2">WARBIXINTA SANADKA ({closureYear})</h2>
              <p>Total Revenue: {config.currencySymbol}{yearlyClosureData.revenue.toFixed(2)}</p>
              <p>Total Expenses: {config.currencySymbol}{yearlyClosureData.expenseTotal.toFixed(2)}</p>
              <p>Total Tax: {config.currencySymbol}{yearlyClosureData.tax.toFixed(2)}</p>
              <p className="font-black mt-2 pt-2 border-t border-black">NET PROFIT: {config.currencySymbol}{yearlyClosureData.profit.toFixed(2)}</p>
              <p>Total Orders: {yearlyClosureData.orderCount}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6 border-b border-black pb-4">
              <div>
                <p className="font-black">Summary:</p>
                <p>Total Revenue: {config.currencySymbol}{stats.totalSales.toFixed(2)}</p>
                <p>Total Tax: {config.currencySymbol}{stats.totalTax.toFixed(2)}</p>
                <p>Total Orders: {stats.totalOrders}</p>
                <p>Avg Order: {config.currencySymbol}{stats.avgOrder.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p>Xafiiska Maamulka</p>
                <p>{config.address}</p>
                <p>{config.phone}</p>
              </div>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black font-black">
                  <th className="py-2">ID</th>
                  <th className="py-2">Items</th>
                  <th className="py-2">Method</th>
                  <th className="py-2 text-right">Total</th>
                  <th className="py-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => (
                  <tr key={o.id} className="border-b border-gray-200">
                    <td className="py-2">#{o.id.split('-')[1]}</td>
                    <td className="py-2 max-w-[150px] truncate">{o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
                    <td className="py-2">{o.paymentMethod}</td>
                    <td className="py-2 text-right">{config.currencySymbol}{o.total.toFixed(2)}</td>
                    <td className="py-2 text-right text-[8px]">{new Date(o.timestamp).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div className="mt-8 text-center pt-8 border-t border-dashed border-black">
          <p className="font-black">Mahadsanid - Koob Coffee MS</p>
          <p className="text-[8px] italic opacity-70">Nidaamkan waxaa iska leh {config.name}</p>
        </div>
      </div>
    </div>
  );
};

const ReportStatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-lg transition-all">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${color}`}>
        <i className={`fas ${icon} text-lg`}></i>
      </div>
      <div>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-black text-gray-800">{value}</h3>
      </div>
    </div>
  </div>
);

export default Reports;
