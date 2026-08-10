import {isDateKey} from './dateHelpers';

export const required = (value: string, label: string) =>
  value.trim() ? null : `${label} is required`;

export const validAmount = (value: string) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? null : 'Enter an amount greater than zero';
};

export const validDate = (value: string) =>
  isDateKey(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime())
    ? null
    : 'Use a valid date in YYYY-MM-DD format';

export const normalizePhone = (value: string) => {
  const phone = value.replace(/[\s()-]/g, '');
  return phone.startsWith('+') ? phone : `+${phone}`;
};
