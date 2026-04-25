# Configuración de Supabase

Para que la integración con Supabase funcione correctamente, debes ejecutar el siguiente script SQL en el **SQL Editor** de tu proyecto de Supabase.

```sql
-- Tabla de Pacientes
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  firstName TEXT NOT NULL,
  cedula TEXT UNIQUE NOT NULL,
  birthDate DATE NOT NULL,
  placeOfBirth TEXT,
  gender TEXT,
  maritalStatus TEXT,
  educationLevel TEXT,
  dominantHand TEXT,
  address TEXT,
  state TEXT,
  country TEXT,
  phone TEXT,
  photoUrl TEXT,
  medicalHistory TEXT,
  allergies TEXT,
  hasDisability BOOLEAN,
  disabilityDescription TEXT,
  company TEXT,
  department TEXT,
  jobTitle TEXT,
  workSchedule TEXT,
  entryDate DATE,
  employmentStatus TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Doctores
CREATE TABLE doctors (
  id UUID PRIMARY KEY,
  title TEXT,
  firstName TEXT NOT NULL,
  cedula TEXT UNIQUE NOT NULL,
  mpps TEXT,
  inpsasel TEXT,
  collegeId TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Empresas
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  rif TEXT UNIQUE NOT NULL,
  nil TEXT,
  address TEXT,
  phone TEXT,
  contactName TEXT,
  contactPhone TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Atenciones Médicas
CREATE TABLE medical_attentions (
  id UUID PRIMARY KEY,
  patientId UUID REFERENCES patients(id) ON DELETE CASCADE,
  patientName TEXT,
  patientCedula TEXT,
  reportNumber TEXT,
  attentionDate DATE NOT NULL,
  attentionType TEXT,
  reason TEXT,
  medicalReferral TEXT,
  doctorId UUID REFERENCES doctors(id),
  doctorName TEXT,
  diagnosis TEXT,
  observations TEXT,
  recommendations TEXT,
  restDays INTEGER,
  restStartDate DATE,
  restEndDate DATE,
  evaluationResult TEXT,
  weight NUMERIC,
  height NUMERIC,
  bmi NUMERIC,
  bloodPressure TEXT,
  heartRate INTEGER,
  respiratoryRate INTEGER,
  temperature NUMERIC,
  oxygenSaturation INTEGER,
  isExternal BOOLEAN,
  externalDoctor TEXT,
  externalInstitution TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Consultas/Citas
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  patientId UUID REFERENCES patients(id) ON DELETE CASCADE,
  patientName TEXT,
  patientCedula TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  type TEXT,
  status TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Recipes
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY,
  patientId UUID REFERENCES patients(id) ON DELETE CASCADE,
  patientName TEXT,
  patientCedula TEXT,
  date DATE NOT NULL,
  medicines JSONB,
  indications TEXT,
  doctorName TEXT,
  doctorLicense TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Cargos
CREATE TABLE job_titles (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Departamentos
CREATE TABLE departments (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Usuarios del Sistema
CREATE TABLE app_users (
  id UUID PRIMARY KEY,
  firstName TEXT NOT NULL,
  cedula TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Validación de Reposos
CREATE TABLE rest_validations (
  id UUID PRIMARY KEY,
  patientId UUID REFERENCES patients(id) ON DELETE CASCADE,
  patientName TEXT,
  patientCedula TEXT,
  reportNumber TEXT,
  date DATE NOT NULL,
  pathology TEXT,
  restDays INTEGER,
  restStartDate DATE,
  restEndDate DATE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Contadores para Reportes (Opcional, se puede manejar por lógica)
CREATE TABLE report_counters (
  companyName TEXT PRIMARY KEY,
  counter INTEGER DEFAULT 0
);
```

### Configuración de Variables de Entorno

Una vez ejecutado el script, debes configurar las siguientes variables en el menú **Settings** de AI Studio:

- `VITE_SUPABASE_URL`: La URL de tu proyecto de Supabase.
- `VITE_SUPABASE_ANON_KEY`: El API Key anon de tu proyecto de Supabase.
