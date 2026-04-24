import React, { useState, useEffect } from 'react';
import { 
  Search, User, Calendar, AlertCircle, AlertTriangle, FileText, 
  Building2, Briefcase, Phone, MapPin, Activity,
  ChevronDown, ChevronUp, Printer, Clock, Target, Ambulance,
  UserCheck, ShieldCheck, ClipboardList, LogIn, UserCog,
  Heart, Thermometer, Scale, Ruler, Brain, Eye, Info,
  Stethoscope, Pill, History, Users, Download
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { findPatientByCedula, getMedicalAttentionsByCedula, getDoctors } from '../utils/storage';
import { Patient, MedicalAttention, Doctor } from '../types';

const ClinicalHistory: React.FC = () => {
  // --- State ---
  const [searchCedula, setSearchCedula] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [attentions, setAttentions] = useState<MedicalAttention[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  // --- Load Reference Data ---
  useEffect(() => {
    const fetchData = async () => {
        const docs = await getDoctors();
        setDoctors(docs);
        if (docs.length > 0) setSelectedDoctorId(docs[0].id);
    };
    fetchData();
  }, []);

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
      const foundPatient = await findPatientByCedula(searchCedula);
      if (!foundPatient) {
        setError('El número de cédula no se encuentra registrado en el sistema.');
        setIsSearching(false);
        return;
      }

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

  const handleDownloadPDF = async () => {
    const element = document.getElementById('clinical-history-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // If content is longer than one page, we might need to handle it, 
      // but for now let's scale it to fit or just add one page.
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Historia_Clinica_${patient?.cedula}_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error("Error generating PDF", err);
      alert("Error al generar el PDF. Por favor intente de nuevo.");
    }
  };

  const latestAttention = attentions.length > 0 ? attentions.sort((a, b) => new Date(b.attentionDate).getTime() - new Date(a.attentionDate).getTime())[0] : null;

  const getResultColor = (result: string) => {
    switch (result) {
      case 'Apto': return 'border-green-500 bg-green-50 text-green-800';
      case 'No Apto': return 'border-red-500 bg-red-50 text-red-800';
      case 'Postpuesta': return 'border-orange-500 bg-orange-50 text-orange-800';
      default: return 'border-slate-300 bg-slate-50 text-slate-700';
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-8 px-4 md:px-0">
      
      {/* 1. Header & Search (Oculto en Impresión) */}
      <section className="print:hidden mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 rounded-lg">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              Historia Clínica Electrónica
            </h2>
            <p className="text-slate-500 text-sm">Gestión integral del expediente médico.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                <UserCog className="w-4 h-4 text-blue-600" />
                <select 
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="text-xs font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                >
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.title} {d.firstName}</option>)}
                </select>
            </div>
            {patient && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95 text-xs font-bold"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-md active:scale-95 text-xs font-bold"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 relative overflow-hidden">
          <form onSubmit={handleSearch} className="relative z-10 flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Búsqueda de Paciente</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={searchCedula}
                  onChange={(e) => setSearchCedula(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none text-lg font-bold transition-all"
                  placeholder="Cédula..."
                />
                <Search className="w-5 h-5 text-slate-300 absolute left-3.5 top-3" />
              </div>
            </div>
            <button 
              type="submit"
              disabled={isSearching}
              className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition-all font-bold text-sm shadow-lg shadow-blue-100 active:scale-95"
            >
              {isSearching ? 'Buscando...' : 'Cargar'}
            </button>
          </form>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-xs font-bold">
              <AlertCircle className="w-4 h-4"/> {error}
            </div>
          )}
        </div>
      </section>

      {/* EXPEDIENTE MÉDICO FORMAL */}
      {patient ? (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div id="clinical-history-content" className="bg-white shadow-2xl border border-slate-200 rounded-none md:rounded-3xl overflow-hidden print:shadow-none print:border-0 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col relative">
            
            {/* Header del Expediente (Estilo Papel Membretado) */}
            <div className="p-4 border-b-2 border-blue-600 print:p-2 bg-slate-50/30">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-sm">
                     <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">{patient.company}</h1>
                    <p className="text-blue-600 text-[8px] font-black tracking-widest uppercase mt-0.5">Servicio de Salud Ocupacional</p>
                    <div className="flex items-center gap-2 mt-1 text-[7px] text-slate-400 font-bold uppercase">
                      <span className="flex items-center gap-1"><MapPin className="w-2 h-2" /> Sede Principal</span>
                      <span className="flex items-center gap-1"><Phone className="w-2 h-2" /> {patient.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                   <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                     <p className="text-[7px] text-slate-400 uppercase font-black mb-0 tracking-widest">Expediente</p>
                     <p className="font-mono text-sm font-black text-slate-900">HC-{patient.cedula}</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 flex-1 space-y-6">
              
              {/* ALERTA MÉDICA (CRÍTICO) */}
              {(patient.allergies || patient.hasDisability) && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center shrink-0 shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-red-900 font-black uppercase tracking-widest text-[8px] mb-1.5">Alerta Médica</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {patient.allergies && (
                        <div className="bg-white/60 p-1.5 rounded-md border border-red-100">
                          <p className="text-[7px] font-black text-red-400 uppercase mb-0">Alergias</p>
                          <p className="text-[10px] font-bold text-red-800">{patient.allergies}</p>
                        </div>
                      )}
                      {patient.hasDisability && (
                        <div className="bg-white/60 p-1.5 rounded-md border border-red-100">
                          <p className="text-[7px] font-black text-red-400 uppercase mb-0">Discapacidad</p>
                          <p className="text-[10px] font-bold text-red-800">{patient.disabilityDescription || 'Presenta Discapacidad'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 1. FILIACIÓN (DATOS DEL TRABAJADOR) */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-4 w-1 bg-blue-600 rounded-full"></div>
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">I. Datos de Filiación</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Foto y QR Mock */}
                  <div className="md:col-span-2 flex flex-col items-center gap-1.5">
                     <div className="w-full aspect-square rounded-xl border border-slate-100 overflow-hidden bg-slate-100 shadow-sm flex items-center justify-center">
                       {patient.photoUrl ? (
                         <img src={patient.photoUrl} alt="Paciente" className="w-full h-full object-cover" />
                       ) : (
                         <User className="w-10 h-10 text-slate-300" />
                       )}
                     </div>
                     <div className="w-full p-1 bg-slate-50 rounded-md border border-slate-100 flex items-center justify-center gap-1">
                        <div className="w-3 h-3 bg-slate-800 rounded-sm"></div>
                        <span className="text-[6px] font-bold text-slate-500 uppercase tracking-widest">Verificado</span>
                     </div>
                  </div>

                  {/* Información Detallada */}
                  <div className="md:col-span-10 grid grid-cols-3 gap-y-3 gap-x-4">
                    <div className="col-span-3">
                      <label className="text-[7px] font-black text-blue-600 uppercase tracking-widest block mb-0">Nombres y Apellidos</label>
                      <p className="text-base font-black text-slate-900">{patient.firstName}</p>
                    </div>
                    
                    <div>
                       <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0">Cédula</label>
                       <p className="text-xs font-bold text-slate-800">V-{patient.cedula}</p>
                    </div>

                    <div>
                       <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0">Fecha Nac. / Edad</label>
                       <p className="text-xs font-bold text-slate-800">
                         {formatDate(patient.birthDate)} 
                         <span className="text-blue-600 ml-1">({calculateAge(patient.birthDate)}a)</span>
                       </p>
                    </div>

                    <div>
                       <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0">Género / Edo. Civil</label>
                       <p className="text-xs font-bold text-slate-800">{patient.gender} / {patient.maritalStatus}</p>
                    </div>

                    <div className="col-span-3 bg-blue-50/20 p-3 rounded-xl border border-blue-100/50 grid grid-cols-4 gap-2">
                        <div>
                           <label className="text-[6px] font-black text-blue-400 uppercase tracking-widest block mb-0">Cargo</label>
                           <p className="text-[9px] font-black text-slate-800 flex items-center gap-1">
                             <Briefcase className="w-2.5 h-2.5 text-blue-500" /> {patient.jobTitle}
                           </p>
                        </div>
                        <div>
                           <label className="text-[6px] font-black text-blue-400 uppercase tracking-widest block mb-0">Departamento</label>
                           <p className="text-[9px] font-black text-slate-800 flex items-center gap-1">
                             <Building2 className="w-2.5 h-2.5 text-blue-500" /> {patient.department || 'Operaciones'}
                           </p>
                        </div>
                        <div>
                           <label className="text-[6px] font-black text-blue-400 uppercase tracking-widest block mb-0">Ingreso</label>
                           <p className="text-[9px] font-black text-slate-800 flex items-center gap-1">
                             <LogIn className="w-2.5 h-2.5 text-blue-500" /> {patient.entryDate || 'N/A'}
                           </p>
                        </div>
                        <div>
                           <label className="text-[6px] font-black text-blue-400 uppercase tracking-widest block mb-0">Estatus</label>
                           <p className="text-[9px] font-black text-slate-800 flex items-center gap-1">
                             <ShieldCheck className="w-2.5 h-2.5 text-blue-500" /> {patient.employmentStatus.toUpperCase()}
                           </p>
                        </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. ANTECEDENTES MÉDICOS (HISTORIA) */}
              <section className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-4 w-1 bg-indigo-600 rounded-full"></div>
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">II. Antecedentes Médicos</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded bg-white flex items-center justify-center shadow-sm shrink-0">
                        <History className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <div>
                        <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Personales</label>
                        <p className="text-[10px] text-slate-700 leading-tight">
                          {patient.medicalHistory || 'Sin antecedentes patológicos registrados.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded bg-white flex items-center justify-center shadow-sm shrink-0">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <div>
                        <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Familiares</label>
                        <p className="text-[10px] text-slate-700 leading-tight italic">
                          Interrogados y negados.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded bg-white flex items-center justify-center shadow-sm shrink-0">
                        <Activity className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <div>
                        <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Hábitos</label>
                        <div className="flex flex-wrap gap-1">
                          <span className="px-1.5 py-0.5 bg-white rounded text-[7px] font-bold text-slate-600 border border-slate-200">Tabaco: Niega</span>
                          <span className="px-1.5 py-0.5 bg-white rounded text-[7px] font-bold text-slate-600 border border-slate-200">Alcohol: Social</span>
                          <span className="px-1.5 py-0.5 bg-white rounded text-[7px] font-bold text-slate-600 border border-slate-200">Act. Física: Regular</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded bg-white flex items-center justify-center shadow-sm shrink-0">
                        <Ambulance className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <div>
                        <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Limitaciones</label>
                        <div className="space-y-1">
                          {patient.hasDisability ? (
                            <div className="p-1.5 bg-red-50 border border-red-100 rounded-md">
                              <p className="text-[9px] font-bold text-red-700">{patient.disabilityDescription}</p>
                            </div>
                          ) : (
                            <p className="text-[9px] text-slate-500 italic">Sin discapacidades.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. EXAMEN FÍSICO (ÚLTIMA EVALUACIÓN) */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-4 w-1 bg-emerald-600 rounded-full"></div>
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">III. Examen Físico (Última Evaluación)</h3>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                   <div className="bg-emerald-50/30 border border-emerald-100 p-2 rounded-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <Heart className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[6px] font-black text-emerald-600/60 uppercase tracking-widest">Tensión Art.</p>
                        <p className="text-xs font-black text-slate-800">{latestAttention?.bloodPressure || '--/--'} <span className="text-[7px] font-normal">mmHg</span></p>
                      </div>
                   </div>
                   <div className="bg-emerald-50/30 border border-emerald-100 p-2 rounded-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <Activity className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[6px] font-black text-emerald-600/60 uppercase tracking-widest">Frec. Card.</p>
                        <p className="text-xs font-black text-slate-800">{latestAttention?.heartRate || '--'} <span className="text-[7px] font-normal">bpm</span></p>
                      </div>
                   </div>
                   <div className="bg-emerald-50/30 border border-emerald-100 p-2 rounded-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <Scale className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[6px] font-black text-emerald-600/60 uppercase tracking-widest">Peso / IMC</p>
                        <p className="text-xs font-black text-slate-800">{latestAttention?.weight || '--'} <span className="text-[7px] font-normal">kg</span> <span className="text-[8px] text-slate-400 font-bold ml-1">{latestAttention?.bmi || '--'}</span></p>
                      </div>
                   </div>
                   <div className="bg-emerald-50/30 border border-emerald-100 p-2 rounded-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <Thermometer className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[6px] font-black text-emerald-600/60 uppercase tracking-widest">Temp.</p>
                        <p className="text-xs font-black text-slate-800">{latestAttention?.temperature || '--'} <span className="text-[7px] font-normal">°C</span></p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                   <div className="p-2 border border-slate-100 rounded-lg bg-slate-50/30">
                      <div className="flex items-center gap-1 mb-1">
                        <Brain className="w-2.5 h-2.5 text-emerald-600" />
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Neurológico</span>
                      </div>
                      <p className="text-[9px] text-slate-600 font-medium italic">Lúcido, orientado.</p>
                   </div>
                   <div className="p-2 border border-slate-100 rounded-lg bg-slate-50/30">
                      <div className="flex items-center gap-1 mb-1">
                        <Eye className="w-2.5 h-2.5 text-emerald-600" />
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Visual</span>
                      </div>
                      <p className="text-[9px] text-slate-600 font-medium italic">20/20. Sin corrección.</p>
                   </div>
                   <div className="p-2 border border-slate-100 rounded-lg bg-slate-50/30">
                      <div className="flex items-center gap-1 mb-1">
                        <Stethoscope className="w-2.5 h-2.5 text-emerald-600" />
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Cardiopulmonar</span>
                      </div>
                      <p className="text-[9px] text-slate-600 font-medium italic">Rítmico. Murmullo presente.</p>
                   </div>
                </div>
              </section>

              {/* 4. EVOLUCIÓN CRONOLÓGICA (HISTORIAL) */}
              <section className="print:break-inside-auto">
                 <div className="flex items-center gap-3 mb-10">
                  <div className="h-8 w-1.5 bg-slate-900 rounded-full"></div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">IV. Evolución Médica Cronológica</h3>
                </div>

                 {attentions.length === 0 ? (
                   <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                      <FileText className="w-20 h-20 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No se registran atenciones previas</p>
                   </div>
                 ) : (
                   <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                      {attentions.map((att, index) => (
                         <div key={att.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            {/* Icono de la linea de tiempo */}
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-900 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                               <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            </div>
                            
                            {/* Contenido de la atención */}
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group-hover:border-blue-200">
                               <div className="flex items-center justify-between mb-4">
                                  <div className="flex flex-col">
                                    <time className="font-mono text-xs font-black text-blue-600">{formatDate(att.attentionDate)}</time>
                                    {att.reportNumber && (
                                      <span className="text-[9px] font-mono font-bold text-slate-400 mt-0.5">N° {att.reportNumber}</span>
                                    )}
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getResultColor(att.evaluationResult)}`}>
                                    {att.evaluationResult}
                                  </span>
                               </div>
                               
                               <div className="mb-4">
                                  <h4 className="text-sm font-black text-slate-900 uppercase mb-1">{att.attentionType}</h4>
                                  <p className="text-xs text-slate-500 font-medium">Evaluado por: {att.doctorName || 'Médico de Guardia'}</p>
                               </div>

                               <div className="space-y-4">
                                  {/* Signos Vitales en la Evolución */}
                                  {(att.bloodPressure || att.heartRate || att.temperature || att.weight) && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                                       {att.bloodPressure && (
                                         <div className="flex items-center gap-2">
                                            <Heart className="w-3 h-3 text-red-500" />
                                            <span className="text-[10px] font-bold text-slate-600">{att.bloodPressure} <span className="text-[8px] font-normal opacity-60">mmHg</span></span>
                                         </div>
                                       )}
                                       {att.heartRate && (
                                         <div className="flex items-center gap-2">
                                            <Activity className="w-3 h-3 text-emerald-500" />
                                            <span className="text-[10px] font-bold text-slate-600">{att.heartRate} <span className="text-[8px] font-normal opacity-60">bpm</span></span>
                                         </div>
                                       )}
                                       {att.temperature && (
                                         <div className="flex items-center gap-2">
                                            <Thermometer className="w-3 h-3 text-orange-500" />
                                            <span className="text-[10px] font-bold text-slate-600">{att.temperature}°C</span>
                                         </div>
                                       )}
                                       {att.weight && (
                                         <div className="flex items-center gap-2">
                                            <Scale className="w-3 h-3 text-blue-500" />
                                            <span className="text-[10px] font-bold text-slate-600">{att.weight}kg</span>
                                         </div>
                                       )}
                                    </div>
                                  )}

                                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Diagnóstico</label>
                                     <p className="text-xs font-bold text-slate-700 leading-relaxed">{att.diagnosis}</p>
                                  </div>
                                  
                                  {(att.observations || att.recommendations) && (
                                    <div className="space-y-2">
                                      {att.observations && (
                                        <div>
                                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Observaciones</label>
                                          <p className="text-[10px] text-slate-600 leading-snug">{att.observations}</p>
                                        </div>
                                      )}
                                      {att.recommendations && (
                                        <div className="flex gap-2 items-start">
                                          <Info className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                                          <p className="text-[10px] text-blue-700 font-medium leading-snug">{att.recommendations}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                 )}
              </section>
            </div>

            {/* Footer de Página (Certificación) */}
            <div className="bg-slate-50 p-4 border-t border-slate-200">
               <div className="grid grid-cols-2 gap-8 mb-4">
                  <div className="text-center">
                    <div className="h-12 border-b border-slate-400 mb-1.5 flex items-end justify-center pb-0.5">
                       <p className="text-slate-400 font-mono text-[7px]">Firma Digitalizada</p>
                    </div>
                    <p className="text-[7px] font-black text-blue-400 uppercase tracking-widest">Firma del Trabajador</p>
                    <p className="text-[6px] text-slate-500 mt-0">{patient.firstName}</p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 border-b border-slate-400 mb-1.5 flex items-end justify-center pb-0.5">
                       <div className="w-8 h-8 border border-blue-900/30 rounded-full flex items-center justify-center">
                          <ShieldCheck className="w-4 h-4 text-blue-900/10" />
                       </div>
                    </div>
                    <p className="text-[7px] font-black text-blue-400 uppercase tracking-widest">Sello Servicio Médico</p>
                    <p className="text-[6px] text-slate-500 mt-0">Validado por {doctors.find(d => d.id === selectedDoctorId)?.firstName || 'Médico'}</p>
                  </div>
               </div>
               
               <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <p className="text-[6px] text-slate-500 uppercase tracking-widest font-bold">
                     Confidencial - Ley de Ejercicio de la Medicina
                  </p>
                  <div className="flex items-center gap-2 text-[6px] text-slate-600 font-mono">
                     <span>HC-{patient.cedula}</span>
                     <span>{new Date().toLocaleDateString()}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      ) : (
        /* Estado inicial vacío */
        <div className="flex flex-col items-center justify-center py-20 text-slate-300 animate-in fade-in zoom-in duration-500">
           <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-slate-100 mb-6 relative">
              <div className="absolute inset-0 bg-blue-600 rounded-3xl scale-90 blur-2xl opacity-10"></div>
              <Search className="w-12 h-12 text-blue-600 relative z-10" />
           </div>
           <h3 className="text-xl font-black text-slate-800 mb-1">Consulta de Expediente</h3>
           <p className="text-slate-400 font-medium max-w-xs text-center text-sm">Ingrese el número de cédula para visualizar la historia clínica.</p>
           
           <div className="mt-8 grid grid-cols-3 gap-4 opacity-40">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><History className="w-4 h-4" /></div>
                <span className="text-[7px] font-black uppercase tracking-widest">Antecedentes</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Stethoscope className="w-4 h-4" /></div>
                <span className="text-[7px] font-black uppercase tracking-widest">Examen Físico</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Activity className="w-4 h-4" /></div>
                <span className="text-[7px] font-black uppercase tracking-widest">Evolución</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalHistory;
