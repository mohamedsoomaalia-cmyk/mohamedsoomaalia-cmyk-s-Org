
// @ts-nocheck
import React, { useState, useRef } from 'react';
import { StaffMember, UserRole, SystemConfig } from '../types';
import toast from 'react-hot-toast';

interface StaffProps {
  staff: StaffMember[];
  onAddStaff: (s: StaffMember) => void;
  onUpdateStaff: (u: StaffMember) => void;
  onDeleteStaff: (id: string) => void;
  currentUser: StaffMember;
  config: SystemConfig;
}

const Staff: React.FC<StaffProps> = ({ staff, onAddStaff, onUpdateStaff, onDeleteStaff, currentUser, config }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    role: UserRole.WAITER,
    phone: '',
    gender: 'Male' as 'Male' | 'Female',
    status: 'Active' as 'Active' | 'On Leave' | 'Inactive',
    pin: '1234',
    image: '',
    guarantorName: '',
    guarantorPhone: ''
  });

  const canManage = [UserRole.ADMIN, UserRole.MANAGER].includes(currentUser.role);

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

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: StaffMember = {
      id: `S-${Date.now()}`,
      name: formData.name,
      role: formData.role,
      phone: formData.phone,
      gender: formData.gender,
      joinDate: new Date().toISOString().split('T')[0],
      status: formData.status,
      pin: formData.pin,
      image: formData.image,
      guarantorName: formData.guarantorName,
      guarantorPhone: formData.guarantorPhone
    };
    onAddStaff(newMember);
    setIsAdding(false);
    resetForm();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff) {
      onUpdateStaff({
        ...editingStaff,
        name: formData.name,
        role: formData.role,
        phone: formData.phone,
        gender: formData.gender,
        status: formData.status,
        pin: formData.pin,
        image: formData.image,
        guarantorName: formData.guarantorName,
        guarantorPhone: formData.guarantorPhone
      });
      setEditingStaff(null);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', role: UserRole.WAITER, phone: '', gender: 'Male', status: 'Active', pin: '1234', image: '',
      guarantorName: '', guarantorPhone: ''
    });
  };

  const startEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      role: member.role,
      phone: member.phone,
      gender: member.gender || 'Male',
      status: member.status,
      pin: member.pin,
      image: member.image || '',
      guarantorName: member.guarantorName || '',
      guarantorPhone: member.guarantorPhone || ''
    });
  };

  const handleFingerprintRegister = async (member: StaffMember) => {
    try {
      if (!window.PublicKeyCredential) {
        toast.error("Browser-kaagu ma taageero Fingerprint-ka.");
        return;
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      const userID = new TextEncoder().encode(member.id);
      
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: config.name,
          id: window.location.hostname,
        },
        user: {
          id: userID,
          name: member.name,
          displayName: member.name,
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "none",
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });

      if (credential) {
        onUpdateStaff({ ...member, fingerprintId: credential.id });
        toast.success(config.language === 'Somali' ? "Fingerprint-ka waa lagu daray!" : "Fingerprint registered!");
      }
    } catch (err) {
      console.error("Fingerprint registration failed:", err);
      toast.error(config.language === 'Somali' ? "Fingerprint-ka waa lagu guuldareystay." : "Fingerprint registration failed.");
    }
  };

  return (
    <div className="p-8 space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Staff Management</h2>
          <p className="text-gray-500">Diiwaanka iyo maamulka shaqaalaha Koob Coffee.</p>
        </div>
        {canManage && (
          <button onClick={() => setIsAdding(true)} className="px-4 py-2 bg-[#c6a07d] text-white rounded-lg hover:bg-[#b08d6c] shadow-lg transition-all flex items-center gap-2 font-bold">
            <i className="fas fa-user-plus"></i> Ku dar Shaqaale
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map(member => (
          <div key={member.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col items-center text-center relative group">
            {canManage && (
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => startEdit(member)}
                  className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-[#c6a07d]"
                >
                  <i className="fas fa-edit text-xs"></i>
                </button>
                <button 
                  onClick={() => onDeleteStaff(member.id)}
                  className="p-2 bg-red-50 rounded-lg text-red-300 hover:text-red-500"
                >
                  <i className="fas fa-trash text-xs"></i>
                </button>
              </div>
            )}
            
            <div className="relative mb-4">
              <div className={`w-24 h-24 rounded-full border-4 ${member.gender === 'Female' ? 'border-pink-50' : 'border-blue-50'} shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center`}>
                {member.image ? (
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <img src={`https://i.pravatar.cc/150?u=${member.id}`} alt={member.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-4 border-white shadow-sm ${member.status === 'Active' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white shadow-sm ${member.gender === 'Female' ? 'bg-pink-500' : 'bg-blue-500'}`}>
                <i className={`fas ${member.gender === 'Female' ? 'fa-venus' : 'fa-mars'}`}></i>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-800">{member.name}</h3>
            <div className="flex gap-2 items-center mb-3">
               <span className="text-[10px] font-semibold text-[#c6a07d] uppercase tracking-wider px-3 py-1 bg-[#c6a07d]/10 rounded-full">
                {member.role}
               </span>
               <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${member.gender === 'Female' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                  {member.gender === 'Female' ? 'Dumar' : 'Rag'}
               </span>
            </div>
            
            <div className="w-full space-y-2 mb-2">
              <div className="flex justify-between text-[10px] text-gray-500">
                <span className="font-bold uppercase">Phone:</span>
                <span className="font-medium text-gray-700">{member.phone}</span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-500">
                <span className="font-bold uppercase">PIN:</span>
                <span className="font-mono text-gray-700">{canManage ? member.pin : '****'}</span>
              </div>
              {member.guarantorName && (
                 <div className="mt-3 p-2 bg-gray-50 rounded-xl border border-gray-100 text-left">
                    <p className="text-[8px] font-black text-[#c6a07d] uppercase tracking-widest mb-1">Damiinka (Guarantor)</p>
                    <p className="text-[10px] font-bold text-gray-700">{member.guarantorName}</p>
                    <p className="text-[9px] font-mono text-gray-400">{member.guarantorPhone}</p>
                 </div>
              )}
              {canManage && (
                <button 
                  onClick={() => handleFingerprintRegister(member)}
                  className={`w-full mt-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${member.fingerprintId ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-400 border border-gray-200 hover:bg-brand-secondary/10 hover:text-brand-secondary hover:border-brand-secondary/20'}`}
                >
                  <i className={`fas ${member.fingerprintId ? 'fa-fingerprint' : 'fa-plus-circle'}`}></i>
                  {member.fingerprintId ? 'Fingerprint Registered' : 'Register Fingerprint'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {(isAdding || editingStaff) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 animate-scaleIn overflow-y-auto max-h-[90vh] no-scrollbar shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold">{editingStaff ? 'Bedel Shaqaalaha' : 'Diiwaangeli Shaqaale'}</h3>
                  <p className="text-xs text-gray-400">Buuxi xogta shaqaalaha iyo damiinka hoos.</p>
                </div>
                <button onClick={() => { setIsAdding(false); setEditingStaff(null); resetForm(); }} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
                  <i className="fas fa-times"></i>
                </button>
             </div>

             <form onSubmit={editingStaff ? handleEditSubmit : handleAddSubmit} className="space-y-5">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center gap-4">
                  <div className="w-24 h-24 rounded-full shadow-lg border-4 border-[#c6a07d]/20 overflow-hidden flex items-center justify-center relative group bg-white">
                    {formData.image ? (
                      <img src={formData.image} className="w-full h-full object-cover" alt="Staff Preview" />
                    ) : (
                      <i className="fas fa-user text-4xl text-gray-200"></i>
                    )}
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                    >
                      <i className="fas fa-camera"></i>
                    </button>
                  </div>
                  
                  <div className="w-full grid grid-cols-1 gap-2">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 bg-white border border-gray-200 rounded-xl text-gray-500 font-bold text-[10px] hover:border-[#c6a07d] hover:text-[#c6a07d] transition-all flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-upload"></i> Soo geli Sawir
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Magaca</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#c6a07d] font-bold" placeholder="Magaca oo buuxa" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Telefoonka</label>
                    <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#c6a07d] font-bold" placeholder="252..." />
                  </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jinsiga (Sex)</label>
                    <div className="grid grid-cols-2 gap-4">
                       <button type="button" onClick={() => setFormData({...formData, gender: 'Male'})} className={`flex items-center justify-center gap-3 py-3 rounded-xl font-black border-2 transition-all ${formData.gender === 'Male' ? 'bg-blue-500 border-blue-600 text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-blue-200'}`}>
                          <i className="fas fa-mars"></i> RAG (MALE)
                       </button>
                       <button type="button" onClick={() => setFormData({...formData, gender: 'Female'})} className={`flex items-center justify-center gap-3 py-3 rounded-xl font-black border-2 transition-all ${formData.gender === 'Female' ? 'bg-pink-500 border-pink-600 text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-pink-200'}`}>
                          <i className="fas fa-venus"></i> DUMAR (FEMALE)
                       </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Doorka (Role)</label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#c6a07d] font-bold">
                        {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Login PIN</label>
                    <input required maxLength={4} value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#c6a07d] font-mono font-bold text-center" placeholder="1234" />
                  </div>
                </div>

                <div className="p-5 bg-brand-secondary/5 rounded-2xl border border-brand-secondary/10 space-y-4">
                    <h4 className="text-[10px] font-black text-brand-secondary uppercase tracking-widest mb-2 flex items-center gap-2">
                       <i className="fas fa-user-shield"></i> Damiinka Shaqaalaha (Guarantor)
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                       <input value={formData.guarantorName} onChange={e => setFormData({...formData, guarantorName: e.target.value})} className="w-full px-4 py-2 bg-white border-none rounded-xl focus:ring-2 focus:ring-brand-secondary font-bold text-xs" placeholder="Magaca damiinka" />
                       <input value={formData.guarantorPhone} onChange={e => setFormData({...formData, guarantorPhone: e.target.value})} className="w-full px-4 py-2 bg-white border-none rounded-xl focus:ring-2 focus:ring-brand-secondary font-bold text-xs font-mono" placeholder="Tel-ka damiinka" />
                    </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Xaaladda (Status)</label>
                   <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#c6a07d] font-bold">
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Inactive">Inactive</option>
                   </select>
                </div>
                <button type="submit" className="w-full bg-[#c6a07d] text-white py-4 rounded-xl font-black shadow-xl hover:bg-[#b08d6c] transition-all">
                   {editingStaff ? 'Cusboonaysii Shaqaalaha' : 'Keydi Shaqaalaha'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
