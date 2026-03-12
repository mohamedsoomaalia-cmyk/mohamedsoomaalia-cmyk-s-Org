
import React, { useState, useRef } from 'react';
import { Product, StaffMember, UserRole, SystemConfig, Category } from '../types';
import toast from 'react-hot-toast';

interface InventoryProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (p: Product) => void;
  onUpdateProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddCategory: (c: Category) => void;
  onUpdateCategory: (c: Category) => void;
  onDeleteCategory: (id: string) => void;
  currentUser: StaffMember;
  config: SystemConfig;
}

const Inventory: React.FC<InventoryProps> = ({ 
  products, categories, onAddProduct, onUpdateProduct, onDeleteProduct, 
  onAddCategory, onUpdateCategory, onDeleteCategory, currentUser, config 
}) => {
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: categories[0]?.name || 'Coffee',
    price: '',
    stock: '',
    minStock: '',
    image: ''
  });

  const canManage = [UserRole.ADMIN, UserRole.MANAGER].includes(currentUser.role);
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Sawirku aad buu u weyn yahay (Max 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      minStock: parseInt(formData.minStock),
      image: formData.image || 'https://picsum.photos/seed/' + Date.now() + '/200/200'
    };

    if (editingProduct) {
      onUpdateProduct({ ...editingProduct, ...payload });
      setEditingProduct(null);
    } else {
      const newProduct: Product = {
        id: `P-${Date.now()}`,
        ...payload
      };
      onAddProduct(newProduct);
      setIsAdding(false);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', category: categories[0]?.name || 'Coffee', price: '', stock: '', minStock: '', image: '' });
  };

  const startEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category,
      price: p.price.toString(),
      stock: p.stock.toString(),
      minStock: p.minStock.toString(),
      image: p.image
    });
  };

  return (
    <div className="p-8 space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Inventory Management</h2>
          <p className="text-gray-500">Halkan ka maamul, ka bedel, ama ka tirtir alaabta kaydka.</p>
        </div>
        {canManage && (
          <div className="flex gap-3">
             <button onClick={() => setShowCategoryManager(true)} className="px-6 py-3 bg-white border-2 border-brand-secondary/20 text-brand-primary rounded-2xl hover:border-brand-secondary transition-all shadow-sm flex items-center gap-2 font-bold">
                <i className="fas fa-tags"></i> Qaybaha (Categories)
             </button>
             <button onClick={() => setIsAdding(true)} className="px-6 py-3 bg-[#3d2b1f] text-white rounded-2xl hover:bg-black transition-all shadow-lg flex items-center gap-2 font-bold">
                <i className="fas fa-plus"></i> Ku dar Alaab Cusub
             </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
           <div className="relative flex-1">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input 
                type="text" 
                placeholder="Raadi alaabta magaceeda..." 
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#c6a07d] focus:border-transparent transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white text-gray-400 text-[10px] uppercase tracking-[0.2em] font-black border-b border-gray-100">
                <th className="px-8 py-5">Alaabta / Item</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5">Price</th>
                <th className="px-6 py-5">Stock Level</th>
                <th className="px-6 py-5">Status</th>
                {canManage && <th className="px-8 py-5 text-right">Maamulka</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(product => {
                const isLow = product.stock <= product.minStock;
                return (
                  <tr key={product.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-gray-50 flex items-center justify-center">
                          {product.image ? (
                            <img src={product.image} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <i className="fas fa-image text-gray-300"></i>
                          )}
                        </div>
                        <span className="font-bold text-gray-800">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold">{product.category}</span>
                    </td>
                    <td className="px-6 py-5 font-black text-[#3d2b1f]">${product.price.toFixed(2)}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className={`font-black text-lg ${isLow ? 'text-red-500' : 'text-gray-800'}`}>{product.stock}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Min: {product.minStock}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {isLow ? (
                        <div className="flex items-center gap-2 text-red-500">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                          <span className="text-xs font-black uppercase">Low Stock</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-500">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          <span className="text-xs font-black uppercase">In Stock</span>
                        </div>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                           <button 
                            onClick={() => startEdit(product)} 
                            title="Bedel alaabta"
                            className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                           >
                             <i className="fas fa-edit text-sm"></i>
                           </button>
                           <button 
                            onClick={() => onDeleteProduct(product.id)} 
                            title="Tir alaabta"
                            className="w-10 h-10 flex items-center justify-center bg-red-50 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                           >
                             <i className="fas fa-trash-alt text-sm"></i>
                           </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <i className="fas fa-search text-4xl mb-4 opacity-20"></i>
              <p className="font-bold">Wax alaab ah lama helin.</p>
            </div>
          )}
        </div>
      </div>

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 animate-scaleIn shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
             <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-800">Maamul Qaybaha</h3>
                  <p className="text-sm text-gray-500">Ku dar ama tirtir qaybaha alaabta.</p>
                </div>
                <button onClick={() => setShowCategoryManager(false)} className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-800 transition-all">
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
                    className="flex-1 px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#c6a07d] font-bold"
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

      {(isAdding || editingProduct) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 animate-scaleIn shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
             <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-800">{editingProduct ? 'Bedel Macluumaadka' : 'Diiwaangeli Alaab'}</h3>
                  <p className="text-sm text-gray-500">{editingProduct ? 'Cusboonaysii xogta alaabtan halkan.' : 'Buuxi foomka si aad ugu darto alaab cusub.'}</p>
                </div>
                <button onClick={() => { setIsAdding(false); setEditingProduct(null); resetForm(); }} className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-800 transition-all">
                  <i className="fas fa-times text-xl"></i>
                </button>
             </div>
             
             <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Selection Section */}
                <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col items-center gap-4">
                  <div className="w-32 h-32 bg-white rounded-[2rem] shadow-xl border-4 border-[#c6a07d]/20 overflow-hidden flex items-center justify-center relative group">
                    {formData.image ? (
                      <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <i className="fas fa-image text-4xl text-gray-200"></i>
                    )}
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                    >
                      <i className="fas fa-camera text-2xl"></i>
                    </button>
                  </div>
                  
                  <div className="w-full grid grid-cols-1 gap-3">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 bg-white border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-bold text-xs hover:border-[#c6a07d] hover:text-[#c6a07d] transition-all flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-upload"></i> Soo geli Sawir
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                    
                    <div className="relative">
                      <i className="fas fa-link absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                      <input 
                        type="text"
                        placeholder="Ama geli URL-ka sawirka..."
                        value={formData.image.startsWith('data:') ? '' : formData.image}
                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#c6a07d] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Magaca Alaabta (Item Name)</label>
                   <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#c6a07d] font-bold" placeholder="Tusaale: Iced Latte" />
                </div>
                
                <div className="space-y-2">
                   <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Qaybta (Category)</label>
                   <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#c6a07d] font-bold">
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                   </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Qiimaha ($)</label>
                      <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#c6a07d] font-bold text-center" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Tirada Kaydka (Stock)</label>
                      <input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#c6a07d] font-bold text-center" />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Xadka Digniinta (Minimum Stock Level)</label>
                   <input type="number" required value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#c6a07d] font-bold text-center" />
                </div>

                <button type="submit" className="w-full bg-[#3d2b1f] text-white py-5 rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl mt-4">
                  {editingProduct ? 'Cusboonaysii Alaabta' : 'Keydi Alaabta Cusub'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
