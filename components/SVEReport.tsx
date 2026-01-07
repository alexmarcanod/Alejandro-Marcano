
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getAllMedicalAttentions, getAllPatients, getCompanies, getDoctors } from '../utils/storage';
import { MedicalAttention, Patient, Company, Doctor } from '../types';
import { Printer, ShieldCheck, Building2, Table as TableIcon, FileDown, Users, Stethoscope } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

type Quarter = 'I' | 'II' | 'III' | 'IV';

const SVEReport: React.FC = () => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>('I');
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [allAttentions, setAllAttentions] = useState<MedicalAttention[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pats, atts, comps, docs] = await Promise.all([
            getAllPatients(), 
            getAllMedicalAttentions(),
            getCompanies(),
            getDoctors()
        ]);
        setAllPatients(pats);
        setAllAttentions(atts);
        setCompanies(comps);
        setDoctors(docs);
        if (docs.length > 0) setSelectedDoctorId(docs[0].id);
      } catch (e) {
        console.error("Error fetching data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Helpers ---
  const getQuarterMonths = (q: Quarter) => {
    switch (q) {
      case 'I': return [0, 1, 2];
      case 'II': return [3, 4, 5];
      case 'III': return [6, 7, 8];
      case 'IV': return [9, 10, 11];
    }
  };

  const getQuarterRangeText = (q: Quarter, year: number) => {
    switch (q) {
      case 'I': return `Del 01 de enero al 31 de marzo de ${year}`;
      case 'II': return `Del 01 de abril al 30 de junio de ${year}`;
      case 'III': return `Del 01 de julio al 30 de septiembre de ${year}`;
      case 'IV': return `Del 01 de octubre al 31 de diciembre de ${year}`;
    }
  };

  const getMonthName = (monthIndex: number) => {
    return new Date(2024, monthIndex, 1).toLocaleDateString('es-ES', { month: 'long' });
  };

  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return 0;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const getAgeGroup = (age: number) => {
    if (age < 18) return 'Menor 18';
    if (age <= 25) return '18-25';
    if (age <= 35) return '26-35';
    if (age <= 45) return '36-45';
    if (age <= 55) return '46-55';
    return '55+';
  };

  // --- Data Scoping ---
  const patientsInScope = useMemo(() => {
      if (!selectedCompanyName) return [];
      return allPatients.filter(p => p.company === selectedCompanyName);
  }, [allPatients, selectedCompanyName]);

  const jobDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    patientsInScope.forEach(p => {
      const job = p.jobTitle || 'SIN CARGO ASIGNADO';
      distribution[job] = (distribution[job] || 0) + 1;
    });
    return Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  }, [patientsInScope]);

  const genderDistribution = useMemo(() => {
    const male = patientsInScope.filter(p => p.gender === 'Masculino').length;
    const female = patientsInScope.filter(p => p.gender === 'Femenino').length;
    return [
      { name: 'Masculino', value: male, fill: '#1d4ed8' },
      { name: 'Femenino', value: female, fill: '#db2777' }
    ];
  }, [patientsInScope]);

  const attentionsInScope = useMemo(() => {
      const patientCedulas = new Set(patientsInScope.map(p => p.cedula));
      return allAttentions.filter(a => patientCedulas.has(a.patientCedula));
  }, [allAttentions, patientsInScope]);

  const currentCompany = useMemo(() => {
      return companies.find(c => c.name === selectedCompanyName);
  }, [companies, selectedCompanyName]);

  const currentDoctor = useMemo(() => {
      return doctors.find(d => d.id === selectedDoctorId);
  }, [doctors, selectedDoctorId]);

  const quarterAttentions = useMemo(() => {
    const months = getQuarterMonths(selectedQuarter);
    return attentionsInScope.filter(att => {
      const d = new Date(att.attentionDate);
      return d.getFullYear() === selectedYear && months.includes(d.getMonth());
    });
  }, [attentionsInScope, selectedYear, selectedQuarter]);

  const annualOccurrenceSummary = useMemo(() => {
    const summary: Record<number, { ac: number, at: number, ec: number, eo: number }> = {};
    for (let i = 0; i < 12; i++) {
        summary[i] = { ac: 0, at: 0, ec: 0, eo: 0 };
    }

    attentionsInScope.forEach(att => {
        const d = new Date(att.attentionDate);
        if (d.getFullYear() === selectedYear) {
            const month = d.getMonth();
            if (att.reason === 'Accidente Común') summary[month].ac++;
            else if (att.reason === 'Accidente Ocupacional') summary[month].at++;
            else if (att.reason === 'Enfermedad Común') summary[month].ec++;
            else if (att.reason === 'Enfermedad Ocupacional') summary[month].eo++;
        }
    });

    return summary;
  }, [attentionsInScope, selectedYear]);

  const annualTotals = useMemo(() => {
    interface OccurrenceData { ac: number; at: number; ec: number; eo: number; }
    return Object.values(annualOccurrenceSummary).reduce((acc: OccurrenceData, curr: OccurrenceData) => ({
        ac: acc.ac + curr.ac,
        at: acc.at + curr.at,
        ec: acc.ec + curr.ec,
        eo: acc.eo + curr.eo
    }), { ac: 0, at: 0, ec: 0, eo: 0 });
  }, [annualOccurrenceSummary]);

  const ageGroupStats = useMemo(() => {
    const groups: Record<string, number> = { '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '55+': 0 };
    patientsInScope.forEach(p => {
        const group = getAgeGroup(calculateAge(p.birthDate));
        if (groups[group] !== undefined) groups[group]++;
        else groups['55+']++;
    });
    return groups;
  }, [patientsInScope]);

  const examResults = useMemo(() => {
    const data = {
        'Ingreso': { apto: 0, noApto: 0, post: 0, total: 0 },
        'Prevacacional': { apto: 0, noApto: 0, post: 0, total: 0 },
        'Postvacacional': { apto: 0, noApto: 0, post: 0, total: 0 },
        'Egreso': { apto: 0, noApto: 0, post: 0, total: 0 },
        'Especiales': { apto: 0, noApto: 0, post: 0, total: 0 }
    };

    quarterAttentions.forEach(a => {
        let key: keyof typeof data = 'Especiales';
        if (a.attentionType === 'Pre Empleo') key = 'Ingreso';
        else if (a.attentionType === 'Pre Vacaciones') key = 'Prevacacional';
        else if (a.attentionType === 'Periódica') key = 'Postvacacional';
        else if (a.attentionType === 'Egreso') key = 'Egreso';

        data[key].total++;
        if (a.evaluationResult === 'Apto') data[key].apto++;
        else if (a.evaluationResult === 'No Apto') data[key].noApto++;
        else if (a.evaluationResult === 'Postpuesta') data[key].post++;
    });
    return data;
  }, [quarterAttentions]);

  const morbidityDetails = useMemo(() => ({
    accComunes: quarterAttentions.filter(a => a.reason === 'Accidente Común'),
    accTrabajo: quarterAttentions.filter(a => a.reason === 'Accidente Ocupacional'),
    enfComunes: quarterAttentions.filter(a => a.reason === 'Enfermedad Común'),
    enfOcupacionales: quarterAttentions.filter(a => a.reason === 'Enfermedad Ocupacional'),
  }), [quarterAttentions]);

  const handleExportWord = () => {
    if (!reportRef.current) return;
    const content = reportRef.current.innerHTML;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Informe SVE</title><style>body { font-family: 'Arial', sans-serif; font-size: 9pt; } table { border-collapse: collapse; width: 100%; margin-bottom: 10px; } th, td { border: 1px solid #000; padding: 4px; text-align: left; } th { background-color: #f3f4f6; font-weight: bold; } .section-title { font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #000; margin-top: 15px; margin-bottom: 5px; }</style></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + content + footer;
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SVE_${selectedCompanyName || 'Empresa'}_T${selectedQuarter}_${selectedYear}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Print Sections ---
  const HeaderSection = () => (
    <div className="flex flex-col items-center mb-10 w-full">
       <h1 className="text-[22px] font-black text-slate-800 uppercase tracking-tight text-center mb-1 leading-tight">
          INFORME TRIMESTRAL DE VIGILANCIA EPIDEMIOLÓGICA
       </h1>
       <p className="text-md font-semibold text-slate-600 mb-8">
          {getQuarterRangeText(selectedQuarter, selectedYear)}
       </p>
       
       <div className="w-full border border-blue-100 rounded-xl p-8 bg-slate-50/50 shadow-sm">
          <div className="grid grid-cols-[180px_1fr] gap-y-4 text-sm">
             <span className="font-bold text-slate-600">Entidad de Trabajo:</span>
             <span className="text-slate-900 uppercase font-black tracking-wide">{currentCompany?.name || '---'}</span>
             
             <span className="font-bold text-slate-600">Dirección:</span>
             <span className="text-slate-900 font-medium">{currentCompany?.address || '---'}</span>
             
             <span className="font-bold text-slate-600">Actividad Económica:</span>
             <span className="text-slate-900">Empresa Registrada</span>
          </div>
       </div>
    </div>
  );

  const SubscriptionTable = ({ type }: { type: 'full' | 'doc' }) => (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-200">
        <div className="text-center">
            <div className="h-16 border-b border-slate-300 mb-2 flex items-end justify-center pb-1">
               {/* Optional signature visual space */}
            </div>
            {currentDoctor ? (
              <div className="space-y-0.5">
                <p className="text-[9px] font-black uppercase">{currentDoctor.title} {currentDoctor.firstName}</p>
                <p className="text-[8px] font-bold text-slate-700">M.P.P.S: {currentDoctor.mpps} {currentDoctor.collegeId && `| C.M: ${currentDoctor.collegeId}`}</p>
                {currentDoctor.inpsasel && <p className="text-[8px] font-bold text-slate-700">INPSASEL: {currentDoctor.inpsasel}</p>}
                <p className="text-[8px] text-slate-400 uppercase tracking-widest mt-1">Médico Ocupacional</p>
              </div>
            ) : (
              <>
                <p className="text-[9px] font-black uppercase">Médico Ocupacional</p>
                <p className="text-[8px] text-slate-500">Firma y Sello</p>
              </>
            )}
        </div>
        {type === 'full' && (
            <>
                <div className="text-center">
                    <div className="h-16 border-b border-slate-300 mb-2"></div>
                    <p className="text-[9px] font-black uppercase">Prof. Seguridad e Higiene</p>
                    <p className="text-[8px] text-slate-500">Firma y Sello</p>
                </div>
                <div className="text-center">
                    <div className="h-16 border-b border-slate-300 mb-2"></div>
                    <p className="text-[9px] font-black uppercase">Delegados Prevención / CSSL</p>
                    <p className="text-[8px] text-slate-500">Firma y Sello</p>
                </div>
            </>
        )}
    </div>
  );

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando datos epidemiológicos...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Search & Config (Screen Only) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 print:hidden flex flex-col gap-6">
         <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">Generador de Informe SVE</h2>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-1">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Entidad de Trabajo</label>
               <select 
                 value={selectedCompanyName}
                 onChange={(e) => setSelectedCompanyName(e.target.value)}
                 className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
               >
                   <option value="">-- Seleccionar --</option>
                   {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
               </select>
            </div>
            <div className="md:col-span-1">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Stethoscope className="w-3 h-3 text-blue-500" /> Médico Firmante
               </label>
               <select 
                 value={selectedDoctorId}
                 onChange={(e) => setSelectedDoctorId(e.target.value)}
                 className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
               >
                   <option value="">-- Seleccionar --</option>
                   {doctors.map(d => <option key={d.id} value={d.id}>{d.title} {d.firstName}</option>)}
               </select>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Trimestre</label>
               <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value as Quarter)} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white">
                   <option value="I">I (Ene-Mar)</option>
                   <option value="II">II (Abr-Jun)</option>
                   <option value="III">III (Jul-Sep)</option>
                   <option value="IV">IV (Oct-Dic)</option>
               </select>
            </div>
            <div className="flex gap-2">
                <button onClick={() => window.print()} disabled={!selectedCompanyName || !selectedDoctorId} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:bg-blue-700 disabled:bg-slate-300">
                    <Printer className="w-4 h-4" /> PDF
                </button>
                <button onClick={handleExportWord} disabled={!selectedCompanyName || !selectedDoctorId} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:bg-indigo-700 disabled:bg-slate-300">
                    <FileDown className="w-4 h-4" /> Word
                </button>
            </div>
         </div>
      </div>

      {/* REPORT CONTENT */}
      {!selectedCompanyName ? (
          <div className="text-center py-20 text-slate-400 animate-in fade-in">
              <TableIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Seleccione una empresa y un médico para visualizar el reporte trimestral.</p>
          </div>
      ) : (
          <div ref={reportRef} className="print-report bg-white p-8 md:p-12 shadow-2xl rounded-xl border border-slate-200 print:shadow-none print:border-0 print:p-0">
            <style>{`
                @media print {
                    body { background: white; }
                    .print-report { width: 100%; max-width: none; }
                    .page-break { page-break-after: always; padding-top: 20px; }
                    table { page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                }
                .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #000; border-bottom: 2px solid #000; padding: 4px 0; margin: 15px 0 10px 0; background: #f8fafc; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
                th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
                th { background: #f1f5f9; font-weight: bold; text-transform: uppercase; color: #334155; font-size: 8px; }
                .sub-title { font-weight: bold; background: #f8fafc; text-align: center; }
                .bg-total { background-color: #f1f5f9; font-weight: bold; }
                .text-occurrence { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #000; border-bottom: 2px solid #000; padding: 4px 0; margin: 25px 0 10px 0; }
            `}</style>

            {/* PAGE 1: DATOS, CARGOS Y DISCRIMINACIONES DEMOGRÁFICAS */}
            <div className="page-break">
                <HeaderSection />

                <div className="section-title">Distribución de Trabajadores por Cargos y Puestos de Trabajo</div>
                <table>
                    <thead>
                        <tr>
                            <th>Cargo / Puesto de Trabajo</th>
                            <th className="text-center w-40">Cantidad de Trabajadores</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobDistribution.map(([job, count]) => (
                            <tr key={job}>
                                <td className="uppercase font-medium">{job}</td>
                                <td className="text-center font-black">{count}</td>
                            </tr>
                        ))}
                        {jobDistribution.length === 0 && (
                            <tr>
                                <td colSpan={2} className="text-center italic text-slate-400 py-4">No hay datos de nómina registrados.</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="bg-total border-t-2 border-slate-900">
                            <td className="text-right uppercase font-black">Total General de Trabajadores:</td>
                            <td className="text-center text-lg font-black">{patientsInScope.length}</td>
                        </tr>
                    </tfoot>
                </table>

                <div className="section-title">Distribución General de Trabajadores por Sexo</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-8">
                    <div className="overflow-hidden">
                        <table className="mb-0">
                            <thead>
                                <tr>
                                    <th>Sexo</th>
                                    <th className="text-center">Cantidad</th>
                                    <th className="text-center">Porcentaje (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {genderDistribution.map(gender => (
                                    <tr key={gender.name}>
                                        <td className="font-bold">{gender.name.toUpperCase()}</td>
                                        <td className="text-center font-black">{gender.value}</td>
                                        <td className="text-center">
                                            {patientsInScope.length > 0 ? ((gender.value / patientsInScope.length) * 100).toFixed(1) : 0}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-total">
                                    <td className="uppercase">Total Nómina:</td>
                                    <td className="text-center font-black">{patientsInScope.length}</td>
                                    <td className="text-center">100%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    
                    <div className="h-48 w-full bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase mb-4">Gráfico: Proporción por Género</p>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={genderDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                                    {genderDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                    <LabelList dataKey="value" position="top" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#334155' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="section-title">1.- Registro mensual de la cantidad de trabajadores discriminados</div>
                
                <p className="text-[10px] font-bold mb-2">A. Discriminación por Sexo y Discapacidad</p>
                <table>
                    <thead>
                        <tr>
                            <th className="w-40">Período / Mes</th>
                            <th className="text-center">Total Nómina</th>
                            <th className="text-center">Masculino</th>
                            <th className="text-center">Femenino</th>
                            <th className="text-center">Con Discapacidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getQuarterMonths(selectedQuarter).map(m => (
                            <tr key={m}>
                                <td className="font-bold">{getMonthName(m).toUpperCase()}</td>
                                <td className="text-center font-bold">{patientsInScope.length}</td>
                                <td className="text-center">{patientsInScope.filter(p => p.gender === 'Masculino').length}</td>
                                <td className="text-center">{patientsInScope.filter(p => p.gender === 'Femenino').length}</td>
                                <td className="text-center">{patientsInScope.filter(p => p.hasDisability).length}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <p className="text-[10px] font-bold mb-2 mt-4">B. Discriminación por Grupo Etario</p>
                <table>
                    <thead>
                        <tr>
                            <th>Mes</th>
                            <th className="text-center">18-25 años</th>
                            <th className="text-center">26-35 años</th>
                            <th className="text-center">36-45 años</th>
                            <th className="text-center">46-55 años</th>
                            <th className="text-center">Más de 55</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getQuarterMonths(selectedQuarter).map(m => (
                            <tr key={m}>
                                <td className="font-bold">{getMonthName(m).toUpperCase()}</td>
                                <td className="text-center font-bold">{ageGroupStats['18-25']}</td>
                                <td className="text-center font-bold">{ageGroupStats['26-35']}</td>
                                <td className="text-center font-bold">{ageGroupStats['36-45']}</td>
                                <td className="text-center font-bold">{ageGroupStats['46-55']}</td>
                                <td className="text-center font-bold">{ageGroupStats['55+']}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <SubscriptionTable type="full" />
            </div>

            {/* PAGE 2: ACCIDENTES, ENFERMEDADES Y OCURRENCIA ANUAL */}
            <div className="page-break">
                <div className="section-title">2.- Registro de los Accidentes de Trabajo</div>
                <table>
                    <thead>
                        <tr>
                            <th className="w-20">Fecha</th>
                            <th>Cargo / Puesto</th>
                            <th>Turno</th>
                            <th>Lesión / Sistema Afectado</th>
                            <th className="w-16">Días Rep.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {morbidityDetails.accTrabajo.length > 0 ? morbidityDetails.accTrabajo.map(a => (
                            <tr key={a.id}>
                                <td>{a.attentionDate}</td>
                                <td>{allPatients.find(p => p.cedula === a.patientCedula)?.jobTitle || 'N/A'}</td>
                                <td>{allPatients.find(p => p.cedula === a.patientCedula)?.workSchedule || 'N/A'}</td>
                                <td>{a.diagnosis}</td>
                                <td className="text-center font-bold">{a.restDays}</td>
                            </tr>
                        )) : <tr><td colSpan={5} className="text-center italic text-slate-400 py-4">No se registraron accidentes de trabajo en el período.</td></tr>}
                    </tbody>
                </table>

                <div className="section-title">3.- Registro de las Enfermedades Comunes</div>
                <table>
                    <thead>
                        <tr>
                            <th className="w-20">Fecha</th>
                            <th>Cargo</th>
                            <th>Diagnóstico (CIE-10)</th>
                            <th className="w-16 text-center">Días</th>
                        </tr>
                    </thead>
                    <tbody>
                        {morbidityDetails.enfComunes.length > 0 ? morbidityDetails.enfComunes.map(a => (
                            <tr key={a.id}>
                                <td>{a.attentionDate}</td>
                                <td>{allPatients.find(p => p.cedula === a.patientCedula)?.jobTitle || 'N/A'}</td>
                                <td>{a.diagnosis}</td>
                                <td className="text-center font-bold">{a.restDays}</td>
                            </tr>
                        )) : <tr><td colSpan={4} className="text-center italic text-slate-400 py-4">Sin datos registrados.</td></tr>}
                    </tbody>
                </table>

                <div className="section-title">4.- Registro de las Enfermedades Ocupacionales</div>
                <table>
                    <thead>
                        <tr>
                            <th className="w-20">Fecha</th>
                            <th>Cargo</th>
                            <th>Diagnóstico / Sistema Afectado</th>
                            <th className="w-16 text-center">Días</th>
                        </tr>
                    </thead>
                    <tbody>
                        {morbidityDetails.enfOcupacionales.length > 0 ? morbidityDetails.enfOcupacionales.map(a => (
                            <tr key={a.id}>
                                <td>{a.attentionDate}</td>
                                <td>{allPatients.find(p => p.cedula === a.patientCedula)?.jobTitle || 'N/A'}</td>
                                <td>{a.diagnosis}</td>
                                <td className="text-center font-bold">{a.restDays}</td>
                            </tr>
                        )) : <tr><td colSpan={4} className="text-center italic text-slate-400 py-4">Sin datos registrados.</td></tr>}
                    </tbody>
                </table>

                <div className="text-occurrence">Relación mensual y anual de la ocurrencia</div>
                <table>
                    <thead>
                        <tr>
                            <th>Mes / Período</th>
                            <th className="text-center">Accidentes Comunes (AC)</th>
                            <th className="text-center">Accidentes de Trabajo (AT)</th>
                            <th className="text-center">Enfermedades Comunes (EC)</th>
                            <th className="text-center">Enfermedades Ocupacionales (EO)</th>
                            <th className="text-center bg-slate-100">Total Mes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 12 }, (_, i) => i).map(monthIdx => {
                            const stats = annualOccurrenceSummary[monthIdx];
                            const monthTotal = stats.ac + stats.at + stats.ec + stats.eo;
                            return (
                                <tr key={monthIdx}>
                                    <td className="font-bold uppercase">{getMonthName(monthIdx)}</td>
                                    <td className="text-center">{stats.ac || 0}</td>
                                    <td className="text-center">{stats.at || 0}</td>
                                    <td className="text-center">{stats.ec || 0}</td>
                                    <td className="text-center">{stats.eo || 0}</td>
                                    <td className="text-center font-bold bg-slate-50">{monthTotal}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-total border-t-2 border-slate-900">
                            <td className="font-black uppercase">Totales Anuales ({selectedYear}):</td>
                            <td className="text-center font-black">{annualTotals.ac}</td>
                            <td className="text-center font-black">{annualTotals.at}</td>
                            <td className="text-center font-black">{annualTotals.ec}</td>
                            <td className="text-center font-black">{annualTotals.eo}</td>
                            <td className="text-center font-black text-blue-800 bg-blue-50">
                                {annualTotals.ac + annualTotals.at + annualTotals.ec + annualTotals.eo}
                            </td>
                        </tr>
                    </tfoot>
                </table>
                <SubscriptionTable type="doc" />
            </div>

            {/* PAGE 3: EXÁMENES, REFERENCIAS Y REPOSOS */}
            <div className="page-break">
                <div className="section-title">5.- Resultados de Exámenes de Salud Periódicos y Especiales</div>
                <table>
                    <thead>
                        <tr>
                            <th>Tipo de Examen / Evaluación</th>
                            <th className="text-center">Total</th>
                            <th className="text-center">Aptos</th>
                            <th className="text-center">No Aptos</th>
                            <th className="text-center">Postpuestos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(examResults).map(([key, stats]) => {
                            const s = stats as { total: number; apto: number; noApto: number; post: number };
                            return (
                                <tr key={key}>
                                    <td className="font-bold">{key.toUpperCase()}</td>
                                    <td className="text-center font-bold">{s.total}</td>
                                    <td className="text-center">{s.apto}</td>
                                    <td className="text-center">{s.noApto}</td>
                                    <td className="text-center">{s.post}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="section-title">6.- Referencias a centros especializados</div>
                <table>
                    <thead>
                        <tr>
                            <th className="w-20">Fecha</th>
                            <th>Especialidad / Centro</th>
                            <th>Causa o Motivo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quarterAttentions.filter(a => a.medicalReferral).length > 0 ? quarterAttentions.filter(a => a.medicalReferral).map(a => (
                            <tr key={a.id}>
                                <td>{a.attentionDate}</td>
                                <td className="font-bold">{a.medicalReferral}</td>
                                <td>{a.diagnosis}</td>
                            </tr>
                        )) : <tr><td colSpan={3} className="text-center italic text-slate-400 py-2">No se realizaron referencias en el trimestre.</td></tr>}
                    </tbody>
                </table>

                <div className="section-title">7.- Registro de los Reposos (Discriminado por Cantidad y Tiempo)</div>
                <p className="text-[9px] text-slate-500 italic mb-2">* Incluye reposos de atenciones internas y validación de reposos externos.</p>
                <table>
                    <thead>
                        <tr>
                            <th>Categoría de Reposo</th>
                            <th className="text-center">N° de Casos</th>
                            <th className="text-center">Días Totales</th>
                            <th className="text-center">Promedio (Días)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Accidentes Comunes</td>
                            <td className="text-center">{morbidityDetails.accComunes.length}</td>
                            <td className="text-center">{morbidityDetails.accComunes.reduce((acc, curr) => acc + curr.restDays, 0)}</td>
                            <td className="text-center">{morbidityDetails.accComunes.length > 0 ? (morbidityDetails.accComunes.reduce((acc, curr) => acc + curr.restDays, 0) / morbidityDetails.accComunes.length).toFixed(1) : 0}</td>
                        </tr>
                        <tr>
                            <td>Accidentes de Trabajo</td>
                            <td className="text-center">{morbidityDetails.accTrabajo.length}</td>
                            <td className="text-center">{morbidityDetails.accTrabajo.reduce((acc, curr) => acc + curr.restDays, 0)}</td>
                            <td className="text-center">{morbidityDetails.accTrabajo.length > 0 ? (morbidityDetails.accTrabajo.reduce((acc, curr) => acc + curr.restDays, 0) / morbidityDetails.accTrabajo.length).toFixed(1) : 0}</td>
                        </tr>
                        <tr>
                            <td>Enfermedades Comunes</td>
                            <td className="text-center">{morbidityDetails.enfComunes.length}</td>
                            <td className="text-center">{morbidityDetails.enfComunes.reduce((acc, curr) => acc + curr.restDays, 0)}</td>
                            <td className="text-center">{morbidityDetails.enfComunes.length > 0 ? (morbidityDetails.enfComunes.reduce((acc, curr) => acc + curr.restDays, 0) / morbidityDetails.enfComunes.length).toFixed(1) : 0}</td>
                        </tr>
                        <tr>
                            <td>Enfermedades Ocupacionales</td>
                            <td className="text-center">{morbidityDetails.enfOcupacionales.length}</td>
                            <td className="text-center">{morbidityDetails.enfOcupacionales.reduce((acc, curr) => acc + curr.restDays, 0)}</td>
                            <td className="text-center">{morbidityDetails.enfOcupacionales.length > 0 ? (morbidityDetails.enfOcupacionales.reduce((acc, curr) => acc + curr.restDays, 0) / morbidityDetails.enfOcupacionales.length).toFixed(1) : 0}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr className="bg-total border-t border-slate-900">
                           <td className="uppercase">Total Consolidado de Reposos:</td>
                           <td className="text-center">{morbidityDetails.accComunes.length + morbidityDetails.accTrabajo.length + morbidityDetails.enfComunes.length + morbidityDetails.enfOcupacionales.length}</td>
                           <td className="text-center font-black">
                              {morbidityDetails.accComunes.reduce((acc, curr) => acc + curr.restDays, 0) + 
                               morbidityDetails.accTrabajo.reduce((acc, curr) => acc + curr.restDays, 0) + 
                               morbidityDetails.enfComunes.reduce((acc, curr) => acc + curr.restDays, 0) + 
                               morbidityDetails.enfOcupacionales.reduce((acc, curr) => acc + curr.restDays, 0)}
                           </td>
                           <td></td>
                        </tr>
                    </tfoot>
                </table>
                <SubscriptionTable type="full" />
            </div>

            {/* PAGE 4: OTROS REGISTROS Y ESTADÍSTICAS */}
            <div className="page-break">
                <div className="section-title">8.- Registro de Personas con discapacidad atendidos</div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded text-[10px]">
                    Total de trabajadores con discapacidad en nómina: <strong>{patientsInScope.filter(p => p.hasDisability).length}</strong>. <br/>
                    Atenciones realizadas a este grupo en el trimestre: <strong>{quarterAttentions.filter(a => allPatients.find(p => p.cedula === a.patientCedula)?.hasDisability).length}</strong>.
                </div>

                <div className="section-title">9.- Factores de riesgo y procesos peligrosos</div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded text-[10px] italic">
                    Se mantienen los riesgos identificados en el Programa de Seguridad y Salud en el Trabajo (PSST): Ergonómicos (posturas), Psicosociales (carga laboral) y Físicos (ruido/iluminación según área).
                </div>

                <div className="section-title">10.- Medidas de control propuestas y realizadas</div>
                <table>
                    <thead>
                        <tr>
                            <th>Nivel de Control</th>
                            <th>Acciones Realizadas / Propuestas</th>
                            <th className="w-20">Estatus</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>En la Fuente</td><td>Mantenimiento preventivo de equipos.</td><td>Ejecutado</td></tr>
                        <tr><td>En el Ambiente</td><td>Evaluación de iluminación en puestos administrativos.</td><td>En curso</td></tr>
                        <tr><td>En el Trabajador</td><td>Capacitación en higiene postural y pausas activas.</td><td>Programado</td></tr>
                    </tbody>
                </table>

                <div className="section-title">11.- Estadísticas de accidentalidad y morbilidad</div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="p-3 border border-slate-300 rounded text-center">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Índice de Frecuencia (IF)</p>
                        <p className="text-lg font-black">{morbidityDetails.accTrabajo.length > 0 ? ((morbidityDetails.accTrabajo.length * 1000000) / (patientsInScope.length * 500)).toFixed(2) : '0.00'}</p>
                    </div>
                    <div className="p-3 border border-slate-300 rounded text-center">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Índice de Gravedad (IG)</p>
                        <p className="text-lg font-black">{morbidityDetails.accTrabajo.reduce((acc, curr) => acc + curr.restDays, 0)}</p>
                    </div>
                </div>
                
                <SubscriptionTable type="full" />
            </div>
          </div>
      )}
    </div>
  );
};

export default SVEReport;
