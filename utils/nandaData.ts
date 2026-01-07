export interface Pathology {
  code: string;
  name: string;
}

export const medicalSpecialties = [
  "Alergología",
  "Anestesiología",
  "Cardiología",
  "Cirugía General",
  "Cirugía Plástica y Reconstructiva",
  "Dermatología",
  "Endocrinología",
  "Gastroenterología",
  "Geriatría",
  "Ginecología y Obstetricia",
  "Hematología",
  "Infectología",
  "Medicina Física y Rehabilitación (Fisiatría)",
  "Medicina Interna",
  "Medicina Ocupacional",
  "Nefrología",
  "Neumonología",
  "Neurocirugía",
  "Neurología",
  "Nutrición y Dietética",
  "Oftalmología",
  "Oncología",
  "Ortopedia y Traumatología",
  "Otorrinolaringología",
  "Pediatría",
  "Psiquiatría",
  "Psicología",
  "Radiología",
  "Reumatología",
  "Urología"
];

export const pathologies: Pathology[] = [
  // --- MUSCULOESQUELÉTICOS (Muy comunes en INPSASEL) ---
  { code: "M54.5", name: "Lumbago no especificado (Dolor lumbar)" },
  { code: "M54.4", name: "Lumbago con ciática" },
  { code: "M54.2", name: "Cervicalgia (Dolor cervical)" },
  { code: "M51.2", name: "Hernia de disco intervertebral lumbosacro (sin mielopatía)" },
  { code: "M51.1", name: "Trastornos de disco lumbar y otros, con radiculopatía" },
  { code: "M50.0", name: "Trastorno de disco cervical con mielopatía" },
  { code: "M75.1", name: "Síndrome del manguito rotatorio" },
  { code: "M75.0", name: "Capsulitis adhesiva de hombro (Hombro congelado)" },
  { code: "M77.1", name: "Epicondilitis lateral (Codo de tenista)" },
  { code: "M77.0", name: "Epicondilitis medial (Codo de golfista)" },
  { code: "G56.0", name: "Síndrome del túnel carpiano" },
  { code: "G56.2", name: "Lesión del nervio cubital (Túnel cubital)" },
  { code: "M65.3", name: "Dedo en gatillo (Tenosinovitis estenosante)" },
  { code: "M65.4", name: "Tenosinovitis de estiloides radial (De Quervain)" },
  { code: "M70.2", name: "Bursitis del olécranon" },
  { code: "M70.4", name: "Bursitis prepatelar" },
  { code: "M25.5", name: "Dolor en articulación (Artralgia - Sitio no especificado)" },
  { code: "M17.9", name: "Gonartrosis, no especificada (Desgaste de rodilla)" },
  { code: "S83.5", name: "Esguince y torcedura de rodilla (Ligamento cruzado)" },
  { code: "S93.4", name: "Esguince y torcedura del tobillo" },

  // --- RESPIRATORIOS (Riesgos químicos/polvo) ---
  { code: "J00", name: "Rinofaringitis aguda (Resfriado común)" },
  { code: "J06.9", name: "Infección aguda de las vías respiratorias superiores" },
  { code: "J20.9", name: "Bronquitis aguda, no especificada" },
  { code: "J45.9", name: "Asma, no especificada (Asma Ocupacional)" },
  { code: "J62.8", name: "Neumoconiosis debida a otro polvo conteniendo sílice" },
  { code: "J63.2", name: "Beriliosis" },
  { code: "J66.0", name: "Bisinosis (Enfermedad de las vías aéreas por algodón)" },
  { code: "J68.9", name: "Afección respiratoria debida a inhalación de gases/humos" },
  { code: "J30.1", name: "Rinitis alérgica debida al polen" },
  { code: "J30.3", name: "Otras rinitis alérgicas (Rinitis Ocupacional)" },

  // --- AUDITIVOS (Ruido ocupacional) ---
  { code: "H83.3", name: "Efectos del ruido sobre el oído interno" },
  { code: "H90.3", name: "Hipoacusia neurosensorial, bilateral (Sordera profesional)" },
  { code: "H90.4", name: "Hipoacusia neurosensorial, unilateral con audición irrestricta contralateral" },
  { code: "H91.9", name: "Hipoacusia, no especificada" },
  { code: "H93.1", name: "Tinnitus (Acúfenos)" },

  // --- DERMATOLÓGICOS (Contacto) ---
  { code: "L23.9", name: "Dermatitis alérgica de contacto, causa no especificada" },
  { code: "L24.9", name: "Dermatitis de contacto por irritantes" },
  { code: "L23.0", name: "Dermatitis alérgica de contacto debida a metales" },
  { code: "L23.5", name: "Dermatitis alérgica de contacto debida a otros productos químicos" },
  { code: "B35.4", name: "Tiña del cuerpo" },
  { code: "B35.3", name: "Tiña del pie (Pie de atleta)" },

  // --- PSICOSOCIALES Y ESTRÉS ---
  { code: "F43.0", name: "Reacción al estrés agudo" },
  { code: "Z73.0", name: "Síndrome de agotamiento (Burnout)" },
  { code: "F41.1", name: "Trastorno de ansiedad generalizada" },
  { code: "F43.2", name: "Trastornos de adaptación" },
  { code: "G47.0", name: "Trastornos del inicio y mantenimiento del sueño (Insomnio)" },
  { code: "R53", name: "Malestar y fatiga (Fatiga crónica laboral)" },

  // --- CARDIOVASCULARES ---
  { code: "I10", name: "Hipertensión esencial (primaria)" },
  { code: "R00.0", name: "Taquicardia, no especificada" },
  { code: "I83.9", name: "Venas varicosas de los miembros inferiores, sin úlcera ni inflamación" },

  // --- TRAUMATISMOS Y OTROS ---
  { code: "S05.9", name: "Traumatismo del ojo y de la órbita (Cuerpo extraño)" },
  { code: "T15.9", name: "Cuerpo extraño en parte externa del ojo" },
  { code: "S61.9", name: "Herida abierta de la muñeca y de la mano" },
  { code: "S90.3", name: "Contusión de pie" },
  { code: "T75.2", name: "Efectos de la vibración" },
  { code: "R42", name: "Mareo y desvanecimiento" },
  { code: "R51", name: "Cefalea (Dolor de cabeza)" },
  
  // --- VISUALES ---
  { code: "H52.1", name: "Miopía" },
  { code: "H52.2", name: "Astigmatismo" },
  { code: "H52.4", name: "Presbicia" },
  { code: "H53.1", name: "Alteraciones visuales subjetivas (Fatiga visual)" }
];