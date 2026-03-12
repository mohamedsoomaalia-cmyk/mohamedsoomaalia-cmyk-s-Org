
import React, { useState } from 'react';
import { StaffMember, SystemConfig } from '../types';
import toast from 'react-hot-toast';

interface LoginProps {
  staffMembers: StaffMember[];
  onLogin: (staff: StaffMember, authMethod: 'PIN' | 'FINGERPRINT') => void;
  config: SystemConfig;
}

const DefaultLogo = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 fill-brand-primary">
    <path d="M45,35 c0,0,5-10,0-15 c-5,5,0,15,0,15 M55,35 c0,0,5-10,0-15 c-5,5,0,15,0,15 M35,40 h30 v15 c0,10-10,15-15,15 s-15-5-15-15 V40 z M65,45 h5 c5,0,5,10,0,10 h-5 M25,70 c0,0,10,20,50,0 c-20,10-50,0-50,0" />
  </svg>
);

const Login: React.FC<LoginProps> = ({ staffMembers, onLogin, config }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      
      if (newPin.length === 4) {
        setTimeout(() => {
          const matchedStaff = staffMembers.find(s => s.pin === newPin);
          if (matchedStaff) {
            onLogin(matchedStaff, 'PIN');
          } else {
            setError(true);
            setPin('');
          }
        }, 300);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-brand-primary overflow-hidden">
      {/* Dynamic Background Image */}
      <div 
        className="absolute inset-0 opacity-40 bg-cover bg-center"
        style={{ backgroundImage: `url(${config.loginBgUrl})` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-brand-primary via-brand-primary/80 to-transparent"></div>

      <div className="w-full max-w-md p-8 flex flex-col items-center relative z-10 animate-fadeIn">
        <div className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-8 transform rotate-3 border-4 border-brand-secondary/20 overflow-hidden">
          {config.logoUrl ? (
            <img src={config.logoUrl} className="w-full h-full object-cover" alt="Logo" />
          ) : (
            <DefaultLogo />
          )}
        </div>
        
        <h1 className="text-4xl font-playfair font-black text-white mb-2 text-center drop-shadow-lg uppercase tracking-tight">{config.name}</h1>
        <p className="text-brand-secondary mb-4 font-black tracking-[0.2em] uppercase text-[10px] text-center max-w-[80%] mx-auto">{config.description}</p>
        <div className="h-px w-20 bg-brand-secondary/30 mb-8"></div>

        <div className="flex gap-6 mb-12">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 shadow-lg ${
                error ? 'border-red-500 bg-red-500 animate-bounce' : 
                pin.length > i ? 'bg-brand-secondary border-brand-secondary scale-150' : 'border-white/30 bg-black/20'
              }`}
            ></div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6 w-full max-w-[340px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-3xl font-black hover:bg-white/20 active:scale-90 transition-all flex items-center justify-center shadow-lg"
            >
              {num}
            </button>
          ))}
          <div className="w-20 h-20"></div>
          <button
            onClick={() => handleNumberClick('0')}
            className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-3xl font-black hover:bg-white/20 active:scale-90 transition-all flex items-center justify-center shadow-lg"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-20 h-20 rounded-3xl bg-white/5 text-white/50 text-2xl hover:text-white active:scale-90 transition-all flex items-center justify-center"
          >
            <i className="fas fa-backspace"></i>
          </button>
        </div>

        {error && (
          <div className="mt-8 px-6 py-2 bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-full text-red-200 font-bold text-xs animate-pulse">
            PIN-ka waa khalad. Mar kale isku day.
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
