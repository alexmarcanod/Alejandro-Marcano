import { LucideIcon } from "lucide-react";

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  hasSubmenu?: boolean;
  subItems?: string[];
}

export interface Patient {
  id: string;
  // Personal
  photoUrl?: string;
  firstName: string;
  cedula: string;
  birthDate: string;
  placeOfBirth?: string;
  gender: 'Masculino' | 'Femenino';
  maritalStatus?: 'Soltero' | 'Casado' | 'Divorciado' | 'Viudo' | 'Concubino';
  educationLevel?: 'Primaria' | 'Secundaria' | 'Técnico' | 'Universitario' | 'Postgrado';
  dominantHand?: 'Diestro' | 'Zurdo' | 'Ambidextro';
  address: string;
  state?: string;
  country?: string;
  phone: string;
  
  // Medical
  medicalHistory: string;
  hasDisability: boolean;
  disabilityDescription?: string;

  // Laboral
  company: string;
  department?: string; // Nuevo
  jobTitle: string;
  workSchedule?: string; // Nuevo
  entryDate: string;
  employmentStatus: 'fijo' | 'contratado';
  
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientCedula: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: 'Atención General' | 'Examen Pre-empleo' | 'Examen Periódico' | 'Examen Post-vacacional' | 'Examen de Egreso' | 'Otras Evaluaciones Especiales';
  status: 'Programada' | 'Completada' | 'Cancelada';
  createdAt: string;
}

export interface MedicalAttention {
  id: string;
  patientId: string;
  patientName: string;
  patientCedula: string;
  
  attentionDate: string;
  attentionType: 'Pre Empleo' | 'Pre Vacaciones' | 'Egreso' | 'Periódica' | 'General';
  reason?: 'Enfermedad Común' | 'Enfermedad Ocupacional' | 'Accidente Común' | 'Accidente Ocupacional';
  medicalReferral?: string;
  
  // Doctor fields
  doctorId?: string;
  doctorName?: string;
  
  diagnosis: string;
  observations?: string;
  recommendations?: string;
  
  restDays: number;
  restStartDate: string;
  restEndDate: string;
  
  evaluationResult: 'Apto' | 'No Apto' | 'Postpuesta' | 'No Aplica';
  
  // New Fields for SVE and External Support
  isExternal?: boolean;
  externalDoctor?: string;
  externalInstitution?: string;
  
  createdAt: string;
}

export interface PrescriptionItem {
  id: string;
  name: string;
  dosage: string;
  quantity: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  patientCedula: string;
  date: string;
  
  medicines: PrescriptionItem[];
  indications: string;
  
  doctorName: string;
  doctorLicense: string;
  
  createdAt: string;
}

// --- New Modules Interfaces ---

export interface Doctor {
  id: string;
  title: 'Dr.' | 'Dra.';
  firstName: string;
  cedula: string;
  mpps: string;
  inpsasel: string;
  collegeId?: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  rif: string;
  address: string;
  phone: string;
  contactName: string;
  contactPhone: string;
  createdAt: string;
}

export interface JobTitle {
  id: string;
  name: string;
  createdAt: string;
}

export interface AppUser {
  id: string;
  firstName: string;
  cedula: string;
  username: string;
  password?: string;
  role: 'Administrador' | 'Asistente' | 'Médico';
  createdAt: string;
}