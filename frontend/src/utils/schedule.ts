export type ScheduleSlot = {
    id: number;
    day_of_week: string;
    start_time: string;
    location: string;
};

const WEEKDAY_TO_JS: Record<string, number> = {
    Воскресенье: 0,
    Понедельник: 1,
    Вторник: 2,
    Среда: 3,
    Четверг: 4,
    Пятница: 5,
    Суббота: 6,
};

export function formatScheduleSlot(slot: ScheduleSlot): string {
    return `${slot.day_of_week}, ${slot.start_time} — ${slot.location}`;
}

export function suggestedDateForScheduleDay(dayOfWeek: string): string {
    const target = WEEKDAY_TO_JS[dayOfWeek];
    const now = new Date();
    if (target === undefined) {
        return formatLocalIsoDate(now);
    }

    const current = now.getDay();
    let daysBack = current - target;
    if (daysBack < 0) daysBack += 7;

    const result = new Date(now);
    result.setDate(result.getDate() - daysBack);
    return formatLocalIsoDate(result);
}

export function isScheduleDayToday(dayOfWeek: string): boolean {
    const target = WEEKDAY_TO_JS[dayOfWeek];
    return target !== undefined && new Date().getDay() === target;
}

function parseLocalIsoDate(isoDate: string): Date {
    const [year, month, day] = isoDate.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function formatLocalIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function isDateOnScheduleWeekday(isoDate: string, dayOfWeek: string): boolean {
    const target = WEEKDAY_TO_JS[dayOfWeek];
    if (target === undefined) return true;
    return parseLocalIsoDate(isoDate).getDay() === target;
}

export function snapDateToScheduleWeekday(isoDate: string, dayOfWeek: string): string {
    const target = WEEKDAY_TO_JS[dayOfWeek];
    if (target === undefined) return isoDate;

    const date = parseLocalIsoDate(isoDate);
    let diff = date.getDay() - target;
    if (diff < 0) diff += 7;
    date.setDate(date.getDate() - diff);
    return formatLocalIsoDate(date);
}
