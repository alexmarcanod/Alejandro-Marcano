
import React, { useState, useEffect } from 'react';
import { 
  Search, Printer, FileText, AlertCircle, ChevronRight, 
  User, Building2, ClipboardList, Briefcase, Activity, 
  Calendar, ShieldCheck, ArrowLeft, Clock
} from 'lucide-react';
import { findPatientByCedula, getMedicalAttentionsByCedula, getDoctors } from '../utils/storage';
import { Patient, MedicalAttention, Doctor } from '../types';

interface MedicalReportGeneratorProps {
  type: 'medical' | 'occupational' | 'sick-leave' | 'external-sick-leave';
}

const MedicalReportGenerator: React.FC<MedicalReportGeneratorProps> = ({ type }) => {
  // --- State ---
  const [searchCedula, setSearchCedula] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [attentions, setAttentions] = useState<MedicalAttention[]>([]);
  const [selectedAttention, setSelectedAttention] = useState<MedicalAttention | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // --- Load Reference Data ---
  useEffect(() => {
    const fetchDoctors = async () => {
        const docs = await getDoctors();
        setDoctors(docs);
    };
    fetchDoctors();
  }, []);

  // --- Logic ---
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
        setError('El trabajador no se encuentra registrado.');
        return;
      }
      const foundAttentions = await getMedicalAttentionsByCedula(searchCedula);
      
      setPatient(foundPatient);
      setAttentions(foundAttentions);
      
      // Para Informe Ocupacional (histórico), no necesitamos seleccionar una atención específica
      // pero igual cargamos la lista para mostrarla en el reporte.
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
      case 'medical': return 'Informe Médico';
      case 'occupational': return 'Informe de Antecedentes Ocupacionales';
      case 'sick-leave': return 'Constancia de Reposo Médico';
      case 'external-sick-leave': return 'Validación de Reposo Externo';
      default: return 'Reporte Médico';
    }
  };

  // --- Sub-Components for Report Layouts ---

  const ReportHeader = () => (
    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 bg-blue-900 rounded-xl flex items-center justify-center text-white print:border print:border-black">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Alex Consulting</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Servicios Médicos Ocupacionales<br/>RIF: J-12345678-9</p>
        </div>
      </div>
      <div className="text-right">
        <h2 className="text-sm font-black uppercase text-slate-800 underline decoration-2 underline-offset-4">{getReportTitle()}</h2>
        <p className="text-[10px] text-slate-500 mt-2 font-mono">FECHA EMISIÓN: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );

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
    const docInfo = getDoctorSignInfo(doctorId);
    return (
      <div className="mt-16 flex justify-center">
        <div className="w-64 text-center">
          <div className="h-16 mb-2 border-b border-slate-900"></div>
          <p className="text-xs font-black uppercase text-slate-900">{docInfo.name}</p>
          <p className="text-[9px] font-bold text-slate-500 uppercase">Médico Ocupacional</p>
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
           <p className="text-slate-500 text-sm">Generación de documentación legal para el trabajador.</p>
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
            {isSearching ? 'Cargando...' : 'Consultar'}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-3 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> {error}</p>}
      </section>

      {/* 2. Selección de Atención (Para Medical y Sick-Leave) */}
      {patient && (type === 'medical' || type === 'sick-leave' || type === 'external-sick-leave') && !selectedAttention && (
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
                                    <p className="text-xs text-slate-500 uppercase font-medium">{att.attentionType} - {att.reason}</p>
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

      {/* 3. REPORT VIEWS */}
      
      {/* 3A. INFORME MÉDICO / REPOSO SELECCIONADO */}
      {selectedAttention && patient && (type === 'medical' || type === 'sick-leave' || type === 'external-sick-leave') && (
        <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-between items-center mb-6 print:hidden">
                <button onClick={() => setSelectedAttention(null)} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium">
                    <ArrowLeft className="w-4 h-4" /> Volver a la lista
                </button>
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
                  <div className="flex-1 flex flex-col justify-center space-y-12 text-center">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black text-slate-900 uppercase">CERTIFICADO DE REPOSO</h2>
                        <div className="w-20 h-1 bg-slate-900 mx-auto"></div>
                    </div>
                    
                    <p className="text-lg text-slate-800 leading-relaxed text-justify px-8">
                        Se hace constar por medio de la presente, que el trabajador <strong>{patient.firstName.toUpperCase()}</strong>, titular de la Cédula de Identidad <strong>V-{patient.cedula}</strong>, quien labora en la empresa <strong>{patient.company}</strong>, ha sido evaluado en este servicio médico. 
                        A consecuencia de los hallazgos clínicos encontrados, se le indica <strong>REPOSO MÉDICO</strong> por un periodo de:
                    </p>

                    <div className="bg-slate-900 text-white p-8 rounded-2xl mx-12 shadow-xl print:bg-white print:text-black print:border-4 print:border-black print:shadow-none">
                        <p className="text-5xl font-black mb-2">{selectedAttention.restDays} DÍAS</p>
                        <p className="text-sm font-bold uppercase tracking-widest opacity-70">Continuos</p>
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

                    <div className="px-8 text-left italic text-slate-500 border-l-4 border-slate-200">
                        <p className="text-sm"><strong>Motivo:</strong> {selectedAttention.reason}</p>
                        <p className="text-sm"><strong>Diagnóstico:</strong> {selectedAttention.diagnosis.split('\n')[0]}</p>
                    </div>
                  </div>
                )}

                <SignSection doctorId={selectedAttention.doctorId} />
                <div className="mt-auto pt-4 border-t border-slate-100 text-[8px] text-slate-400 text-center uppercase tracking-tighter">
                    Documento electrónico generado por Alex Consulting System v2.4 - No requiere sellos húmedos adicionales si porta código de validación.
                </div>
            </div>
        </div>
      )}

      {/* 3B. INFORME OCUPACIONAL (HISTÓRICO) */}
      {patient && type === 'occupational' && (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex justify-end mb-6 print:hidden">
                <button onClick={() => window.print()} className="px-6 py-2 bg-slate-900 text-white rounded-lg flex items-center gap-2 font-bold shadow-lg active:scale-95 transition-all">
                    <Printer className="w-4 h-4" /> Imprimir Antecedentes Ocupacionales
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
                                <th className="p-2 text-[9px] font-black uppercase text-left border border-slate-800">Diagnósticos / Patologías</th>
                                <th className="p-2 text-[9px] font-black uppercase text-left border border-slate-800">Resultado / Tratamiento</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attentions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-400 italic text-sm">No existen registros médicos asociados a este trabajador.</td>
                                </tr>
                            ) : (
                                attentions.map(att => (
                                    <tr key={att.id} className="border-b border-slate-100">
                                        <td className="p-2 text-[10px] font-bold border border-slate-200 align-top">{att.attentionDate}</td>
                                        <td className="p-2 text-[10px] border border-slate-200 align-top">
                                            <span className="font-black text-slate-800 block leading-tight">{att.attentionType}</span>
                                            <span className="text-slate-500 italic text-[9px]">{att.reason}</span>
                                        </td>
                                        <td className="p-2 text-[10px] border border-slate-200 align-top">
                                            <p className="whitespace-pre-wrap leading-tight text-slate-700">{att.diagnosis}</p>
                                        </td>
                                        <td className="p-2 text-[10px] border border-slate-200 align-top">
                                            <p className="font-bold text-blue-800 mb-1">Evaluación: {att.evaluationResult}</p>
                                            <p className="text-[9px] text-slate-500 leading-tight">{att.recommendations || "N/A"}</p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200 print:bg-white">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Resumen de Conclusión</h4>
                    <p className="text-[10px] text-slate-700 leading-relaxed italic">
                        El presente historial médico ocupacional resume las evaluaciones realizadas bajo los estándares de vigilancia epidemiológica institucional. Cada registro ha sido validado por el personal facultativo responsable.
                    </p>
                </div>

                <SignSection />
                <div className="mt-auto pt-4 text-[8px] text-slate-300 text-center font-mono">
                    GENERADO POR ALEX CONSULTING v2.4 | {new Date().toISOString()}
                </div>
            </div>
        </div>
      )}

      {/* 4. Empty State */}
      {!patient && !isSearching && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300 animate-in fade-in">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-6">
                  <ClipboardList className="w-12 h-12" />
              </div>
              <p className="text-lg font-medium text-slate-400 text-center max-w-sm">Ingrese el número de cédula del trabajador para cargar la información y generar el documento.</p>
          </div>
      )}
    </div>
  );
};

export default MedicalReportGenerator;
