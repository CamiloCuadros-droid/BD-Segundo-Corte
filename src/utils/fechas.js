const pad = (n) => String(n).padStart(2, '0');
const formato = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const hoy = () => formato(new Date());

const masMeses = (meses) => {
  const d = new Date();
  d.setMonth(d.getMonth() + meses);
  return formato(d);
};

// Lunes de la semana actual (YYYY-MM-DD)
const lunesActual = () => {
  const d = new Date();
  const dia = d.getDay(); // 0 = domingo
  d.setDate(d.getDate() - (dia === 0 ? 6 : dia - 1));
  return formato(d);
};

const esFecha = (texto) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const d = new Date(`${texto}T00:00:00`);
  return !Number.isNaN(d.getTime()) && formato(d) === texto;
};

// true si "YYYY-MM-DD" es una fecha real y cae en lunes
const esLunes = (texto) => esFecha(texto) && new Date(`${texto}T00:00:00`).getDay() === 1;

// Numero de dia (para comparar dias consecutivos)
const aDia = (d) => Math.round(new Date(`${d}T00:00:00`).getTime() / 86400000);

module.exports = { hoy, masMeses, lunesActual, esLunes, esFecha, aDia };
