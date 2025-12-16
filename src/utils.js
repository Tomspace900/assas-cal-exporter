/**
 * Utility functions for ICS generation
 */

/**
 * Converts ISO 8601 datetime to ICS format
 * @param {string} isoDate - Date in format "2025-12-17T09:00:00"
 * @returns {string} Date in ICS format "20251217T090000"
 */
function formatIcsDate(isoDate) {
  if (!isoDate) return '';

  // Remove all separators: - : and T
  return isoDate.replace(/[-:]/g, '').replace('T', 'T');
}

/**
 * Escapes special characters for ICS format
 * According to RFC 5545, we need to escape: \ ; , and newlines
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeIcsText(text) {
  if (!text) return '';

  return text
    .replace(/\\/g, '\\\\')     // Backslash must be first
    .replace(/;/g, '\\;')       // Semicolon
    .replace(/,/g, '\\,')       // Comma
    .replace(/\n/g, '\\n');     // Newline becomes literal \n
}

/**
 * Folds long lines to max 75 characters (ICS requirement)
 * Continuation lines start with a space
 * @param {string} line - Line to fold
 * @returns {string} Folded line with CRLF continuation
 */
function foldLine(line) {
  if (line.length <= 75) {
    return line;
  }

  const result = [];
  let remaining = line;

  // First line can be 75 chars
  result.push(remaining.substring(0, 75));
  remaining = remaining.substring(75);

  // Subsequent lines: 74 chars (because of leading space)
  while (remaining.length > 0) {
    result.push(' ' + remaining.substring(0, 74));
    remaining = remaining.substring(74);
  }

  return result.join('\r\n');
}

/**
 * Generates current timestamp in ICS format (UTC)
 * @returns {string} Current timestamp in format "20251214T120000Z"
 */
function generateDtstamp() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Decodes HTML entities to their corresponding characters
 * @param {string} text - Text containing HTML entities
 * @returns {string} Decoded text
 */
function decodeHtmlEntities(text) {
  if (!text) return '';

  // Common HTML entities in the CELCAT data
  const entities = {
    '&#233;': 'é',  // é
    '&#232;': 'è',  // è
    '&#234;': 'ê',  // ê
    '&#224;': 'à',  // à
    '&#226;': 'â',  // â
    '&#231;': 'ç',  // ç
    '&#244;': 'ô',  // ô
    '&#249;': 'ù',  // ù
    '&#251;': 'û',  // û
    '&#239;': 'ï',  // ï
    '&amp;': '&',   // &
    '&lt;': '<',    // <
    '&gt;': '>',    // >
    '&quot;': '"',  // "
    '&#39;': "'",   // '
  };

  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char);
  }

  return result;
}

/**
 * Abbreviates event category for concise display
 * @param {string} category - Full category name
 * @returns {string} Abbreviated category
 */
function abbreviateCategory(category) {
  if (!category) return '';

  const abbreviations = {
    'Cours magistral': 'CM',
    'Travaux dirigés': 'TD',
    'Travaux pratiques': 'TP',
    'Conférence': 'Conf',
    'Séminaire': 'Sém',
    'Examen': 'Exam',
  };

  return abbreviations[category] || category;
}

module.exports = {
  formatIcsDate,
  escapeIcsText,
  foldLine,
  generateDtstamp,
  decodeHtmlEntities,
  abbreviateCategory
};
