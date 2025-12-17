/**
 * Browser Adapter
 * Browser-specific functionality: fetch, download, prompts, UI
 */

/**
 * Prompts user for date range with helpful examples
 * @returns {Object} { startDate, endDate } in YYYY-MM-DD format, or null if cancelled
 */
function promptDateRange() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 0-indexed

  // Determine academic year: Sept-Aug
  // If we're before September, academic year is previous year
  const academicYear = currentMonth >= 9 ? currentYear : currentYear - 1;
  const academicYearStart = `${academicYear}-09-01`;
  const academicYearEnd = `${academicYear + 1}-08-31`;

  // Format helper text with French date examples
  const startDate = new Date(academicYearStart);
  const endDate = new Date(academicYearEnd);

  const startExample = `${startDate.getDate()} ${getMonthName(
    startDate.getMonth()
  )} ${startDate.getFullYear()}`;
  const endExample = `${endDate.getDate()} ${getMonthName(
    endDate.getMonth()
  )} ${endDate.getFullYear()}`;

  const start = prompt(
    `📅 DATE DE DÉBUT\n\n` +
      `Format : ANNÉE-MOIS-JOUR (YYYY-MM-DD)\n\n` +
      `Exemple : (${startExample}) → ${academicYearStart}\n` +
      `Exemple : (8 juin 2025) → 2025-06-08\n\n` +
      `Entre la date de début :`,
    academicYearStart
  );

  if (!start) return null; // User cancelled

  const end = prompt(
    `📅 DATE DE FIN\n\n` +
      `Format : ANNÉE-MOIS-JOUR (YYYY-MM-DD)\n\n` +
      `Exemple : (${endExample}) → ${academicYearEnd}\n` +
      `Exemple : (31 août 2026) → 2026-08-31\n\n` +
      `Entre la date de fin :`,
    academicYearEnd
  );

  if (!end) return null; // User cancelled

  // Basic validation
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    alert(
      "❌ Format de date invalide !\n\n" +
        "Utilise le format : ANNÉE-MOIS-JOUR\n" +
        "Exemple : 2025-09-01 pour le 1er septembre 2025"
    );
    return null;
  }

  return { startDate: start, endDate: end };
}

/**
 * Helper to get French month name
 * @param {number} monthIndex - 0-indexed month
 * @returns {string} Month name in French
 */
function getMonthName(monthIndex) {
  const months = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];
  return months[monthIndex];
}

/**
 * Fetches student display name from CELCAT API
 * @param {string} studentId - Student federation ID
 * @returns {Promise<string|null>} Student first name or null
 */
async function fetchStudentName(studentId) {
  const url = "https://celcat-web.u-paris2.fr/calendar/Home/LoadDisplayNames";

  const formData = new URLSearchParams({
    "federationIds[]": studentId,
    resType: "104", // Hardcodé pour M2 GRH
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      credentials: "include",
    });

    if (!response.ok) {
      console.log("[Assas Exporter] Could not fetch student name");
      return null;
    }

    const data = await response.json();
    // Response: [{"federationId": "2401012", "displayName": "PERIN,ELEONORE"}]
    if (data && data.length > 0 && data[0].displayName) {
      const displayName = data[0].displayName; // "PERIN,ELEONORE"
      const parts = displayName.split(",");
      if (parts.length >= 2) {
        // Get first name and capitalize properly
        const firstName = parts[1].trim();
        return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      }
    }
  } catch (e) {
    console.log("[Assas Exporter] Error fetching student name:", e);
  }

  return null;
}

/**
 * Fetches calendar data from CELCAT API
 * @param {string} studentId - Student federation ID
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of events
 */
