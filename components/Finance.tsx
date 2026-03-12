
// @ts-nocheck
import React, { useState } from 'react';
import { Order, Expense, SystemConfig } from '../types';

interface FinanceProps {
  orders: Order[];
  expenses: Expense[];
  onAddExpense: (e: Expense) => void;
  config: SystemConfig;
}

const Finance: React.FC<FinanceProps> = ({ orders, expenses, onAddExpense, config }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ title: '', amount: '', category: 'Inventory' });

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      title: formData.title,
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: new Date().toISOString().split('T')[0]
    };
    onAddExpense(newExpense);
    setIsAdding(false);
    setFormData({ title: '', amount: '', category: 'Inventory' });
  };

  return (
    <div className="p-8 space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Finance & Expenses</h2>
          <p className="text-gray-500">Maamul lacagta soo gasha iyo kuwa baxa.</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="px-4 py-2 bg-[#c6a07d] text-white rounded-lg hover:bg-[#b08d6c]">
          <i className="fas fa-plus mr-2"></i> Diiwaangeli Kharash
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border-l-4 border-green-500 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Total Revenue (All Time)</p>
          <h3 className="text-3xl font-bold mt-2 text-gray-800">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border-l-4 border-red-500 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Total Expenses</p>
          <h3 className="text-3xl font-bold mt-2 text-gray-800">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border-l-4 border-blue-500 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Net Profit</p>
          <h3 className={`text-3xl font-bold mt-2 ${netProfit < 0 ? 'text-red-500' : 'text-gray-800'}`}>${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold">Diiwaanka Kharashka</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Expense Title</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{e.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{e.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{e.date}</td>
                  <td className="px-6 py-4 font-bold text-red-500 text-right">-${e.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 animate-scaleIn">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Diiwaangeli Kharash</h3>
                <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
             </div>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Ujeedada Kharashka</label>
                   <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Qaybta</label>
                   <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 border rounded-xl">
                      <option value="Inventory">Inventory (Alaab)</option>
                      <option value="Salary">Mushahar</option>
                      <option value="Rent">Kirada</option>
                      <option value="Utility">Utility (Koronto/Biyo)</option>
                      <option value="Marketing">Marketing</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Lacagta ($)</label>
                   <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <button type="submit" className="w-full bg-[#c6a07d] text-white py-3 rounded-xl font-bold hover:bg-[#b08d6c]">Keydi Kharashka</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
