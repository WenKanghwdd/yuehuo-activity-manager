export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function getMonday(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

export function getWeekInfo(weekStart: string): {
  year: number;
  weekNum: number;
  startDate: string;
  endDate: string;
  startMonth: number;
  endMonth: number;
  crossMonth: boolean;
  crossYear: boolean;
} {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  // Calculate week number: count weeks from Jan 1 of the year
  const yearStart = new Date(start.getFullYear(), 0, 1);
  // Find the first Monday of the year
  const firstMonday = getMonday(yearStart);
  const daysSince = Math.floor((start.getTime() - new Date(firstMonday).getTime()) / (1000 * 60 * 60 * 24));
  const weekNum = Math.floor(daysSince / 7) + 1;

  const startMonth = start.getMonth() + 1;
  const endMonth = end.getMonth() + 1;

  return {
    year: start.getFullYear(),
    weekNum: weekNum < 1 ? 1 : weekNum,
    startDate: `${start.getMonth() + 1}/${start.getDate()}`,
    endDate: `${end.getMonth() + 1}/${end.getDate()}`,
    startMonth,
    endMonth,
    crossMonth: startMonth !== endMonth || start.getFullYear() !== end.getFullYear(),
    crossYear: start.getFullYear() !== end.getFullYear(),
  };
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function getWeekDates(weekStart: string): string[] {
  const dates: string[] = [];
  const start = new Date(weekStart);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export function hasOutdoorKeyword(text: string): boolean {
  const keywords = ['外出', '户外', '出游', '郊游', '出行', '公园', '散步'];
  return keywords.some(kw => text.includes(kw));
}

export function isOlderThanOneYear(dateStr: string): boolean {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return new Date(dateStr) < oneYearAgo;
}

export function exportToExcel(data: Record<string, unknown>[], filename: string): void {
  // Dynamic import xlsx to avoid issues
  import('xlsx').then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  });
}

export function readExcelFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        import('xlsx').then((XLSX) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet);
          resolve(jsonData);
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
