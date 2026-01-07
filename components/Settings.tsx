import React, { useRef, useState } from 'react';
import { Settings as SettingsIcon, Download, Upload, Database, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { exportAllData, importAllData } from '../utils/storage';

const Settings: React.FC = () => {
  const [msg, setMsg] = useState<{type: 'success'|'error', text: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const dataStr = exportAllData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `AlexConsulting_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setMsg({ type: 'success', text: 'Respaldo descargado exitosamente.' });
    } catch (e) {
      setMsg({ type: 'error', text: 'Error al generar el respaldo.' });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const success = importAllData(jsonStr);
        if (success) {
          setMsg({ type: 'success', text: 'Base de datos restaurada. La página se recargará en 3 segundos...' });
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          setMsg({ type: 'error', text: 'El archivo no tiene el formato correcto.' });
        }
      } catch (err) {
        setMsg({ type: 'error', text: 'Error al leer el archivo.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-slate-800 rounded-lg text-white">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Configuración del Sistema</h2>
          <p className="text-slate-500 text-sm">Gestión de datos y preferencias.</p>
        </div>
      </div>

      {msg && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <AlertTriangle className="w-5 h-5"/>}
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* EXPORT CARD */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
           <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600">
              <Download className="w-8 h-8" />
           </div>
           <h3 className="text-xl font-bold text-slate-800 mb-2">Respaldo de Datos</h3>
           <p className="text-slate-500 text-sm mb-6">
             Descargue una copia completa de la base de datos local (Pacientes, Historias, Usuarios) en formato JSON. Ideal para mover datos a otro equipo.
           </p>
           <button 
             onClick={handleExport}
             className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-lg transition-all hover:-translate-y-0.5"
           >
             <Database className="w-4 h-4" /> Generar Backup
           </button>
        </div>

        {/* IMPORT CARD */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
           <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-orange-600">
              <Upload className="w-8 h-8" />
           </div>
           <h3 className="text-xl font-bold text-slate-800 mb-2">Restaurar Datos</h3>
           <p className="text-slate-500 text-sm mb-6">
             Importe un archivo de respaldo (.json). <br/>
             <span className="text-red-500 font-bold">¡ADVERTENCIA!</span> Esto sobrescribirá todos los datos actuales.
           </p>
           <input 
             type="file" 
             ref={fileInputRef}
             className="hidden" 
             accept=".json"
             onChange={handleImport}
           />
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-lg hover:border-orange-300 hover:text-orange-700 font-medium flex items-center gap-2 transition-all"
           >
             <Upload className="w-4 h-4" /> Seleccionar Archivo
           </button>
        </div>

      </div>

      <div className="mt-8 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-500">
         <p className="font-bold mb-1">Nota sobre la Versión Web:</p>
         <p>
           Esta aplicación utiliza almacenamiento local del navegador. Si borra la caché o historial de navegación, podría perder los datos. 
           Se recomienda realizar respaldos periódicos utilizando la opción de "Respaldo de Datos".
         </p>
      </div>
    </div>
  );
};

export default Settings;