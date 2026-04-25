import React, { useState } from 'react';
import { ShieldCheck, User, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { getUsers } from '../utils/storage';
import { AppUser } from '../types';

interface LoginProps {
  onLogin: (user: AppUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const users = await getUsers();
      
      // Case insensitive username match and trim whitespace
      const user = users.find(u => 
        u.username.toLowerCase().trim() === username.toLowerCase().trim() && 
        u.password === password
      );

      if (user) {
        onLogin(user);
      } else {
        setLoading(false);
        setError('Usuario o contraseña incorrectos. Verifique sus credenciales.');
      }
    } catch (err) {
      console.error("Login component error:", err);
      setLoading(false);
      setError('Error al intentar acceder. Verifique su conexión y vuelva a intentarlo.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')] opacity-10"></div>
          <div className="relative z-10 flex flex-col items-center">
             <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 mb-4 shadow-lg">
                <ShieldCheck className="w-10 h-10 text-white" />
             </div>
             <h1 className="text-2xl font-bold text-white tracking-wide">ALEX CONSULTING</h1>
             <p className="text-blue-200 text-sm font-medium uppercase tracking-widest mt-1">Servicios Médicos Ocupacionales</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
           <form onSubmit={handleLogin} className="space-y-6">
              
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase ml-1">Usuario</label>
                 <div className="relative group">
                    <User className="w-5 h-5 text-slate-400 absolute left-3 top-3 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-slate-800 font-medium"
                      placeholder="Ingrese su usuario"
                      required
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase ml-1">Contraseña</label>
                 <div className="relative group">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-slate-800 font-medium"
                      placeholder="Ingrese su contraseña"
                      required
                    />
                 </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 border border-red-100 animate-pulse">
                   <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
              >
                 {loading ? 'Accediendo...' : 'Iniciar Sesión'}
                 {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
           </form>

           <div className="mt-8 text-center">
              <p className="text-xs text-slate-400">© {new Date().getFullYear()} Alex Consulting. Sistema Integral.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;