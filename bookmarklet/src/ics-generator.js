/**
 * ICS (iCalendar) file generator
 * Generates RFC 5545 compliant .ics files
 */

const { formatIcsDate, escapeIcsText, foldLine, generateDtstamp, abbreviateCategory } = require('./utils');
const { buildIcsDescription } = require('./parser');

/**
 * Generates a complete .ics file from event array
 * @param {Array} events - Array of event objects with parsed data
 * @returns {string} Complete ICS file content
 */
function generateIcs(events) {
  const lines = [];

  // VCALENDAR header
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//Assas//Calendar Exporter//EN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push('X-WR-CALNAME:Assas Calendar');
  lines.push('X-WR-TIMEZONE:Europe/Paris');

  // Add each event
  for (const event of events) {
    const vevent = createVEvent(event);
    lines.push(vevent);
  }

  // VCALENDAR footer
  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Creates a single VEVENT block
 * @param {Object} event - Event object with parsed data
 * @returns {string} VEVENT block
 */
function createVEvent(event) {
  const lines = [];

  // Event start
  lines.push('BEGIN:VEVENT');

  // UID - Use the API's event ID to prevent duplicates
  const uid = escapeIcsText(event.id);
  lines.push(foldLine(`UID:${uid}`));

  // DTSTAMP - Current timestamp
  lines.push(`DTSTAMP:${generateDtstamp()}`);

  // DTSTART - Event start time
  const dtstart = formatIcsDate(event.start);
  lines.push(`DTSTART:${dtstart}`);

  // DTEND - Event end time
  const dtend = formatIcsDate(event.end);
  lines.push(`DTEND:${dtend}`);

  // SUMMARY - Event title (abbreviated category + module name)
  const abbrevCategory = abbreviateCategory(event.eventCategory) || 'Cours';
  let summary = abbrevCategory;
  if (event.parsed && event.parsed.module) {
    summary = `${abbrevCategory} - ${event.parsed.module}`;
  }
  const escapedSummary = escapeIcsText(summary);
  lines.push(foldLine(`SUMMARY:${escapedSummary}`));

  // DESCRIPTION - Detailed information
  const description = buildIcsDescription(event.parsed || {}, event);
  const escapedDescription = escapeIcsText(description);
  lines.push(foldLine(`DESCRIPTION:${escapedDescription}`));

  // LOCATION - Room if available
  let location = '';
  if (event.parsed && event.parsed.room) {
    location = event.parsed.room;
  } else if (event.sites && event.sites.length > 0) {
    location = event.sites.join(', ');
  }
  if (location) {
    const escapedLocation = escapeIcsText(location);
    lines.push(foldLine(`LOCATION:${escapedLocation}`));
  }

  // CATEGORIES - Event category
  if (event.eventCategory) {
    const escapedCategory = escapeIcsText(event.eventCategory);
    lines.push(foldLine(`CATEGORIES:${escapedCategory}`));
  }

  // STATUS - Confirmed
  lines.push('STATUS:CONFIRMED');

  // TRANSP - Show as busy
  lines.push('TRANSP:OPAQUE');

  // Event end
  lines.push('END:VEVENT');

  return lines.join('\r\n');
}

module.exports = {
  generateIcs,
  createVEvent
};
