
import React, { useState, useEffect } from 'react';
import { Search, Printer, FileBarChart, AlertCircle, ChevronRight, Briefcase, Clock, Stethoscope, ClipboardList, Save, CheckCircle2, Building, User } from 'lucide-react';
import { findPatientByCedula, getMedicalAttentionsByCedula, getDoctors, saveMedicalAttentionToDB } from '../utils/storage';
import { Patient, MedicalAttention, Doctor } from '../types';

interface MedicalReportGeneratorProps {
  type: 'medical' | 'occupational' | 'sick-leave' | 'external-sick-leave';
}

const MedicalReportGenerator: React.FC<MedicalReportGeneratorProps> = ({ type }) => {
  const [searchCedula, setSearchCedula] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [selectedAttention, setSelectedAttention] = useState<MedicalAttention | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

  const [formData, setFormData] = useState({
      diagnosis: '',
      days: 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      reason: 'Enfermedad Común' as MedicalAttention['reason'],
      externalDoctor: '',
      externalInstitution: ''
  });

  useEffect(() => {
    const fetchDoctors = async () => {
        const docs = await getDoctors();
        setDoctors(docs);
        if (docs.length > 0) setSelectedDoctorId(docs[0].id);
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (!formData.startDate || formData.days < 1) return;
    const date = new Date(formData.startDate);
    date.setDate(date.getDate() + (Number(formData.days) - 1));
    setFormData(prev => ({ ...prev, endDate: date.toISOString().split('T')[0] }));
  }, [formData.startDate, formData.days]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCedula.trim()) return;
    setIsSearching(true);
    setError(''); setSuccess(''); setPatient(null); setSelectedAttention(null);
    try {
      const foundPatient = await findPatientByCedula(searchCedula);
      if (!foundPatient) { setError('Trabajador no encontrado.'); setIsSearching(false); return; }
      setPatient(foundPatient);
    } catch (err) { setError('Error al recuperar datos.'); } finally { setIsSearching(false); }
  };

  const handleSaveLeave = async () => {
    if (!patient || !selectedDoctorId || !formData.diagnosis) { setError('Complete el diagnóstico y seleccione el médico.'); return; }
    const doc = doctors.find(d => d.id === selectedDoctorId);
    const newAttention: Omit<MedicalAttention, 'id' | 'createdAt'> = {
        patientId: patient.id,
        patientName: patient.firstName,
        patientCedula: patient.cedula,
        attentionDate: formData.startDate,
        attentionType: 'General',
        reason: formData.reason,
        diagnosis: formData.diagnosis,
        restDays: formData.days,
        restStartDate: formData.startDate,
        restEndDate: formData.endDate,
        evaluationResult: 'No Aplica',
        doctorId: selectedDoctorId,
        doctorName: doc ? `${doc.title} ${doc.firstName}` : '',
        isExternal: type === 'external-sick-leave',
        externalDoctor: type === 'external-sick-leave' ? formData.externalDoctor : undefined,
        externalInstitution: type === 'external-sick-leave' ? formData.externalInstitution : undefined
    };
    try {
        const saved = await saveMedicalAttentionToDB(newAttention);
        setSelectedAttention(saved);
        setSuccess('Registro guardado exitosamente.');
    } catch (err) { setError('Error al guardar el registro.'); }
  };

  const getTitle = () => {
    switch(type) {
        case 'medical': return 'Informe Médico General';
        case 'occupational': return 'Informe Ocupacional';
        case 'sick-leave': return 'Reposo Médico (Interno)';
        case 'external-sick-leave': return 'Validación de Reposo Externo';
        default: return 'Reporte';
    }
  };

  const renderHeader = () => (
    <header className="border-b-2 border-slate-800 pb-4 mb-8 flex justify-between items-start">
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold">AC</div>
            <div>
                <h1 className="text-xl font-bold text-slate-900 uppercase tracking-wider leading-tight">Alex Consulting</h1>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-widest">Servicios Médicos Ocupacionales</p>
                <p className="text-[10px] text-slate-500">RIF: J-12345678-9 | Gestión de Salud</p>
            </div>
        </div>
        <div className="text-right">
            <h2 className="text-lg font-bold text-slate-800 uppercase">{getTitle()}</h2>
            <p className="text-xs text-slate-500 mt-1">Fecha Emisión: {new Date().toLocaleDateString()}</p>
        </div>
    </header>
  );

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">{getTitle()}</h2>
        {success && <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> {success}</div>}
      </div>
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 print:hidden">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-slate-600 mb-1 uppercase tracking-tight">Cédula del Trabajador</label>
            <input type="number" value={searchCedula} onChange={(e) => setSearchCedula(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none text-lg font-mono" placeholder="Ej. 12345678"/>
          </div>
          <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg">Consultar</button>
        </form>
      </section>
      {patient && !selectedAttention && (
        <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 print:hidden">
            <h3 className="font-bold text-slate-800 mb-6 border-b pb-4">Detalles del Reposo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Diagnóstico</label>
                    <textarea value={formData.diagnosis} onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))} rows={3} className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none" placeholder="Escriba el diagnóstico..."/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Días</label>
                    <input type="number" value={formData.days} onChange={(e) => setFormData(prev => ({ ...prev, days: parseInt(e.target.value) || 1 }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none font-bold text-orange-600"/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Inicio</label>
                    <input type="date" value={formData.startDate} onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none"/>
                </div>
            </div>
            <button onClick={handleSaveLeave} className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">Generar y Guardar</button>
        </div>
      )}
      {selectedAttention && patient && (
          <div className="bg-white shadow-2xl border border-slate-200 w-full max-w-[216mm] mx-auto min-h-[279mm] p-[20mm] print:shadow-none print:border-0 print:w-full print:p-0 flex flex-col">
              {renderHeader()}
              <div className="flex-1 space-y-8 text-slate-900 text-sm leading-relaxed">
                <div className="text-center mb-8"><h2 className="text-2xl font-bold uppercase underline">Constancia de Reposo Médico - Alex Consulting</h2></div>
                <p className="text-justify text-base">Hacemos constar que el trabajador <strong>{patient.firstName}</strong> con CI <strong>{patient.cedula}</strong> ha sido evaluado bajo los protocolos de Alex Consulting.</p>
                <div className="bg-slate-50 p-6 border border-slate-200 rounded-xl"><p className="text-lg font-bold italic">"{selectedAttention.diagnosis}"</p></div>
                <p className="text-justify text-base">Reposo médico por <strong>{selectedAttention.restDays}</strong> días continuos desde el {formData.startDate}.</p>
              </div>
              <div className="mt-16 text-center border-t pt-4 text-xs text-slate-400">Generado por Alex Consulting System v2.4</div>
          </div>
      )}
    </div>
  );
};
export default MedicalReportGenerator;
