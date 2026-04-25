import React, { useState, useEffect } from 'react';
import { Building2, Plus, Save, Trash2, PenSquare, MapPin, Phone, User, AlertCircle, CheckCircle2, LayoutGrid, List, Users } from 'lucide-react';
import { Company, Patient } from '../types';
import { getCompanies, saveCompany, updateCompany, deleteCompany, getAllPatients } from '../utils/storage';

const CompaniesManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const initialFormState = {
    name: '',
    rif: '',
    nil: '',
    address: '',
    phone: '',
    contactName: '',
    contactPhone: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [compsData, patsData] = await Promise.all([getCompanies(), getAllPatients()]);
      setCompanies(compsData);
      setPatients(patsData);
    } catch (error: any) {
      console.error("Error loading data:", error);
      setMessage({ type: 'error', text: 'Error al cargar los datos.' });
    } finally {
      setLoading(false);
    }
  };

  const getWorkerCount = (companyName: string) => {
    return patients.filter(p => p.company === companyName).length;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateCompany(isEditing, formData);
        setMessage({ type: 'success', text: 'Empresa actualizada correctamente' });
      } else {
        await saveCompany(formData);
        setMessage({ type: 'success', text: 'Empresa registrada correctamente' });
      }
      setFormData(initialFormState);
      setIsEditing(null);
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al procesar la solicitud' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (comp: Company) => {
    setIsEditing(comp.id);
    setFormData({
      name: comp.name,
      rif: comp.rif,
      nil: comp.nil || '',
      address: comp.address,
      phone: comp.phone,
      contactName: comp.contactName,
      contactPhone: comp.contactPhone
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (showDeleteConfirm) {
      try {
        await deleteCompany(showDeleteConfirm);
        setMessage({ type: 'success', text: 'Empresa eliminada correctamente' });
        loadData();
      } catch (error: any) {
        setMessage({ type: 'error', text: 'Error al eliminar la empresa' });
      } finally {
        setShowDeleteConfirm(null);
        setTimeout(() => setMessage(null), 3000);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-lg text-indigo-700">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Gestión de Empresas</h2>
            <p className="text-slate-500 text-sm">Registro de clientes y entidades de trabajo.</p>
          </div>
        </div>

        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <LayoutGrid className="w-4 h-4" /> Cuadros
          </button>
          <button 
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <List className="w-4 h-4" /> Tabla
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
          {message.text}
        </div>
      )}

      {/* Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-6 text-red-600">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">¿Confirmar eliminación?</h3>
                <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium shadow-lg shadow-red-100 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* FORM */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
              {isEditing ? <PenSquare className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
              {isEditing ? 'Editar Empresa' : 'Nueva Empresa'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Razón Social</label>
                <input 
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nombre de la empresa"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">RIF</label>
                  <input 
                    type="text"
                    name="rif"
                    required
                    value={formData.rif}
                    onChange={handleChange}
                    placeholder="J-12345678-9"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NIL</label>
                  <input 
                    type="text"
                    name="nil"
                    value={formData.nil}
                    onChange={handleChange}
                    placeholder="Número NIL"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dirección Fiscal</label>
                <textarea 
                  name="address"
                  required
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Dirección completa"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label>
                    <input 
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contacto</label>
                    <input 
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
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
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex justify-center items-center gap-2 shadow-lg"
                 >
                    <Save className="w-4 h-4" />
                    {isEditing ? 'Actualizar' : 'Guardar'}
                 </button>
              </div>
            </form>
          </div>
        </div>

        {/* LIST / CARDS */}
        <div className="lg:col-span-8">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Cargando empresas...</p>
             </div>
           ) : companies.length === 0 ? (
             <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="italic">No hay empresas registradas en el sistema.</p>
             </div>
           ) : viewMode === 'grid' ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
                {companies.map(comp => {
                  const workerCount = getWorkerCount(comp.name);
                  return (
                    <div 
                        key={comp.id} 
                        className="group relative h-40 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100 overflow-hidden cursor-default border border-blue-500 transition-all hover:scale-[1.02] hover:shadow-blue-200"
                    >
                        {/* Background Decoration */}
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <Building2 className="w-32 h-32 text-white" />
                        </div>

                        {/* Visible Content */}
                        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                            <h3 className="text-white font-bold text-lg leading-tight uppercase px-2">{comp.name}</h3>
                            <div className="mt-2 flex items-center gap-1.5 text-blue-100 text-xs font-medium bg-blue-700/50 px-3 py-1 rounded-full border border-blue-400/30">
                                <Users className="w-3.5 h-3.5" />
                                {workerCount} Trabajadores
                            </div>
                        </div>

                        {/* HOVER OVERLAY */}
                        <div className="absolute inset-0 bg-blue-900/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col p-5">
                            <div className="flex justify-between items-start mb-3">
                                <span className="bg-blue-500/30 text-blue-200 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-blue-400/30">Opciones</span>
                                <div className="flex gap-2">
                                    <button 
                                      onClick={() => handleEdit(comp)} 
                                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors text-xs font-bold"
                                      title="Modificar"
                                    >
                                        <PenSquare className="w-3.5 h-3.5" />
                                        <span>Modificar</span>
                                    </button>
                                    <button 
                                      onClick={() => handleDelete(comp.id)} 
                                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-200 transition-colors text-xs font-bold"
                                      title="Eliminar"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Eliminar</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="space-y-2 text-left">
                                <div>
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Nombre Comercial</p>
                                    <p className="text-sm text-white font-bold truncate">{comp.name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">RIF / NIL</p>
                                    <p className="text-sm text-blue-50 font-mono">{comp.rif} {comp.nil ? `/ ${comp.nil}` : ''}</p>
                                </div>
                                <div className="pt-2 border-t border-blue-700/50 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-400" />
                                        <span className="text-xs text-white font-bold">{workerCount} <span className="font-normal text-blue-300">Trabajadores</span></span>
                                    </div>
                                    <span className="text-[10px] text-blue-400 italic">Afamed v2.4</span>
                                </div>
                            </div>
                        </div>
                    </div>
                  );
                })}
             </div>
           ) : (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Empresa</th>
                        <th className="px-4 py-3">RIF</th>
                        <th className="px-4 py-3 text-center">Nómina</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {companies.map(comp => (
                        <tr key={comp.id} className="hover:bg-slate-50 group">
                          <td className="px-4 py-3">
                             <div className="font-bold text-slate-800">{comp.name}</div>
                             <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                                <MapPin className="w-3 h-3" /> {comp.address.substring(0, 40)}...
                             </div>
                          </td>
                          <td className="px-4 py-3">
                             <div className="font-mono text-slate-600 font-medium">{comp.rif}</div>
                             {comp.nil && <div className="text-[10px] text-slate-400 font-mono uppercase">NIL: {comp.nil}</div>}
                          </td>
                          <td className="px-4 py-3 text-center">
                             <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-bold border border-indigo-100">
                                {getWorkerCount(comp.name)}
                             </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                             <div className="flex justify-end gap-3">
                               <button 
                                 onClick={() => handleEdit(comp)} 
                                 className="flex items-center gap-1.5 px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-xs font-bold"
                               >
                                  <PenSquare className="w-4 h-4" />
                                  <span>Modificar</span>
                               </button>
                               <button 
                                 onClick={() => handleDelete(comp.id)} 
                                 className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs font-bold"
                               >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Eliminar</span>
                               </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default CompaniesManagement;