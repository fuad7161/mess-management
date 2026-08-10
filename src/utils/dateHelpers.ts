export const toDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const currentMonthKey = () => toDateKey().slice(0, 7);

export const monthBounds = (month: string) => ({
  start: `${month}-01`,
  end: `${month}-31`,
});

export const displayDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
};

export const isDateKey = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
