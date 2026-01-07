import React, { useState } from 'react';
import { 
  Search, User, FileText, Plus, Trash2, Printer, 
  Save, AlertCircle, Pill, ClipboardList, PenTool 
} from 'lucide-react';
import { findPatientByCedula, savePrescriptionToDB } from '../utils/storage';
import { Patient, PrescriptionItem } from '../types';

const ElectronicPrescription: React.FC = () => {
  // --- State ---
  const [searchCedula, setSearchCedula] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [searchError, setSearchError] = useState('');

  // Prescription Data
  const [medicines, setMedicines] = useState<PrescriptionItem[]>([]);
  const [indications, setIndications] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Temporary Inputs for adding a med
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medQty, setMedQty] = useState('');

  // Doctor Info (Mocked for current user context)
  const doctorInfo = {
    name: "Dr. Alex Marcano",
    license: "MPPS: 54.321 | CMA: 12.345",
    phone: "0414-123.45.67",
    specialty: "Medicina Ocupacional"
  };

  // --- Logic ---

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCedula.trim()) return;

    setIsSearching(true);
    setSearchError('');
    setPatient(null);
    setMedicines([]);
    setIndications('');

    try {
      const foundPatient = await findPatientByCedula(searchCedula);
      if (foundPatient) {
        setPatient(foundPatient);
      } else {
        setSearchError('Paciente no encontrado.');
      }
    } catch (err) {
      setSearchError('Error al buscar paciente.');
    } finally {
      setIsSearching(false);
    }
  };

  const addMedicine = () => {
    if (!medName.trim()) return;
    
    const newItem: PrescriptionItem = {
      id: crypto.randomUUID(),
      name: medName,
      dosage: medDose,
      quantity: medQty
    };

    setMedicines([...medicines, newItem]);
    
    // Reset inputs
    setMedName('');
    setMedDose('');
    setMedQty('');
  };

  const removeMedicine = (id: string) => {
    setMedicines(medicines.filter(m => m.id !== id));
  };

  const handleSaveAndPrint = async () => {
    if (!patient) return;
    if (medicines.length === 0 && !indications.trim()) {
        alert("La receta está vacía.");
        return;
    }

    setIsSaving(true);
    try {
        await savePrescriptionToDB({
            patientId: patient.id,
            patientName: patient.firstName,
            patientCedula: patient.cedula,
            date: new Date().toISOString(),
            medicines: medicines,
            indications: indications,
            doctorName: doctorInfo.name,
            doctorLicense: doctorInfo.license
        });

        // Trigger Print after saving
        setTimeout(() => {
            window.print();
        }, 500);

    } catch (error) {
        alert("Error al guardar la receta.");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 print:hidden">
        <FileText className="w-6 h-6 text-blue-600" />
        Recipe Electrónico (Rx)
      </h2>

      {/* SEARCH (Hidden on Print) */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 print:hidden">
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-slate-700 mb-1">Cédula del Paciente</label>
            <div className="relative">
              <input 
                type="number" 
                value={searchCedula}
                onChange={(e) => setSearchCedula(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ingrese Cédula"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>
          <button 
            type="submit"
            disabled={isSearching}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-medium"
          >
            {isSearching ? 'Buscando...' : 'Nueva Receta'}
          </button>
        </form>
        {searchError && <p className="text-red-500 text-sm mt-3 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {searchError}</p>}
      </section>

      {/* PRESCRIPTION PAPER */}
      {patient && (
        <div className="bg-white shadow-xl border border-slate-200 rounded-lg overflow-hidden max-w-[210mm] mx-auto min-h-[200mm] flex flex-col relative print:shadow-none print:border-0 print:w-full">
            
            {/* Header / Branding */}
            <div className="p-8 border-b-2 border-slate-100 flex justify-between items-start">
                <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl print:bg-black">
                        Rx
                     </div>
                     <div>
                        <h1 className="text-xl font-bold text-slate-900 uppercase tracking-wide">Alex Consulting</h1>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">{doctorInfo.specialty}</p>
                     </div>
                </div>
                <div className="text-right">
                    <p className="text-sm text-slate-500 font-medium">Fecha de Emisión</p>
                    <p className="text-lg font-bold text-slate-800">{new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Patient Info Bar */}
            <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 print:bg-transparent print:border-b-2 print:border-slate-200">
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Paciente</label>
                    <p className="font-semibold text-slate-900 truncate">{patient.firstName}</p>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Cédula</label>
                    <p className="font-semibold text-slate-900">{patient.cedula}</p>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Edad</label>
                    <p className="font-semibold text-slate-900">{calculateAge(patient.birthDate)} años</p>
                </div>
            </div>

            {/* Main Content: 2 Columns */}
            <div className="flex-1 flex flex-col md:flex-row print:flex-row">
                
                {/* LEFT: MEDICINES */}
                <div className="flex-1 p-8 border-r border-slate-100 print:border-r-2 print:border-slate-200">
                    <div className="flex items-center gap-2 mb-6 text-blue-800 print:text-black">
                        <Pill className="w-5 h-5" />
                        <h3 className="font-bold text-lg uppercase tracking-wider">Medicamentos</h3>
                    </div>

                    {/* Input Row (Screen Only) */}
                    <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100 print:hidden space-y-3">
                        <div>
                            <input 
                                type="text" 
                                placeholder="Nombre del Medicamento" 
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                value={medName}
                                onChange={e => setMedName(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3">
                            <input 
                                type="text" 
                                placeholder="Dosis / Concentración" 
                                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                value={medDose}
                                onChange={e => setMedDose(e.target.value)}
                            />
                             <input 
                                type="text" 
                                placeholder="Cant." 
                                className="w-20 px-3 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                value={medQty}
                                onChange={e => setMedQty(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={addMedicine}
                            className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Agregar Ítem
                        </button>
                    </div>

                    {/* List */}
                    {medicines.length === 0 ? (
                        <p className="text-slate-400 italic text-sm text-center mt-10 print:hidden">Agregue medicamentos a la lista...</p>
                    ) : (
                        <ul className="space-y-6">
                            {medicines.map((med, index) => (
                                <li key={med.id} className="group relative pl-4 border-l-2 border-slate-200">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-800 text-lg">{index + 1}. {med.name}</p>
                                            <p className="text-slate-600 font-medium">{med.dosage}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Cantidad</span>
                                            <p className="font-bold text-slate-800">{med.quantity}</p>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => removeMedicine(med.id)}
                                        className="absolute -left-8 top-1 p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* RIGHT: INDICATIONS */}
                <div className="flex-1 p-8 bg-white">
                    <div className="flex items-center gap-2 mb-6 text-blue-800 print:text-black">
                        <ClipboardList className="w-5 h-5" />
                        <h3 className="font-bold text-lg uppercase tracking-wider">Indicaciones</h3>
                    </div>

                    <textarea 
                        className="w-full h-[300px] resize-none border-none focus:ring-0 p-0 text-slate-700 leading-relaxed text-sm bg-[linear-gradient(transparent,transparent_29px,#e2e8f0_30px)] bg-[length:100%_30px] print:text-black"
                        placeholder="Escriba aquí las indicaciones, dosis horaria, dieta y recomendaciones..."
                        value={indications}
                        onChange={e => setIndications(e.target.value)}
                    />
                </div>
            </div>

            {/* DOCTOR FOOTER */}
            <div className="mt-auto p-8 pt-12">
                <div className="flex justify-center">
                     <div className="text-center w-64">
                        {/* Placeholder Signature */}
                        <div className="h-16 mb-2 flex items-end justify-center">
                            <PenTool className="w-8 h-8 text-slate-200 print:hidden" />
                        </div>
                        <div className="border-t border-slate-800 pt-2">
                            <p className="font-bold text-slate-900">{doctorInfo.name}</p>
                            <p className="text-xs text-slate-600 uppercase tracking-wider">{doctorInfo.license}</p>
                            <p className="text-xs text-slate-500 mt-1">{doctorInfo.phone}</p>
                        </div>
                     </div>
                </div>
            </div>

            {/* Actions Bar (Floating or bottom) */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3 print:hidden">
                <button 
                    onClick={handleSaveAndPrint}
                    disabled={isSaving}
                    className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium flex items-center gap-2 shadow-lg transform hover:-translate-y-0.5 transition-all"
                >
                    {isSaving ? 'Guardando...' : (
                        <>
                            <Printer className="w-4 h-4" />
                            <Save className="w-4 h-4" />
                            Guardar e Imprimir
                        </>
                    )}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ElectronicPrescription;