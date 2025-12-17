/**
 * Assas Calendar Exporter - Bookmarklet
 * Main orchestration workflow with dialog UI
 */

(async function () {
  "use strict";

  // Guard: prevent multiple instances
  const INSTANCE_ID = "assas-exporter-running";
  if (document.getElementById(INSTANCE_ID)) {
    console.log("[Assas] Already running, skipping...");
    showStatus("⚠️ Déjà en cours !", "info");
    return;
  }

  // Create invisible marker element
  const marker = document.createElement("div");
  marker.id = INSTANCE_ID;
  marker.style.display = "none";
  document.body.appendChild(marker);

  try {
    console.log("[Assas] Starting...");

    // === STEP 1: Extract Student ID ===
    showStatus("🔍 Recherche de ton ID...", "info");
    let studentId = extractStudentId();

    if (!studentId) {
      studentId = prompt(
        "🎓 ID ÉTUDIANT\n\n" +
          "Ton ID n'a pas pu être détecté.\n" +
          "Trouve-le en haut à droite de CELCAT (7 chiffres).\n\n" +
          "Entre ton ID :",
        ""
      );

      if (!studentId || !studentId.trim()) {
        showStatus("Oups, annulé ! 👋", "error");
        return;
      }
      studentId = studentId.trim();
    }

    console.log("[Assas] Student ID:", studentId);

    // === STEP 2: Get Student Name (optional) ===
    let studentName = null;
    try {
      studentName = await fetchStudentName(studentId);
      if (studentName) {
        showStatus(`Yo ${studentName} ! 🤙`, "success");
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (e) {
      // Ignore
    }

    // === STEP 3: Date Selection Dialog ===
    let dateRange;
    try {
      dateRange = await showDateDialog();
    } catch (e) {
      showStatus("Bon, une autre fois alors ! 👋", "error");
      return;
    }

    const { startDate, endDate } = dateRange;
    console.log("[Assas] Dates:", startDate, "->", endDate);

    // === STEP 4: Fetch Calendar Data ===
    showStatus("⚡ Récup du planning...", "info");
    let events;
    try {
      events = await fetchCalendarData(studentId, startDate, endDate);
    } catch (error) {
      console.error("[Assas] API Error:", error);
      showStatus(`Aïe ! ${error.message} 💥`, "error");
      return;
    }

    if (!events || events.length === 0) {
      showStatus("Zéro cours trouvé ! �", "error");
      return;
    }

    console.log("[Assas] Fetched:", events.length, "events");

    // === STEP 5: Parse Events ===
    showStatus("🔬 Analyse en cours...", "info");
    const parsedEvents = events.map((event) => ({
      ...event,
      parsed: parseDescription(event.description),
    }));

    // === STEP 6: Extract Filter Options ===
    const filterOptions = extractFilterOptions(parsedEvents);
    console.log("[Assas] Found groups:", filterOptions.groups);
    console.log("[Assas] Found options:", filterOptions.options.length);

    // === STEP 7: Show Filter Dialog ===
    let selectedFilters;
    try {
      selectedFilters = await showFilterDialog(filterOptions, parsedEvents.length, parsedEvents);
    } catch (e) {
      showStatus("Pas de souci, à plus ! ✌️", "error");
      return;
    }

    // === STEP 8: Apply Filters ===
    const filteredEvents = filterEvents(parsedEvents, selectedFilters);
    console.log("[Assas] After filter:", filteredEvents.length, "events");

    if (filteredEvents.length === 0) {
      showStatus("Rien à exporter ! Coche des trucs �", "error");
      return;
    }

    // === STEP 9: Generate ICS ===
    showStatus("🛠️ Fabrication du fichier...", "info");
    let icsContent;
    try {
      icsContent = generateIcs(filteredEvents);
    } catch (error) {
      console.error("[Assas] ICS Error:", error);
      showStatus(`Oups ! ${error.message} 😅`, "error");
      return;
    }

    // === STEP 10: Download ===
    const filename = `assas-calendar-${startDate}-${endDate}.ics`;
    await downloadIcsFile(icsContent, filename);

    // === Success! ===
    const msg = studentName
      ? `Hop ! ${filteredEvents.length} cours exportés pour ${studentName} 💥`
      : `Bam ! ${filteredEvents.length} cours exportés 💥`;
    showStatus(msg, "success");

    console.log("[Assas] Done!", filename);
  } catch (error) {
    console.error("[Assas] Error:", error);
    showStatus(`Erreur: ${error.message}`, "error");
  } finally {
    // Remove the marker to allow re-running
    const marker = document.getElementById("assas-exporter-running");
    if (marker) marker.remove();
  }
})();
