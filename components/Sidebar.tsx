
import React, { useState } from 'react';
import { 
  FolderOpen, 
  Stethoscope, 
  Calendar, 
  FileText, 
  ClipboardList, 
  Activity, 
  FileBarChart, 
  ChevronDown, 
  ChevronRight, 
  ShieldPlus,
  BookOpenCheck,
  FileCheck,
  Settings,
  Database
} from 'lucide-react';
import { MenuItem, AppUser } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  user: AppUser;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, user }) => {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const menuItems: MenuItem[] = [
    { 
      id: 'archivo', 
      label: 'Archivo', 
      icon: FolderOpen, 
      hasSubmenu: true,
      subItems: ['Paciente', 'Medicos', 'Empresas', 'Usuarios', 'Historia Clínica', 'Cargos', 'Departamento'] 
    },
    { id: 'atencion', label: 'Atención Médica', icon: Stethoscope },
    { id: 'validacion-reposos', label: 'Validación de reposos', icon: FileCheck },
    { id: 'citas', label: 'Citas', icon: Calendar },
    { id: 'recipe', label: 'Recipe E.', icon: FileText },
    { id: 'reporte', label: 'Reporte', icon: ClipboardList },
    { id: 'diagnostica', label: 'I Diagnóstica', icon: Activity },
    { 
      id: 'informes', 
      label: 'Informes', 
      icon: FileBarChart,
      hasSubmenu: true,
      subItems: ['Informes Medicos', 'Informe Ocupacional', 'Reposo Medico']
    },
    { id: 'sve', label: 'Informe SVE', icon: BookOpenCheck },
    { id: 'datos', label: 'Carga Masiva', icon: Database },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ].filter(item => {
    // If modules is not defined or empty, allow everything for Admin role as fallback
    if (user.role === 'Administrador') return true;
    
    // Explicit module check
    const allowedModules = user.modules || [];
    return allowedModules.includes(item.id);
  });

  const toggleSubmenu = (id: string) => {
    if (expandedMenu === id) {
      setExpandedMenu(null);
    } else {
      setExpandedMenu(id);
    }
  };

  const handleLogoClick = () => {
    onNavigate('dashboard');
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleSubItemClick = (parent: string, item: string) => {
    const viewId = item.toLowerCase()
      .replace(/ /g, '-')
      .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
      
    onNavigate(viewId);
    
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed top-0 left-0 z-50 h-full w-72 
          bg-gradient-to-b from-[#0f172a] to-[#1e3a8a] 
          text-white shadow-2xl transition-transform duration-300 ease-in-out
          flex flex-col justify-between print:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header / Logo Section (Clickable) */}
        <div 
          onClick={handleLogoClick}
          className="p-6 border-b border-blue-800/50 bg-opacity-20 bg-blue-900 cursor-pointer hover:bg-blue-800/40 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg bg-opacity-20 border border-blue-400 group-hover:scale-105 transition-transform">
               <ShieldPlus className="w-8 h-8 text-blue-300" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-blue-100 tracking-wide">ALEX CONSULTING</h1>
              <p className="text-[10px] text-blue-300 uppercase tracking-widest">Servicios Médicos</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
          {menuItems.map((item) => (
            <div key={item.id} className="mb-1">
              <button
                onClick={() => item.hasSubmenu ? toggleSubmenu(item.id) : onNavigate(item.id)}
                className={`
                  w-full flex items-center justify-between p-3 rounded-lg
                  transition-all duration-200
                  ${expandedMenu === item.id ? 'bg-blue-800/50 text-blue-200' : 'hover:bg-blue-800/30 text-gray-100'}
                `}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${expandedMenu === item.id ? 'text-blue-300' : 'text-gray-300'}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {item.hasSubmenu && (
                  expandedMenu === item.id 
                    ? <ChevronDown className="w-4 h-4 text-blue-300" /> 
                    : <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* Submenu */}
              {item.hasSubmenu && expandedMenu === item.id && (
                <div className="ml-4 pl-4 border-l border-blue-700/50 mt-1 space-y-1">
                  {item.subItems?.map((sub, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleSubItemClick(item.id, sub)}
                      className="w-full text-left p-2 text-sm text-gray-300 hover:text-white hover:bg-blue-800/20 rounded transition-colors"
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-blue-800/50 bg-[#0b1120]/50 text-center">
          <p className="text-xs text-gray-400 font-light mb-1">
            &copy; {new Date().getFullYear()} Alex Consulting
          </p>
          <p className="text-xs text-gray-500 font-light">
            Servicios Médicos
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
