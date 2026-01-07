import { Patient, MedicalAttention, Prescription, Doctor, Company, AppUser, JobTitle, Appointment } from '../types';

const STORAGE_KEY_PATIENTS = 'alex_consulting_patients';
const STORAGE_KEY_ATTENTIONS = 'alex_consulting_attentions';
const STORAGE_KEY_PRESCRIPTIONS = 'alex_consulting_prescriptions';
const STORAGE_KEY_DOCTORS = 'alex_consulting_doctors';
const STORAGE_KEY_COMPANIES = 'alex_consulting_companies';
const STORAGE_KEY_USERS = 'alex_consulting_users';
const STORAGE_KEY_JOB_TITLES = 'alex_consulting_job_titles';
const STORAGE_KEY_APPOINTMENTS = 'alex_consulting_appointments';

// --- DATA MANAGEMENT (WEB VERSION) ---

export const exportAllData = (): string => {
  const data: Record<string, any> = {};
  const keys = [
    STORAGE_KEY_PATIENTS,
    STORAGE_KEY_ATTENTIONS,
    STORAGE_KEY_PRESCRIPTIONS,
    STORAGE_KEY_DOCTORS,
    STORAGE_KEY_COMPANIES,
    STORAGE_KEY_USERS,
    STORAGE_KEY_JOB_TITLES,
    STORAGE_KEY_APPOINTMENTS
  ];

  keys.forEach(key => {
    const raw = localStorage.getItem(key);
    if (raw) {
      data[key] = JSON.parse(raw);
    }
  });

  return JSON.stringify(data, null, 2);
};

export const importAllData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (typeof data !== 'object' || data === null) return false;

    Object.keys(data).forEach(key => {
      if (key.startsWith('alex_consulting_')) {
        localStorage.setItem(key, JSON.stringify(data[key]));
      }
    });
    return true;
  } catch (e) {
    console.error("Error importing data", e);
    return false;
  }
};

// --- Helper Generic Functions ---

const getItems = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveItem = <T>(key: string, item: T) => {
  const items = getItems<T>(key);
  // @ts-ignore
  items.push(item);
  localStorage.setItem(key, JSON.stringify(items));
};

const updateItemInList = <T extends { id: string }>(key: string, id: string, updates: Partial<T>): T | null => {
  const items = getItems<T>(key);
  const index = items.findIndex(i => i.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    localStorage.setItem(key, JSON.stringify(items));
    return items[index];
  }
  return null;
};

const deleteItemInList = <T extends { id: string }>(key: string, id: string) => {
  const items = getItems<T>(key);
  const filtered = items.filter(i => i.id !== id);
  localStorage.setItem(key, JSON.stringify(filtered));
};

export const initializeAuth = () => {
  const users = getItems<AppUser>(STORAGE_KEY_USERS);
  if (users.length === 0) {
    const adminUser: AppUser = {
      id: 'admin-default',
      firstName: 'Administrador Principal',
      cedula: '00000000',
      username: 'admin',
      password: 'admin',
      role: 'Administrador',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify([adminUser]));
  }
};

// --- Patients ---

export const savePatientToDB = (patientData: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient> => {
  return new Promise((resolve, reject) => {
    try {
      setTimeout(() => {
        const newPatient: Patient = {
          ...patientData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString()
        };
        saveItem(STORAGE_KEY_PATIENTS, newPatient);
        resolve(newPatient);
      }, 100);
    } catch (error) {
      reject(error);
    }
  });
};

export const batchSavePatients = (patients: Omit<Patient, 'id' | 'createdAt'>[]): Promise<{ created: number, updated: number }> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const existingPatients = getItems<Patient>(STORAGE_KEY_PATIENTS);
            let created = 0;
            let updated = 0;

            const updatedList = [...existingPatients];

            patients.forEach(pData => {
                const existingIndex = updatedList.findIndex(ep => ep.cedula === pData.cedula);
                if (existingIndex !== -1) {
                    updatedList[existingIndex] = { 
                        ...updatedList[existingIndex], 
                        ...pData 
                    };
                    updated++;
                } else {
                    updatedList.push({
                        ...pData,
                        id: crypto.randomUUID(),
                        createdAt: new Date().toISOString()
                    } as Patient);
                    created++;
                }
            });

            localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(updatedList));
            resolve({ created, updated });
        }, 500);
    });
};

