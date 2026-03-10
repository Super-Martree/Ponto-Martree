function escapeCsvValue(value) {
  if (value === null || value === undefined) return '';
  const normalized = String(value).replace(/\r?\n/g, ' ').trim();
  return `"${normalized.replace(/"/g, '""')}"`;
}

export function exportarCsv({ fileName, headers, rows }) {
  const csvLines = [
    headers.map(escapeCsvValue).join(';'),
    ...rows.map((row) => row.map(escapeCsvValue).join(';'))
  ];

  const blob = new Blob([`\uFEFF${csvLines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportarCsvComSecoes({ fileName, sections }) {
  const csvLines = [];

  sections.forEach((section, index) => {
    if (section.title) {
      csvLines.push(escapeCsvValue(section.title));
    }

    csvLines.push(section.headers.map(escapeCsvValue).join(';'));
    csvLines.push(...section.rows.map((row) => row.map(escapeCsvValue).join(';')));

    if (index < sections.length - 1) {
      csvLines.push('');
    }
  });

  const blob = new Blob([`\uFEFF${csvLines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
