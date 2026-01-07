
import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileBarChart, Users, Stethoscope, Download, 
  PieChart as PieChartIcon, Activity, Building2 
} from 'lucide-react';
import { getAllMedicalAttentions, getAllPatients, getCompanies } from '../utils/storage';
import { MedicalAttention, Patient, Company } from '../types';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

type ReportType = 'atenciones' | 'patologias' | 'pacientes';
type FilterType = 'dia' | 'mes' | 'rango';

// Extended type for report to include patient details joined
interface MergedAttention extends MedicalAttention {
  patientAge: number;
  patientCompany: string;
  patientJob: string;
  patientGender: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const Reports: React.FC = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<ReportType>('atenciones');
  const [filterType, setFilterType] = useState<FilterType>('mes');
  
  // Date States
  const [dateStart, setDateStart] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateEnd, setDateEnd] = useState<string>(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Data States
  const [rawAttentions, setRawAttentions] = useState<MedicalAttention[]>([]);
  const [rawPatients, setRawPatients] = useState<Patient[]>([]);
  const [companiesList, setCompaniesList] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [selectedCompany, setSelectedCompany] = useState<string>(''); // Empty = All

  // --- Initial Data Load ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [atts, pats, comps] = await Promise.all([
            getAllMedicalAttentions(), 
            getAllPatients(),
            getCompanies()
        ]);
        setRawAttentions(atts);
        setRawPatients(pats);
        setCompaniesList(comps);
      } catch (e) {
        console.error("Error fetching data for reports", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Helpers ---
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

  // --- Data Processing & Filtering ---

  // 1. Filter Attenciones by Date FIRST
  const dateFilteredAttentions = useMemo(() => {
    return rawAttentions.filter(att => {
      const attDate = att.attentionDate; // YYYY-MM-DD
      
      if (filterType === 'dia') {
        return attDate === dateStart;
      } else if (filterType === 'mes') {
        return attDate.startsWith(month);
      } else if (filterType === 'rango') {
        return attDate >= dateStart && attDate <= dateEnd;
      }
      return true;
    });
  }, [rawAttentions, filterType, dateStart, dateEnd, month]);

  // 2. Merge Patient Data AND Filter by Company (for Attenciones & Patologias tabs)
  const mergedData: MergedAttention[] = useMemo(() => {
    const joined = dateFilteredAttentions.map(att => {
      const patient = rawPatients.find(p => p.cedula === att.patientCedula);
      return {
        ...att,
        patientAge: patient ? calculateAge(patient.birthDate) : 0,
        patientCompany: patient ? patient.company : 'N/A',
        patientJob: patient ? patient.jobTitle : 'N/A',
        patientGender: patient ? patient.gender : 'N/A'
      };
    });

    // Apply Company Filter
    if (selectedCompany) {
        return joined.filter(item => item.patientCompany === selectedCompany);
    }
    
    return joined.sort((a, b) => new Date(a.attentionDate).getTime() - new Date(b.attentionDate).getTime());
  }, [dateFilteredAttentions, rawPatients, selectedCompany]);

  // 3. Filter Patients List (for Patients tab)
  const filteredPatients = useMemo(() => {
      if (selectedCompany) {
          return rawPatients.filter(p => p.company === selectedCompany);
      }
      return rawPatients;
  }, [rawPatients, selectedCompany]);

  // 4. Calculate Pathology Stats including ALL lines in diagnosis
  const { pathologyStats, totalPathologiesCount } = useMemo(() => {
    const stats: Record<string, number> = {};
    let totalCount = 0;

    mergedData.forEach(item => {
      if (!item.diagnosis) return;
      
      // Split by newlines to get individual pathologies (Principal and Secondary)
      const lines = item.diagnosis.split('\n');
      
      lines.forEach(line => {
        const cleanedLine = line.trim();
        if (cleanedLine) {
          // Normalize for stats: we keep the full line as it usually contains [CODE] NAME
          stats[cleanedLine] = (stats[cleanedLine] || 0) + 1;
          totalCount++;
        }
      });
    });

    const sortedStats = Object.entries(stats)
      .map(([name, count]) => ({ 
        name, 
        count, 
        percentage: totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : "0.0" 
      }))
      .sort((a, b) => b.count - a.count);

    return { pathologyStats: sortedStats, totalPathologiesCount: totalCount };
  }, [mergedData]);

  // --- Export Functions ---

  const exportToExcel = (fileName: string, sheetName: string, data: any[]) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportAttentions = () => {
    const exportData = mergedData.map(item => ({
      "Fecha": item.attentionDate,
      "Cédula": item.patientCedula,
      "Paciente": item.patientName,
      "Sexo": item.patientGender,
      "Edad": item.patientAge,
      "Empresa": item.patientCompany,
      "Cargo": item.patientJob,
      "Tipo Atención": item.attentionType,
      "Días Reposo": item.restDays,
      "Diagnóstico Completo": item.diagnosis, // Full diagnosis
      "Resultado": item.evaluationResult
    }));
    exportToExcel("Reporte_Atenciones", "Atenciones", exportData);
  };

  const handleExportPatients = () => {
    const exportData = filteredPatients.map(p => ({
      "Cédula": p.cedula,
      "Nombres y Apellidos": p.firstName,
      "Sexo": p.gender,
      "Fecha Nacimiento": p.birthDate,
      "Edad": calculateAge(p.birthDate),
      "Empresa": p.company,
      "Cargo": p.jobTitle,
      "Fecha Ingreso": p.entryDate,
      "Estatus": p.employmentStatus,
      "Teléfono": p.phone
    }));
    exportToExcel("Maestro_Pacientes", "Pacientes", exportData);
  };

  // --- Renders ---

  const renderFilters = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
      
      {/* Top Row: Company Selection */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <Building2 className="w-5 h-5 text-slate-400" />
          <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Filtrar por Empresa</label>
              <select 
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
              >
                  <option value="">-- Todas las Empresas --</option>
                  {companiesList.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
              </select>
          </div>
      </div>

      {/* Bottom Row: Date Filters */}
      {activeTab !== 'pacientes' && (
        <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:auto">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Rango de Fecha</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setFilterType('dia')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === 'dia' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Día
                </button>
                <button 
                    onClick={() => setFilterType('mes')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === 'mes' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Mes
                </button>
                <button 
                    onClick={() => setFilterType('rango')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === 'rango' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Rango
                </button>
                </div>
            </div>

            {filterType === 'dia' && (
                <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Seleccionar Fecha</label>
                <input 
                    type="date" 
                    value={dateStart} 
                    onChange={(e) => setDateStart(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                </div>
            )}

            {filterType === 'mes' && (
                <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Seleccionar Mes</label>
                <input 
                    type="month" 
                    value={month} 
                    onChange={(e) => setMonth(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                </div>
            )}

            {filterType === 'rango' && (
                <div className="flex gap-2 items-end">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Desde</label>
                    <input 
                    type="date" 
                    value={dateStart} 
                    onChange={(e) => setDateStart(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hasta</label>
                    <input 
                    type="date" 
                    value={dateEnd} 
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                </div>
                </div>
            )}
            
            <div className="ml-auto text-sm text-slate-500 pb-2">
                {mergedData.length} consultas en período
            </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileBarChart className="w-7 h-7 text-blue-600" />
            Centro de Reportes
          </h2>
          <p className="text-slate-500 mt-1">Generación de informes operativos y epidemiológicos.</p>
        </div>
        
        {/* Main Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
           <button 
             onClick={() => setActiveTab('atenciones')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'atenciones' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
           >
             <Stethoscope className="w-4 h-4" /> Atenciones
           </button>
           <button 
             onClick={() => setActiveTab('patologias')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'patologias' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
           >
             <Activity className="w-4 h-4" /> Patologías
           </button>
           <button 
             onClick={() => setActiveTab('pacientes')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'pacientes' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
           >
             <Users className="w-4 h-4" /> Pacientes
           </button>
        </div>
      </div>

      {/* --- REPORTE DE ATENCIONES --- */}
      {activeTab === 'atenciones' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           {renderFilters()}
           
           <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="font-semibold text-slate-800">
                     Detalle Operacional de Consultas 
                     {selectedCompany && <span className="text-blue-600 ml-2">({selectedCompany})</span>}
                 </h3>
                 <button 
                   onClick={handleExportAttentions}
                   disabled={mergedData.length === 0}
                   className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-300 text-sm font-medium transition-colors"
                 >
                   <Download className="w-4 h-4" /> Exportar .xlsx
                 </button>
              </div>
              
              <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                       <tr>
                          <th className="px-4 py-3">Fecha</th>
                          <th className="px-4 py-3">Paciente</th>
                          <th className="px-4 py-3">Cédula</th>
                          <th className="px-4 py-3">Sexo</th>
                          <th className="px-4 py-3">Edad</th>
                          <th className="px-4 py-3">Empresa / Cargo</th>
                          <th className="px-4 py-3">Tipo Atención</th>
                          <th className="px-4 py-3 text-center">Reposo</th>
                          <th className="px-4 py-3">Diagnóstico</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {mergedData.length === 0 ? (
                         <tr>
                            <td colSpan={9} className="px-4 py-8 text-center text-slate-500 italic">No se encontraron registros para el período o empresa seleccionada.</td>
                         </tr>
                       ) : (
                         mergedData.map((row) => (
                           <tr key={row.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{row.attentionDate}</td>
                              <td className="px-4 py-3">{row.patientName}</td>
                              <td className="px-4 py-3 font-mono text-slate-600">{row.patientCedula}</td>
                              <td className="px-4 py-3">{row.patientGender}</td>
                              <td className="px-4 py-3">{row.patientAge}</td>
                              <td className="px-4 py-3">
                                 <div className="font-medium text-slate-800">{row.patientCompany}</div>
                                 <div className="text-xs text-slate-500">{row.patientJob}</div>
                              </td>
                              <td className="px-4 py-3">
                                 <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">{row.attentionType}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                 {row.restDays > 0 ? <span className="font-bold text-orange-600">{row.restDays} días</span> : '-'}
                              </td>
                              <td className="px-4 py-3 text-slate-600 text-xs whitespace-pre-wrap">
                                 {row.diagnosis}
                              </td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* --- REPORTE DE PATOLOGÍAS --- */}
      {activeTab === 'patologias' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
           {renderFilters()}

           {/* Top Stats Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                 <div className="bg-purple-100 p-3 rounded-full mb-3 text-purple-600">
                    <Activity className="w-8 h-8" />
                 </div>
                 <h3 className="text-3xl font-bold text-slate-800">{totalPathologiesCount}</h3>
                 <p className="text-sm text-slate-500 uppercase tracking-wide font-medium">Patologías Identificadas</p>
                 <p className="text-[10px] text-slate-400 mt-1 italic">(Incluye principales y secundarias)</p>
              </div>
              
              <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <PieChartIcon className="w-5 h-5 text-purple-600" />
                   Top 3 Causas de Morbilidad {selectedCompany && `(${selectedCompany})`}
                 </h4>
                 <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="h-48 w-48 relative">
                       {pathologyStats.length > 0 ? (
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pathologyStats.slice(0, 3)}
                                innerRadius={40}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="count"
                              >
                                {pathologyStats.slice(0, 3).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip contentStyle={{ fontSize: '10px' }} />
                            </PieChart>
                         </ResponsiveContainer>
                       ) : <div className="flex items-center justify-center h-full text-slate-300">Sin datos</div>}
                    </div>
                    <div className="flex-1 space-y-3 w-full">
                       {pathologyStats.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                             <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index] }}></div>
                                <span className="font-medium text-slate-700 truncate max-w-[150px] md:max-w-xs text-xs" title={item.name}>{item.name}</span>
                             </div>
                             <div className="text-right shrink-0">
                                <span className="block font-bold text-slate-900 text-xs">{item.count} casos</span>
                                <span className="text-[10px] text-slate-500">{item.percentage}%</span>
                             </div>
                          </div>
                       ))}
                       {pathologyStats.length === 0 && <p className="text-slate-500 italic text-sm">No hay registros para mostrar</p>}
                    </div>
                 </div>
              </div>
           </div>

           {/* Top 10 Chart & Table */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <h4 className="font-bold text-slate-800 mb-6">Top 10 Patologías Frecuentes</h4>
                 <div className="h-[350px] w-full">
                    {pathologyStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={pathologyStats.slice(0, 10)}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                          <XAxis type="number" hide />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            width={120} 
                            tick={{fontSize: 9, fontWeight: 'medium', fill: '#475569'}} 
                            interval={0} 
                          />
                          <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ fontSize: '10px' }} />
                          <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]}>
                            {pathologyStats.slice(0, 10).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">Sin datos para graficar</div>
                    )}
                 </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h4 className="font-bold text-slate-800">Censo Completo de Morbilidad</h4>
                 </div>
                 <div className="overflow-y-auto max-h-[350px]">
                    <table className="w-full text-sm">
                       <thead className="bg-white sticky top-0 z-10 shadow-sm">
                          <tr className="text-xs text-slate-500 uppercase">
                             <th className="px-4 py-3 text-left">Patología / Hallazgo</th>
                             <th className="px-4 py-3 text-right">Frecuencia</th>
                             <th className="px-4 py-3 text-right">%</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {pathologyStats.map((stat, idx) => (
                             <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-4 py-2 font-medium text-slate-700 text-xs">{stat.name}</td>
                                <td className="px-4 py-2 text-right font-bold">{stat.count}</td>
                                <td className="px-4 py-2 text-right text-slate-500 text-[10px]">{stat.percentage}%</td>
                             </tr>
                          ))}
                          {pathologyStats.length === 0 && (
                            <tr><td colSpan={3} className="p-4 text-center text-slate-400">Sin datos registrados en este rango.</td></tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- REPORTE DE PACIENTES --- */}
      {activeTab === 'pacientes' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderFilters()}

           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                 <h3 className="text-lg font-bold text-slate-800">
                     Maestro de Pacientes 
                     {selectedCompany && <span className="text-blue-600 ml-2">({selectedCompany})</span>}
                 </h3>
                 <p className="text-slate-500 text-sm">Listado general de empleados registrados en el sistema.</p>
              </div>
              <button 
                 onClick={handleExportPatients}
                 disabled={filteredPatients.length === 0}
                 className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-md transition-all hover:-translate-y-0.5 disabled:bg-slate-300"
               >
                 <Download className="w-4 h-4" /> Descargar Listado (.xlsx)
               </button>
           </div>

           <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                       <tr>
                          <th className="px-4 py-3">Cédula</th>
                          <th className="px-4 py-3">Nombre Completo</th>
                          <th className="px-4 py-3">Sexo</th>
                          <th className="px-4 py-3">Edad</th>
                          <th className="px-4 py-3">Empresa</th>
                          <th className="px-4 py-3">Cargo</th>
                          <th className="px-4 py-3">Fecha Ingreso</th>
                          <th className="px-4 py-3">Estatus</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {filteredPatients.length === 0 ? (
                         <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No hay pacientes registrados para esta selección.</td></tr>
                       ) : (
                        filteredPatients.sort((a,b) => a.cedula.localeCompare(b.cedula)).map((p) => (
                           <tr key={p.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-mono font-medium text-slate-700">{p.cedula}</td>
                              <td className="px-4 py-3">
                                 <div className="font-semibold text-slate-900">{p.firstName}</div>
                              </td>
                              <td className="px-4 py-3">{p.gender}</td>
                              <td className="px-4 py-3 text-slate-600">{calculateAge(p.birthDate)} años</td>
                              <td className="px-4 py-3">{p.company}</td>
                              <td className="px-4 py-3">{p.jobTitle}</td>
                              <td className="px-4 py-3 text-slate-500">{p.entryDate}</td>
                              <td className="px-4 py-3">
                                 <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${p.employmentStatus === 'fijo' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'}`}>
                                    {p.employmentStatus}
                                 </span>
                              </td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
