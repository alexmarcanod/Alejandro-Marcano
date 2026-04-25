
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Printer, FileText, AlertCircle, ChevronRight, 
  User, Building2, ClipboardList, Briefcase, Activity, 
  Calendar, ShieldCheck, ArrowLeft, Clock, Save, CheckCircle2, X, ListPlus, UserCog
} from 'lucide-react';
import { findPatientByCedula, getMedicalAttentionsByCedula, getDoctors, saveMedicalAttentionToDB, getCompanies } from '../utils/storage';
import { Patient, MedicalAttention, Doctor, Company } from '../types';
import { pathologies, Pathology } from '../utils/nandaData';

interface MedicalReportGeneratorProps {
  type: 'medical' | 'occupational' | 'sick-leave' | 'external-sick-leave';
}

const MedicalReportGenerator: React.FC<MedicalReportGeneratorProps> = ({ type }) => {
  // --- State ---
  const [searchCedula, setSearchCedula] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [attentions, setAttentions] = useState<MedicalAttention[]>([]);
  const [selectedAttention, setSelectedAttention] = useState<MedicalAttention | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  // --- External Input State (For 'external-sick-leave' mode) ---
  const [isSaving, setIsSaving] = useState(false);
  const [pathologySearch, setPathologySearch] = useState('');
  const [showPathologyList, setShowPathologyList] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [externalData, setExternalData] = useState({
    attentionDate: new Date().toISOString().split('T')[0],
    reason: 'No Aplica' as MedicalAttention['reason'],
    diagnosis: '',
    restDays: 1,
    externalDoctor: '',
    externalInstitution: '',
    doctorId: '' // Médico interno que valida
  });

  // --- Load Reference Data ---
  useEffect(() => {
    const fetchData = async () => {
        const [docs, comps] = await Promise.all([getDoctors(), getCompanies()]);
        setDoctors(docs);
        setCompanies(comps);
        if (docs.length > 0) setSelectedDoctorId(docs[0].id);
    };
    fetchData();
  }, []);

  // Update selectedDoctorId when attention is selected (default to attention's doctor if available)
  useEffect(() => {
    if (selectedAttention?.doctorId) {
      setSelectedDoctorId(selectedAttention.doctorId);
    }
  }, [selectedAttention]);

  // Handle click outside for CIE-10 dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPathologyList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Logic ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCedula.trim()) return;

    setIsSearching(true);
    setError('');
    setSuccess('');
    setPatient(null);
    setAttentions([]);
    setSelectedAttention(null);

    try {
      const foundPatient = await findPatientByCedula(searchCedula);
      if (!foundPatient) {
        setError('El trabajador no se encuentra registrado.');
        return;
      }
      const foundAttentions = await getMedicalAttentionsByCedula(searchCedula);
      
      setPatient(foundPatient);
      setAttentions(foundAttentions);
    } catch (err) {
      setError('Error al recuperar los datos.');
    } finally {
      setIsSearching(false);
    }
  };

  const calculateAge = (birthDateString: string) => {
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const getRestEndDate = (startDate: string, days: number) => {
    if (!startDate) return '';
    const date = new Date(startDate);
    date.setDate(date.getDate() + (Number(days) - 1));
    return date.toISOString().split('T')[0];
  };

  const handleExternalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !externalData.doctorId || !externalData.diagnosis) {
        setError('Por favor complete el diagnóstico y seleccione el médico validador.');
        return;
    }

    setIsSaving(true);
    setError('');

    const validatorDoctor = doctors.find(d => d.id === externalData.doctorId);

    try {
      const newAtt: Omit<MedicalAttention, 'id' | 'createdAt'> = {
        patientId: patient.id,
        patientName: patient.firstName,
        patientCedula: patient.cedula,
        attentionDate: externalData.attentionDate,
        attentionType: 'General',
        reason: externalData.reason,
        diagnosis: externalData.diagnosis,
        restDays: Number(externalData.restDays),
        restStartDate: externalData.attentionDate,
        restEndDate: getRestEndDate(externalData.attentionDate, externalData.restDays),
        evaluationResult: 'No Aplica',
        isExternal: true,
        externalDoctor: externalData.externalDoctor,
        externalInstitution: externalData.externalInstitution,
        doctorId: externalData.doctorId,
        doctorName: validatorDoctor ? `${validatorDoctor.title} ${validatorDoctor.firstName}` : 'Validador Interno'
      };

      const saved = await saveMedicalAttentionToDB(newAtt, patient.company);
      setSuccess('Reposo externo validado y guardado correctamente.');
      setSelectedAttention(saved);
      // Refresh list
      const updatedList = await getMedicalAttentionsByCedula(patient.cedula);
      setAttentions(updatedList);
    } catch (err) {
      setError('Error al guardar la validación.');
    } finally {
      setIsSaving(false);
    }
  };

  const addPathology = (item: Pathology) => {
    const text = `[${item.code}] ${item.name}`;
    setExternalData(prev => ({ ...prev, diagnosis: prev.diagnosis ? `${prev.diagnosis}\n${text}` : text }));
    setPathologySearch('');
    setShowPathologyList(false);
  };

  const getDoctorSignInfo = (doctorId?: string) => {
    const doc = doctors.find(d => d.id === doctorId);
    if (!doc) return { name: 'Firma Autorizada', mpps: '-------', inpsasel: '-------' };
    return {
      name: `${doc.title} ${doc.firstName}`,
      mpps: doc.mpps,
      inpsasel: doc.inpsasel,
      college: doc.collegeId
    };
  };

  const getReportTitle = () => {
    switch (type) {
      case 'medical': return 'Informe Médico Ocupacional';
      case 'occupational': return 'Informe Médico Ocupacional';
      case 'sick-leave': return 'Reposo Médico';
      case 'external-sick-leave': return 'Validación de Reposo Externo';
      default: return 'Informe Médico Ocupacional';
    }
  };

  // --- Sub-Components for Report Layouts ---

  const ReportHeader = () => {
    const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
    return (
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-blue-900 rounded-xl flex items-center justify-center text-white print:border print:border-black">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">{selectedDoctor?.firstName || 'MÉDICO TRATANTE'}</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">
              Medicina Ocupacional<br/>
              {selectedDoctor?.cedula ? `RIF: ${selectedDoctor.cedula}` : ''}
            </p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-sm font-black uppercase text-slate-800 underline decoration-2 underline-offset-4">
            {type === 'sick-leave' ? 'Reposo Médico' : 'Informe Médico Ocupacional'}
          </h2>
          <div className="mt-2 space-y-0.5">
            <p className="text-[10px] text-slate-500 font-mono uppercase">FECHA EMISIÓN: {new Date().toLocaleDateString()}</p>
            {selectedAttention?.reportNumber && (
              <p className="text-[10px] text-blue-700 font-black font-mono uppercase">N° INFORME: {selectedAttention.reportNumber}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const PatientInfoBox = ({ full }: { full?: boolean }) => (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 print:bg-white print:border-slate-300">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="col-span-2">
          <label className="font-black text-slate-400 uppercase text-[9px] block">Paciente</label>
          <p className="font-bold text-slate-900 uppercase">{patient?.firstName}</p>
        </div>
        <div>
          <label className="font-black text-slate-400 uppercase text-[9px] block">Cédula</label>
          <p className="font-bold text-slate-900">V-{patient?.cedula}</p>
        </div>
        <div>
          <label className="font-black text-slate-400 uppercase text-[9px] block">Edad / Sexo</label>
          <p className="font-bold text-slate-900">{calculateAge(patient?.birthDate || '')} años - {patient?.gender}</p>
        </div>
        {full && (
          <>
            <div className="col-span-2">
              <label className="font-black text-slate-400 uppercase text-[9px] block">Empresa</label>
              <p className="font-bold text-slate-900">{patient?.company}</p>
            </div>
            <div className="col-span-2">
              <label className="font-black text-slate-400 uppercase text-[9px] block">Cargo / Puesto</label>
              <p className="font-bold text-slate-900">{patient?.jobTitle}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const SignSection = ({ doctorId }: { doctorId?: string }) => {
    const docInfo = getDoctorSignInfo(doctorId || selectedDoctorId);
    return (
      <div className="mt-16 flex justify-center">
        <div className="w-64 text-center">
          <div className="h-16 mb-2 border-b border-slate-900"></div>
          <p className="text-xs font-black uppercase text-slate-900">{docInfo.name}</p>
          <p className="text-[9px] font-bold text-slate-500 uppercase">Medicina Ocupacional</p>
          <p className="text-[9px] text-slate-600">MPPS: {docInfo.mpps} {docInfo.college && `| CM: ${docInfo.college}`}</p>
          {docInfo.inpsasel && <p className="text-[9px] text-slate-600">INPSASEL: {docInfo.inpsasel}</p>}
        </div>
      </div>
    );
  };

  // --- Main Render Logic ---

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <FileText className="w-6 h-6 text-blue-600" />
             {getReportTitle()}
           </h2>
           <p className="text-slate-500 text-sm">Generación de documentos médicos oficiales.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
              <UserCog className="w-4 h-4 text-slate-400" />
              <select 
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="text-sm font-bold text-slate-700 outline-none bg-transparent"
              >
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.title} {d.firstName}</option>)}
              </select>
          </div>
          {patient && (
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all shadow-lg hover:shadow-xl active:scale-95 font-bold"
            >
              <Printer className="w-5 h-5" />
              Imprimir Reporte
            </button>
          )}
        </div>
      </div>

      {/* 1. Búsqueda de Trabajador (Hidden on print) */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 print:hidden">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Cédula de Identidad</label>
            <div className="relative">
                <input 
                  type="number" 
                  value={searchCedula}
                  onChange={(e) => setSearchCedula(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono"
                  placeholder="Ej. 12345678"
                />
                <Search className="w-6 h-6 text-slate-400 absolute left-4 top-3.5" />
            </div>
          </div>
          <button 
            type="submit"
            disabled={isSearching}
            className="w-full md:w-auto px-10 py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 disabled:bg-slate-300 transition-all"
          >
            {isSearching ? 'Cargando...' : 'Cargar Datos'}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-3 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> {error}</p>}
        {success && <p className="text-green-600 text-sm mt-3 flex items-center gap-2 font-bold"><CheckCircle2 className="w-4 h-4"/> {success}</p>}
      </section>

      {/* 2. Formulario de Validación (Solo para External) */}
      {patient && type === 'external-sick-leave' && !selectedAttention && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
            <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-orange-200 text-orange-600">
                        <ClipboardList className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-orange-900">Registrar Validación de Reposo Externo</h3>
                </div>
                <div className="text-right">
                    <p className="text-xs text-orange-700 font-bold uppercase">{patient.firstName}</p>
                    <p className="text-[10px] text-orange-600 font-mono">V-{patient.cedula}</p>
                </div>
            </div>

            <form onSubmit={handleExternalSave} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Emisión Reposo</label>
                        <input 
                            type="date" 
                            required
                            value={externalData.attentionDate}
                            onChange={e => setExternalData({...externalData, attentionDate: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Días Otorgados</label>
                        <input 
                            type="number" 
                            min="1"
                            required
                            value={externalData.restDays}
                            onChange={e => setExternalData({...externalData, restDays: Number(e.target.value)})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-lg font-bold"
                        />
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col justify-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Periodo Calculado</span>
                        <div className="text-xs font-bold text-slate-700">
                            Del {externalData.attentionDate} al {getRestEndDate(externalData.attentionDate, externalData.restDays)}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motivo del Reposo</label>
                        <select 
                            value={externalData.reason}
                            onChange={e => setExternalData({...externalData, reason: e.target.value as any})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white"
                        >
                            <option value="Enfermedad Común">Enfermedad Común</option>
                            <option value="Accidente Común">Accidente Común</option>
                            <option value="Enfermedad Ocupacional">Enfermedad Ocupacional</option>
                            <option value="Accidente Ocupacional">Accidente Ocupacional</option>
                            <option value="No Aplica">No Aplica</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Médico Validador (Interno)</label>
                        <select 
                            required
                            value={externalData.doctorId}
                            onChange={e => setExternalData({...externalData, doctorId: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white font-bold text-blue-700"
                        >
                            <option value="">-- Seleccionar Médico --</option>
                            {doctors.map(d => <option key={d.id} value={d.id}>{d.title} {d.firstName}</option>)}
                        </select>
                    </div>
                </div>

                <div className="relative" ref={dropdownRef}>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Patología CIE-10 (Búsqueda)</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Buscar código o nombre..."
                            value={pathologySearch}
                            onChange={e => { setPathologySearch(e.target.value); setShowPathologyList(true); }}
                            onFocus={() => setShowPathologyList(true)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                    {showPathologyList && (
                        <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto mt-1">
                            {pathologies.filter(p => p.name.toLowerCase().includes(pathologySearch.toLowerCase()) || p.code.toLowerCase().includes(pathologySearch.toLowerCase())).map(p => (
                                <button 
                                    key={p.code} 
                                    type="button"
                                    onClick={() => addPathology(p)}
                                    className="w-full text-left p-2 hover:bg-blue-50 text-sm border-b border-slate-50 flex gap-2"
                                >
                                    <span className="font-mono font-bold text-blue-600">[{p.code}]</span> {p.name}
                                </button>
                            ))}
                        </div>
                    )}
                    <textarea 
                        required
                        placeholder="Descripción del diagnóstico externo..."
                        value={externalData.diagnosis}
                        onChange={e => setExternalData({...externalData, diagnosis: e.target.value})}
                        className="w-full mt-3 px-3 py-2 border border-slate-300 rounded-lg outline-none h-24 font-mono text-sm"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Médico Tratante (Externo)</label>
                        <input 
                            type="text" 
                            value={externalData.externalDoctor}
                            onChange={e => setExternalData({...externalData, externalDoctor: e.target.value})}
                            placeholder="Nombre del médico que firmó el reposo"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Institución / Centro</label>
                        <input 
                            type="text" 
                            value={externalData.externalInstitution}
                            onChange={e => setExternalData({...externalData, externalInstitution: e.target.value})}
                            placeholder="Ej. IVSS, Hospital Central, Clínica..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                        {isSaving ? 'Guardando...' : <><Save className="w-5 h-5"/> Guardar y Generar Validación</>}
                    </button>
                </div>
            </form>
        </div>
      )}

      {/* 3. Selección de Atención (Solo para Reposo Interno o Informe Médico) */}
      {patient && (type === 'medical' || type === 'sick-leave') && !selectedAttention && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center gap-3 mb-6">
                <User className="w-10 h-10 text-blue-600 bg-white p-2 rounded-full border border-blue-200" />
                <div>
                    <h3 className="font-bold text-blue-900">{patient.firstName}</h3>
                    <p className="text-xs text-blue-700">Seleccione la atención médica para generar el informe/reposo.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {attentions.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-400 italic text-sm">No existen atenciones previas para este trabajador.</p>
                    </div>
                ) : (
                    attentions.map(att => (
                        <button 
                            key={att.id}
                            onClick={() => setSelectedAttention(att)}
                            className="w-full text-left p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{new Date(att.attentionDate).toLocaleDateString()}</p>
                                    <p className="text-xs text-slate-500 uppercase font-medium">
                                        {att.isExternal ? 'VALIDACIÓN EXTERNA' : att.attentionType} - {att.reason}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {att.restDays > 0 && <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded-full">{att.restDays} DÍAS REPOSO</span>}
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
      )}

      {/* 4. REPORT VIEWS (Paper Visualization) */}
      {selectedAttention && patient && (
        <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-between items-center mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedAttention(null)} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
            <UserCog className="w-4 h-4 text-slate-400" />
            <select 
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="text-sm font-bold text-slate-700 outline-none bg-transparent"
            >
              {doctors.map(d => <option key={d.id} value={d.id}>{d.title} {d.firstName}</option>)}
            </select>
          </div>
        </div>
        <button onClick={() => window.print()} className="px-6 py-2 bg-slate-800 text-white rounded-lg flex items-center gap-2 font-bold shadow-lg">
            <Printer className="w-4 h-4" /> Imprimir Documento
        </button>
      </div>

            {/* PAPER */}
            <div className="bg-white shadow-2xl border border-slate-200 w-full max-w-[216mm] mx-auto min-h-[279mm] p-[15mm] print:shadow-none print:border-0 print:p-0 flex flex-col">
                <ReportHeader />
                <PatientInfoBox full />

                {type === 'medical' ? (
                  <div className="flex-1 space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Diagnóstico Médico (CIE-10)</h3>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 min-h-[100px] print:bg-white">
                            <p className="text-sm text-slate-800 font-bold italic whitespace-pre-wrap leading-relaxed">
                                {selectedAttention.diagnosis}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Tratamiento e Indicaciones</h3>
                        <div className="p-3 bg-white min-h-[200px]">
                            <p className="text-sm text-slate-700 leading-relaxed">
                                {selectedAttention.observations || "Se remite al paciente con las recomendaciones pertinentes según su diagnóstico."}
                                <br/><br/>
                                <strong>Plan de Recomendaciones:</strong><br/>
                                {selectedAttention.recommendations || "- Seguir indicaciones generales de salud ocupacional."}
                            </p>
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center space-y-8 text-center">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black text-slate-900 uppercase">
                            {selectedAttention.isExternal ? 'CERTIFICADO DE VALIDACIÓN' : 'CERTIFICADO DE REPOSO'}
                        </h2>
                        <div className="w-20 h-1 bg-slate-900 mx-auto"></div>
                    </div>
                    
                    <p className="text-base text-slate-800 leading-relaxed text-justify px-8">
                        Se hace constar por medio de la presente, que el trabajador <strong>{patient.firstName.toUpperCase()}</strong>, titular de la Cédula de Identidad <strong>V-{patient.cedula}</strong>, quien labora en la empresa <strong>{patient.company}</strong>, ha presentado documentación médica 
                        {selectedAttention.isExternal ? ' externa que ha sido validada por este servicio.' : ' tras ser evaluado en este servicio médico.'} 
                        En consecuencia, se avala el periodo de <strong>REPOSO MÉDICO</strong> por:
                    </p>

                    <div className="bg-slate-900 text-white p-6 rounded-2xl mx-12 shadow-xl print:bg-white print:text-black print:border-4 print:border-black print:shadow-none">
                        <p className="text-5xl font-black mb-2">{selectedAttention.restDays} DÍAS</p>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-70">Continuos</p>
                    </div>

                    <div className="flex justify-center gap-12 text-sm">
                        <div className="text-center">
                            <p className="font-bold text-slate-400 uppercase text-[10px]">Fecha Inicio</p>
                            <p className="text-xl font-black text-slate-800">{selectedAttention.restStartDate}</p>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-slate-400 uppercase text-[10px]">Fecha Culminación</p>
                            <p className="text-xl font-black text-slate-800">{selectedAttention.restEndDate}</p>
                        </div>
                    </div>

                    <div className="px-8 text-left italic text-slate-500 border-l-4 border-slate-200 space-y-1">
                        <p className="text-sm"><strong>Motivo:</strong> {selectedAttention.reason}</p>
                        <p className="text-sm"><strong>Diagnóstico:</strong> {selectedAttention.diagnosis.split('\n')[0]}</p>
                        {selectedAttention.isExternal && (
                            <>
                                <p className="text-sm text-blue-700"><strong>Médico Tratante (Ext):</strong> {selectedAttention.externalDoctor}</p>
                                <p className="text-sm text-blue-700"><strong>Institución:</strong> {selectedAttention.externalInstitution}</p>
                            </>
                        )}
                    </div>
                  </div>
                )}

                <SignSection doctorId={selectedDoctorId} />
                <div className="mt-auto pt-4 border-t border-slate-100 text-[8px] text-slate-400 text-center uppercase tracking-tighter">
                    Documento electrónico generado por Sistema de Vigilancia Epidemiológica {selectedAttention.isExternal ? '(Validación Externa)' : '(Atención Interna)'}
                </div>
            </div>
        </div>
      )}

      {/* 5. INFORME OCUPACIONAL (HISTÓRICO) */}
      {patient && type === 'occupational' && (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex justify-end items-center gap-4 mb-6 print:hidden">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                    <UserCog className="w-4 h-4 text-slate-400" />
                    <select 
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        className="text-sm font-bold text-slate-700 outline-none bg-transparent"
                    >
                        {doctors.map(d => <option key={d.id} value={d.id}>{d.title} {d.firstName}</option>)}
                    </select>
                </div>
                <button onClick={() => window.print()} className="px-6 py-2 bg-slate-900 text-white rounded-lg flex items-center gap-2 font-bold shadow-lg">
                    <Printer className="w-4 h-4" /> Imprimir Antecedentes
                </button>
            </div>

            {/* PAPER */}
            <div className="bg-white shadow-2xl border border-slate-200 w-full max-w-[216mm] mx-auto min-h-[279mm] p-[15mm] print:shadow-none print:border-0 print:p-0 flex flex-col">
                <ReportHeader />
                <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> I. Datos del Trabajador
                </h3>
                <PatientInfoBox full />

                <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4 mt-4 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> II. Historial de Vigilancia de Salud
                </h3>

                <div className="flex-1">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white print:bg-white print:text-black print:border-b-2 print:border-black">
                                <th className="p-2 text-[9px] font-black uppercase text-left border border-slate-800 w-24">Fecha</th>
                                <th className="p-2 text-[9px] font-black uppercase text-left border border-slate-800">Tipo / Motivo</th>
                                <th className="p-2 text-[9px] font-black uppercase text-left border border-slate-800">Diagnósticos</th>
                                <th className="p-2 text-[9px] font-black uppercase text-left border border-slate-800">Resultado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attentions.map(att => (
                                <tr key={att.id} className="border-b border-slate-100">
                                    <td className="p-2 text-[10px] font-bold border border-slate-200 align-top">{att.attentionDate}</td>
                                    <td className="p-2 text-[10px] border border-slate-200 align-top">
                                        <span className="font-black text-slate-800 block leading-tight">{att.isExternal ? 'VAL. EXTERNA' : att.attentionType}</span>
                                        <span className="text-slate-500 italic text-[9px]">{att.reason}</span>
                                    </td>
                                    <td className="p-2 text-[10px] border border-slate-200 align-top">
                                        <p className="whitespace-pre-wrap leading-tight text-slate-700 font-bold">{att.diagnosis.split('\n')[0]}</p>
                                        {att.restDays > 0 && <span className="text-[8px] bg-orange-50 text-orange-600 px-1 font-black">REPOSO: {att.restDays} DÍAS</span>}
                                    </td>
                                    <td className="p-2 text-[10px] border border-slate-200 align-top">
                                        <p className="font-bold text-blue-800">{att.evaluationResult}</p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <SignSection doctorId={selectedDoctorId} />
                <div className="mt-auto pt-4 text-[8px] text-slate-300 text-center font-mono uppercase">
                    Documento generado por Sistema de Vigilancia Epidemiológica | {new Date().toISOString()}
                </div>
            </div>
        </div>
      )}

      {/* 6. Empty State */}
      {!patient && !isSearching && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300 animate-in fade-in">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-6">
                  <ClipboardList className="w-12 h-12" />
              </div>
              <p className="text-lg font-medium text-slate-400 text-center max-w-sm">Ingrese el número de cédula del trabajador para comenzar.</p>
          </div>
      )}
    </div>
  );
};

export default MedicalReportGenerator;
