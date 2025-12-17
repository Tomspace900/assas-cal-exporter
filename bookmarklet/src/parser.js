/**
 * Parser module for extracting structured data from CELCAT description fields
 */

const { decodeHtmlEntities } = require("./utils");

/**
 * Cleans a group string to extract just the essential identifier
 * @param {string} groupString - Raw group string (e.g., "1 - Pierre MAZEAUD")
 * @returns {string} Cleaned group identifier (e.g., "1")
 */
function cleanGroupString(groupString) {
  if (!groupString) return groupString;

  // If it starts with a digit, extract just the digit(s)
  // "1 - Pierre MAZEAUD" → "1"
  // "2 - Cours mutualisé" → "2"
  const digitMatch = groupString.match(/^(\d+)/);
  if (digitMatch) {
    return digitMatch[1];
  }

  // If it's "OPTION" (with or without additional text), return "OPTION"
  if (groupString.toUpperCase().includes("OPTION")) {
    return "OPTION";
  }

  // For special cases like "COACHING", "ANUULE", etc., return as-is
  return groupString.trim();
}

/**
 * Parses the description field and extracts structured information
 *
 * Expected format (lines separated by \r\n<br />\r\n):
 * Line 1: Event category (e.g., "Cours magistral")
 * Line 2: Module name (e.g., "Santé au travail")
 * Line 3-N: Room (starts with "Salle"), Staff name, or Group
 *
 * @param {string} rawDescription - The raw description from API
 * @returns {Object} { category, module, staff, group, room }
 */
function parseDescription(rawDescription) {
  if (!rawDescription) {
    return {
      category: null,
      module: null,
      staff: null,
      group: null,
      room: null,
    };
  }

  // Step 1: Normalize line breaks
  // Replace \r\n and <br /> with simple \n
  let normalized = rawDescription
    .replace(/<br\s*\/?>/gi, "\n") // <br /> or <br> to newline
    .replace(/\r\n/g, "\n") // \r\n to \n
    .replace(/\r/g, "\n"); // Any remaining \r to \n

  // Step 2: Decode HTML entities (é, &amp;, etc.)
  normalized = decodeHtmlEntities(normalized);

  // Step 3: Split into lines and filter out empty ones
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Step 4: Initialize result object
  const result = {
    category: null,
    module: null,
    staff: null,
    group: null,
    room: null,
  };

  // Step 5: Parse each line
  if (lines.length === 0) return result;

  // Line 1: Event category
  result.category = lines[0];

  // Line 2: Module name (but could also be staff name if no module!)
  if (lines.length > 1) {
    const line2 = lines[1];

    // Pattern 1: LASTNAME, Firstname (single or multiple staff separated by comma)
    // e.g., "BLONDET, Pierre" or "BLONDET, Pierre, VOYNNET-FOURBOUL, Catherine"
    const STAFF_LASTNAME_FIRST = /^([A-ZÀ-Ö][A-ZÀ-Ö\s-]+),\s*([A-ZÀ-Öa-zà-ö][a-zà-ö\s-]+)/;

    // Pattern 2: Simple "Firstname Lastname" (2-3 words, starts with capital)
    // e.g., "Pierre Gaudibert", "Jean-Pierre Martin"
    const STAFF_SIMPLE_NAME = /^[A-ZÀ-Ö][a-zà-ö-]+\s+[A-ZÀ-Ö][a-zà-ö-]+$/;

    // Check if line 2 looks like a staff name
    const isStaffPattern1 = STAFF_LASTNAME_FIRST.test(line2);
    const isStaffPattern2 = STAFF_SIMPLE_NAME.test(line2) && line2.split(/\s+/).length <= 3;

    if (isStaffPattern1 || isStaffPattern2) {
      // Line 2 is actually a staff name, not a module
      result.staff = line2;
      result.module = null;
    } else {
      // Clean module: remove duplicate parts (e.g., "Name, Name" -> "Name")
      let cleanModule = line2;
      if (line2.includes(",")) {
        const parts = line2.split(",").map((p) => p.trim());
        // Check if parts are duplicates
        const unique = [...new Set(parts)];
        if (unique.length < parts.length) {
          cleanModule = unique.join(", ");
        }
      }
      result.module = cleanModule;
    }
  }

  // Lines 3+: Could be room, staff, or group
  // We need to identify them by pattern
  const ROOM_PATTERN = /^Salle\s+(.+)$/i;
  const GROUP_PATTERN = /^Groupe\s+(.+)$/i;
  const STAFF_PATTERN = /^([A-ZÀ-Ö][A-ZÀ-Ö\s-]+),\s*([A-ZÀ-Öa-zà-ö][a-zà-ö\s-]+)$/;

  // Pattern for inverted format: "Name - Groupe X"
  const INVERTED_GROUP_PATTERN = /(.+?)\s*-\s*Groupe\s+(\d+)/i;

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];

    // Check if it's a room
    const roomMatch = line.match(ROOM_PATTERN);
    if (roomMatch) {
      result.room = roomMatch[1].trim();
      continue;
    }

    // Check if it's inverted format: "Name - Groupe X"
    const invertedMatch = line.match(INVERTED_GROUP_PATTERN);
    if (invertedMatch) {
      // Extract staff name and group number
      if (!result.staff) {
        result.staff = invertedMatch[1].trim();
      }
      if (!result.group) {
        result.group = invertedMatch[2].trim(); // Just the number
      }
      continue;
    }

    // Check if it's a group (standard format)
    const groupMatch = line.match(GROUP_PATTERN);
    if (groupMatch) {
      // Extract just the group number or keyword
      const groupContent = groupMatch[1].trim();

      // Clean the group to extract just the essential part
      // "1 - Pierre MAZEAUD" → "1"
      // "2 - Cours mutualisé" → "2"
      // "OPTION" → "OPTION"
      const cleanedGroup = cleanGroupString(groupContent);
      result.group = cleanedGroup;
      continue;
    }

    // Check if it's a staff name (LASTNAME, Firstname)
    const staffMatch = line.match(STAFF_PATTERN);
    if (staffMatch) {
      result.staff = line.trim();
      continue;
    }

    // If none of the patterns match, it could be:
    // - A staff name without comma (like "Pierre Gaugibert")
    // - A group without "Groupe" prefix (like "OPTION")
    // - Something else entirely

    // Heuristic: If it contains only letters and spaces, assume it's staff
    // If it looks like a short label, assume it's a group
    if (/^[A-ZÀ-Öa-zà-ö\s-]+$/.test(line)) {
      // If it's all caps or very short, it might be a group label
      if (line === line.toUpperCase() || line.length < 15) {
        if (!result.group) {
          result.group = line.trim();
        }
      } else {
        // Otherwise assume it's a staff name
        if (!result.staff) {
          result.staff = line.trim();
        }
      }
    }
  }

  return result;
}

/**
 * Builds a clean, human-readable description for ICS
 * @param {Object} parsed - Output from parseDescription
 * @param {Object} event - Original event object
 * @returns {string} Formatted description
 */
function buildIcsDescription(parsed, event) {
  const parts = [];

  if (parsed.module) {
    parts.push(`Module: ${parsed.module}`);
  }

  if (parsed.staff) {
    parts.push(`Intervenant: ${parsed.staff}`);
  }

  if (parsed.group) {
    parts.push(`Groupe: ${parsed.group}`);
  }

  if (parsed.room) {
    parts.push(`Salle: ${parsed.room}`);
  }

  if (event.department) {
    parts.push(`Département: ${event.department}`);
  }

  if (event.modules && event.modules.length > 0) {
    parts.push(`Code: ${event.modules.join(", ")}`);
  }

  return parts.join("\n");
}

module.exports = {
  parseDescription,
  buildIcsDescription,
};
