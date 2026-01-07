import React, { useState, useEffect } from 'react';
import { UserCog, Plus, Save, Trash2, PenSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Doctor } from '../types';
import { getDoctors, saveDoctor, updateDoctor, deleteDoctor } from '../utils/storage';

const DoctorsManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const initialFormState = {
    title: 'Dr.' as 'Dr.' | 'Dra.',
    firstName: '',
    cedula: '',
    mpps: '',
    inpsasel: '',
    collegeId: '' // Nuevo
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getDoctors();
    setDoctors(data);
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateDoctor(isEditing, formData);
        setMessage({ type: 'success', text: 'Registro actualizado correctamente' });
      } else {
        await saveDoctor(formData);
        setMessage({ type: 'success', text: 'Médico registrado correctamente' });
      }
      setFormData(initialFormState);
      setIsEditing(null);
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al procesar la solicitud' });
    }
  };

  const handleEdit = (doc: Doctor) => {
    setIsEditing(doc.id);
    setFormData({
      title: doc.title,
      firstName: doc.firstName,
      cedula: doc.cedula,
      mpps: doc.mpps,
      inpsasel: doc.inpsasel,
      collegeId: doc.collegeId || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este registro?')) {
      await deleteDoctor(id);
      loadData();
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-lg text-blue-700">
          <UserCog className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Médicos</h2>
          <p className="text-slate-500 text-sm">Registro de personal sanitario autorizado.</p>
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
              {isEditing ? 'Editar Médico' : 'Nuevo Médico'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título</label>
                <select 
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="Dr.">Dr.</option>
                  <option value="Dra.">Dra.</option>
                </select>
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombres y Apellidos</label>
                <input 
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Ej. Juan Pérez"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 mt-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Registro MPPS</label>
                <input 
                  type="text"
                  name="mpps"
                  required
                  value={formData.mpps}
                  onChange={handleChange}
                  placeholder="N° de Matrícula"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Colegio de Médicos</label>
                <input 
                  type="text"
                  name="collegeId"
                  value={formData.collegeId}
                  onChange={handleChange}
                  placeholder="N° Colegiado"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Registro INPSASEL</label>
                <input 
                  type="text"
                  name="inpsasel"
                  value={formData.inpsasel}
                  onChange={handleChange}
                  placeholder="N° de Registro (Opcional)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex justify-center items-center gap-2"
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
                 <h3 className="font-bold text-slate-700">Listado de Médicos ({doctors.length})</h3>
              </div>
              
              {loading ? (
                <div className="p-8 text-center text-slate-400">Cargando...</div>
              ) : doctors.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic">No hay médicos registrados.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Médico</th>
                        <th className="px-4 py-3">Cédula</th>
                        <th className="px-4 py-3">Registros</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {doctors.map(doc => (
                        <tr key={doc.id} className="hover:bg-slate-50 group">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            <span className="text-slate-500 mr-1">{doc.title}</span> {doc.firstName}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600">{doc.cedula}</td>
                          <td className="px-4 py-3">
                            <div className="text-xs">
                              <span className="font-bold text-slate-500">MPPS:</span> {doc.mpps}
                            </div>
                            {doc.collegeId && (
                                <div className="text-xs">
                                  <span className="font-bold text-slate-500">CM:</span> {doc.collegeId}
                                </div>
                            )}
                            {doc.inpsasel && (
                              <div className="text-xs">
                                <span className="font-bold text-slate-500">INPSASEL:</span> {doc.inpsasel}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                             <div className="flex justify-end gap-2">
                               <button onClick={() => handleEdit(doc)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar">
                                  <PenSquare className="w-4 h-4" />
                               </button>
                               <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
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

export default DoctorsManagement;