/**
 * Assas Calendar Exporter - Bookmarklet
 * Main orchestration workflow
 */

(async function() {
  'use strict';

  try {
    console.log('[Assas Exporter] Starting calendar export...');

    // === STEP 1: Extract Student ID ===
    showStatus('Recherche de ton ID...', 'info');
    let studentId = extractStudentId();

    if (!studentId) {
      studentId = prompt(
        `🎓 ID ÉTUDIANT\n\n` +
        `Ton ID n'a pas pu être détecté automatiquement.\n\n` +
        `Où le trouver ?\n` +
        `• En haut à droite de la page CELCAT\n` +
        `• À côté de "Log Out" (exemple: - 2401012)\n` +
        `• C'est un nombre à 7 chiffres\n\n` +
        `Entre ton ID étudiant :`,
        ''
      );

      if (!studentId || !studentId.trim()) {
        showStatus('Export annulé', 'error');
        return;
      }

      studentId = studentId.trim();
    }

    console.log('[Assas Exporter] Using student ID:', studentId);

    // === STEP 1.5: Fetch Student Name ===
    let studentFirstName = null;
    try {
      studentFirstName = await fetchStudentName(studentId);
      if (studentFirstName) {
        console.log('[Assas Exporter] Hello', studentFirstName + '!');
        showStatus(`Salut ${studentFirstName} ! 👋`, 'success');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Show greeting for 1.5s
      }
    } catch (e) {
      console.log('[Assas Exporter] Could not fetch name:', e);
    }

    // === STEP 2: Get Date Range ===
    const greeting = studentFirstName || '';
    showStatus(greeting ? `OK ${greeting}, choisis tes dates...` : 'Choisis tes dates...', 'info');
    const dateRange = promptDateRange();

    if (!dateRange) {
      showStatus('Export annulé', 'error');
      return;
    }

    const { startDate, endDate } = dateRange;
    console.log('[Assas Exporter] Date range:', startDate, 'to', endDate);

    // === STEP 3: Fetch Calendar Data ===
    showStatus(greeting ? `Récup de ton planning ${greeting}...` : 'Récupération du planning...', 'info');
    let events;
    try {
      events = await fetchCalendarData(studentId, startDate, endDate);
    } catch (error) {
      console.error('[Assas Exporter] API Error:', error);
      showStatus(`Erreur API: ${error.message}`, 'error');
      return;
    }

    if (!events || events.length === 0) {
      showStatus('Aucun événement trouvé pour cette période 🤔', 'error');
      return;
    }

    console.log(`[Assas Exporter] Fetched ${events.length} events`);

    // === STEP 4: Parse Events ===
    showStatus(`Analyse de ${events.length} événements...`, 'info');
    const parsedEvents = events.map(event => ({
      ...event,
      parsed: parseDescription(event.description)
    }));

    console.log(`[Assas Exporter] Processing ${parsedEvents.length} events`);

    // === STEP 5: Generate ICS ===
    showStatus('Génération du fichier...', 'info');
    let icsContent;
    try {
      icsContent = generateIcs(parsedEvents);
    } catch (error) {
      console.error('[Assas Exporter] ICS Generation Error:', error);
      showStatus(`Erreur: ${error.message}`, 'error');
      return;
    }

    // === STEP 6: Download File ===
    const filename = `assas-calendar-${startDate}-${endDate}.ics`;

    downloadIcsFile(icsContent, filename);

    // === STEP 7: Success! ===
    const eventCount = parsedEvents.length;
    const successMsg = greeting
      ? `C'est bon ${greeting} ! ${eventCount} cours exportés 🎉`
      : `✓ ${eventCount} cours exportés 🎉`;
    showStatus(successMsg, 'success');

    console.log('[Assas Exporter] Export completed successfully!');
    console.log(`[Assas Exporter] File: ${filename}`);
    console.log(`[Assas Exporter] Events: ${eventCount}`);

  } catch (error) {
    console.error('[Assas Exporter] Unexpected error:', error);
    showStatus(`Erreur: ${error.message}`, 'error');
  }
})();
