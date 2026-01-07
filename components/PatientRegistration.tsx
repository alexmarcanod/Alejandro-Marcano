import React, { useState, useEffect } from 'react';
import { 
  Save, User, Briefcase, Stethoscope, AlertCircle, CheckCircle2, 
  Upload, Trash2, Camera, Search, PenSquare, Plus, AlertTriangle, MapPin, GraduationCap, Clock
} from 'lucide-react';
import { savePatientToDB, findPatientByCedula, updatePatient, deletePatient, getCompanies, getJobTitles } from '../utils/storage';
import { Patient, Company, JobTitle } from '../types';

type TabMode = 'add' | 'edit' | 'delete';

const PatientRegistration: React.FC = () => {
  // --- Global State ---
  const [activeTab, setActiveTab] = useState<TabMode>('add');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- External Data State ---
  const [companiesList, setCompaniesList] = useState<Company[]>([]);
  const [jobTitlesList, setJobTitlesList] = useState<JobTitle[]>([]);

  // --- Search State (Edit/Delete) ---
  const [searchCedula, setSearchCedula] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [foundPatientId, setFoundPatientId] = useState<string | null>(null);

  // --- Form State ---
  const [formData, setFormData] = useState<Partial<Patient>>({
    photoUrl: '',
    firstName: '',
    cedula: '',
    birthDate: '',
    placeOfBirth: '',
    gender: 'Masculino',
    maritalStatus: 'Soltero',
    educationLevel: 'Secundaria',
    dominantHand: 'Diestro',
    address: '',
    state: '',
    country: 'Venezuela',
    phone: '',
    medicalHistory: '',
    hasDisability: false,
    disabilityDescription: '',
    company: '',
    department: '',
    jobTitle: '',
    workSchedule: '',
    entryDate: '',
    employmentStatus: 'fijo'
  });

  // Load Companies and JobTitles on mount
  useEffect(() => {
    const fetchExternalData = async () => {
      const comps = await getCompanies();
      setCompaniesList(comps);
      
      const jobs = await getJobTitles();
      setJobTitlesList(jobs);
    };
    fetchExternalData();
  }, []);

  // Reset when changing tabs
  useEffect(() => {
    setSearchCedula('');
    setSearchError('');
    setFoundPatientId(null);
    setSuccessMsg(null);
    resetForm();
  }, [activeTab]);

  const resetForm = () => {
    setFormData({
      photoUrl: '',
      firstName: '',
      cedula: '',
      birthDate: '',
      placeOfBirth: '',
      gender: 'Masculino',
      maritalStatus: 'Soltero',
      educationLevel: 'Secundaria',
      dominantHand: 'Diestro',
      address: '',
      state: '',
      country: 'Venezuela',
      phone: '',
      medicalHistory: '',
      hasDisability: false,
      disabilityDescription: '',
      company: '',
      department: '',
      jobTitle: '',
      workSchedule: '',
      entryDate: '',
      employmentStatus: 'fijo'
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCedula.trim()) return;

    setIsSearching(true);
    setSearchError('');
    setFoundPatientId(null);
    resetForm();

    try {
      const patient = await findPatientByCedula(searchCedula);
      if (patient) {
        setFoundPatientId(patient.id);
        setFormData({
            ...patient,
            maritalStatus: patient.maritalStatus || 'Soltero',
            educationLevel: patient.educationLevel || 'Secundaria',
            dominantHand: patient.dominantHand || 'Diestro',
            country: patient.country || 'Venezuela',
            placeOfBirth: patient.placeOfBirth || '',
            state: patient.state || '',
            department: patient.department || '',
            workSchedule: patient.workSchedule || ''
        });
      } else {
        setSearchError('Paciente no encontrado.');
      }
    } catch (err) {
      setSearchError('Error al buscar paciente.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("La imagen es demasiado grande. Por favor seleccione una imagen menor a 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, photoUrl: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);

    if (!formData.firstName || !formData.cedula) {
        alert("Por favor complete los campos obligatorios.");
        setLoading(false);
        return;
    }

    try {
      const dataToSave = {
          ...formData,
          disabilityDescription: formData.hasDisability ? formData.disabilityDescription : undefined
      } as Patient;

      if (activeTab === 'add') {
        await savePatientToDB(dataToSave);
        setSuccessMsg("Paciente registrado exitosamente");
        resetForm();
      } else if (activeTab === 'edit' && foundPatientId) {
        await updatePatient(foundPatientId, dataToSave);
        setSuccessMsg("Datos del paciente actualizados");
      }
      
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (error) {
      alert(`Error al ${activeTab === 'add' ? 'guardar' : 'actualizar'} el paciente.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
      if (!foundPatientId) return;

      if (window.confirm("¿Está seguro de que desea eliminar este paciente y todos sus datos asociados? Esta acción no se puede deshacer.")) {
          setLoading(true);
          try {
              await deletePatient(foundPatientId);
              setSuccessMsg("Paciente eliminado correctamente");
              setFoundPatientId(null);
              resetForm();
              setSearchCedula('');
              setTimeout(() => setSuccessMsg(null), 3000);
          } catch (error) {
              alert("Error al eliminar el paciente.");
          } finally {
              setLoading(false);
          }
      }
  };

  const renderSearch = () => (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-blue-600" />
        Búsqueda de Paciente {activeTab === 'edit' ? 'para Modificar' : 'para Eliminar'}
        </h3>
        <form onSubmit={handleSearch} className="flex gap-4 items-start">
        <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-slate-700 mb-1">Cédula del Paciente</label>
            <div className="relative">
            <input 
                type="number" 
                value={searchCedula}
                onChange={(e) => setSearchCedula(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ingrese número de cédula"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            {searchError && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {searchError}</p>}
        </div>
        <button 
            type="submit"
            disabled={isSearching}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-medium"
        >
            {isSearching ? 'Buscando...' : 'Buscar'}
        </button>
        </form>
    </section>
  );

  const renderDeleteCard = () => (
      <div className="bg-red-50 border border-red-100 rounded-xl p-8 flex flex-col items-center animate-in fade-in zoom-in-95">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-200 mb-4 border-4 border-white shadow-sm">
             {formData.photoUrl ? (
                 <img src={formData.photoUrl} alt="Foto" className="w-full h-full object-cover" />
             ) : (
                 <User className="w-full h-full p-4 text-slate-400" />
             )}
          </div>
          <h3 className="text-xl font-bold text-slate-800">{formData.firstName}</h3>
          <p className="text-slate-600 mb-1">C.I: {formData.cedula}</p>
          <p className="text-slate-500 text-sm mb-6">{formData.jobTitle} - {formData.company}</p>
          
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-red-100 mb-6 text-red-700 text-sm max-w-md">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Esta acción eliminará permanentemente al paciente y no podrá recuperarse.</span>
          </div>

          <button 
             onClick={handleDelete}
             disabled={loading}
             className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-lg hover:shadow-xl transition-all"
          >
             {loading ? 'Eliminando...' : <><Trash2 className="w-5 h-5" /> Confirmar Eliminación</>}
          </button>
      </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-10">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Gestión de Pacientes</h2>
        {successMsg && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded flex items-center animate-pulse">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            {successMsg}
          </div>
        )}
      </div>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-8 inline-flex w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('add')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'add' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <span className="flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Agregar</span>
          </button>
          <button 
            onClick={() => setActiveTab('edit')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'edit' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
          >
             <span className="flex items-center justify-center gap-2"><PenSquare className="w-4 h-4" /> Modificar</span>
          </button>
          <button 
            onClick={() => setActiveTab('delete')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'delete' ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
          >
             <span className="flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /> Eliminar</span>
          </button>
       </div>

      {(activeTab === 'edit' || activeTab === 'delete') && !foundPatientId && (
          renderSearch()
      )}
      
      {activeTab === 'delete' && foundPatientId && (
        <div className="space-y-6">
            <button 
              onClick={() => { setFoundPatientId(null); setSearchCedula(''); }}
              className="text-sm text-slate-500 hover:text-blue-600 font-medium"
            >
                ← Buscar otro paciente
            </button>
            {renderDeleteCard()}
        </div>
      )}

      {(activeTab === 'add' || (activeTab === 'edit' && foundPatientId)) && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {activeTab === 'edit' && (
                <div className="flex justify-between items-center mb-2">
                    <button 
                        type="button"
                        onClick={() => { setFoundPatientId(null); setSearchCedula(''); resetForm(); }}
                        className="text-sm text-slate-500 hover:text-blue-600 font-medium"
                    >
                        ← Buscar otro paciente
                    </button>
                </div>
            )}

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Datos Personales y Demográficos</h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <div className="md:col-span-2 lg:col-span-3 flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 mb-2">
                <div className="relative group shrink-0">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center border-2 border-dashed border-slate-300 overflow-hidden bg-slate-50 relative ${formData.photoUrl ? 'border-blue-200 shadow-md' : ''}`}>
                    {formData.photoUrl ? (
                        <img src={formData.photoUrl} alt="Foto del paciente" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-12 h-12 text-slate-300" />
                    )}
                    
                    {!formData.photoUrl && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        <Camera className="w-8 h-8 text-slate-500" />
                        </div>
                    )}
                    </div>
                    
                    <div className="absolute -bottom-2 -right-2 flex gap-2">
                        <label className="bg-blue-600 p-2.5 rounded-full cursor-pointer hover:bg-blue-700 transition-all shadow-md text-white hover:scale-105 active:scale-95" title="Subir foto">
                        <Upload className="w-4 h-4" />
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handlePhotoChange} 
                            className="hidden" 
                        />
                        </label>
                        {formData.photoUrl && (
                        <button 
                            type="button"
                            onClick={removePhoto}
                            className="bg-red-500 p-2.5 rounded-full cursor-pointer hover:bg-red-600 transition-all shadow-md text-white hover:scale-105 active:scale-95"
                            title="Eliminar foto"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        )}
                    </div>
                </div>
                
                <div className="text-center sm:text-left flex-1">
                    <h4 className="font-medium text-slate-900 mb-1">Foto del Paciente</h4>
                    <p className="text-sm text-slate-500 mb-3 max-w-sm">
                    Cargue una imagen reciente.
                    </p>
                </div>
                </div>

                <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombres y Apellidos</label>
                <input 
                    required
                    type="text" 
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej. Juan Pérez"
                />
                </div>
                
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cédula</label>
                <input 
                    required
                    type="number" 
                    name="cedula"
                    value={formData.cedula}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej. 12345678"
                />
                </div>

                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Nacimiento</label>
                <input 
                    required
                    type="date" 
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Lugar de Nacimiento</label>
                   <input 
                      type="text"
                      name="placeOfBirth"
                      value={formData.placeOfBirth}
                      onChange={handleChange}
                      placeholder="Ciudad, Estado"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Sexo</label>
                   <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                   >
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                   </select>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Estado Civil</label>
                   <select
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                   >
                      <option value="Soltero">Soltero</option>
                      <option value="Casado">Casado</option>
                      <option value="Divorciado">Divorciado</option>
                      <option value="Viudo">Viudo</option>
                      <option value="Concubino">Concubino</option>
                   </select>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Grado de Instrucción</label>
                   <select
                      name="educationLevel"
                      value={formData.educationLevel}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                   >
                      <option value="Primaria">Primaria</option>
                      <option value="Secundaria">Secundaria</option>
                      <option value="Técnico">Técnico</option>
                      <option value="Universitario">Universitario</option>
                      <option value="Postgrado">Postgrado</option>
                   </select>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Mano Dominante</label>
                   <select
                      name="dominantHand"
                      value={formData.dominantHand}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                   >
                      <option value="Diestro">Diestro</option>
                      <option value="Zurdo">Zurdo</option>
                      <option value="Ambidextro">Ambidextro</option>
                   </select>
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección de Habitación</label>
                <textarea 
                    required
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Dirección completa"
                />
                </div>

                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Estado (Ubicación)</label>
                   <input 
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Ej. Lara"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                </div>
                
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">País</label>
                   <input 
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="Ej. Venezuela"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                </div>

                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input 
                    required
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej. 0414-1234567"
                />
                </div>
            </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-emerald-900">Datos Médicos</h3>
            </div>
            <div className="p-6 space-y-6">
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Antecedentes Médicos</label>
                <textarea 
                    name="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Describa alergias, intervenciones quirúrgicas previas, enfermedades crónicas..."
                />
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-4 mb-3">
                    <span className="text-sm font-medium text-slate-700">¿Posee alguna discapacidad?</span>
                    <div className="flex items-center bg-white rounded-lg border border-slate-300 p-1">
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, hasDisability: true }))}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${formData.hasDisability ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Sí
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, hasDisability: false }))}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${!formData.hasDisability ? 'bg-slate-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        No
                    </button>
                    </div>
                </div>

                {formData.hasDisability && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Descripción de la Discapacidad <span className="text-red-500">*</span></label>
                    <input 
                        required={formData.hasDisability}
                        type="text" 
                        name="disabilityDescription"
                        value={formData.disabilityDescription}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="Especifique el tipo y grado de discapacidad"
                    />
                    </div>
                )}
                </div>
            </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-indigo-900">Datos Laborales</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
                  <select
                    name="company"
                    required
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="">-- Seleccionar Empresa --</option>
                    {companiesList.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
                   <input 
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="Ej. Mantenimiento, Administración"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                   />
                </div>
                
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                <select
                    name="jobTitle"
                    required
                    value={formData.jobTitle}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="">-- Seleccionar Cargo --</option>
                    {jobTitlesList.map(j => (
                      <option key={j.id} value={j.name}>{j.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Horario de Trabajo</label>
                   <div className="relative">
                       <input 
                          type="text"
                          name="workSchedule"
                          value={formData.workSchedule}
                          onChange={handleChange}
                          placeholder="Ej. 08:00 AM - 05:00 PM"
                          className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                       />
                       <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                   </div>
                </div>

                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Ingreso</label>
                <input 
                    required
                    type="date" 
                    name="entryDate"
                    value={formData.entryDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                </div>

                <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Estatus Laboral</label>
                <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input 
                        type="radio" 
                        name="employmentStatus" 
                        value="fijo"
                        checked={formData.employmentStatus === 'fijo'}
                        onChange={handleChange}
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border border-slate-300 checked:border-indigo-600 transition-all"
                        />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-600 opacity-0 peer-checked:opacity-100 transition-opacity"></span>
                    </div>
                    <span className="text-slate-700 group-hover:text-indigo-700">Fijo</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input 
                        type="radio" 
                        name="employmentStatus" 
                        value="contratado"
                        checked={formData.employmentStatus === 'contratado'}
                        onChange={handleChange}
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border border-slate-300 checked:border-indigo-600 transition-all"
                        />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-600 opacity-0 peer-checked:opacity-100 transition-opacity"></span>
                    </div>
                    <span className="text-slate-700 group-hover:text-indigo-700">Contratado</span>
                    </label>
                </div>
                </div>
            </div>
            </section>

            <div className="pt-4 flex justify-end">
            <button
                type="submit"
                disabled={loading}
                className={`
                flex items-center gap-2 px-8 py-3 rounded-lg text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all
                ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}
                `}
            >
                {loading ? (
                <>Procesando...</>
                ) : (
                <>
                    <Save className="w-5 h-5" />
                    {activeTab === 'edit' ? 'Actualizar Paciente' : 'Guardar Paciente'}
                </>
                )}
            </button>
            </div>

        </form>
      )}
    </div>
  );
};

export default PatientRegistration;