async function fetchCalendarData(studentId, startDate, endDate) {
  const url = "https://celcat-web.u-paris2.fr/calendar/Home/GetCalendarData";

  // Build form data
  const formData = new URLSearchParams({
    start: startDate,
    end: endDate,
    resType: "104", // TODO: hardcodé pour M2 GRH - si ne fonctionne pas, chercher dans l'URL CELCAT
    calView: "agendaDay",
    "federationIds[]": studentId,
  });

  console.log("[Assas Exporter] Fetching calendar data...", {
    studentId,
    startDate,
    endDate,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
    credentials: "include", // Include cookies for authentication
  });

  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
  }

  const events = await response.json();
  console.log("[Assas Exporter] Fetched events:", events.length);

  return events;
}

/**
 * Detects if the user is on a mobile device
 * @returns {boolean} True if mobile device detected
 */
function isMobileDevice() {
  return (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
  );
}

/**
 * Triggers download of .ics file in browser (or shares on mobile)
 * On mobile devices with navigator.share() support, attempts to share the file
 * Falls back to standard download on desktop or if sharing fails
 * @param {string} icsContent - Complete ICS file content
 * @param {string} filename - Desired filename
 */
async function downloadIcsFile(icsContent, filename = "assas-calendar.ics") {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });

  // Try mobile share API if on mobile device
  if (isMobileDevice() && navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], filename, { type: "text/calendar;charset=utf-8" });

      // Check if the browser can share files
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Calendrier Assas",
          text: "Importer dans ton calendrier",
        });
        console.log("[Assas Exporter] File shared successfully");
        showStatus("📅 Fichier partagé ! Choisis ton app calendrier", "success");
        return;
      }
    } catch (error) {
      // User cancelled or share failed
      if (error.name === "AbortError") {
        console.log("[Assas Exporter] User cancelled share, falling back to download");
        showStatus("📥 Téléchargement du fichier...", "info");
        // Fall through to download
      } else {
        // Other error: fallback to standard download
        console.log("[Assas Exporter] Share failed, falling back to download:", error);
      }
    }
  }

  // Fallback: standard download (desktop, mobile without support, or cancelled share)
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Cleanup
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);

  console.log("[Assas Exporter] File download triggered:", filename);
}

// Toast management for stacking
const toastState = {
  toasts: [],
  maxToasts: 5,
  toastHeight: 60, // Approximate height including margin
  baseTop: 20,
};

/**
 * Shows status message to user with stacking support
 * @param {string} message - Message to display
 * @param {string} type - 'info', 'success', 'error'
 */
function showStatus(message, type = "info") {
  const colors = {
    info: "#2196f3",
    success: "#4caf50",
    error: "#f44336",
  };

  // Remove oldest toast if at max
  if (toastState.toasts.length >= toastState.maxToasts) {
    const oldest = toastState.toasts.shift();
    if (oldest && oldest.parentNode) oldest.remove();
  }

  // Calculate position based on existing toasts
  const topPosition = toastState.baseTop + toastState.toasts.length * toastState.toastHeight;

  const div = document.createElement("div");
  div.textContent = message;
  div.style.cssText = `
    position: fixed;
    top: ${topPosition}px;
    right: 20px;
    padding: 15px 20px;
    background: ${colors[type] || colors.info};
    color: white;
    border-radius: 8px;
    z-index: 9999999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 300px;
    transition: top 0.2s ease, opacity 0.2s ease;
  `;

  document.body.appendChild(div);
  toastState.toasts.push(div);

  // Auto-remove after delay
  setTimeout(() => {
    const index = toastState.toasts.indexOf(div);
    if (index > -1) {
      toastState.toasts.splice(index, 1);
      // Reposition remaining toasts
      toastState.toasts.forEach((t, i) => {
        t.style.top = `${toastState.baseTop + i * toastState.toastHeight}px`;
      });
    }
    if (div.parentNode) {
      div.style.opacity = "0";
      setTimeout(() => div.remove(), 200);
    }
  }, 3000);
}

// For Node.js compatibility (not used in browser)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    isMobileDevice,
    promptDateRange,
    fetchStudentName,
    fetchCalendarData,
    downloadIcsFile,
    showStatus,
  };
}
