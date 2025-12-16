/**
 * Student ID Extractor
 * Extracts the student ID (federationId) from the CELCAT page (DOM or URL)
 */

/**
 * Extracts student ID from the page DOM or URL
 * Tries multiple strategies in order of reliability
 * @returns {string|null} Student ID or null if not found
 */
function extractStudentId() {
  // Strategy 1: Extract from navbar HTML (most reliable)
  // The navbar shows: <span class="small">- 2401012</span>
  try {
    const logoutLink = document.querySelector('.logInOrOut');
    if (logoutLink) {
      const smallSpan = logoutLink.querySelector('.small');
      if (smallSpan && smallSpan.textContent) {
        // Text is in format "- 2401012", extract the number
        const match = smallSpan.textContent.trim().match(/\d+/);
        if (match) {
          console.log('[Assas Exporter] Found student ID in navbar:', match[0]);
          return match[0];
        }
      }
    }
  } catch (e) {
    console.log('[Assas Exporter] Could not extract from navbar:', e);
  }

  // Strategy 2: Look for any element with student ID pattern
  try {
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const text = el.textContent || '';
      // Look for pattern like "- 2401012" or similar student ID formats
      const match = text.match(/[-\s](\d{7})/); // Assuming 7-digit ID
      if (match) {
        console.log('[Assas Exporter] Found student ID in DOM:', match[1]);
        return match[1];
      }
    }
  } catch (e) {
    console.log('[Assas Exporter] Could not scan DOM:', e);
  }

  // Strategy 3: Extract from URL query parameters
  const url = window.location.href;

  // Query parameter federationIds[] (URL-encoded or not)
  // Example: ?federationIds[]=2401012 or ?federationIds%5B%5D=2401012
  const queryMatch = url.match(/federationIds(?:%5B%5D|\[\])=([^&]+)/);
  if (queryMatch) {
    console.log('[Assas Exporter] Found student ID in query params:', queryMatch[1]);
    return queryMatch[1];
  }

  // Hash fragment with federationIds parameter
  // Example: #/calendar?federationIds[]=2401012
  const hashMatch = url.match(/#.*federationIds(?:%5B%5D|\[\])=([^&]+)/);
  if (hashMatch) {
    console.log('[Assas Exporter] Found student ID in hash fragment:', hashMatch[1]);
    return hashMatch[1];
  }

  // Look for id parameter in query or hash
  const idQueryMatch = url.match(/[?&]id=([^&]+)/);
  if (idQueryMatch) {
    console.log('[Assas Exporter] Found student ID in id param:', idQueryMatch[1]);
    return idQueryMatch[1];
  }

  // Path segment (e.g., /student/2401012/)
  const pathMatch = url.match(/\/student\/(\d+)/);
  if (pathMatch) {
    console.log('[Assas Exporter] Found student ID in path:', pathMatch[1]);
    return pathMatch[1];
  }

  console.log('[Assas Exporter] Could not extract student ID automatically');
  return null;
}

// For Node.js compatibility (not used in browser)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractStudentId };
}