export const getPatientsFromDB = (): Patient[] => getItems<Patient>(STORAGE_KEY_PATIENTS);

export const getAllPatients = (): Promise<Patient[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getPatientsFromDB());
    }, 100);
  });
}

export const findPatientByCedula = (cedula: string): Promise<Patient | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const patients = getPatientsFromDB();
      const found = patients.find(p => p.cedula === cedula);
      resolve(found);
    }, 100);
  });
};

export const updatePatient = (id: string, updatedData: Partial<Patient>): Promise<Patient> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const updated = updateItemInList<Patient>(STORAGE_KEY_PATIENTS, id, updatedData);
      if (updated) resolve(updated);
      else reject(new Error("Patient not found"));
    }, 100);
  });
};

export const deletePatient = (id: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      deleteItemInList<Patient>(STORAGE_KEY_PATIENTS, id);
      resolve();
    }, 100);
  });
};

// --- Medical Attentions ---
export const getAllMedicalAttentions = (): Promise<MedicalAttention[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getItems<MedicalAttention>(STORAGE_KEY_ATTENTIONS));
    }, 100);
  });
};

export const saveMedicalAttentionToDB = (attentionData: Omit<MedicalAttention, 'id' | 'createdAt'>): Promise<MedicalAttention> => {
  return new Promise((resolve, reject) => {
    try {
      setTimeout(() => {
        const newAttention: MedicalAttention = {
            ...attentionData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString()
        };
        saveItem(STORAGE_KEY_ATTENTIONS, newAttention);
        resolve(newAttention);
      }, 100);
    } catch (error) {
        reject(error);
    }
  });
};

export const getMedicalAttentionsByCedula = (cedula: string): Promise<MedicalAttention[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const attentions = getItems<MedicalAttention>(STORAGE_KEY_ATTENTIONS);
      const filtered = attentions
        .filter(a => a.patientCedula === cedula)
        .sort((a, b) => new Date(b.attentionDate).getTime() - new Date(a.attentionDate).getTime());
      resolve(filtered);
    }, 100);
  });
};

export const updateMedicalAttention = (id: string, updatedData: Partial<MedicalAttention>): Promise<MedicalAttention> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const updated = updateItemInList<MedicalAttention>(STORAGE_KEY_ATTENTIONS, id, updatedData);
      if (updated) resolve(updated);
      else reject(new Error("Attention not found"));
    }, 100);
  });
};

export const deleteMedicalAttention = (id: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      deleteItemInList<MedicalAttention>(STORAGE_KEY_ATTENTIONS, id);
      resolve();
    }, 100);
  });
};

// --- Prescriptions ---
export const savePrescriptionToDB = (prescriptionData: Omit<Prescription, 'id' | 'createdAt'>): Promise<Prescription> => {
  return new Promise((resolve, reject) => {
    try {
      setTimeout(() => {
        const newPrescription: Prescription = {
          ...prescriptionData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString()
        };
        saveItem(STORAGE_KEY_PRESCRIPTIONS, newPrescription);
        resolve(newPrescription);
      }, 100);
    } catch (error) {
      reject(error);
    }
  });
};

// --- DOCTORS ---
export const getDoctors = (): Promise<Doctor[]> => {
  return new Promise(resolve => setTimeout(() => resolve(getItems<Doctor>(STORAGE_KEY_DOCTORS)), 100));
};

export const saveDoctor = (data: Omit<Doctor, 'id' | 'createdAt'>): Promise<Doctor> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const newItem: Doctor = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      saveItem(STORAGE_KEY_DOCTORS, newItem);
      resolve(newItem);
    }, 100);
  });
};

export const updateDoctor = (id: string, data: Partial<Doctor>): Promise<Doctor> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const updated = updateItemInList<Doctor>(STORAGE_KEY_DOCTORS, id, data);
      updated ? resolve(updated) : reject("Doctor not found");
    }, 100);
  });
};

export const deleteDoctor = (id: string): Promise<void> => {
  return new Promise(resolve => {
    deleteItemInList<Doctor>(STORAGE_KEY_DOCTORS, id);
    resolve();
  });
};

