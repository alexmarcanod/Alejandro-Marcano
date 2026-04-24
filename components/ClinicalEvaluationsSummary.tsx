import React from 'react';
import { ClipboardCheck, Activity, UserPlus, UserMinus, CalendarCheck, AlertCircle } from 'lucide-react';

interface EvaluationAspect {
  label: string;
  count: number;
  icon: React.ReactNode;
  description: string;
}

const ClinicalEvaluationsSummary: React.FC = () => {
  const aspects: EvaluationAspect[] = [
    { 
      label: 'Medicina General', 
      count: 6, 
      icon: <Activity className="w-5 h-5 text-blue-600" />,
      description: 'Consultas de atención médica general y seguimiento.'
    },
    { 
      label: 'Evaluación de Ingreso', 
      count: 2, 
      icon: <UserPlus className="w-5 h-5 text-emerald-600" />,
      description: 'Evaluaciones pre-empleo para nuevos ingresos.'
    },
    { 
      label: 'Evaluación de Egreso', 
      count: 2, 
      icon: <UserMinus className="w-5 h-5 text-rose-600" />,
      description: 'Evaluaciones post-empleo al finalizar la relación laboral.'
    },
    { 
      label: 'Preventiva Programada', 
      count: 2, 
      icon: <CalendarCheck className="w-5 h-5 text-amber-600" />,
      description: 'Evaluaciones periódicas de salud ocupacional.'
    },
    { 
      label: 'Post-vacacional', 
      count: 0, 
      icon: <ClipboardCheck className="w-5 h-5 text-slate-400" />,
      description: 'Evaluaciones al retornar de periodos vacacionales.'
    },
    { 
      label: 'Otras Especiales', 
      count: 0, 
      icon: <AlertCircle className="w-5 h-5 text-slate-400" />,
      description: 'Evaluaciones por cambios de puesto o reintegro.'
    }
  ];

  const totalGeneral = aspects.find(a => a.label === 'Medicina General')?.count || 0;
  const totalSpecific = aspects.filter(a => a.label !== 'Medicina General').reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-blue-600" />
          Resumen de Evaluaciones Clínicas
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Resumen consolidado de la actividad clínica y ocupacional.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="text-sm font-medium text-blue-600 mb-1">Total Medicina General</div>
          <div className="text-3xl font-bold text-blue-900">{totalGeneral}</div>
          <div className="text-xs text-blue-500 mt-1">Consultas totalizadas</div>
        </div>
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <div className="text-sm font-medium text-emerald-600 mb-1">Total Específicas</div>
          <div className="text-3xl font-bold text-emerald-900">{totalSpecific}</div>
          <div className="text-xs text-emerald-500 mt-1">Ingreso, Egreso y Preventivas</div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Desglose por Aspecto</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {aspects.map((aspect, index) => (
            <div 
              key={index}
              className={`p-4 rounded-xl border transition-all ${
                aspect.count > 0 
                  ? 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md' 
                  : 'bg-slate-50 border-slate-100 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${aspect.count > 0 ? 'bg-slate-100' : 'bg-slate-200/50'}`}>
                  {aspect.icon}
                </div>
                <div className={`text-2xl font-bold ${aspect.count > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                  {aspect.count}
                </div>
              </div>
              <h4 className={`font-bold text-sm mb-1 ${aspect.count > 0 ? 'text-slate-800' : 'text-slate-500'}`}>
                {aspect.label}
              </h4>
              <p className="text-[11px] text-slate-500 leading-tight">
                {aspect.count > 0 
                  ? aspect.description 
                  : 'No hubo atención para este aspecto en el periodo actual.'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClinicalEvaluationsSummary;
