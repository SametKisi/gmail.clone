export const parseTurkishDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('.')) return new Date(0);
    const [day, month, year] = dateStr.split('.').map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return new Date(0);
    return new Date(year, month - 1, day);
};
