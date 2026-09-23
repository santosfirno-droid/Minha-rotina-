// Portuguese date helpers & formatting utilities

export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAYS_FULL = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export const MONTHS_FULL = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function formatGreeting(name: string): string {
  const hour = new Date().getHours();
  let greet = 'Bom dia';
  if (hour >= 12 && hour < 18) {
    greet = 'Boa tarde';
  } else if (hour >= 18 || hour < 5) {
    greet = 'Boa noite';
  }
  return `${greet}, ${name}`;
}

export function formatCurrentDate(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
  const dayOfWeek = WEEKDAYS_FULL[date.getDay()];
  const day = date.getDate();
  const month = MONTHS_FULL[date.getMonth()];
  const year = date.getFullYear();

  return `${dayOfWeek}, ${day} de ${month} de ${year}`;
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

export function formatSecondsToTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatDurationHuman(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}min`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}min`;
  }
}

/**
 * Exact progress messages per user specification:
 * 0%: “Vamos começar?”
 * 25%: “Bom começo!”
 * 50%: “Você já fez metade!”
 * 75%: “Tá quase!”
 * 100%: “Dia concluído!”
 */
export function getMotivationalMessage(percent: number): { message: string; badge: string; color: string } {
  if (percent <= 0) {
    return { message: 'Vamos começar?', badge: '0%', color: 'text-slate-500' };
  } else if (percent < 50) {
    return { message: 'Bom começo!', badge: `${percent}%`, color: 'text-blue-600' };
  } else if (percent < 75) {
    return { message: 'Você já fez metade!', badge: `${percent}%`, color: 'text-blue-600' };
  } else if (percent < 100) {
    return { message: 'Tá quase!', badge: `${percent}%`, color: 'text-blue-700' };
  } else {
    return { message: 'Dia concluído!', badge: '100%', color: 'text-emerald-600' };
  }
}

export function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

export function getCurrentMinutesToday(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function formatMinutesToTime(minutesTotal: number): string {
  const normalized = ((minutesTotal % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatTimeRange(startTime?: string, durationMinutes?: number): string {
  if (!startTime) return '';
  if (!durationMinutes || durationMinutes <= 0) return startTime;
  const startMin = parseTimeToMinutes(startTime);
  if (startMin === null) return startTime;
  const endMin = startMin + durationMinutes;
  return `${startTime} — ${formatMinutesToTime(endMin)}`;
}

export function isTaskOverdue(timeStr?: string, durationMinutes?: number): boolean {
  if (!timeStr) return false;
  const startMin = parseTimeToMinutes(timeStr);
  if (startMin === null) return false;
  const currentMin = getCurrentMinutesToday();
  const endMin = durationMinutes ? startMin + durationMinutes : startMin + 15;
  return currentMin > endMin;
}

export function getWeekDays(
  referenceDateStr: string,
  startOfWeek: 0 | 1 = 1
): { dateStr: string; dayShort: string; dayNum: number; isToday: boolean }[] {
  const ref = new Date(referenceDateStr + 'T12:00:00');
  const day = ref.getDay(); // 0 is Sun

  let diff = day - startOfWeek;
  if (diff < 0) diff += 7;

  const monday = new Date(ref);
  monday.setDate(ref.getDate() - diff);

  const days = [];
  const todayStr = new Date().toISOString().split('T')[0];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const year = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${m}-${dayOfMonth}`;

    days.push({
      dateStr,
      dayShort: WEEKDAYS_SHORT[d.getDay()],
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
    });
  }

  return days;
}
