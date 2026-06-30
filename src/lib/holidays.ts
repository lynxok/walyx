// Argentinian National Holidays for 2026
// Format: "MM-DD"
const ARG_HOLIDAYS_2026: Record<string, string> = {
  "01-01": "Año Nuevo",
  "02-16": "Carnaval",
  "02-17": "Carnaval",
  "03-24": "Día Nacional de la Memoria por la Verdad y la Justicia",
  "04-02": "Día del Veterano y de los Caídos en la Guerra de Malvinas",
  "04-03": "Viernes Santo",
  "05-01": "Día del Trabajador",
  "05-25": "Día de la Revolución de Mayo",
  "06-15": "Paso a la Inmortalidad del Gral. Güemes",
  "06-20": "Paso a la Inmortalidad del Gral. Belgrano",
  "07-09": "Día de la Independencia",
  "08-17": "Paso a la Inmortalidad del Gral. José de San Martín",
  "10-12": "Día del Respeto a la Diversidad Cultural",
  "11-23": "Día de la Soberanía Nacional",
  "12-08": "Día de la Inmaculada Concepción de María",
  "12-25": "Navidad",
};

export function getHolidayForDate(date: Date): string | null {
  // Normalize date to local timezone comparison string "MM-DD"
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const key = `${month}-${day}`;

  return ARG_HOLIDAYS_2026[key] || null;
}
