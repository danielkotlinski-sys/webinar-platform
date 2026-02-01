export function parseCSV(csvContent: string): string[] {
  // Remove BOM if present
  const content = csvContent.replace(/^\uFEFF/, '');

  // Normalize line endings
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into lines and filter empty ones
  const lines = normalizedContent.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    return [];
  }

  // Try to parse as CSV with headers
  const firstLine = lines[0];
  const delimiter = firstLine.includes(',') ? ',' : firstLine.includes(';') ? ';' : '\t';

  // Parse header row to find email column
  const headers = parseLine(firstLine, delimiter).map(h => h.toLowerCase().trim());

  // Find the email column index
  let emailColumnIndex = headers.findIndex(h =>
    h === 'email' || h === 'e-mail' || h === 'email address' || h === 'emailaddress'
  );

  // If no explicit email header, look for column containing @ signs
  if (emailColumnIndex === -1) {
    // Check the second row (first data row) for @ signs
    if (lines.length > 1) {
      const firstDataRow = parseLine(lines[1], delimiter);
      emailColumnIndex = firstDataRow.findIndex(cell => cell.includes('@'));
    }

    // If still not found, check if the first row itself contains emails (no header)
    if (emailColumnIndex === -1) {
      const firstRowCells = parseLine(firstLine, delimiter);
      emailColumnIndex = firstRowCells.findIndex(cell => cell.includes('@'));

      // If first row has emails, process all rows including the first one
      if (emailColumnIndex !== -1) {
        return extractEmails(lines, delimiter, emailColumnIndex, false);
      }
    }
  }

  if (emailColumnIndex === -1) {
    // Fallback: try to extract any email-like strings from the entire content
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = content.match(emailRegex);
    return matches ? [...new Set(matches.map(e => e.toLowerCase().trim()))] : [];
  }

  return extractEmails(lines, delimiter, emailColumnIndex, true);
}

function parseLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function extractEmails(
  lines: string[],
  delimiter: string,
  columnIndex: number,
  skipHeader: boolean
): string[] {
  const emails: Set<string> = new Set();
  const startIndex = skipHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const cells = parseLine(lines[i], delimiter);
    if (cells[columnIndex]) {
      const email = cells[columnIndex].toLowerCase().trim();
      // Validate email format
      if (isValidEmail(email)) {
        emails.add(email);
      }
    }
  }

  return [...emails];
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}
