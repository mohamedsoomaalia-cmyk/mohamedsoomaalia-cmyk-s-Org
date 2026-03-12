
// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getBusinessInsights } from '../services/geminiService';
import { Product, Order, SystemConfig } from '../types';
import { translations } from '../translations';

interface DashboardProps {
  products: Product[];
  orders: Order[];
  systemName: string;
  config: SystemConfig;
}

const Dashboard: React.FC<DashboardProps> = ({ products, orders, systemName, config }) => {
  const t = translations[config.language];
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const todayOrders = orders.filter(o => new Date(o.timestamp) >= today);
    const dailyRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
    return { revenue: dailyRevenue.toFixed(2), orders: todayOrders.length, customers: todayOrders.length, lowStock: lowStockCount };
  }, [orders, products]);

  const salesByDay = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map(d => ({ name: d, sales: 0 }));
    orders.forEach(o => { data[new Date(o.timestamp).getDay()].sales += o.total; });
    return data;
  }, [orders]);

  const fetchInsights = useCallback(async () => {
    setLoadingInsights(true);
    try {
      const res = await getBusinessInsights(salesByDay, { lowStockCount: stats.lowStock });
      setInsights(res);
    } catch (err) { 
      setInsights(config.language === 'Somali' ? "Error loading insights. Fadlan hubi khadkaaga internetka." : "Error loading insights. Please check your connection."); 
    }
    finally { setLoadingInsights(false); }
  }, [salesByDay, stats.lowStock, config.language]);

  useEffect(() => { 
    fetchInsights(); 
  }, [fetchInsights]);

  return (
    <div className="p-8 space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">{t.welcome}, {systemName}!</h2>
          <p className="text-gray-500 font-medium">{config.language === 'Somali' ? 'Falanqaynta ganacsiga iyo warbixinnada maanta.' : 'Business analysis and reports for today.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t.revenue} value={`${config.currencySymbol}${stats.revenue}`} icon="fa-dollar-sign" color="bg-green-100 text-green-600" trend={t.date} />
        <StatCard title={t.orders} value={stats.orders} icon="fa-receipt" color="bg-blue-100 text-blue-600" trend={t.pos} />
        <StatCard title={t.customers} value={stats.customers} icon="fa-users" color="bg-purple-100 text-purple-600" trend={t.customers} />
        <StatCard title={t.low_stock} value={stats.lowStock} icon="fa-box-open" color="bg-orange-100 text-orange-600" trend={t.inventory} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="text-lg font-black mb-8 uppercase tracking-widest text-gray-400">{t.weekly_perf}</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="sales" fill="var(--brand-secondary)" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-brand-primary text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
              <i className="fas fa-wand-magic-sparkles text-brand-secondary"></i>
            </div>
            <h3 className="text-lg font-black uppercase tracking-widest">{t.ai_insights}</h3>
          </div>
          <div className="flex-1 space-y-4 text-white/80 leading-relaxed relative z-10">
            {loadingInsights ? (
              <div className="space-y-4 animate-pulse"><div className="h-4 bg-white/10 rounded w-3/4"></div><div className="h-4 bg-white/10 rounded w-full"></div><div className="h-4 bg-white/10 rounded w-5/6"></div></div>
            ) : (
              <div className={`prose prose-sm prose-invert whitespace-pre-wrap text-sm font-medium ${insights?.includes('Quota') ? 'text-orange-300' : ''}`}>
                {insights || (config.language === 'Somali' ? "Wax faallo ah lagama helin AI-ga." : "No insights found from AI.")}
              </div>
            )}
          </div>
          <button onClick={fetchInsights} disabled={loadingInsights} className="mt-8 w-full py-4 bg-brand-secondary text-brand-primary rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 relative z-10 shadow-lg disabled:opacity-50">
            {loadingInsights ? (config.language === 'Somali' ? 'Falanqaynayaa...' : 'Analyzing...') : t.refresh_ai}
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, trend }: any) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-all">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black text-gray-800">{value}</h3>
      </div>
      <div className={`p-4 rounded-2xl shadow-inner ${color}`}><i className={`fas ${icon} text-xl`}></i></div>
    </div>
    <div className="mt-4"><span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded-md">{trend}</span></div>
  </div>
);

export default Dashboard;
