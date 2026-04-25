
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getAllMedicalAttentions, getAllPatients, getCompanies, getDoctors, getRestValidations } from '../utils/storage';
import { MedicalAttention, Patient, Company, Doctor, RestValidation } from '../types';
import { Printer, ShieldCheck, Building2, Table as TableIcon, FileDown, Users, Stethoscope, PieChart as PieChartIcon, ClipboardList } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, PieChart, Pie } from 'recharts';

type Quarter = 'I' | 'II' | 'III' | 'IV';

const COLORS_SERIES = ['#1e4ed8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const SVEReport: React.FC = () => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [reportType, setReportType] = useState<'monthly' | 'quarterly' | 'annual'>('quarterly');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>('I');
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [allAttentions, setAllAttentions] = useState<MedicalAttention[]>([]);
  const [allRestValidations, setAllRestValidations] = useState<RestValidation[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pats, atts, comps, docs, rests] = await Promise.all([
            getAllPatients(), 
            getAllMedicalAttentions(),
            getCompanies(),
            getDoctors(),
            getRestValidations()
        ]);
        setAllPatients(pats);
        setAllAttentions(atts);
        setCompanies(comps);
        setDoctors(docs);
        setAllRestValidations(rests);
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
  const allCompanyPatients = useMemo(() => {
      if (!selectedCompanyName) return [];
      return allPatients.filter(p => p.company === selectedCompanyName);
  }, [allPatients, selectedCompanyName]);

  const activePatients = useMemo(() => {
    return allCompanyPatients.filter(p => !p.status || p.status === 'Activo');
  }, [allCompanyPatients]);

  const attentionsInScope = useMemo(() => {
    const patientCedulas = new Set(allCompanyPatients.map(p => p.cedula));
    return allAttentions.filter(a => patientCedulas.has(a.patientCedula));
  }, [allAttentions, allCompanyPatients]);

  const restValidationsInScope = useMemo(() => {
    const patientCedulas = new Set(allCompanyPatients.map(p => p.cedula));
    return allRestValidations.filter(r => patientCedulas.has(r.patientCedula));
  }, [allRestValidations, allCompanyPatients]);

  const getRangeText = () => {
    if (reportType === 'quarterly') {
      return getQuarterRangeText(selectedQuarter, selectedYear);
    } else if (reportType === 'monthly') {
      const monthName = getMonthName(selectedMonth);
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      return `Del 01 de ${monthName} al ${lastDay} de ${monthName} de ${selectedYear}`;
    } else {
      return `Del 01 de enero al 31 de diciembre de ${selectedYear}`;
    }
  };

  const getPatientsActiveInMonth = (monthIdx: number, year: number) => {
    const monthlyAttentions = attentionsInScope.filter(att => {
      const attDate = new Date(att.attentionDate + 'T00:00:00');
      return attDate.getFullYear() === year && attDate.getMonth() === monthIdx;
    });
    const treatedCedulas = new Set(monthlyAttentions.map(a => a.patientCedula));
    return allCompanyPatients.filter(p => treatedCedulas.has(p.cedula));
  };

  const getAgeGroupStatsForList = (list: Patient[]) => {
    const groups: Record<string, number> = { '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '55+': 0 };
    list.forEach(p => {
        const group = getAgeGroup(calculateAge(p.birthDate));
        if (groups[group] !== undefined) groups[group]++;
        else groups['55+']++;
    });
    return groups;
  };

  const jobDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    activePatients.forEach(p => {
      const job = p.jobTitle || 'SIN CARGO ASIGNADO';
      distribution[job] = (distribution[job] || 0) + 1;
    });
    return Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  }, [activePatients]);

  const departmentDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    activePatients.forEach(p => {
      const dept = p.department || 'SIN DEPARTAMENTO ASIGNADO';
      distribution[dept] = (distribution[dept] || 0) + 1;
    });
    return Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  }, [activePatients]);

  const genderDistribution = useMemo(() => {
    const male = activePatients.filter(p => p.gender === 'Masculino').length;
    const female = activePatients.filter(p => p.gender === 'Femenino').length;
    return [
      { name: 'Masculino', value: male, fill: '#1d4ed8' },
      { name: 'Femenino', value: female, fill: '#db2777' }
    ];
  }, [activePatients]);

  const ageGroupDistribution = useMemo(() => {
    const groups: Record<string, number> = {
      'Menor 18': 0,
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '55+': 0
    };
    activePatients.forEach(p => {
      const age = calculateAge(p.birthDate);
      const group = getAgeGroup(age);
      groups[group] = (groups[group] || 0) + 1;
    });
    return Object.entries(groups).map(([name, value], index) => ({
      name,
      value,
      fill: COLORS_SERIES[index % COLORS_SERIES.length]
    }));
  }, [activePatients]);

  const currentCompany = useMemo(() => {
      return companies.find(c => c.name === selectedCompanyName);
  }, [companies, selectedCompanyName]);

  const currentDoctor = useMemo(() => {
      return doctors.find(d => d.id === selectedDoctorId);
  }, [doctors, selectedDoctorId]);

  const quarterAttentions = useMemo(() => {
    if (reportType === 'quarterly') {
      const months = getQuarterMonths(selectedQuarter);
      return attentionsInScope.filter(att => {
        const d = new Date(att.attentionDate + 'T00:00:00');
        return d.getFullYear() === selectedYear && months.includes(d.getMonth());
      });
    } else if (reportType === 'monthly') {
      return attentionsInScope.filter(att => {
        const d = new Date(att.attentionDate + 'T00:00:00');
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      });
    } else {
      return attentionsInScope.filter(att => {
        const d = new Date(att.attentionDate + 'T00:00:00');
        return d.getFullYear() === selectedYear;
      });
    }
  }, [attentionsInScope, selectedYear, selectedQuarter, reportType, selectedMonth]);

  const quarterRestValidations = useMemo(() => {
    if (reportType === 'quarterly') {
      const months = getQuarterMonths(selectedQuarter);
      return restValidationsInScope.filter(r => {
        const d = new Date(r.date + 'T00:00:00');
        return d.getFullYear() === selectedYear && months.includes(d.getMonth());
      });
    } else if (reportType === 'monthly') {
      return restValidationsInScope.filter(r => {
        const d = new Date(r.date + 'T00:00:00');
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      });
    } else {
      return restValidationsInScope.filter(r => {
        const d = new Date(r.date + 'T00:00:00');
        return d.getFullYear() === selectedYear;
      });
    }
  }, [restValidationsInScope, selectedYear, selectedQuarter, reportType, selectedMonth]);

  const annualOccurrenceSummary = useMemo(() => {
    const summary: Record<number, { ac: number, at: number, ec: number, eo: number }> = {};
    for (let i = 0; i < 12; i++) {
        summary[i] = { ac: 0, at: 0, ec: 0, eo: 0 };
    }

    attentionsInScope.forEach(att => {
        const d = new Date(att.attentionDate + 'T00:00:00');
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
    externalRests: quarterRestValidations
  }), [quarterAttentions, quarterRestValidations]);

  // --- Chart Data Calculators ---

  const examPieData = useMemo(() => {
    return Object.entries(examResults)
      // Fix: Cast stats to any to access total property and avoid TypeScript inference issues with Object.entries
      .map(([name, stats]) => ({ name, value: (stats as any).total }))
      .filter(item => item.value > 0);
  }, [examResults]);

  const restsPieData = useMemo(() => {
    const data = [
        { name: 'Accidentes Comunes', value: morbidityDetails.accComunes.length },
        { name: 'Accidentes de Trabajo', value: morbidityDetails.accTrabajo.length },
        { name: 'Enfermedades Comunes', value: morbidityDetails.enfComunes.length },
        { name: 'Enfermedades Ocupacionales', value: morbidityDetails.enfOcupacionales.length },
        { name: 'Reposos Externos', value: morbidityDetails.externalRests.length },
    ];
    return data.filter(item => item.value > 0);
  }, [morbidityDetails]);

  const pathologyDistribution = useMemo(() => {
    const internal: Record<string, { count: number, days: number }> = {};
    const external: Record<string, { count: number, days: number }> = {};

    // Internal (from attentions with rest)
    quarterAttentions.forEach(att => {
      if (att.restDays > 0) {
        const diag = att.diagnosis.split('\n')[0] || 'SIN DIAGNÓSTICO';
        if (!internal[diag]) internal[diag] = { count: 0, days: 0 };
        internal[diag].count++;
        internal[diag].days += att.restDays;
      }
    });

    // External (from validations)
    quarterRestValidations.forEach(rest => {
      const diag = rest.pathology.split('\n')[0] || 'SIN DIAGNÓSTICO';
      if (!external[diag]) external[diag] = { count: 0, days: 0 };
      external[diag].count++;
      external[diag].days += rest.restDays;
    });

    return {
      internal: Object.entries(internal).sort((a, b) => b[1].days - a[1].days),
      external: Object.entries(external).sort((a, b) => b[1].days - a[1].days)
    };
  }, [quarterAttentions, quarterRestValidations]);

  const top10Morbidity = useMemo(() => {
    const counts: Record<string, number> = {};
    const morbidityReasons = ['Enfermedad Común', 'Enfermedad Ocupacional', 'Accidente Común', 'Accidente Ocupacional'];

    // Filter by year to show annual top 10
    attentionsInScope.filter(att => {
        const d = new Date(att.attentionDate + 'T00:00:00');
        const isMorbidity = att.reason && morbidityReasons.includes(att.reason);
        const hasDiagnosis = att.diagnosis && att.diagnosis.trim() !== '' && att.diagnosis !== 'SIN DIAGNÓSTICO';
        return d.getFullYear() === selectedYear && isMorbidity && hasDiagnosis;
    }).forEach(att => {
      const diag = att.diagnosis.split('\n')[0] || 'SIN DIAGNÓSTICO';
      counts[diag] = (counts[diag] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [attentionsInScope, selectedYear]);

  const top3QuarterMorbidity = useMemo(() => {
    const counts: Record<string, number> = {};
    const morbidityReasons = ['Enfermedad Común', 'Enfermedad Ocupacional', 'Accidente Común', 'Accidente Ocupacional'];

    quarterAttentions.filter(att => {
        const isMorbidity = att.reason && morbidityReasons.includes(att.reason);
        const hasDiagnosis = att.diagnosis && att.diagnosis.trim() !== '' && att.diagnosis !== 'SIN DIAGNÓSTICO';
        return isMorbidity && hasDiagnosis;
    }).forEach(att => {
      const diag = att.diagnosis.split('\n')[0] || 'SIN DIAGNÓSTICO';
      counts[diag] = (counts[diag] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, value]) => ({ name, value }));
  }, [quarterAttentions]);

  const handleExportWord = async () => {
    if (!reportRef.current) return;
    
    // Clone the report to modify it for export without affecting the UI
    const clone = reportRef.current.cloneNode(true) as HTMLElement;
    
    // Find all SVG elements (charts) and try to replace them with images for Word
    const svgs = reportRef.current.querySelectorAll('svg');
    const svgImages: string[] = [];
    
    for (let i = 0; i < svgs.length; i++) {
        const svg = svgs[i];
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        // Set canvas dimensions to match SVG
        const svgRect = svg.getBoundingClientRect();
        canvas.width = svgRect.width || 500;
        canvas.height = svgRect.height || 300;
        
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        await new Promise((resolve) => {
            img.onload = () => {
                if (ctx) {
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    svgImages.push(canvas.toDataURL('image/png'));
                }
                URL.revokeObjectURL(url);
                resolve(null);
            };
            img.src = url;
        });
    }

    // Replace SVGs in the clone with the generated images
    const cloneSvgs = clone.querySelectorAll('svg');
    cloneSvgs.forEach((svg, index) => {
        if (svgImages[index]) {
            const img = document.createElement('img');
            img.src = svgImages[index];
            img.style.width = '100%';
            img.style.maxWidth = '500px';
            img.style.height = 'auto';
            svg.parentNode?.replaceChild(img, svg);
        }
    });

    const content = clone.innerHTML;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Informe SVE</title><style>body { font-family: 'Arial', sans-serif; font-size: 12pt; text-align: justify; line-height: 1.5; } table { border-collapse: collapse; width: 100%; margin-bottom: 15px; border: 1px solid #000; line-height: 1.5; } th, td { border: 1px solid #000; padding: 8px; text-align: justify; } th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; text-align: center; text-transform: uppercase; } tr:nth-child(even) { background-color: #f3f4f6; } .section-title { font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #000; margin-top: 20px; margin-bottom: 10px; font-size: 14pt; } .chart-container { text-align: center; margin: 25px 0; }</style></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + content + footer;
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filename = reportType === 'quarterly' 
      ? `SVE_${selectedCompanyName || 'Empresa'}_T${selectedQuarter}_${selectedYear}.doc`
      : reportType === 'monthly'
        ? `SVE_${selectedCompanyName || 'Empresa'}_M${selectedMonth + 1}_${selectedYear}.doc`
        : `SVE_${selectedCompanyName || 'Empresa'}_Anual_${selectedYear}.doc`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Print Sections ---
  const HeaderSection = () => (
    <div className="flex flex-col items-center mb-10 w-full">
       <h1 className="text-[22pt] font-black text-slate-800 uppercase tracking-tight text-center mb-1 leading-tight">
          INFORME {reportType === 'quarterly' ? 'TRIMESTRAL' : 'MENSUAL'} DE VIGILANCIA EPIDEMIOLÓGICA
       </h1>
       <p className="text-[14pt] font-semibold text-slate-600 mb-8">
          {getRangeText()}
       </p>
       
       <div className="w-full border border-blue-100 rounded-xl p-8 bg-slate-50/50 shadow-sm">
          <div className="grid grid-cols-[180px_1fr] gap-y-4 text-[12pt]">
             <span className="font-bold text-slate-600">Entidad de Trabajo:</span>
             <span className="text-slate-900 uppercase font-black tracking-wide">{currentCompany?.name || '---'}</span>
             
             <span className="font-bold text-slate-600">RIF:</span>
             <span className="text-slate-900 font-mono">{currentCompany?.rif || '---'}</span>

             {currentCompany?.nil && (
               <>
                 <span className="font-bold text-slate-600">NIL:</span>
                 <span className="text-slate-900 font-mono">{currentCompany.nil}</span>
               </>
             )}
             
             <span className="font-bold text-slate-600">Dirección:</span>
             <span className="text-slate-900 font-medium">{currentCompany?.address || '---'}</span>
             
             <span className="font-bold text-slate-600">Actividad Económica:</span>
             <span className="text-slate-900">Empresa Registrada</span>
          </div>
       </div>
    </div>
  );

  const ExecutiveSummarySection = () => {
    const totalConsultas = quarterAttentions.length;
    const evaluacionesEspecificas = Object.values(examResults).reduce((acc: number, curr: any) => acc + (curr.total || 0), 0);
    const siniestralidad = morbidityDetails.accTrabajo.length + morbidityDetails.enfOcupacionales.length;
    const derivaciones = quarterAttentions.filter(a => a.medicalReferral).length;

    const internalRestsCount = morbidityDetails.accComunes.length + morbidityDetails.accTrabajo.length + morbidityDetails.enfComunes.length + morbidityDetails.enfOcupacionales.length;
    const internalRestsDays = morbidityDetails.accComunes.reduce((acc, curr) => acc + curr.restDays, 0) + 
                             morbidityDetails.accTrabajo.reduce((acc, curr) => acc + curr.restDays, 0) + 
                             morbidityDetails.enfComunes.reduce((acc, curr) => acc + curr.restDays, 0) + 
                             morbidityDetails.enfOcupacionales.reduce((acc, curr) => acc + curr.restDays, 0);
    
    const externalRestsCount = morbidityDetails.externalRests.length;
    const externalRestsDays = morbidityDetails.externalRests.reduce((acc, curr) => acc + curr.restDays, 0);

    return (
      <div className="flex flex-col items-center w-full min-h-[800px] relative">
        {/* Watermark Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
          <ShieldCheck className="w-[500px] h-[500px]" />
        </div>

        <div className="z-10 w-full flex flex-col items-center">
          <h2 className="text-[18px] font-black text-center mb-2 uppercase">
            Resumen Gestión de Medicina Ocupacional ({currentCompany?.name || 'Empresa'})
          </h2>
          <h3 className="text-[16px] font-bold text-center mb-12 underline decoration-2 underline-offset-4">
            {reportType === 'quarterly' ? `Trimestre ${selectedQuarter}` : reportType === 'monthly' ? `Mes de ${getMonthName(selectedMonth)}` : 'Anual'} ({selectedYear})
          </h3>

          <div className="space-y-8 text-[12pt] leading-[1.5] text-justify w-full max-w-3xl">
            <p>
              Se llevaron a cabo actividades de vigilancia de la salud de los trabajadores para garantizar la actualización de los expedientes médicos y el monitoreo de la morbilidad, obteniendo los siguientes resultados:
            </p>

            <p>
              <span className="font-bold">Evaluaciones Clínicas:</span> Se totalizaron {totalConsultas} consultas de Medicina General. {(evaluacionesEspecificas as number) > 0 ? `Se registraron ${evaluacionesEspecificas}` : 'No hubo registro de'} evaluaciones específicas de ingreso, egreso o preventivas programadas.
            </p>
            <div className="pl-4 space-y-1">
              {Object.entries(examResults).map(([key, val]: [string, any]) => (
                <p key={key} className="text-[11pt]">
                  • {key}: {val.total > 0 ? `${val.total} consultas` : 'No hubo atención para este aspecto'}.
                </p>
              ))}
            </div>

            <p>
              <span className="font-bold">Siniestralidad y Morbilidad:</span> Se reporta una tasa de {siniestralidad} accidentes laborales y enfermedades ocupacionales. {derivaciones > 0 ? `Se realizaron ${derivaciones} derivaciones` : 'No fue necesaria la derivación'} de personal a especialistas externos.
            </p>

            <div className="pt-4">
              <p className="font-bold mb-4 uppercase">Indicadores de Ausentismo:</p>
              <table className="w-full border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-300 p-2 text-left">Origen del Reposo</th>
                    <th className="border border-slate-300 p-2 text-center">Cantidad</th>
                    <th className="border border-slate-300 p-2 text-center">Días Totales</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2">Servicio Médico Interno</td>
                    <td className="border border-slate-300 p-2 text-center font-bold">{internalRestsCount}</td>
                    <td className="border border-slate-300 p-2 text-center font-bold">{internalRestsDays}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2">Centros Médicos Externos</td>
                    <td className="border border-slate-300 p-2 text-center font-bold">{externalRestsCount}</td>
                    <td className="border border-slate-300 p-2 text-center font-bold">{externalRestsDays}</td>
                  </tr>
                  <tr className="bg-slate-100 font-black">
                    <td className="border border-slate-300 p-2">Consolidado Final</td>
                    <td className="border border-slate-300 p-2 text-center">{internalRestsCount + externalRestsCount}</td>
                    <td className="border border-slate-300 p-2 text-center">{internalRestsDays + externalRestsDays}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-auto pt-20 text-center">
            <p className="text-[12pt] font-bold uppercase tracking-widest text-slate-400">Medicina Ocupacional.</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando datos epidemiológicos...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Search & Config (Screen Only) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 print:hidden flex flex-col gap-6">
         <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">Generador de Informe SVE</h2>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
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
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
               <select value={reportType} onChange={(e) => setReportType(e.target.value as 'monthly' | 'quarterly' | 'annual')} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white">
                   <option value="quarterly">Trimestral</option>
                   <option value="monthly">Mensual</option>
                   <option value="annual">Anual</option>
               </select>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{reportType === 'quarterly' ? 'Trimestre' : reportType === 'monthly' ? 'Mes' : 'Período'}</label>
               {reportType === 'quarterly' ? (
                 <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value as Quarter)} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white">
                     <option value="I">I (Ene-Mar)</option>
                     <option value="II">II (Abr-Jun)</option>
                     <option value="III">III (Jul-Sep)</option>
                     <option value="IV">IV (Oct-Dic)</option>
                 </select>
               ) : reportType === 'monthly' ? (
                 <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white">
                     {Array.from({ length: 12 }).map((_, i) => (
                       <option key={i} value={i}>{getMonthName(i)}</option>
                     ))}
                 </select>
               ) : (
                 <div className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-500 font-medium">
                   Ene - Dic
                 </div>
               )}
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Año</label>
               <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white">
                   {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
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
              <p>Seleccione una empresa y un médico para visualizar el reporte {reportType === 'quarterly' ? 'trimestral' : reportType === 'monthly' ? 'mensual' : 'anual'}.</p>
          </div>
      ) : (
          <div ref={reportRef} className="print-report bg-white p-8 md:p-12 shadow-2xl rounded-xl border border-slate-200 print:shadow-none print:border-0 print:p-0 font-['Arial'] text-[12pt] leading-[1.5]">
            <style>{`
                @media print {
                    body { background: white; font-family: 'Arial', sans-serif; font-size: 12pt; text-align: justify; line-height: 1.5; }
                    .print-report { width: 100%; max-width: none; font-family: 'Arial', sans-serif; font-size: 12pt; text-align: justify; line-height: 1.5; }
                    .page-break { page-break-after: always; padding-top: 20px; }
                    table { page-break-inside: auto; border: 1px solid #000; line-height: 1.5; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    tr:nth-child(even) { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
                    th { background-color: #1e3a8a !important; color: #ffffff !important; -webkit-print-color-adjust: exact; text-align: center !important; }
                    td { text-align: justify !important; border: 1px solid #000 !important; }
                    .no-print-chart { display: none !important; }
                }
                .print-report { font-family: 'Arial', sans-serif; font-size: 12pt; text-align: justify; line-height: 1.5; }
                .section-title { font-size: 14pt; font-weight: 800; text-transform: uppercase; color: #000; border-bottom: 2px solid #000; padding: 4px 0; margin: 20px 0 10px 0; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12pt; border: 1px solid #000; line-height: 1.5; }
                th, td { border: 1px solid #000; padding: 8px; text-align: justify; }
                th { background: #1e3a8a; color: #ffffff; font-weight: bold; text-transform: uppercase; text-align: center; }
                tr:nth-child(even) { background-color: #f3f4f6; }
                .sub-title { font-weight: bold; background: #f8fafc; text-align: center; }
                .bg-total { background-color: #f1f5f9; font-weight: bold; }
                .text-occurrence { font-size: 14pt; font-weight: 800; text-transform: uppercase; color: #000; border-bottom: 2px solid #000; padding: 4px 0; margin: 25px 0 10px 0; }
                .chart-container { height: 250px; width: 100%; margin: 20px 0; display: flex; flex-direction: column; align-items: center; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background: #fdfdfd; }
            `}</style>

            {/* PAGE 0: EXECUTIVE SUMMARY */}
            <div className="page-break">
                <ExecutiveSummarySection />
            </div>

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
                            <td className="text-center text-lg font-black">{activePatients.length}</td>
                        </tr>
                    </tfoot>
                </table>

                <div className="section-title">Distribución de Trabajadores por Departamento</div>
                <table>
                    <thead>
                        <tr>
                            <th>Departamento</th>
                            <th className="text-center w-40">Cantidad de Trabajadores</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departmentDistribution.map(([dept, count]) => (
                            <tr key={dept}>
                                <td className="uppercase font-medium">{dept}</td>
                                <td className="text-center font-black">{count}</td>
                            </tr>
                        ))}
                        {departmentDistribution.length === 0 && (
                            <tr>
                                <td colSpan={2} className="text-center italic text-slate-400 py-4">No hay datos de departamentos registrados.</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="bg-total border-t-2 border-slate-900">
                            <td className="text-right uppercase font-black">Total General de Trabajadores:</td>
                            <td className="text-center text-lg font-black">{activePatients.length}</td>
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
                                            {activePatients.length > 0 ? ((gender.value / activePatients.length) * 100).toFixed(1) : 0}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-total">
                                    <td className="uppercase">Total Nómina:</td>
                                    <td className="text-center font-black">{activePatients.length}</td>
                                    <td className="text-center">100%</td>
                                </tr>
                                <tr className="bg-total border-t border-slate-300">
                                    <td className="uppercase">Personas con Discapacidad:</td>
                                    <td className="text-center font-black">{activePatients.filter(p => p.hasDisability).length}</td>
                                    <td className="text-center">
                                        {activePatients.length > 0 ? ((activePatients.filter(p => p.hasDisability).length / activePatients.length) * 100).toFixed(1) : 0}%
                                    </td>
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

                <div className="section-title">Distribución General de Trabajadores por Grupo Etario</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-8">
                    <div className="overflow-hidden">
                        <table className="mb-0">
                            <thead>
                                <tr>
                                    <th>Grupo Etario</th>
                                    <th className="text-center">Cantidad</th>
                                    <th className="text-center">Porcentaje (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ageGroupDistribution.map(group => (
                                    <tr key={group.name}>
                                        <td className="font-bold">{group.name}</td>
                                        <td className="text-center font-black">{group.value}</td>
                                        <td className="text-center">
                                            {activePatients.length > 0 ? ((group.value / activePatients.length) * 100).toFixed(1) : 0}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-total">
                                    <td className="uppercase">Total Nómina:</td>
                                    <td className="text-center font-black">{activePatients.length}</td>
                                    <td className="text-center">100%</td>
                                </tr>
                                <tr className="bg-total border-t border-slate-300">
                                    <td className="uppercase">Personas con Discapacidad:</td>
                                    <td className="text-center font-black">{activePatients.filter(p => p.hasDisability).length}</td>
                                    <td className="text-center">
                                        {activePatients.length > 0 ? ((activePatients.filter(p => p.hasDisability).length / activePatients.length) * 100).toFixed(1) : 0}%
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    
                    <div className="h-48 w-full bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase mb-4">Gráfico: Proporción por Grupo Etario</p>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ageGroupDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                                    {ageGroupDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                    <LabelList dataKey="value" position="top" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#334155' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="section-title">Registro mensual de la cantidad de trabajadores discriminados</div>
                
                <p className="text-[10px] font-bold mb-2">A. Discriminación por Sexo y Discapacidad (Vinculados a Evaluación)</p>
                <table>
                    <thead>
                        <tr>
                            <th className="w-40">Período / Mes</th>
                            <th className="text-center">Total Atendidos</th>
                            <th className="text-center">Masculino</th>
                            <th className="text-center">Femenino</th>
                            <th className="text-center">Con Discapacidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(reportType === 'quarterly' ? getQuarterMonths(selectedQuarter) : reportType === 'monthly' ? [selectedMonth] : Array.from({length: 12}, (_, i) => i)).map(m => {
                            const activeInMonth = getPatientsActiveInMonth(m, selectedYear);
                            return (
                                <tr key={m}>
                                    <td className="font-bold">{getMonthName(m).toUpperCase()}</td>
                                    <td className="text-center font-bold">{activeInMonth.length}</td>
                                    <td className="text-center">{activeInMonth.filter(p => p.gender === 'Masculino').length}</td>
                                    <td className="text-center">{activeInMonth.filter(p => p.gender === 'Femenino').length}</td>
                                    <td className="text-center">{activeInMonth.filter(p => p.hasDisability).length}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <p className="text-[10px] font-bold mb-2 mt-4">B. Discriminación por Grupo Etario (Vinculados a Evaluación)</p>
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
                        {(reportType === 'quarterly' ? getQuarterMonths(selectedQuarter) : reportType === 'monthly' ? [selectedMonth] : Array.from({length: 12}, (_, i) => i)).map(m => {
                            const activeInMonth = getPatientsActiveInMonth(m, selectedYear);
                            const monthlyAgeStats = getAgeGroupStatsForList(activeInMonth);
                            return (
                                <tr key={m}>
                                    <td className="font-bold">{getMonthName(m).toUpperCase()}</td>
                                    <td className="text-center font-bold">{monthlyAgeStats['18-25']}</td>
                                    <td className="text-center font-bold">{monthlyAgeStats['26-35']}</td>
                                    <td className="text-center font-bold">{monthlyAgeStats['36-45']}</td>
                                    <td className="text-center font-bold">{monthlyAgeStats['46-55']}</td>
                                    <td className="text-center font-bold">{monthlyAgeStats['55+']}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* PAGE 2: ACCIDENTES, ENFERMEDADES Y OCURRENCIA ANUAL */}
            <div className="page-break">
                <div className="section-title">1.- Registro de los Accidentes Comunes</div>
                <table>
                    <thead>
                        <tr>
                            <th className="w-20">Fecha</th>
                            <th>Cargo / Puesto</th>
                            <th>Departamento</th>
                            <th>Turno</th>
                            <th>Lesión / Sistema Afectado</th>
                            <th className="w-16">Días Rep.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {morbidityDetails.accComunes.length > 0 ? morbidityDetails.accComunes.map(a => (
                            <tr key={a.id}>
                                <td>{a.attentionDate}</td>
                                <td>{allPatients.find(p => p.cedula === a.patientCedula)?.jobTitle || 'N/A'}</td>
                                <td>{allPatients.find(p => p.cedula === a.patientCedula)?.department || 'N/A'}</td>
                                <td>{allPatients.find(p => p.cedula === a.patientCedula)?.workSchedule || 'N/A'}</td>
                                <td>{a.diagnosis}</td>
                                <td className="text-center font-bold">{a.restDays}</td>
                            </tr>
                        )) : <tr><td colSpan={6} className="text-center italic text-slate-400 py-4">No se registraron accidentes comunes en el período.</td></tr>}
                    </tbody>
                </table>

                <div className="section-title">1.- Registro de los Accidentes de Trabajo</div>
                <table>
                    <thead>
                        <tr>
                            <th className="w-20">Fecha</th>
                            <th>Cargo / Puesto</th>
                            <th>Departamento</th>
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
                                <td>{allPatients.find(p => p.cedula === a.patientCedula)?.department || 'N/A'}</td>
                                <td>{allPatients.find(p => p.cedula === a.patientCedula)?.workSchedule || 'N/A'}</td>
                                <td>{a.diagnosis}</td>
                                <td className="text-center font-bold">{a.restDays}</td>
                            </tr>
                        )) : <tr><td colSpan={6} className="text-center italic text-slate-400 py-4">No se registraron accidentes de trabajo en el período.</td></tr>}
                    </tbody>
                </table>

                <div className="section-title">3.- Registro de las Enfermedades comunes</div>
                <table>
                    <thead>
                        <tr>
                            <th className="w-20">Fecha</th>
                            <th>Cargo</th>
                            <th>Departamento</th>
                            <th>Diagnóstico (CIE-10)</th>
                            <th className="w-16 text-center">Días</th>
                        </tr>
                    </thead>
                    <tbody>
                        {morbidityDetails.enfComunes.length > 0 ? morbidityDetails.enfComunes.map(a => (
                            <tr key={a.id}>
                                <td>{a.attentionDate}</td>
                                <td>{allPatients.find(p => p.cedula === a.patientCedula)?.jobTitle || 'N/A'}</td>
                                <td>{allPatients.find(p => p.cedula === a.patientCedula)?.department || 'N/A'}</td>
                                <td>{a.diagnosis}</td>
                                <td className="text-center font-bold">{a.restDays}</td>
                            </tr>
                        )) : <tr><td colSpan={5} className="text-center italic text-slate-400 py-4">Sin datos registrados.</td></tr>}
                    </tbody>
                </table>

                <div className="section-title">4.- Registro de los Enfermedades ocupacionales</div>
                <table>
                    <thead>
                        <tr>
                            <th className="w-20">Fecha</th>
                            <th>Cargo</th>
                            <th>Departamento</th>
                            <th>Diagnóstico / Sistema Afectado</th>
                            <th className="w-16 text-center">Días</th>
                        </tr>
                    </thead>
                    <tbody>
                        {morbidityDetails.enfOcupacionales.length > 0 ? morbidityDetails.enfOcupacionales.map(a => (
                            <tr key={a.id}>
                                <td>{a.attentionDate}</td>
                                <td>{allPatients.find(p => p.cedula === a.patientCedula)?.jobTitle || 'N/A'}</td>
                                <td>{allPatients.find(p => p.cedula === a.patientCedula)?.department || 'N/A'}</td>
                                <td>{a.diagnosis}</td>
                                <td className="text-center font-bold">{a.restDays}</td>
                            </tr>
                        )) : <tr><td colSpan={5} className="text-center italic text-slate-400 py-4">Sin datos registrados.</td></tr>}
                    </tbody>
                </table>

                <div className="section-title">4.1.- Análisis de las 10 Primeras Causas de Morbilidad (Anual {selectedYear})</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <table className="text-[9px]">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="w-8 text-center">N°</th>
                                    <th>Causa de Morbilidad (Diagnóstico)</th>
                                    <th className="w-16 text-center">Casos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {top10Morbidity.length > 0 ? top10Morbidity.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="text-center">{idx + 1}</td>
                                        <td>{item.name}</td>
                                        <td className="text-center font-bold">{item.value}</td>
                                    </tr>
                                )) : <tr><td colSpan={3} className="text-center italic text-slate-400 py-2">Sin datos registrados en el año.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <div className="h-[200px] border border-slate-200 rounded p-2 bg-white">
                        {top10Morbidity.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={top10Morbidity} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 8 }} />
                                    <Tooltip contentStyle={{ fontSize: '10px' }} />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                                        <LabelList dataKey="value" position="right" style={{ fontSize: '8px', fontWeight: 'bold' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="flex items-center justify-center h-full text-[9px] italic text-slate-400">Sin datos para graficar.</div>}
                    </div>
                </div>

                <div className="section-title">4.2.- Análisis de las 3 Primeras Causas de Morbilidad del {reportType === 'quarterly' ? `Trimestre (T${selectedQuarter})` : reportType === 'monthly' ? `Mes (${getMonthName(selectedMonth)})` : 'Año'}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <table className="text-[9px]">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="w-8 text-center">N°</th>
                                    <th>Causa de Morbilidad (Diagnóstico)</th>
                                    <th className="w-16 text-center">Casos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {top3QuarterMorbidity.length > 0 ? top3QuarterMorbidity.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="text-center">{idx + 1}</td>
                                        <td>{item.name}</td>
                                        <td className="text-center font-bold">{item.value}</td>
                                    </tr>
                                )) : <tr><td colSpan={3} className="text-center italic text-slate-400 py-2">Sin datos registrados en el {reportType === 'quarterly' ? 'trimestre' : 'mes'}.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <div className="h-[120px] border border-slate-200 rounded p-2 bg-white">
                        {top3QuarterMorbidity.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={top3QuarterMorbidity} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 8 }} />
                                    <Tooltip contentStyle={{ fontSize: '10px' }} />
                                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]}>
                                        <LabelList dataKey="value" position="right" style={{ fontSize: '8px', fontWeight: 'bold' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="flex items-center justify-center h-full text-[9px] italic text-slate-400">Sin datos para graficar.</div>}
                    </div>
                </div>

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

                {/* GRAFICO SECCION 5 */}
                <div className="chart-container">
                    <div className="flex items-center gap-2 mb-2">
                        <PieChartIcon className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] font-black uppercase text-slate-500">Gráfico: Distribución de Evaluaciones Realizadas</span>
                    </div>
                    {examPieData.length > 0 ? (
                        <div className="flex w-full h-full items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={examPieData}
                                        cx="50%" cy="50%"
                                        innerRadius={30}
                                        outerRadius={70}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        labelLine={true}
                                        isAnimationActive={false}
                                    >
                                        {examPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS_SERIES[index % COLORS_SERIES.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-[9px] text-slate-400 italic">Sin datos registrados para graficar.</div>
                    )}
                </div>

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
                        )) : <tr><td colSpan={3} className="text-center italic text-slate-400 py-2">No se realizaron referencias en el {reportType === 'quarterly' ? 'trimestre' : reportType === 'monthly' ? 'mes' : 'anual'}.</td></tr>}
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
                            <td colSpan={4} className="bg-slate-100 font-bold text-[9px] uppercase">Reposos Internos (Atención Médica)</td>
                        </tr>
                        <tr>
                            <td className="pl-4">Accidentes Comunes</td>
                            <td className="text-center">{morbidityDetails.accComunes.length}</td>
                            <td className="text-center">{morbidityDetails.accComunes.reduce((acc, curr) => acc + curr.restDays, 0)}</td>
                            <td className="text-center">{morbidityDetails.accComunes.length > 0 ? (morbidityDetails.accComunes.reduce((acc, curr) => acc + curr.restDays, 0) / morbidityDetails.accComunes.length).toFixed(1) : 0}</td>
                        </tr>
                        <tr>
                            <td className="pl-4">Accidentes de Trabajo</td>
                            <td className="text-center">{morbidityDetails.accTrabajo.length}</td>
                            <td className="text-center">{morbidityDetails.accTrabajo.reduce((acc, curr) => acc + curr.restDays, 0)}</td>
                            <td className="text-center">{morbidityDetails.accTrabajo.length > 0 ? (morbidityDetails.accTrabajo.reduce((acc, curr) => acc + curr.restDays, 0) / morbidityDetails.accTrabajo.length).toFixed(1) : 0}</td>
                        </tr>
                        <tr>
                            <td className="pl-4">Enfermedades Comunes</td>
                            <td className="text-center">{morbidityDetails.enfComunes.length}</td>
                            <td className="text-center">{morbidityDetails.enfComunes.reduce((acc, curr) => acc + curr.restDays, 0)}</td>
                            <td className="text-center">{morbidityDetails.enfComunes.length > 0 ? (morbidityDetails.enfComunes.reduce((acc, curr) => acc + curr.restDays, 0) / morbidityDetails.enfComunes.length).toFixed(1) : 0}</td>
                        </tr>
                        <tr>
                            <td className="pl-4">Enfermedades Ocupacionales</td>
                            <td className="text-center">{morbidityDetails.enfOcupacionales.length}</td>
                            <td className="text-center">{morbidityDetails.enfOcupacionales.reduce((acc, curr) => acc + curr.restDays, 0)}</td>
                            <td className="text-center">{morbidityDetails.enfOcupacionales.length > 0 ? (morbidityDetails.enfOcupacionales.reduce((acc, curr) => acc + curr.restDays, 0) / morbidityDetails.enfOcupacionales.length).toFixed(1) : 0}</td>
                        </tr>
                        <tr>
                            <td colSpan={4} className="bg-slate-100 font-bold text-[9px] uppercase">Reposos Externos (Validación)</td>
                        </tr>
                        <tr>
                            <td className="pl-4">Reposos Externos Validados</td>
                            <td className="text-center">{morbidityDetails.externalRests.length}</td>
                            <td className="text-center">{morbidityDetails.externalRests.reduce((acc, curr) => acc + curr.restDays, 0)}</td>
                            <td className="text-center">{morbidityDetails.externalRests.length > 0 ? (morbidityDetails.externalRests.reduce((acc, curr) => acc + curr.restDays, 0) / morbidityDetails.externalRests.length).toFixed(1) : 0}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr className="bg-total border-t border-slate-900">
                           <td className="uppercase">Total Consolidado de Reposos:</td>
                           <td className="text-center">{morbidityDetails.accComunes.length + morbidityDetails.accTrabajo.length + morbidityDetails.enfComunes.length + morbidityDetails.enfOcupacionales.length + morbidityDetails.externalRests.length}</td>
                           <td className="text-center font-black">
                              {morbidityDetails.accComunes.reduce((acc, curr) => acc + curr.restDays, 0) + 
                               morbidityDetails.accTrabajo.reduce((acc, curr) => acc + curr.restDays, 0) + 
                               morbidityDetails.enfComunes.reduce((acc, curr) => acc + curr.restDays, 0) + 
                               morbidityDetails.enfOcupacionales.reduce((acc, curr) => acc + curr.restDays, 0) +
                               morbidityDetails.externalRests.reduce((acc, curr) => acc + curr.restDays, 0)}
                           </td>
                           <td></td>
                        </tr>
                    </tfoot>
                </table>

                {/* GRAFICO SECCION 7 */}
                <div className="chart-container">
                    <div className="flex items-center gap-2 mb-2">
                        <PieChartIcon className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] font-black uppercase text-slate-500">Gráfico: Proporción de Casos de Reposo por Categoría</span>
                    </div>
                    {restsPieData.length > 0 ? (
                        <div className="flex w-full h-full items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={restsPieData}
                                        cx="50%" cy="50%"
                                        innerRadius={30}
                                        outerRadius={70}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        labelLine={true}
                                        isAnimationActive={false}
                                    >
                                        {restsPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS_SERIES[(index + 2) % COLORS_SERIES.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-[9px] text-slate-400 italic">No se registraron casos de reposo para este periodo.</div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <ClipboardList className="w-3 h-3 text-slate-500" />
                            <span className="text-[10px] font-black uppercase text-slate-500">Distribución por Patología (Internos)</span>
                        </div>
                        <table className="text-[9px]">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="text-left">Patología</th>
                                    <th className="text-center w-12">Casos</th>
                                    <th className="text-center w-12">Días</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pathologyDistribution.internal.length > 0 ? pathologyDistribution.internal.map(([path, stats], idx) => (
                                    <tr key={idx}>
                                        <td className="font-medium">{path}</td>
                                        <td className="text-center">{stats.count}</td>
                                        <td className="text-center font-bold">{stats.days}</td>
                                    </tr>
                                )) : <tr><td colSpan={3} className="text-center italic text-slate-400 py-2">Sin reposos internos.</td></tr>}
                            </tbody>
                        </table>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <ClipboardList className="w-3 h-3 text-slate-500" />
                            <span className="text-[10px] font-black uppercase text-slate-500">Distribución por Patología (Externos)</span>
                        </div>
                        <table className="text-[9px]">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="text-left">Patología</th>
                                    <th className="text-center w-12">Casos</th>
                                    <th className="text-center w-12">Días</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pathologyDistribution.external.length > 0 ? pathologyDistribution.external.map(([path, stats], idx) => (
                                    <tr key={idx}>
                                        <td className="font-medium">{path}</td>
                                        <td className="text-center">{stats.count}</td>
                                        <td className="text-center font-bold">{stats.days}</td>
                                    </tr>
                                )) : <tr><td colSpan={3} className="text-center italic text-slate-400 py-2">Sin reposos externos.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* PAGE 4: OTROS REGISTROS Y ESTADÍSTICAS */}
            <div className="page-break">
                <div className="section-title">8.- Registro de Personas con discapacidad atendidos</div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded text-[10px]">
                    Total de trabajadores con discapacidad en nómina: <strong>{activePatients.filter(p => p.hasDisability).length}</strong>. <br/>
                    Atenciones realizadas a este grupo en el {reportType === 'quarterly' ? 'trimestre' : reportType === 'monthly' ? 'mes' : 'anual'}: <strong>{quarterAttentions.filter(a => allCompanyPatients.find(p => p.cedula === a.patientCedula)?.hasDisability).length}</strong>.
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
                        <tr><td>Administrativo</td><td>Reubicaciones de puestos de trabajo.</td><td>Ejecutado</td></tr>
                    </tbody>
                </table>

                <div className="section-title">11.- Estadísticas de accidentalidad y morbilidad</div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="p-3 border border-slate-300 rounded text-center">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Índice de Frecuencia (IF)</p>
                        <p className="text-lg font-black">{morbidityDetails.accTrabajo.length > 0 ? ((morbidityDetails.accTrabajo.length * 1000000) / (activePatients.length * 500)).toFixed(2) : '0.00'}</p>
                    </div>
                    <div className="p-3 border border-slate-300 rounded text-center">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Índice de Gravedad (IG)</p>
                        <p className="text-lg font-black">{morbidityDetails.accTrabajo.reduce((acc, curr) => acc + curr.restDays, 0)}</p>
                    </div>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default SVEReport;
