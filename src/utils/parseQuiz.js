export function parseQuizText(text) {
  const parts = text.split(/\n(?=Question:|Answer:|A\)|B\)|C\)|D\))/g);
  let htmlBlocks = [];
  let current = "";

  for (let line of parts) {
    if (/^Question:/.test(line)) {
      if (current) htmlBlocks.push(current);
      current = `<strong>${line.trim()}</strong>`;
    } else {
      current += `<br>${line.trim()}`;
    }
  }
  if (current) htmlBlocks.push(current);
  return htmlBlocks;
}

