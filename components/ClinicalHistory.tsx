import React, { useState } from 'react';
import { 
  Search, User, Calendar, AlertCircle, FileText, 
  Building2, Briefcase, Phone, MapPin, Activity,
  ChevronDown, ChevronUp, Printer, Clock, Target, Ambulance,
  UserCheck, ShieldCheck, ClipboardList, LogIn
} from 'lucide-react';
import { findPatientByCedula, getMedicalAttentionsByCedula } from '../utils/storage';
import { Patient, MedicalAttention } from '../types';

const ClinicalHistory: React.FC = () => {
  // --- State ---
  const [searchCedula, setSearchCedula] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [attentions, setAttentions] = useState<MedicalAttention[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // --- Helpers ---
  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return 0;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCedula.trim()) return;

    setIsSearching(true);
    setError('');
    setPatient(null);
    setAttentions([]);

    try {
      // 1. Get Patient
      const foundPatient = await findPatientByCedula(searchCedula);
      if (!foundPatient) {
        setError('El número de cédula no se encuentra registrado en el sistema.');
        setIsSearching(false);
        return;
      }

      // 2. Get Attentions
      const foundAttentions = await getMedicalAttentionsByCedula(searchCedula);
      
      setPatient(foundPatient);
      setAttentions(foundAttentions);
    } catch (err) {
      setError('Ocurrió un error al intentar recuperar el expediente.');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'Apto': return 'border-green-500 bg-green-50 text-green-800';
      case 'No Apto': return 'border-red-500 bg-red-50 text-red-800';
      case 'Postpuesta': return 'border-orange-500 bg-orange-50 text-orange-800';
      default: return 'border-slate-300 bg-slate-50 text-slate-700';
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 px-4 md:px-0">
      
      {/* 1. Header & Search (Oculto en Impresión) */}
      <section className="print:hidden mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="w-7 h-7 text-blue-600" />
              Historia Clínica Consolidada
            </h2>
            <p className="text-slate-500 text-sm">Vista completa del expediente médico ocupacional del trabajador.</p>
          </div>
          {patient && (
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all shadow-lg hover:shadow-xl active:scale-95 font-bold"
            >
              <Printer className="w-5 h-5" />
              Imprimir Historia Completa
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Búsqueda por Cédula</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={searchCedula}
                  onChange={(e) => setSearchCedula(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono"
                  placeholder="Ej: 12345678"
                />
                <Search className="w-6 h-6 text-slate-400 absolute left-4 top-3" />
              </div>
            </div>
            <button 
              type="submit"
              disabled={isSearching}
              className="w-full md:w-auto px-10 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-bold shadow-md shadow-blue-100"
            >
              {isSearching ? 'Consultando...' : 'Cargar Expediente'}
            </button>
          </form>
          {error && <p className="text-red-500 text-sm mt-3 flex items-center gap-1 font-medium"><AlertCircle className="w-4 h-4"/> {error}</p>}
        </div>
      </section>

      {/* EXPEDIENTE MÉDICO FORMAL */}
      {patient ? (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          
          <div className="bg-white shadow-2xl border border-slate-200 rounded-none md:rounded-xl overflow-hidden print:shadow-none print:border-0 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col relative">
            
            {/* Header del Expediente */}
            <div className="bg-slate-900 text-white p-10 print:bg-white print:text-black print:border-b-2 print:border-black print:p-8">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white print:border print:border-black">
                     <ShieldCheck className="w-10 h-10" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter">ALEX CONSULTING</h1>
                    <p className="text-blue-400 print:text-black text-sm font-bold tracking-widest uppercase">Expediente Médico de Salud Ocupacional</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Cédula Identidad</p>
                   <p className="font-mono text-lg font-bold">V-{patient.cedula}</p>
                </div>
              </div>
            </div>

            <div className="p-10 md:p-12 flex-1">
              
              {/* RESUMEN DEL PACIENTE (DATOS MAESTROS) */}
              <section className="mb-12">
                <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-blue-100 pb-2">
                   <UserCheck className="w-4 h-4" /> Resumen del Trabajador
                </h3>
                
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Foto de Perfil */}
                  <div className="shrink-0 flex justify-center">
                     <div className="w-36 h-36 rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-50 shadow-inner flex items-center justify-center relative">
                       {patient.photoUrl ? (
                         <img src={patient.photoUrl} alt="Paciente" className="w-full h-full object-cover" />
                       ) : (
                         <User className="w-14 h-14 text-slate-200" />
                       )}
                     </div>
                  </div>

                  {/* Datos Maestros */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Nombres y Apellidos</label>
                      <h2 className="text-2xl font-bold text-slate-900 leading-tight">{patient.firstName}</h2>
                    </div>
                    
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Fecha Nac. / Edad</label>
                       <p className="text-base text-slate-800 font-semibold">
                         {formatDate(patient.birthDate)} 
                         <span className="text-blue-600 ml-2">({calculateAge(patient.birthDate)} años)</span>
                       </p>
                    </div>

                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Estatus Laboral</label>
                       <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${patient.employmentStatus === 'fijo' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                         {patient.employmentStatus}
                       </span>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 print:bg-white">
                        <div className="flex items-start gap-2">
                           <Building2 className="w-4 h-4 text-slate-400 mt-0.5" />
                           <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Empresa</label>
                              <p className="text-sm font-bold text-slate-800">{patient.company}</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-2">
                           <Briefcase className="w-4 h-4 text-slate-400 mt-0.5" />
                           <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Cargo</label>
                              <p className="text-sm font-bold text-slate-800">{patient.jobTitle}</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-2">
                           <LogIn className="w-4 h-4 text-slate-400 mt-0.5" />
                           <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Fecha de Ingreso</label>
                              <p className="text-sm font-bold text-slate-800">{patient.entryDate || '-'}</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-2">
                           <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                           <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Teléfono</label>
                              <p className="text-sm font-bold text-slate-800">{patient.phone}</p>
                           </div>
                        </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* LISTADO CRONOLÓGICO DE ATENCIONES */}
              <section className="print:break-inside-auto">
                 <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-8 flex items-center gap-2 border-b border-blue-100 pb-2">
                   <Activity className="w-4 h-4" /> Historial de Atenciones Médicas
                 </h3>

                 {attentions.length === 0 ? (
                   <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                      <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-medium italic">No hay registros de atención para este paciente.</p>
                   </div>
                 ) : (
                   <div className="space-y-6">
                      {attentions.map((att) => (
                         <div key={att.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow print:shadow-none print:border-slate-300">
                            
                            {/* Cabecera Tarjeta */}
                            <div 
                               onClick={() => toggleExpand(att.id)}
                               className={`cursor-pointer border-l-8 p-5 flex justify-between items-start transition-colors print:bg-white print:border-slate-900 ${getResultColor(att.evaluationResult)}`}
                            >
                               <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-1">
                                     <span className="text-[10px] font-black uppercase tracking-widest bg-white/50 px-2 py-0.5 rounded border border-current">{att.attentionType}</span>
                                     <span className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {formatDate(att.attentionDate)}
                                     </span>
                                  </div>
                                  <h4 className="font-bold text-base text-slate-800 mb-2">Evaluación: {att.evaluationResult}</h4>
                                  <div className="flex items-center gap-4 text-xs font-medium opacity-70">
                                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> Dr(a). {att.doctorName || 'N/A'}</span>
                                      {att.restDays > 0 && <span className="flex items-center gap-1 text-orange-700 font-bold"><Clock className="w-3 h-3" /> {att.restDays} días reposo</span>}
                                  </div>
                               </div>
                               <div className="text-slate-300 print:hidden mt-2">
                                  {expandedId === att.id ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                               </div>
                            </div>

                            {/* Detalles */}
                            <div className={`${expandedId === att.id ? 'block' : 'hidden'} print:block p-6 border-t border-slate-100 bg-white space-y-4 animate-in slide-in-from-top-2`}>
                               
                               <div>
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Diagnóstico Principal (CIE-10)</label>
                                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-slate-700 whitespace-pre-line font-bold text-xs leading-relaxed italic">
                                      {att.diagnosis || "Sin diagnóstico registrado."}
                                    </p>
                                 </div>
                               </div>

                               {att.restDays > 0 && (
                                 <div className="flex gap-4">
                                    <div className="flex-1 bg-orange-50 p-3 rounded-xl border border-orange-100">
                                       <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest block mb-1">Periodo de Reposo</label>
                                       <p className="text-xs font-bold text-orange-900">
                                          Desde: {att.restStartDate} <span className="mx-2">|</span> Hasta: {att.restEndDate}
                                       </p>
                                    </div>
                                 </div>
                               )}

                               {att.observations && (
                                 <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Observaciones / Recomendaciones</label>
                                    <p className="text-[11px] text-slate-600 leading-snug">{att.observations}</p>
                                    {att.recommendations && <p className="text-[11px] text-blue-700 font-medium mt-2">Plan: {att.recommendations}</p>}
                                 </div>
                               )}
                            </div>
                         </div>
                      ))}
                   </div>
                 )}
              </section>
            </div>

            {/* Footer de Página */}
            <div className="bg-slate-50 p-10 border-t border-slate-200 text-center print:bg-white print:border-t-2 print:border-black print:p-8 mt-auto">
               <div className="grid grid-cols-2 gap-10 mb-8 print:mb-12">
                  <div className="text-center">
                    <div className="h-16 border-b border-slate-300 mb-2"></div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Firma del Trabajador</p>
                  </div>
                  <div className="text-center">
                    <div className="h-16 border-b border-slate-300 mb-2"></div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sello / Firma Médica</p>
                  </div>
               </div>
               <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-light">Documento Electrónico Generado por Alex Consulting v2.4</p>
               <p className="text-[8px] text-slate-300 mt-2 font-mono">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      ) : (
        /* Estado inicial vacío */
        <div className="flex flex-col items-center justify-center py-20 text-slate-300 animate-in fade-in">
           <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-6">
              <Search className="w-12 h-12" />
           </div>
           <p className="text-lg font-medium text-slate-400">Ingrese el número de cédula para cargar la historia clínica.</p>
        </div>
      )}
    </div>
  );
};

export default ClinicalHistory;