import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, User, Calendar, AlertCircle, Save, CheckCircle2, 
  Stethoscope, Clock, FileCheck, Plus, X, ListPlus, 
  PenSquare, Trash2, ArrowLeft, AlertTriangle, Target, Ambulance, ClipboardList, BookOpen, Activity
} from 'lucide-react';
import { 
  findPatientByCedula, 
  saveMedicalAttentionToDB, 
  getMedicalAttentionsByCedula, 
  updateMedicalAttention, 
  deleteMedicalAttention,
  getDoctors,
  updatePatient
} from '../utils/storage';
import { pathologies, Pathology, medicalSpecialties } from '../utils/nandaData';
import { Patient, MedicalAttention as IMedicalAttention, Doctor } from '../types';

type TabMode = 'add' | 'edit' | 'delete';

const MedicalAttention: React.FC = () => {
  // --- Global UI State ---
  const [activeTab, setActiveTab] = useState<TabMode>('add');
  
  // --- Search State (Shared for Add/Edit/Delete) ---
  const [searchCedula, setSearchCedula] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);

  // --- List State (For Edit/Delete) ---
  const [attentionsList, setAttentionsList] = useState<IMedicalAttention[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // --- Doctor State ---
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // --- Form/Action State ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false); // For Save/Update/Delete
  const [actionSuccess, setActionSuccess] = useState<string | null>(null); // Message

  // --- Pathology Search State ---
  const [pathologySearch, setPathologySearch] = useState('');
  const [showPathologyList, setShowPathologyList] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Form Data ---
  const [formData, setFormData] = useState({
    attentionDate: new Date().toISOString().split('T')[0],
    attentionType: 'General' as 'Pre Empleo' | 'Pre Vacaciones' | 'Egreso' | 'Periódica' | 'General',
    reason: 'Enfermedad Común' as 'Enfermedad Común' | 'Enfermedad Ocupacional' | 'Accidente Común' | 'Accidente Ocupacional',
    medicalReferral: '',
    diagnosis: '',
    observations: '', // Nuevo
    recommendations: '', // Nuevo
    restDays: 0,
    evaluationResult: 'Apto' as 'Apto' | 'No Apto' | 'Postpuesta' | 'No Aplica',
    doctorId: '', // New Field
    // Vitals
    weight: undefined as number | undefined,
    height: undefined as number | undefined,
    bloodPressure: '',
    heartRate: undefined as number | undefined,
    respiratoryRate: undefined as number | undefined,
    temperature: undefined as number | undefined,
    oxygenSaturation: undefined as number | undefined
  });

  // Load Doctors on Mount
  useEffect(() => {
    const fetchDoctors = async () => {
      const docs = await getDoctors();
      setDoctors(docs);
    };
    fetchDoctors();
  }, []);

  // Reset state when changing tabs
  useEffect(() => {
    setSearchCedula('');
    setSearchError('');
    setCurrentPatient(null);
    setAttentionsList([]);
    setEditingId(null);
    resetForm();
    setActionSuccess(null);
  }, [activeTab]);

  // --- Helpers ---
  const resetForm = () => {
    setFormData({
      attentionDate: new Date().toISOString().split('T')[0],
      attentionType: 'General',
      reason: 'No Aplica',
      medicalReferral: '',
      diagnosis: '',
      observations: '',
      recommendations: '',
      restDays: 0,
      evaluationResult: 'Apto',
      doctorId: '',
      weight: undefined,
      height: undefined,
      bloodPressure: '',
      heartRate: undefined,
      respiratoryRate: undefined,
      temperature: undefined,
      oxygenSaturation: undefined
    });
  };

  const filteredPathologies = pathologies.filter(item => 
    item.name.toLowerCase().includes(pathologySearch.toLowerCase()) || 
    item.code.toLowerCase().includes(pathologySearch.toLowerCase())
  );

  const calculateAge = (birthDateString: string) => {
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getRestEndDate = (startDate: string, days: number) => {
    if (!startDate) return '';
    const date = new Date(startDate);
    date.setDate(date.getDate() + Number(days));
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPathologyList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- Logic Handlers ---

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCedula.trim()) return;

    setIsSearching(true);
    setSearchError('');
    setCurrentPatient(null);
    setAttentionsList([]);
    setEditingId(null);

    try {
      // 1. Find Patient
      const foundPatient = await findPatientByCedula(searchCedula);
      
      if (!foundPatient) {
        setSearchError('Paciente no encontrado.');
        setIsSearching(false);
        return;
      }

      setCurrentPatient(foundPatient);

      // 2. If Edit/Delete mode, fetch attentions list
      if (activeTab !== 'add') {
        setIsLoadingList(true);
        const list = await getMedicalAttentionsByCedula(searchCedula);
        setAttentionsList(list);
        setIsLoadingList(false);
      }

    } catch (err) {
      setSearchError('Error al procesar la búsqueda.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleEditClick = (attention: IMedicalAttention) => {
    setEditingId(attention.id);
    setFormData({
      attentionDate: attention.attentionDate,
      attentionType: attention.attentionType,
      reason: attention.reason || 'Enfermedad Común',
      medicalReferral: attention.medicalReferral || '',
      diagnosis: attention.diagnosis,
      observations: attention.observations || '',
      recommendations: attention.recommendations || '',
      restDays: attention.restDays,
      evaluationResult: attention.evaluationResult,
      doctorId: attention.doctorId || '',
      weight: attention.weight,
      height: attention.height,
      bloodPressure: attention.bloodPressure || '',
      heartRate: attention.heartRate,
      respiratoryRate: attention.respiratoryRate,
      temperature: attention.temperature,
      oxygenSaturation: attention.oxygenSaturation
    });
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm("¿Está seguro de que desea eliminar este registro permanentemente?")) {
      setLoadingAction(true);
      try {
        await deleteMedicalAttention(id);
        // Refresh list
        const list = await getMedicalAttentionsByCedula(searchCedula);
        setAttentionsList(list);
        setActionSuccess("Registro eliminado correctamente.");
        setTimeout(() => setActionSuccess(null), 3000);
      } catch (error) {
        alert("Error al eliminar el registro.");
      } finally {
        setLoadingAction(false);
      }
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addPathologyToDiagnosis = (item: Pathology) => {
    const textToAdd = `[${item.code}] ${item.name}`;
    setFormData(prev => ({
      ...prev,
      diagnosis: prev.diagnosis ? `${prev.diagnosis}\n${textToAdd}` : textToAdd
    }));
    setPathologySearch('');
    setShowPathologyList(false);
  };

  const addCustomPathology = () => {
    if (!pathologySearch.trim()) return;
    const textToAdd = pathologySearch.trim();
    setFormData(prev => ({
      ...prev,
      diagnosis: prev.diagnosis ? `${prev.diagnosis}\n${textToAdd}` : textToAdd
    }));
    setPathologySearch('');
    setShowPathologyList(false);
  };

  const handleSaveOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;

    if (!formData.doctorId) {
        alert("Debe seleccionar el médico tratante.");
        return;
    }

    setLoadingAction(true);
    setActionSuccess(null);

    const selectedDoctor = doctors.find(d => d.id === formData.doctorId);
    const doctorName = selectedDoctor ? `${selectedDoctor.title} ${selectedDoctor.firstName}` : undefined;

    const dataToSave = {
      patientId: currentPatient.id,
      patientName: currentPatient.firstName,
      patientCedula: currentPatient.cedula,
      attentionDate: formData.attentionDate,
      attentionType: formData.attentionType,
      reason: formData.reason,
      medicalReferral: formData.medicalReferral,
      diagnosis: formData.diagnosis,
      observations: formData.observations,
      recommendations: formData.recommendations,
      restDays: Number(formData.restDays),
      restStartDate: formData.attentionDate,
      restEndDate: getRestEndDate(formData.attentionDate, formData.restDays),
      evaluationResult: formData.evaluationResult,
      doctorId: formData.doctorId,
      doctorName: doctorName,
      // Vitals
      weight: formData.weight,
      height: formData.height,
      bmi: (formData.weight && formData.height) ? Number((formData.weight / ((formData.height/100) ** 2)).toFixed(2)) : undefined,
      bloodPressure: formData.bloodPressure,
      heartRate: formData.heartRate,
      respiratoryRate: formData.respiratoryRate,
      temperature: formData.temperature,
      oxygenSaturation: formData.oxygenSaturation
    };

    try {
      if (activeTab === 'edit' && editingId) {
        // UPDATE
        await updateMedicalAttention(editingId, dataToSave);
        setActionSuccess("Atención actualizada correctamente.");
        // Refresh list needed if we go back to list, but here we stay or could go back
        setEditingId(null); // Go back to list
        // Refresh the list in background
        const list = await getMedicalAttentionsByCedula(currentPatient.cedula);
        setAttentionsList(list);
      } else {
        // CREATE
        await saveMedicalAttentionToDB(dataToSave, currentPatient.company);
        
        // If it's an "Egreso" attention, mark patient as such
        if (formData.attentionType === 'Egreso') {
          await updatePatient(currentPatient.id, { status: 'Egreso' });
        }
        
        setActionSuccess("Atención registrada correctamente.");
        resetForm();
      }
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (error) {
      alert(`Error al ${activeTab === 'edit' ? 'actualizar' : 'guardar'} la atención.`);
    } finally {
      setLoadingAction(false);
    }
  };

  // --- UI Components ---

  const renderPatientHeader = () => {
    if (!currentPatient) return null;
    return (
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-6 mb-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <User className="w-32 h-32 text-blue-600" />
        </div>
        <h3 className="text-blue-900 font-bold mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Datos del Paciente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
          <div className="md:col-span-2">
            <p className="text-sm text-blue-600 font-medium uppercase tracking-wider">Nombres y Apellidos</p>
            <p className="text-lg text-blue-900 font-semibold">{currentPatient.firstName}</p>
          </div>
          <div>
            <p className="text-sm text-blue-600 font-medium uppercase tracking-wider">Fecha Nacimiento</p>
            <p className="text-lg text-blue-900 font-medium">{new Date(currentPatient.birthDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-blue-600 font-medium uppercase tracking-wider">Edad</p>
            <p className="text-lg text-blue-900 font-medium">{calculateAge(currentPatient.birthDate)} años</p>
          </div>
        </div>
      </div>
    );
  };

  const renderForm = () => (
    <form onSubmit={handleSaveOrUpdate} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {activeTab === 'edit' && (
        <button 
          type="button" 
          onClick={() => setEditingId(null)}
          className="mb-4 flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver a la lista
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Datos Atención */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-indigo-900">Datos de la Atención</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Atención</label>
                <input 
                  type="date" 
                  name="attentionDate"
                  required
                  value={formData.attentionDate}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                   <User className="w-3.5 h-3.5 text-indigo-500" /> Médico Tratante <span className="text-red-500">*</span>
                </label>
                <select 
                  name="doctorId"
                  required
                  value={formData.doctorId}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="">-- Seleccionar --</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.title} {doc.firstName}</option>
                  ))}
                </select>
                {doctors.length === 0 && <p className="text-[10px] text-red-500 mt-1">No hay médicos registrados. Ir a Archivo &gt; Médicos</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Atención</label>
                <select 
                  name="attentionType"
                  value={formData.attentionType}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="Pre Empleo">Pre Empleo</option>
                  <option value="Pre Vacaciones">Pre Vacaciones</option>
                  <option value="Egreso">Egreso</option>
                  <option value="Periódica">Periódica</option>
                  <option value="General">General</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                   <Target className="w-3.5 h-3.5 text-indigo-500" /> Motivo
                </label>
                <select 
                  name="reason"
                  value={formData.reason}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="Enfermedad Común">Enfermedad Común</option>
                  <option value="Enfermedad Ocupacional">Enfermedad Ocupacional</option>
                  <option value="Accidente Común">Accidente Común</option>
                  <option value="Accidente Ocupacional">Accidente Ocupacional</option>
                  <option value="No Aplica">No Aplica</option>
                </select>
              </div>
            </div>
        </div>

        {/* Signos Vitales */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-emerald-900">Signos Vitales y Antropometría</h3>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Peso (kg)</label>
                <input 
                  type="number" 
                  step="0.1"
                  name="weight"
                  value={formData.weight || ''}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Talla (cm)</label>
                <input 
                  type="number" 
                  name="height"
                  value={formData.height || ''}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">T.A. (mmHg)</label>
                <input 
                  type="text" 
                  name="bloodPressure"
                  value={formData.bloodPressure}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="120/80"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">F.C. (bpm)</label>
                <input 
                  type="number" 
                  name="heartRate"
                  value={formData.heartRate || ''}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">F.R. (rpm)</label>
                <input 
                  type="number" 
                  name="respiratoryRate"
                  value={formData.respiratoryRate || ''}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Temp (°C)</label>
                <input 
                  type="number" 
                  step="0.1"
                  name="temperature"
                  value={formData.temperature || ''}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">SatO2 (%)</label>
                <input 
                  type="number" 
                  name="oxygenSaturation"
                  value={formData.oxygenSaturation || ''}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>
            </div>
        </div>

        {/* Signos Vitales */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-emerald-900">Signos Vitales y Antropometría</h3>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Peso (kg)</label>
                <input 
                  type="number" 
                  step="0.1"
                  name="weight"
                  value={formData.weight || ''}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Talla (cm)</label>
                <input 
                  type="number" 
                  name="height"
                  value={formData.height || ''}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">T.A. (mmHg)</label>
                <input 
                  type="text" 
                  name="bloodPressure"
                  value={formData.bloodPressure}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="120/80"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">F.C. (bpm)</label>
                <input 
                  type="number" 
                  name="heartRate"
                  value={formData.heartRate || ''}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">F.R. (rpm)</label>
                <input 
                  type="number" 
                  name="respiratoryRate"
                  value={formData.respiratoryRate || ''}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Temp (°C)</label>
                <input 
                  type="number" 
                  step="0.1"
                  name="temperature"
                  value={formData.temperature || ''}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">SatO2 (%)</label>
                <input 
                  type="number" 
                  name="oxygenSaturation"
                  value={formData.oxygenSaturation || ''}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>
            </div>
        </div>

        {/* Diagnóstico */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible flex flex-col z-20">
          <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-emerald-900">Diagnóstico (CIE-10 / INPSASEL)</h3>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-4">
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-slate-700 mb-1">Buscar Patología / Código</label>
              <div className="relative">
                <input 
                  type="text"
                  value={pathologySearch}
                  onChange={(e) => {
                    setPathologySearch(e.target.value);
                    setShowPathologyList(true);
                  }}
                  onFocus={() => setShowPathologyList(true)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50"
                  placeholder="Ej. Lumbago, M54.5, Túnel Carpiano..."
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                {pathologySearch && (
                  <button 
                    type="button" 
                    onClick={() => setPathologySearch('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {showPathologyList && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 max-h-60 overflow-y-auto z-50">
                  {filteredPathologies.length > 0 ? (
                    filteredPathologies.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => addPathologyToDiagnosis(item)}
                        className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-slate-100 last:border-0 flex items-start gap-3 transition-colors group"
                      >
                        <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded font-mono group-hover:bg-emerald-100 group-hover:text-emerald-700">
                          {item.code}
                        </span>
                        <span className="text-sm text-slate-700 font-medium group-hover:text-emerald-900">
                          {item.name}
                        </span>
                        <Plus className="w-4 h-4 ml-auto text-slate-300 group-hover:text-emerald-500" />
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-500">
                      {pathologySearch ? 'No se encontraron resultados.' : 'Escriba para buscar...'}
                    </div>
                  )}
                  {pathologySearch && (
                    <button
                      type="button"
                      onClick={addCustomPathology}
                      className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-blue-50 border-t border-slate-200 flex items-center gap-2 text-blue-600 font-medium transition-colors"
                    >
                      <ListPlus className="w-4 h-4" />
                      Agregar "{pathologySearch}" manualmente
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Diagnósticos Seleccionados / Notas</label>
              <textarea 
                name="diagnosis"
                required
                value={formData.diagnosis}
                onChange={handleFormChange}
                rows={6}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Reposo y Resultado */}
        <div className="space-y-6 z-10">
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
               <Ambulance className="w-5 h-5 text-slate-600" />
               <h3 className="font-semibold text-slate-800">Referencia Médica</h3>
            </div>
            <div className="p-6">
               <label className="block text-sm font-medium text-slate-700 mb-1">Especialidad (Opcional)</label>
               <select
                  name="medicalReferral"
                  value={formData.medicalReferral}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
               >
                  <option value="">-- No requiere referencia --</option>
                  {medicalSpecialties.map((specialty) => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
               </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-orange-900">Reposo Médico</h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Días de Reposo Otorgados</label>
                <input 
                  type="number" 
                  min="0"
                  name="restDays"
                  value={formData.restDays}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-lg font-semibold text-slate-800"
                />
              </div>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Desde:</span>
                  <span className="font-medium text-slate-800">{formData.attentionDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Hasta:</span>
                  <span className="font-medium text-slate-800">
                    {getRestEndDate(formData.attentionDate, formData.restDays)}
                  </span>
                </div>
              </div>
            </div>
          </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-800">Resultado Evaluación</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {['Apto', 'No Apto', 'Postpuesta', 'No Aplica'].map((option) => (
                    <label key={option} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="relative flex items-center">
                      <input 
                        type="radio" 
                        name="evaluationResult" 
                        value={option}
                        checked={formData.evaluationResult === option}
                        onChange={handleFormChange}
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border border-slate-300 checked:border-blue-600 transition-all"
                      />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-600 opacity-0 peer-checked:opacity-100 transition-opacity"></span>
                    </div>
                    <span className={`font-medium ${formData.evaluationResult === option ? 'text-blue-700' : 'text-slate-600'}`}>
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Campos adicionales para reporte */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
               <BookOpen className="w-5 h-5 text-slate-600" />
               <h3 className="font-semibold text-slate-800">Notas Adicionales para el Informe</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones / Hallazgos</label>
                  <textarea 
                     name="observations"
                     value={formData.observations}
                     onChange={handleFormChange}
                     rows={4}
                     className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                     placeholder="Ej. Examen físico dentro de límites normales..."
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Recomendaciones / Plan</label>
                  <textarea 
                     name="recommendations"
                     value={formData.recommendations}
                     onChange={handleFormChange}
                     rows={4}
                     className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                     placeholder="Ej. Uso de EPP, pausas activas, control anual..."
                  />
               </div>
            </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end pb-8">
        <button
          type="submit"
          disabled={loadingAction}
          className={`
            flex items-center gap-2 px-8 py-3 rounded-lg text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all
            ${loadingAction ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800'}
          `}
        >
          {loadingAction ? 'Procesando...' : (
            <>
              <Save className="w-5 h-5" />
              {activeTab === 'edit' ? 'Actualizar Atención' : 'Guardar Atención'}
            </>
          )}
        </button>
      </div>
    </form>
  );

  const renderAttentionsList = () => {
    if (isLoadingList) return <div className="text-center p-8 text-slate-500">Cargando registros...</div>;
    if (attentionsList.length === 0) return (
       <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center flex flex-col items-center">
          <div className="bg-slate-200 p-4 rounded-full mb-3">
             <ClipboardList className="w-8 h-8 text-slate-500" />
          </div>
          <h4 className="text-slate-700 font-semibold mb-1">Sin registros encontrados</h4>
          <p className="text-slate-500 text-sm">Este paciente no tiene atenciones registradas.</p>
       </div>
    );

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
         <h3 className="font-semibold text-slate-800 mb-2">Historial de Atenciones ({attentionsList.length})</h3>
         {attentionsList.map((attention) => (
            <div key={attention.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1">
                 <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wide">
                      {attention.attentionType}
                    </span>
                    <span className="text-slate-500 text-sm flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(attention.attentionDate).toLocaleDateString()}
                    </span>
                    {attention.reason && (
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                        {attention.reason}
                      </span>
                    )}
                 </div>
                 {attention.doctorName && (
                   <p className="text-xs text-blue-600 font-medium mb-1">Atendido por: {attention.doctorName}</p>
                 )}
                 <p className="text-slate-700 text-sm line-clamp-2">{attention.diagnosis || 'Sin diagnóstico especificado'}</p>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                 {activeTab === 'edit' && (
                   <button 
                     onClick={() => handleEditClick(attention)}
                     className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium text-sm transition-colors"
                   >
                     <PenSquare className="w-4 h-4" /> Modificar
                   </button>
                 )}
                 {activeTab === 'delete' && (
                   <button 
                     onClick={() => handleDeleteClick(attention.id)}
                     className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm transition-colors"
                   >
                     <Trash2 className="w-4 h-4" /> Eliminar
                   </button>
                 )}
              </div>
            </div>
         ))}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
       
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Atención Médica</h2>
          {actionSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded flex items-center animate-pulse shadow-sm">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {actionSuccess}
            </div>
          )}
       </div>

       {/* Tabs Navigation */}
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

      {/* Main Search Section (Always visible initially) */}
      {!editingId && (
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Búsqueda de Paciente {activeTab !== 'add' && 'para gestión'}
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
      )}

      {/* --- CONTENT RENDER LOGIC --- */}
      
      {/* 1. ADD MODE: Show Patient Info -> Form */}
      {activeTab === 'add' && currentPatient && (
        <>
          {renderPatientHeader()}
          {renderForm()}
        </>
      )}

      {/* 2. EDIT MODE: Show Patient Info -> List -> (On Click) Form */}
      {activeTab === 'edit' && currentPatient && (
        <>
          {renderPatientHeader()}
          
          {!editingId ? (
            renderAttentionsList()
          ) : (
            renderForm()
          )}
        </>
      )}

      {/* 3. DELETE MODE: Show Patient Info -> List with Delete Buttons */}
      {activeTab === 'delete' && currentPatient && (
        <>
          {renderPatientHeader()}
          {attentionsList.length > 0 && (
             <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-start gap-3 text-sm border border-red-100">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>Modo de eliminación activo. Las acciones realizadas aquí son irreversibles. Se solicitará confirmación antes de borrar cualquier registro.</p>
             </div>
          )}
          {renderAttentionsList()}
        </>
      )}

    </div>
  );
};

export default MedicalAttention;