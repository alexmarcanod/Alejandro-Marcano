import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Search, User, Save, X, Edit, 
  Trash2, AlertCircle, CheckCircle2, ChevronRight, Briefcase 
} from 'lucide-react';
import { findPatientByCedula, getAppointments, saveAppointment, updateAppointment, deleteAppointment, checkAvailability } from '../utils/storage';
import { Patient, Appointment } from '../types';

const Appointments: React.FC = () => {
  // --- UI State ---
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // --- Search State ---
  const [searchCedula, setSearchCedula] = useState('');
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // --- Appointments Data ---
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Form State ---
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '08:00',
    type: 'Atención General' as Appointment['type']
  });

  // Load appointments on mount
  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    const data = await getAppointments();
    // Sort by date then time
    const sorted = data.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
    });
    setAppointments(sorted);
  };

  // --- Logic Helpers ---

  // Generate Time Slots (8am - 5pm, 30 min intervals)
  const generateTimeSlots = () => {
    const slots = [];
    let start = 8 * 60; // 8:00 in minutes
    const end = 17 * 60; // 17:00
    while (start <= end) {
      const hours = Math.floor(start / 60);
      const minutes = start % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      slots.push(timeString);
      start += 30;
    }
    return slots;
  };

  const handleSearchPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCedula.trim()) return;

    setIsSearching(true);
    setMessage(null);
    setFoundPatient(null);

    try {
      const patient = await findPatientByCedula(searchCedula);
      if (patient) {
        setFoundPatient(patient);
      } else {
        setMessage({ type: 'error', text: 'Paciente no encontrado.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al buscar paciente.' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!foundPatient && !editingId) {
        setMessage({ type: 'error', text: 'Debe buscar y seleccionar un paciente primero.' });
        return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Check collision
      const isAvailable = await checkAvailability(formData.date, formData.time, editingId || undefined);
      if (!isAvailable) {
        setMessage({ type: 'error', text: 'El horario seleccionado ya está ocupado.' });
        setLoading(false);
        return;
      }

      if (editingId) {
        // Update existing
        await updateAppointment(editingId, {
            date: formData.date,
            time: formData.time,
            type: formData.type
        });
        setMessage({ type: 'success', text: 'Cita modificada correctamente.' });
        setEditingId(null);
      } else if (foundPatient) {
        // Create new
        await saveAppointment({
            patientId: foundPatient.id,
            patientName: foundPatient.firstName,
            patientCedula: foundPatient.cedula,
            date: formData.date,
            time: formData.time,
            type: formData.type,
            status: 'Programada'
        });
        setMessage({ type: 'success', text: 'Cita programada con éxito.' });
      }

      // Reset form partly
      setFormData(prev => ({ ...prev, time: '08:00' })); // Reset time but keep date maybe?
      loadAppointments();
      
      // Clear messages after delay
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar la cita.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (apt: Appointment) => {
    setEditingId(apt.id);
    setFoundPatient({ 
        firstName: apt.patientName, 
        cedula: apt.patientCedula 
    } as Patient); // Mock patient object for display
    setFormData({
        date: apt.date,
        time: apt.time,
        type: apt.type
    });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = async (id: string) => {
    if (window.confirm('¿Desea cancelar esta cita?')) {
        await updateAppointment(id, { status: 'Cancelada' });
        loadAppointments();
    }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm('¿Eliminar registro permanentemente?')) {
          await deleteAppointment(id);
          loadAppointments();
      }
  }

  const handleCancelEdit = () => {
      setEditingId(null);
      setFoundPatient(null);
      setSearchCedula('');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        time: '08:00',
        type: 'Atención General'
      });
  }

  // --- Render Sections ---

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Calendar className="w-6 h-6 text-blue-600" />
        Gestión de Citas
      </h2>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: SCHEDULING FORM */}
        <div className="lg:col-span-5 space-y-6">
            
            {/* 1. Patient Search (Only show if not editing existing appointment) */}
            {!editingId && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Search className="w-4 h-4 text-slate-500" /> Buscar Paciente
                    </h3>
                    <form onSubmit={handleSearchPatient} className="flex gap-2">
                        <input 
                            type="number" 
                            value={searchCedula}
                            onChange={(e) => setSearchCedula(e.target.value)}
                            placeholder="Cédula de Identidad"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button 
                            type="submit"
                            disabled={isSearching}
                            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:bg-slate-400"
                        >
                            {isSearching ? '...' : 'Buscar'}
                        </button>
                    </form>
                </div>
            )}

            {/* 2. Scheduling Form (Visible if patient found or editing) */}
            {(foundPatient || editingId) && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-left-4">
                    <div className="mb-6 pb-4 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Paciente Seleccionado</span>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">{foundPatient?.firstName}</h4>
                                <p className="text-sm text-slate-500">C.I: {foundPatient?.cedula}</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-4">
                        <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                            {editingId ? <Edit className="w-4 h-4 text-indigo-500"/> : <Clock className="w-4 h-4 text-blue-500"/>}
                            {editingId ? 'Modificar Cita' : 'Detalles de la Cita'}
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                            <input 
                                type="date"
                                name="date"
                                required
                                min={new Date().toISOString().split('T')[0]} // Prevent past dates
                                value={formData.date}
                                onChange={handleFormChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora</label>
                            <div className="relative">
                                <select 
                                    name="time"
                                    value={formData.time}
                                    onChange={handleFormChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                                >
                                    {generateTimeSlots().map(time => (
                                        <option key={time} value={time}>{time}</option>
                                    ))}
                                </select>
                                <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Atención</label>
                            <div className="relative">
                                <select 
                                    name="type"
                                    value={formData.type}
                                    onChange={handleFormChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                                >
                                    <option value="Atención General">Atención General (Control)</option>
                                    <option value="Examen Pre-empleo">Examen Pre-empleo</option>
                                    <option value="Examen Periódico">Examen Periódico</option>
                                    <option value="Examen Post-vacacional">Examen Post-vacacional</option>
                                    <option value="Examen de Egreso">Examen de Egreso</option>
                                    <option value="Otras Evaluaciones Especiales">Otras Evaluaciones Especiales</option>
                                </select>
                                <Briefcase className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-2">
                            {editingId && (
                                <button 
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
                                >
                                    Cancelar Edición
                                </button>
                            )}
                            <button 
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex justify-center items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {editingId ? 'Actualizar Cita' : 'Guardar Cita'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>

        {/* RIGHT COLUMN: AGENDA VIEW */}
        <div className="lg:col-span-7">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Agenda de Citas</h3>
                    <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                        {appointments.filter(a => a.status === 'Programada').length} Activas
                    </span>
                </div>

                <div className="p-0 flex-1 overflow-y-auto max-h-[600px]">
                    {appointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-10 text-slate-400">
                            <Calendar className="w-12 h-12 mb-3 opacity-20" />
                            <p>No hay citas programadas.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {/* Group by Date logic visualization */}
                            {(Array.from(new Set(appointments.map(a => a.date))) as string[]).map(date => (
                                <div key={date}>
                                    <div className="bg-slate-50/50 px-4 py-2 text-xs font-bold text-slate-500 uppercase sticky top-0 backdrop-blur-sm">
                                        {new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </div>
                                    {appointments.filter(a => a.date === date).map(apt => (
                                        <div key={apt.id} className={`p-4 hover:bg-slate-50 transition-colors flex items-start gap-4 group ${apt.status === 'Cancelada' ? 'opacity-50 grayscale' : ''}`}>
                                            <div className="bg-blue-50 text-blue-700 font-bold px-3 py-2 rounded-lg text-sm text-center min-w-[70px]">
                                                {apt.time}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-800">{apt.patientName}</h4>
                                                <p className="text-sm text-slate-500 mb-1">{apt.type}</p>
                                                {apt.status === 'Cancelada' && (
                                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">CANCELADA</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {apt.status !== 'Cancelada' && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleEdit(apt)}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full" 
                                                            title="Modificar"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleCancel(apt.id)}
                                                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-full" 
                                                            title="Cancelar Cita"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button 
                                                    onClick={() => handleDelete(apt.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full" 
                                                    title="Eliminar Registro"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Appointments;