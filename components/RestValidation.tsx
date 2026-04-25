import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, User, Calendar, AlertCircle, Save, CheckCircle2, 
  Clock, Plus, X, ListPlus, 
  Trash2, ClipboardList, FileCheck
} from 'lucide-react';
import { 
  findPatientByCedula, 
  saveRestValidation, 
  getRestValidations,
  deleteRestValidation,
  getDoctors
} from '../utils/storage';
import { pathologies, Pathology } from '../utils/nandaData';
import { Patient, RestValidation as IRestValidation, Doctor } from '../types';

const RestValidation: React.FC = () => {
  const [searchCedula, setSearchCedula] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);

  const [restValidations, setRestValidations] = useState<IRestValidation[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [pathologySearch, setPathologySearch] = useState('');
  const [showPathologyList, setShowPathologyList] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    pathology: '',
    restDays: 0,
    selectedDoctorId: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const [restData, docsData] = await Promise.all([getRestValidations(), getDoctors()]);
    setRestValidations(restData);
    setDoctors(docsData);
    if (docsData.length > 0) {
      setFormData(prev => ({ ...prev, selectedDoctorId: docsData[0].id }));
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCedula.trim()) return;

    setIsSearching(true);
    setSearchError('');
    setCurrentPatient(null);

    try {
      const foundPatient = await findPatientByCedula(searchCedula);
      if (!foundPatient) {
        setSearchError('Paciente no encontrado.');
      } else {
        setCurrentPatient(foundPatient);
      }
    } catch (err) {
      setSearchError('Error al buscar paciente.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredPathologies = pathologies.filter(item => 
    item.name.toLowerCase().includes(pathologySearch.toLowerCase()) || 
    item.code.toLowerCase().includes(pathologySearch.toLowerCase())
  );

  const addPathologyToDiagnosis = (item: Pathology) => {
    const textToAdd = `[${item.code}] ${item.name}`;
    setFormData(prev => ({
      ...prev,
      pathology: prev.pathology ? `${prev.pathology}\n${textToAdd}` : textToAdd
    }));
    setPathologySearch('');
    setShowPathologyList(false);
  };

  const addCustomPathology = () => {
    if (!pathologySearch.trim()) return;
    setFormData(prev => ({
      ...prev,
      pathology: prev.pathology ? `${prev.pathology}\n${pathologySearch.trim()}` : pathologySearch.trim()
    }));
    setPathologySearch('');
    setShowPathologyList(false);
  };

  const getRestEndDate = (startDate: string, days: number) => {
    if (!startDate) return '';
    const date = new Date(startDate);
    date.setDate(date.getDate() + Number(days));
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;

    setLoadingAction(true);
    try {
      await saveRestValidation({
        patientId: currentPatient.id,
        patientName: currentPatient.firstName,
        patientCedula: currentPatient.cedula,
        date: formData.date,
        pathology: formData.pathology,
        restDays: Number(formData.restDays),
        restStartDate: formData.date,
        restEndDate: getRestEndDate(formData.date, formData.restDays),
        doctorId: formData.selectedDoctorId
      }, currentPatient.company);
      setActionSuccess("Reposo validado correctamente.");
      setFormData({
        date: new Date().toISOString().split('T')[0],
        pathology: '',
        restDays: 0,
        selectedDoctorId: doctors.length > 0 ? doctors[0].id : ''
      });
      setCurrentPatient(null);
      setSearchCedula('');
      fetchInitialData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (error) {
      alert("Error al guardar la validación.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Desea eliminar esta validación?")) {
      await deleteRestValidation(id);
      fetchRestValidations();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPathologyList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Validación de Reposos Externos</h2>
        {actionSuccess && (
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg flex items-center animate-bounce">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            {actionSuccess}
          </div>
        )}
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-slate-700 mb-1">Cédula del Trabajador</label>
            <div className="relative">
              <input 
                type="number" 
                value={searchCedula}
                onChange={(e) => setSearchCedula(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ingrese cédula"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            {searchError && <p className="text-red-500 text-sm mt-1">{searchError}</p>}
          </div>
          <button 
            type="submit"
            disabled={isSearching}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
      </section>

      {currentPatient && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-6 mb-6">
            <h3 className="text-blue-900 font-bold mb-2 flex items-center gap-2">
              <User className="w-5 h-5" />
              Trabajador: {currentPatient.firstName}
            </h3>
            <p className="text-sm text-blue-700">Cédula: {currentPatient.cedula} | Cargo: {currentPatient.jobTitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Médico Validador</label>
                <select 
                  name="selectedDoctorId"
                  required
                  value={formData.selectedDoctorId}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-blue-700"
                >
                  <option value="">-- Seleccionar --</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.title} {d.firstName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha del Reposo</label>
                <input 
                  type="date" 
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Días de Reposo</label>
                <input 
                  type="number" 
                  name="restDays"
                  min="1"
                  required
                  value={formData.restDays}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="mb-6 relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-slate-700 mb-1">Patología / Diagnóstico Externo</label>
              <div className="relative mb-2">
                <input 
                  type="text"
                  value={pathologySearch}
                  onChange={(e) => {
                    setPathologySearch(e.target.value);
                    setShowPathologyList(true);
                  }}
                  onFocus={() => setShowPathologyList(true)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Buscar patología..."
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              
              {showPathologyList && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 max-h-60 overflow-y-auto z-50">
                  {filteredPathologies.slice(0, 50).map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => addPathologyToDiagnosis(item)}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-slate-100 last:border-0 flex items-center gap-2"
                    >
                      <span className="text-xs font-mono bg-slate-100 px-1 rounded">{item.code}</span>
                      <span className="text-sm">{item.name}</span>
                    </button>
                  ))}
                  {pathologySearch && (
                    <button
                      type="button"
                      onClick={addCustomPathology}
                      className="w-full text-left px-4 py-2 bg-slate-50 hover:bg-blue-50 border-t border-slate-200 text-blue-600 text-sm font-medium"
                    >
                      Agregar "{pathologySearch}" manualmente
                    </button>
                  )}
                </div>
              )}

              <textarea 
                name="pathology"
                required
                value={formData.pathology}
                onChange={handleFormChange}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm"
                placeholder="Diagnósticos seleccionados..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loadingAction}
                className="bg-blue-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Validar Reposo
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-800">Últimas Validaciones Registradas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Trabajador</th>
                <th className="px-6 py-3">Patología</th>
                <th className="px-6 py-3 text-center">Días</th>
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {restValidations.length > 0 ? restValidations.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{v.date}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{v.patientName}</div>
                    <div className="text-slate-500 text-xs">{v.patientCedula} {v.reportNumber && <span className="text-blue-600 font-bold ml-2">[{v.reportNumber}]</span>}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate">{v.pathology}</td>
                  <td className="px-6 py-4 text-center font-bold text-blue-600">{v.restDays}</td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleDelete(v.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">No hay validaciones registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RestValidation;
