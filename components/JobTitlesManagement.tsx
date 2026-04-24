import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Save, Trash2, PenSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { JobTitle } from '../types';
import { getJobTitles, saveJobTitle, updateJobTitle, deleteJobTitle } from '../utils/storage';

const JobTitlesManagement: React.FC = () => {
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const initialFormState = {
    name: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getJobTitles();
    // Sort alphabetically
    const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
    setJobTitles(sorted);
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (isEditing) {
        await updateJobTitle(isEditing, formData);
        setMessage({ type: 'success', text: 'Cargo actualizado correctamente' });
      } else {
        await saveJobTitle(formData);
        setMessage({ type: 'success', text: 'Cargo registrado correctamente' });
      }
      setFormData(initialFormState);
      setIsEditing(null);
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al procesar la solicitud' });
    }
  };

  const handleEdit = (job: JobTitle) => {
    setIsEditing(job.id);
    setFormData({
      name: job.name
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este cargo?')) {
      await deleteJobTitle(id);
      loadData();
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-100 rounded-lg text-indigo-700">
          <Briefcase className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Cargos</h2>
          <p className="text-slate-500 text-sm">Registro de cargos y puestos de trabajo.</p>
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
              {isEditing ? <PenSquare className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
              {isEditing ? 'Editar Cargo' : 'Nuevo Cargo'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Cargo</label>
                <input 
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej. Analista Administrativo"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
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
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex justify-center items-center gap-2"
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
                 <h3 className="font-bold text-slate-700">Listado de Cargos ({jobTitles.length})</h3>
              </div>
              
              {loading ? (
                <div className="p-8 text-center text-slate-400">Cargando...</div>
              ) : jobTitles.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic">No hay cargos registrados.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Nombre del Cargo</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {jobTitles.map(job => (
                        <tr key={job.id} className="hover:bg-slate-50 group">
                          <td className="px-4 py-3 font-medium text-slate-800">
                             {job.name}
                          </td>
                          <td className="px-4 py-3 text-right">
                             <div className="flex justify-end gap-2">
                               <button onClick={() => handleEdit(job)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Editar">
                                  <PenSquare className="w-4 h-4" />
                               </button>
                               <button onClick={() => handleDelete(job.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
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

export default JobTitlesManagement;