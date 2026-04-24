
import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Database, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Info, Building2 } from 'lucide-react';
import { batchSavePatients, getCompanies, getJobTitles } from '../utils/storage';
import { Patient, Company, JobTitle } from '../types';

const DataImport: React.FC = () => {
    const [fileData, setFileData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
    const [stats, setStats] = useState<{ created: number, updated: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedTargetCompany, setSelectedTargetCompany] = useState<string>('');

    useEffect(() => {
        const loadRefs = async () => {
            const c = await getCompanies();
            setCompanies(c);
        };
        loadRefs();
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsLoading(true); setStatus(null); setStats(null);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws);
                if (data.length === 0) setStatus({ type: 'error', text: 'El archivo está vacío.' });
                else { setFileData(data); setStatus({ type: 'info', text: `Detectados ${data.length} registros.` }); }
            } catch (err) { setStatus({ type: 'error', text: 'Error al procesar Excel.' }); } finally { setIsLoading(false); }
        };
        reader.readAsBinaryString(file);
    };

    const downloadTemplate = () => {
        const templateData = [{
            "CEDULA": "12345678",
            "NOMBRES_APELLIDOS": "JUAN PEREZ",
            "FECHA_NACIMIENTO": "1990-05-15",
            "LUGAR_NACIMIENTO": "CARACAS",
            "SEXO": "Masculino",
            "ESTADO_CIVIL": "Soltero",
            "GRADO_INSTRUCCION": "Universitario",
            "MANO_DOMINANTE": "Diestro",
            "DIRECCION": "CALLE 1, CASA 2",
            "ESTADO_UBICACION": "LARA",
            "PAIS": "VENEZUELA",
            "TELEFONO": "0414-1234567",
            "ANTECEDENTES_MEDICOS": "NINGUNO",
            "DISCAPACIDAD": "NO",
            "DESC_DISCAPACIDAD": "",
            "DEPARTAMENTO": "ADMINISTRACION",
            "CARGO": "ANALISTA",
            "HORARIO_TRABAJO": "08:00 AM - 05:00 PM",
            "FECHA_INGRESO": "2020-01-01",
            "ESTATUS_LABORAL": "fijo"
        }];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Pacientes");
        XLSX.writeFile(wb, "Plantilla_Carga_Masiva_AlexConsulting.xlsx");
    };

    const processData = async () => {
        if (fileData.length === 0 || !selectedTargetCompany) return;
        setIsProcessing(true);
        try {
            const mappedPatients = fileData.map((row: any) => ({
                firstName: String(row.NOMBRES_APELLIDOS || '').toUpperCase(),
                cedula: String(row.CEDULA || ''),
                birthDate: String(row.FECHA_NACIMIENTO || ''),
                placeOfBirth: String(row.LUGAR_NACIMIENTO || ''),
                gender: (row.SEXO === 'Femenino' ? 'Femenino' : 'Masculino') as any,
                maritalStatus: (row.ESTADO_CIVIL || 'Soltero') as any,
                educationLevel: (row.GRADO_INSTRUCCION || 'Secundaria') as any,
                dominantHand: (row.MANO_DOMINANTE || 'Diestro') as any,
                address: String(row.DIRECCION || ''),
                state: String(row.ESTADO_UBICACION || ''),
                country: String(row.PAIS || 'Venezuela'),
                phone: String(row.TELEFONO || ''),
                medicalHistory: String(row.ANTECEDENTES_MEDICOS || ''),
                hasDisability: String(row.DISCAPACIDAD || '').toUpperCase() === 'SI',
                disabilityDescription: String(row.DESC_DISCAPACIDAD || ''),
                company: selectedTargetCompany,
                department: String(row.DEPARTAMENTO || ''),
                jobTitle: String(row.CARGO || ''),
                workSchedule: String(row.HORARIO_TRABAJO || ''),
                entryDate: String(row.FECHA_INGRESO || ''),
                employmentStatus: (String(row.ESTATUS_LABORAL || '').toLowerCase() === 'contratado' ? 'contratado' : 'fijo') as any,
            }));
            const result = await batchSavePatients(mappedPatients as any);
            setStats(result);
            setStatus({ type: 'success', text: 'Carga masiva finalizada exitosamente en Alex Consulting System.' });
            setFileData([]);
        } catch (err) { setStatus({ type: 'error', text: 'Error al guardar datos.' }); } finally { setIsProcessing(false); }
    };

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg"><Database className="w-6 h-6" /></div>
                <div><h2 className="text-2xl font-bold text-slate-800">Carga Masiva Alex Consulting</h2><p className="text-slate-500 text-sm">Importe su nómina de trabajadores de forma segura.</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">Empresa Destino</h3>
                        <select value={selectedTargetCompany} onChange={(e) => setSelectedTargetCompany(e.target.value)} className="w-full px-3 py-3 border border-slate-300 rounded-xl text-sm bg-slate-50 outline-none">
                            <option value="">-- Seleccionar --</option>
                            {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <button onClick={downloadTemplate} className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 font-bold text-sm hover:bg-slate-100 transition-all">
                            <Download className="w-4 h-4" /> Plantilla Alex Consulting
                        </button>
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <div onClick={() => selectedTargetCompany && fileInputRef.current?.click()} className={`relative border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer ${!selectedTargetCompany ? 'opacity-50' : 'hover:border-indigo-400 bg-white'}`}>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" disabled={!selectedTargetCompany} onChange={handleFileUpload} />
                        <Upload className="w-16 h-16 text-slate-300 mb-4" />
                        <p className="text-lg font-bold text-slate-700 mb-1">Subir archivo Excel</p>
                    </div>
                    {status && <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-sm font-bold">{status.text}</div>}
                    {fileData.length > 0 && !isProcessing && (
                        <button onClick={processData} className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">Confirmar Carga</button>
                    )}
                </div>
            </div>
        </div>
    );
};
export default DataImport;
