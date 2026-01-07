import React, { useState, useEffect } from 'react';
import { Search, Printer, Activity, AlertCircle, FileText, ChevronRight, ShieldPlus } from 'lucide-react';
import { findPatientByCedula, getMedicalAttentionsByCedula, getDoctors } from '../utils/storage';
import { Patient, MedicalAttention, Doctor } from '../types';

const DiagnosticImpression: React.FC = () => {
  // State for Search
  const [searchCedula, setSearchCedula] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  // Data State
  const [patient, setPatient] = useState<Patient | null>(null);
  const [attentions, setAttentions] = useState<MedicalAttention[]>([]);
  const [selectedAttention, setSelectedAttention] = useState<MedicalAttention | null>(null);
  const [assignedDoctor, setAssignedDoctor] = useState<Doctor | null>(null);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);

  // Load doctors for lookup
  useEffect(() => {
    const loadDocs = async () => {
        const docs = await getDoctors();
        setAllDoctors(docs);
    };
    loadDocs();
  }, []);

  // Update assigned doctor when attention changes
  useEffect(() => {
    if (selectedAttention && selectedAttention.doctorId) {
        const doc = allDoctors.find(d => d.id === selectedAttention.doctorId);
        setAssignedDoctor(doc || null);
    } else {
        setAssignedDoctor(null);
    }
  }, [selectedAttention, allDoctors]);

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCedula.trim()) return;

    setIsSearching(true);
    setError('');
    setPatient(null);
    setAttentions([]);
    setSelectedAttention(null);

    try {
      const foundPatient = await findPatientByCedula(searchCedula);
      if (!foundPatient) {
        setError('Paciente no encontrado.');
        setIsSearching(false);
        return;
      }

      const foundAttentions = await getMedicalAttentionsByCedula(searchCedula);
      
      setPatient(foundPatient);
      setAttentions(foundAttentions);
    } catch (err) {
      setError('Error al recuperar datos.');
    } finally {
      setIsSearching(false);
    }
  };

  // Helper to format Diagnosis text (preserve newlines)
  const formatDiagnosis = (text: string) => {
    if (!text) return "Sin diagnóstico registrado.";
    return text.split('\n').map((line, i) => (
        <span key={i} className="block">{line}</span>
    ));
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
        <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2 print:hidden">
            <Activity className="w-6 h-6 text-blue-600" />
            I Diagnóstica (Informe)
        </h2>
        <p className="text-slate-500 text-sm mb-6 print:hidden">Generación de informe de Historia Biopsicosocial.</p>

        {/* --- SEARCH SECTION (Hidden on print) --- */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 print:hidden">
            <form onSubmit={handleSearch} className="flex gap-4 items-end">
            <div className="flex-1 max-w-md">
                <label className="block text-sm font-medium text-slate-700 mb-1">Cédula del Paciente</label>
                <div className="relative">
                <input 
                    type="number" 
                    value={searchCedula}
                    onChange={(e) => setSearchCedula(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ingrese Cédula"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
            </div>
            <button 
                type="submit"
                disabled={isSearching}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-medium"
            >
                {isSearching ? 'Buscando...' : 'Buscar'}
            </button>
            </form>
            {error && <p className="text-red-500 text-sm mt-3 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {error}</p>}
        </section>

        {/* --- SELECTION LIST (If multiple attentions) --- */}
        {patient && !selectedAttention && attentions.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="font-semibold text-slate-800 mb-4">Seleccione la Atención Médica para generar el informe:</h3>
                <div className="space-y-3">
                    {attentions.map((att) => (
                        <div 
                            key={att.id} 
                            onClick={() => setSelectedAttention(att)}
                            className="p-4 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all flex justify-between items-center group"
                        >
                            <div>
                                <div className="font-bold text-slate-800">{new Date(att.attentionDate).toLocaleDateString()}</div>
                                <div className="text-sm text-slate-600">{att.attentionType} - {att.reason || 'Consulta General'}</div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
                        </div>
                    ))}
                </div>
            </div>
        )}

        {patient && attentions.length === 0 && !isSearching && (
             <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg border border-yellow-200 mb-6 flex items-center gap-2">
                 <AlertCircle className="w-5 h-5" /> Este paciente no tiene atenciones registradas para generar un informe.
             </div>
        )}

        {/* --- REPORT PREVIEW --- */}
        {selectedAttention && patient && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
                
                {/* Actions Bar */}
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <button 
                        onClick={() => setSelectedAttention(null)}
                        className="text-sm text-slate-500 hover:text-slate-800 font-medium underline"
                    >
                        ← Volver a selección
                    </button>
                    <button 
                        onClick={() => window.print()}
                        className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium shadow-lg flex items-center gap-2"
                    >
                        <Printer className="w-4 h-4" /> Guardar e Imprimir Diagnóstico
                    </button>
                </div>

                {/* PAPER DOCUMENT */}
                <div className="bg-white shadow-xl border border-slate-200 rounded-none md:rounded-sm overflow-hidden w-full max-w-[216mm] mx-auto min-h-[279mm] p-[15mm] print:shadow-none print:border-0 print:w-full print:max-w-none print:p-0">
                    
                    {/* 1. Header */}
                    <header className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-blue-900 rounded-lg flex items-center justify-center text-white">
                                <ShieldPlus className="w-10 h-10" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 uppercase tracking-wider leading-tight">Alex Consulting</h1>
                                <p className="text-sm font-semibold text-slate-600 uppercase tracking-widest">Servicios Médicos</p>
                            </div>
                        </div>
                        <div className="text-right text-xs font-mono">
                            <div className="grid grid-cols-[auto_1fr] gap-x-2 text-right items-center">
                                <span className="font-bold text-slate-500 uppercase">Fecha:</span>
                                <span className="font-bold text-slate-900 text-sm border-b border-slate-300 px-2">
                                    {new Date(selectedAttention.attentionDate).toLocaleDateString()}
                                </span>

                                <span className="font-bold text-slate-500 uppercase mt-1">N° Historia:</span>
                                <span className="font-bold text-slate-900 text-sm border-b border-slate-300 px-2 mt-1">
                                    {patient.cedula}
                                </span>

                                <span className="font-bold text-slate-500 uppercase mt-1">Tipo:</span>
                                <span className="font-bold text-slate-900 text-sm border-b border-slate-300 px-2 mt-1 uppercase">
                                    {selectedAttention.attentionType}
                                </span>
                            </div>
                        </div>
                    </header>

                    {/* 2. Patient Data Table */}
                    <section className="mb-6">
                        <h3 className="text-xs font-bold bg-slate-100 uppercase border border-slate-300 border-b-0 p-1 text-center text-slate-700">
                            I. Identificación del Trabajador
                        </h3>
                        <div className="border border-slate-300 text-xs">
                            {/* Row 1 */}
                            <div className="flex border-b border-slate-300">
                                <div className="flex-1 p-1 border-r border-slate-300">
                                    <span className="font-bold text-slate-500 block text-[9px]">APELLIDOS Y NOMBRES</span>
                                    <span className="uppercase font-semibold">{patient.firstName}</span>
                                </div>
                                <div className="w-32 p-1">
                                    <span className="font-bold text-slate-500 block text-[9px]">CÉDULA</span>
                                    <span className="uppercase font-semibold">{patient.cedula}</span>
                                </div>
                            </div>
                            {/* Row 2 */}
                            <div className="flex border-b border-slate-300">
                                <div className="w-24 p-1 border-r border-slate-300">
                                    <span className="font-bold text-slate-500 block text-[9px]">SEXO</span>
                                    <span className="uppercase">{patient.gender}</span>
                                </div>
                                <div className="w-16 p-1 border-r border-slate-300">
                                    <span className="font-bold text-slate-500 block text-[9px]">EDAD</span>
                                    <span>{calculateAge(patient.birthDate)}</span>
                                </div>
                                <div className="flex-1 p-1 border-r border-slate-300">
                                    <span className="font-bold text-slate-500 block text-[9px]">ESTADO CIVIL</span>
                                    <span className="uppercase">{patient.maritalStatus || '-'}</span>
                                </div>
                                <div className="flex-1 p-1 border-r border-slate-300">
                                    <span className="font-bold text-slate-500 block text-[9px]">OCUPACIÓN / CARGO</span>
                                    <span className="uppercase">{patient.jobTitle}</span>
                                </div>
                                <div className="flex-1 p-1 border-r border-slate-300">
                                    <span className="font-bold text-slate-500 block text-[9px]">ESTUDIOS</span>
                                    <span className="uppercase">{patient.educationLevel || '-'}</span>
                                </div>
                                <div className="w-28 p-1">
                                    <span className="font-bold text-slate-500 block text-[9px]">MANO DOMINANTE</span>
                                    <span className="uppercase">{patient.dominantHand || '-'}</span>
                                </div>
                            </div>
                            {/* Row 3 */}
                            <div className="flex border-b border-slate-300">
                                <div className="w-32 p-1 border-r border-slate-300">
                                    <span className="font-bold text-slate-500 block text-[9px]">FECHA NACIMIENTO</span>
                                    <span>{new Date(patient.birthDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex-1 p-1 border-r border-slate-300">
                                    <span className="font-bold text-slate-500 block text-[9px]">LUGAR NACIMIENTO</span>
                                    <span className="uppercase">{patient.placeOfBirth || '-'}</span>
                                </div>
                                <div className="flex-1 p-1 border-r border-slate-300">
                                    <span className="font-bold text-slate-500 block text-[9px]">ESTADO / PAÍS</span>
                                    <span className="uppercase">{patient.state ? `${patient.state}, ` : ''}{patient.country || 'Venezuela'}</span>
                                </div>
                                <div className="w-32 p-1">
                                    <span className="font-bold text-slate-500 block text-[9px]">TELÉFONO</span>
                                    <span>{patient.phone}</span>
                                </div>
                            </div>
                            {/* Row 4 */}
                            <div className="flex">
                                <div className="flex-1 p-1">
                                    <span className="font-bold text-slate-500 block text-[9px]">EMPRESA</span>
                                    <span className="uppercase font-bold">{patient.company}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. Diagnostic Impression Section */}
                    <section className="mb-6">
                        <h3 className="text-xs font-bold bg-slate-100 uppercase border border-slate-300 border-b-0 p-1 text-center text-slate-700">
                            II. Conclusiones Médicas
                        </h3>
                        <div className="border border-slate-300 p-4 space-y-4">
                            
                            {/* Diagnóstico */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-1 underline">Impresión Diagnóstica:</h4>
                                <div className="text-sm font-medium text-slate-900 bg-slate-50 p-2 rounded border border-slate-200">
                                    {formatDiagnosis(selectedAttention.diagnosis)}
                                </div>
                            </div>

                            {/* Sin Limitaciones Logic */}
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-slate-500 uppercase">Sin Limitaciones:</span>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-1">
                                        <div className={`w-4 h-4 border border-slate-400 flex items-center justify-center ${selectedAttention.evaluationResult === 'Apto' ? 'bg-black text-white' : 'bg-white'}`}>
                                            {selectedAttention.evaluationResult === 'Apto' && <span className="text-[10px]">X</span>}
                                        </div>
                                        <span className="text-xs font-bold">SI</span>
                                    </label>
                                    <label className="flex items-center gap-1">
                                        <div className={`w-4 h-4 border border-slate-400 flex items-center justify-center ${selectedAttention.evaluationResult !== 'Apto' ? 'bg-black text-white' : 'bg-white'}`}>
                                             {selectedAttention.evaluationResult !== 'Apto' && <span className="text-[10px]">X</span>}
                                        </div>
                                        <span className="text-xs font-bold">NO</span>
                                    </label>
                                </div>
                            </div>

                            {/* Observaciones */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-1 underline">Observaciones:</h4>
                                <p className="text-xs text-slate-800 min-h-[3rem] border-b border-slate-200 border-dotted pb-1">
                                    {selectedAttention.observations || "Sin observaciones adicionales."}
                                </p>
                            </div>

                            {/* Recomendaciones */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-1 underline">Recomendaciones:</h4>
                                <p className="text-xs text-slate-800 min-h-[3rem] border-b border-slate-200 border-dotted pb-1">
                                    {selectedAttention.recommendations || "Sin recomendaciones específicas."}
                                </p>
                            </div>

                             {/* Estudios Solicitados (Using Medical Referral logic mostly, but could be part of diagnosis) */}
                             <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-1 underline">Estudios / Interconsultas Solicitadas:</h4>
                                <p className="text-xs text-slate-800">
                                    {selectedAttention.medicalReferral || "Ninguno."}
                                </p>
                            </div>

                        </div>
                    </section>
                    
                    {/* 4. Footer & Signatures */}
                    <div className="mt-12 flex justify-center">
                        <div className="w-64 text-center">
                            {/* Signature Line */}
                            <div className="border-t border-slate-900 pt-2">
                                {assignedDoctor ? (
                                    <>
                                        <p className="font-bold text-sm uppercase">{assignedDoctor.title} {assignedDoctor.firstName}</p>
                                        <p className="text-xs">C.I: {assignedDoctor.cedula}</p>
                                        <p className="text-xs">M.P.P.S: {assignedDoctor.mpps}</p>
                                        {assignedDoctor.collegeId && <p className="text-xs">C.M: {assignedDoctor.collegeId}</p>}
                                        {assignedDoctor.inpsasel && <p className="text-xs">INPSASEL: {assignedDoctor.inpsasel}</p>}
                                        <p className="text-[10px] mt-1 text-slate-500 font-bold uppercase">Médico Evaluador</p>
                                    </>
                                ) : (
                                    <p className="text-xs text-red-500 italic">Datos del médico no disponibles.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-4 border-t border-slate-300 text-[10px] text-center text-slate-400">
                        <p>Documento generado electrónicamente por Alex Consulting System el {new Date().toLocaleDateString()}</p>
                    </div>

                </div>
            </div>
        )}

    </div>
  );
};

export default DiagnosticImpression;