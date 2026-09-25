export const formatDateForDisplay = (dateValue) => {
    if (!dateValue) return '';

    let d;

    if (typeof dateValue === 'string' && /^\d{1,2}\.\d{1,2}\.\d{4}/.test(dateValue)) {
        const [day, month, year] = dateValue.split('.').map(Number);
        d = new Date(year, month - 1, day);
    } else {
        d = new Date(dateValue);
    }

    if (isNaN(d.getTime())) return String(dateValue);

    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};