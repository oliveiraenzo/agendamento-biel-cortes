/**
 * Converte string "HH:mm" para minutos a partir de 00:00 (ex: "14:30" => 870)
 */
function timeToMinutes(timeStr) {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converte minutos a partir de 00:00 para string "HH:mm" (ex: 870 => "14:30")
 */
function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Verifica se dois intervalos de tempo colidem
 * Condição: (startA < endB) && (endA > startB)
 */
function hasOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

module.exports = {
  timeToMinutes,
  minutesToTime,
  hasOverlap
};

