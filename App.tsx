
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import PatientRegistration from './components/PatientRegistration';
import MedicalAttention from './components/MedicalAttention';
import ClinicalHistory from './components/ClinicalHistory';
import ElectronicPrescription from './components/ElectronicPrescription';
import Reports from './components/Reports';
import SVEReport from './components/SVEReport';
import DoctorsManagement from './components/DoctorsManagement';
import CompaniesManagement from './components/CompaniesManagement';
import UsersManagement from './components/UsersManagement';
import JobTitlesManagement from './components/JobTitlesManagement';
import DepartmentsManagement from './components/DepartmentsManagement';
import DiagnosticImpression from './components/DiagnosticImpression';
import Appointments from './components/Appointments';
import MedicalReportGenerator from './components/MedicalReportGenerator';
import DataImport from './components/DataImport';
import Settings from './components/Settings';
import { Menu, Calendar, Clock, CheckCircle2, ClipboardList, Building2, Users, ChevronRight } from 'lucide-react';
import { getAppointments, initializeAuth, getCompanies, getAllPatients } from './utils/storage';
import { Appointment, AppUser, Company, Patient } from './types';

// Main Application Component
const App: React.FC = () => {
  // --- Auth State ---
  const [user] = useState<AppUser>({
    id: 'default-admin',
    firstName: 'Administrador',
    cedula: '00000000',
    username: 'admin',
    role: 'Administrador',
    createdAt: new Date().toISOString()
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  
  // --- Dashboard State ---
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [dashboardCompanies, setDashboardCompanies] = useState<Company[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (currentView === 'dashboard') {
        const loadDashboardData = async () => {
            try {
                const [allAppointments, companies, patients] = await Promise.all([
                  getAppointments(),
                  getCompanies(),
                  getAllPatients()
                ]);
                
                const today = new Date();
                const offset = today.getTimezoneOffset();
                const localDate = new Date(today.getTime() - (offset*60*1000));
                const localDateStr = localDate.toISOString().split('T')[0];

                const filtered = allAppointments
                    .filter(a => a.date === localDateStr && a.status !== 'Cancelada')
                    .sort((a, b) => a.time.localeCompare(b.time));
                
                setTodayAppointments(filtered);
                setDashboardCompanies(companies);
                setAllPatients(patients);
            } catch (error) {
                console.error("Error loading dashboard data", error);
            }
        };
        loadDashboardData();
    }
  }, [currentView]);

  const renderContent = () => {
    switch (currentView) {
      case 'paciente':
        return <PatientRegistration />;
      case 'medicos':
        return <DoctorsManagement />;
      case 'empresas':
        return <CompaniesManagement />;
      case 'usuarios':
        return <UsersManagement />;
      case 'cargos': 
        return <JobTitlesManagement />;
      case 'departamento':
        return <DepartmentsManagement />;
      case 'historia-clínica':
        return <ClinicalHistory />;
      case 'atencion': 
      case 'atención-médica': 
        return <MedicalAttention />;
      case 'citas':
        return <Appointments />;
      case 'recipe':
      case 'recipe-e.':
        return <ElectronicPrescription />;
      case 'reporte':
        return <Reports />;
      case 'diagnostica':
      case 'i-diagnóstica':
        return <DiagnosticImpression />;
      case 'informes-medicos':
        return <MedicalReportGenerator type="medical" />;
      case 'informe-ocupacional':
        return <MedicalReportGenerator type="occupational" />;
      case 'reposo-medico':
        return <MedicalReportGenerator type="sick-leave" />;
      case 'reposos-externos':
        return <MedicalReportGenerator type="external-sick-leave" />;
      case 'sve':
        return <SVEReport />;
      case 'datos':
        return <DataImport />;
      case 'configuracion':
        return <Settings />;
      case 'dashboard':
      default:
        return (
          <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-20">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8 relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Bienvenido a Alex Consulting</h2>
                <p className="text-slate-600 leading-relaxed max-w-2xl">
                    Sistema de Gestión Integral de Salud Ocupacional. <br/>
                    <span className="text-sm text-slate-500">Usuario: {user.firstName} ({user.role})</span>
                </p>
              </div>
              <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-blue-50 to-transparent opacity-50 pointer-events-none"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-4 opacity-90">
                            <Calendar className="w-5 h-5" />
                            <span className="font-medium">Agenda de Hoy</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold">{todayAppointments.length}</span>
                            <span className="text-blue-200">pacientes</span>
                        </div>
                        <p className="text-xs text-blue-200 mt-2 opacity-80">Citas programadas activas</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-slate-500" /> Accesos Rápidos
                        </h3>
                        <div className="space-y-2">
                            <button onClick={() => setCurrentView('paciente')} className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Registrar Paciente
                            </button>
                            <button onClick={() => setCurrentView('datos')} className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 font-bold text-indigo-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Carga Masiva (Excel)
                            </button>
                            <button onClick={() => setCurrentView('atencion')} className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Nueva Atención
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[300px]">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    Citas del Día
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5 capitalize">
                                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                                {todayAppointments.length} Total
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[400px] p-2">
                            {todayAppointments.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                                    <Calendar className="w-12 h-12 mb-3 opacity-20" />
                                    <p>No hay citas programadas para hoy.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {todayAppointments.map((app) => (
                                        <div key={app.id} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-lg hover:shadow-md hover:border-blue-200 transition-all group">
                                            <div className="flex flex-col items-center justify-center w-16 h-16 bg-blue-50 text-blue-700 rounded-lg shrink-0 border border-blue-100">
                                                <span className="text-lg font-bold">{app.time}</span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h3 className="font-bold text-slate-800 truncate">{app.patientName}</h3>
                                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">{app.status}</span>
                                                </div>
                                                <p className="text-sm text-slate-500 truncate">{app.type}</p>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setCurrentView('citas')} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNavigate={(view) => {
            setCurrentView(view);
            setIsSidebarOpen(false);
        }} 
      />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 lg:ml-72 print:hidden">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800">{user.firstName}</p>
              <p className="text-[10px] text-slate-500 uppercase font-medium">{user.role}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border border-blue-200">
              {user.firstName.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 lg:ml-72 p-6 overflow-x-hidden">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
