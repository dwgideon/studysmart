type CsvRow = Record<string, string>;

export function parseCsv(input: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        field += '"'; index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field); field = "";
    } else if (character === '\n') {
      row.push(field); rows.push(row); row = []; field = "";
    } else if (character !== '\r') {
      field += character;
    }
  }
  if (field || row.length) {row.push(field); rows.push(row);}
  const [header, ...data] = rows.filter((item) => item.some((value) => value.trim()));
  if (!header) {return [];}
  return data.map((values) => Object.fromEntries(
    header.map((key, index) => [key.trim(), values[index]?.trim() ?? ""])
  ));
}

export function serializeCsv(columns: string[], rows: CsvRow[]) {
  const escape = (value: string) => {
    const text = value ?? "";
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [
    columns.map(escape).join(","),
    ...rows.map((row) => columns.map((column) => escape(row[column] ?? "")).join(",")),
  ].join("\r\n") + "\r\n";
}