// --- COMPANIES ---
export const getCompanies = (): Promise<Company[]> => {
  return new Promise(resolve => setTimeout(() => resolve(getItems<Company>(STORAGE_KEY_COMPANIES)), 100));
};

export const saveCompany = (data: Omit<Company, 'id' | 'createdAt'>): Promise<Company> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const newItem: Company = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      saveItem(STORAGE_KEY_COMPANIES, newItem);
      resolve(newItem);
    }, 100);
  });
};

export const updateCompany = (id: string, data: Partial<Company>): Promise<Company> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const updated = updateItemInList<Company>(STORAGE_KEY_COMPANIES, id, data);
      updated ? resolve(updated) : reject("Company not found");
    }, 100);
  });
};

export const deleteCompany = (id: string): Promise<void> => {
  return new Promise(resolve => {
    deleteItemInList<Company>(STORAGE_KEY_COMPANIES, id);
    resolve();
  });
};

// --- JOB TITLES (CARGOS) ---
export const getJobTitles = (): Promise<JobTitle[]> => {
  return new Promise(resolve => setTimeout(() => resolve(getItems<JobTitle>(STORAGE_KEY_JOB_TITLES)), 100));
};

export const saveJobTitle = (data: Omit<JobTitle, 'id' | 'createdAt'>): Promise<JobTitle> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const newItem: JobTitle = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      saveItem(STORAGE_KEY_JOB_TITLES, newItem);
      resolve(newItem);
    }, 100);
  });
};

export const updateJobTitle = (id: string, data: Partial<JobTitle>): Promise<JobTitle> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const updated = updateItemInList<JobTitle>(STORAGE_KEY_JOB_TITLES, id, data);
      updated ? resolve(updated) : reject("Job Title not found");
    }, 100);
  });
};

export const deleteJobTitle = (id: string): Promise<void> => {
  return new Promise(resolve => {
    deleteItemInList<JobTitle>(STORAGE_KEY_JOB_TITLES, id);
    resolve();
  });
};

// --- USERS ---
export const getUsers = (): Promise<AppUser[]> => {
  return new Promise(resolve => setTimeout(() => resolve(getItems<AppUser>(STORAGE_KEY_USERS)), 100));
};

export const saveUser = (data: Omit<AppUser, 'id' | 'createdAt'>): Promise<AppUser> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const newItem: AppUser = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      saveItem(STORAGE_KEY_USERS, newItem);
      resolve(newItem);
    }, 100);
  });
};

export const updateUser = (id: string, data: Partial<AppUser>): Promise<AppUser> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const updated = updateItemInList<AppUser>(STORAGE_KEY_USERS, id, data);
      updated ? resolve(updated) : reject("User not found");
    }, 100);
  });
};

export const deleteUser = (id: string): Promise<void> => {
  return new Promise(resolve => {
    deleteItemInList<AppUser>(STORAGE_KEY_USERS, id);
    resolve();
  });
};

// --- APPOINTMENTS (CITAS) ---
export const getAppointments = (): Promise<Appointment[]> => {
  return new Promise(resolve => setTimeout(() => resolve(getItems<Appointment>(STORAGE_KEY_APPOINTMENTS)), 100));
};

export const saveAppointment = (data: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const newItem: Appointment = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      saveItem(STORAGE_KEY_APPOINTMENTS, newItem);
      resolve(newItem);
    }, 100);
  });
};

export const updateAppointment = (id: string, data: Partial<Appointment>): Promise<Appointment> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const updated = updateItemInList<Appointment>(STORAGE_KEY_APPOINTMENTS, id, data);
      updated ? resolve(updated) : reject("Appointment not found");
    }, 100);
  });
};

export const deleteAppointment = (id: string): Promise<void> => {
  return new Promise(resolve => {
    deleteItemInList<Appointment>(STORAGE_KEY_APPOINTMENTS, id);
    resolve();
  });
};

export const checkAvailability = async (date: string, time: string, excludeId?: string): Promise<boolean> => {
  const appointments = await getAppointments();
  return !appointments.some(a => 
    a.date === date && 
    a.time === time && 
    a.status !== 'Cancelada' &&
    a.id !== excludeId
  );
};