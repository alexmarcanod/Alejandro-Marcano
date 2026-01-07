import React, { useState, useEffect } from 'react';
import { User, Shield, Key, Save, Trash2, PenSquare, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AppUser } from '../types';
import { getUsers, saveUser, updateUser, deleteUser } from '../utils/storage';

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const initialFormState = {
    firstName: '',
    cedula: '',
    password: '',
    confirmPassword: '',
    role: 'Asistente' as 'Administrador' | 'Asistente' | 'Médico'
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  // Logic to generate unique username
  const generateUsername = (name: string, cedula: string) => {
    if (!name || !cedula) return '';
    const firstNamePart = name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const lastNamePart = name.split(' ').length > 1 ? name.split(' ')[1].toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    const nameStr = lastNamePart ? `${firstNamePart}.${lastNamePart}` : firstNamePart;
    return `${nameStr}.${cedula}`;
  };

  const currentUsername = generateUsername(formData.firstName, formData.cedula);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!isEditing && (!formData.password || formData.password !== formData.confirmPassword)) {
        setMessage({ type: 'error', text: 'Las contraseñas no coinciden o están vacías' });
        setTimeout(() => setMessage(null), 3000);
        return;
    }
    
    // In edit mode, if password field is filled, they must match
    if (isEditing && formData.password && formData.password !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
        setTimeout(() => setMessage(null), 3000);
        return;
    }

    try {
      if (isEditing) {
        // Only update password if provided
        const updates: any = {
            firstName: formData.firstName,
            cedula: formData.cedula,
            role: formData.role,
            username: currentUsername
        };
        if (formData.password) {
            updates.password = formData.password;
        }

        await updateUser(isEditing, updates);
        setMessage({ type: 'success', text: 'Usuario actualizado correctamente' });
      } else {
        await saveUser({
            firstName: formData.firstName,
            cedula: formData.cedula,
            username: currentUsername,
            role: formData.role,
            password: formData.password
        });
        setMessage({ type: 'success', text: 'Usuario registrado correctamente' });
      }
      setFormData(initialFormState);
      setIsEditing(null);
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al procesar la solicitud' });
    }
  };

  const handleEdit = (u: AppUser) => {
    setIsEditing(u.id);
    setFormData({
      firstName: u.firstName,
      cedula: u.cedula,
      role: u.role,
      password: '',
      confirmPassword: ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este usuario? Perderá el acceso al sistema.')) {
      await deleteUser(id);
      loadData();
    }
  };

  const resetPassword = (u: AppUser) => {
      alert("Para resetear la contraseña, edite el usuario y escriba una nueva en el campo correspondiente.");
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-slate-800 rounded-lg text-white">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h2>
          <p className="text-slate-500 text-sm">Administración de credenciales y roles de acceso.</p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORM */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
              {isEditing ? <PenSquare className="w-4 h-4"/> : <Shield className="w-4 h-4"/>}
              {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                <input 
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Ej. Pedro Pérez"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cédula</label>
                <input 
                  type="number"
                  name="cedula"
                  required
                  value={formData.cedula}
                  onChange={handleChange}
                  placeholder="Ej. 12345678"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Usuario (Autogenerado)</label>
                <div className="font-mono text-sm font-semibold text-blue-700 truncate">
                   {currentUsername || '...'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rol / Permisos</label>
                <select 
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none bg-white"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Asistente">Asistente</option>
                  <option value="Médico">Médico</option>
                </select>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-2">
                 <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
                    <Key className="w-3 h-3" /> Seguridad
                 </h4>
                 <div className="space-y-3">
                    <div>
                        <input 
                        type="password"
                        name="password"
                        required={!isEditing}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={isEditing ? "Nueva contraseña (opcional)" : "Contraseña"}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                        />
                    </div>
                    <div>
                        <input 
                        type="password"
                        name="confirmPassword"
                        required={!isEditing}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirmar contraseña"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                        />
                    </div>
                 </div>
              </div>

              <div className="flex gap-2 pt-4">
                 {isEditing && (
                   <button 
                     type="button"
                     onClick={() => { setIsEditing(null); setFormData(initialFormState); }}
                     className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
                   >
                     Cancelar
                   </button>
                 )}
                 <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 text-sm font-medium flex justify-center items-center gap-2"
                 >
                    <Save className="w-4 h-4" />
                    {isEditing ? 'Actualizar' : 'Guardar'}
                 </button>
              </div>
            </form>
          </div>
        </div>

        {/* LIST */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                 <h3 className="font-bold text-slate-700">Usuarios del Sistema ({users.length})</h3>
              </div>
              
              {loading ? (
                <div className="p-8 text-center text-slate-400">Cargando...</div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic">No hay usuarios registrados.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Nombre</th>
                        <th className="px-4 py-3">Usuario (Login)</th>
                        <th className="px-4 py-3">Rol</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 group">
                          <td className="px-4 py-3">
                             <div className="font-medium text-slate-900">{u.firstName}</div>
                             <div className="text-xs text-slate-500">CI: {u.cedula}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-blue-700 font-medium">{u.username}</td>
                          <td className="px-4 py-3">
                             <span className={`px-2 py-1 rounded text-xs font-bold ${
                                 u.role === 'Administrador' ? 'bg-slate-800 text-white' :
                                 u.role === 'Médico' ? 'bg-blue-100 text-blue-800' :
                                 'bg-slate-100 text-slate-600'
                             }`}>
                                {u.role}
                             </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                             <div className="flex justify-end gap-2">
                               <button onClick={() => handleEdit(u)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors" title="Editar / Reset Password">
                                  <PenSquare className="w-4 h-4" />
                               </button>
                               <button onClick={() => handleDelete(u.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                                  <Trash2 className="w-4 h-4" />
                               </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;