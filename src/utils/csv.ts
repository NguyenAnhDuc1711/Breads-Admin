const escapeCsvField = (value: string) => {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const toCsv = (headers: string[], rows: (string | number)[][]) => {
  const lines = [headers, ...rows].map((row) =>
    row.map((cell) => escapeCsvField(String(cell))).join(","),
  );
  return lines.join("\n");
};

export const downloadCsv = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
