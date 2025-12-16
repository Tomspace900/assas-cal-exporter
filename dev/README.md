# Documentation Développeur

Guide pour développer et maintenir Assas Calendar Exporter.

## 🚀 Installation

```bash
npm install              # Installe les dépendances
cp dev/mock-data.example.json dev/mock-data.json  # Configure les données de test
```

## 📋 Commandes de développement

```bash
npm run build    # Build le bookmarklet (minifie + génère bookmarklet.txt)
npm run dev      # Test le POC avec données mock (génère ICS)
npm test         # Lance les tests unitaires (15 tests)
npm run analyze  # Analyse les données réelles et vérifie le parsing
```

## 📁 Structure du projet

```
assas-cal-exporter/
├── src/                    # Modules core (CommonJS)
│   ├── utils.js           # Utilitaires (dates ICS, escape, fold)
│   ├── parser.js          # Parse les descriptions CELCAT
│   └── ics-generator.js   # Génère fichiers ICS (RFC 5545)
├── bookmarklet/
│   ├── src/               # Code spécifique navigateur
│   │   ├── main.js        # Orchestration workflow
│   │   ├── browser-adapter.js  # APIs navigateur
│   │   └── student-id-extractor.js  # Extrait ID étudiant
│   ├── build.js           # Script de build (concat + minify)
│   └── dist/              # Sortie build (ignoré git)
└── dev/                   # Outils de développement
    ├── test-parser.js     # Tests unitaires
    ├── poc.js             # POC complet
    ├── analyze.js         # Analyse complète des données
    └── mock-data.example.json  # Template données test
```

## 🧪 Scripts de développement

### `test-parser.js` - Tests unitaires
- **Commande** : `npm test`
- **Fonction** : 15 tests sur le parsing CELCAT
- **Tests** : HTML entities, rooms, staff, groups, edge cases
- **Exit code** : 0 si succès, 1 si échec (CI/CD-ready)

### `poc.js` - Proof of Concept
- **Commande** : `npm run dev`
- **Fonction** : Parse et génère un fichier ICS complet
- **Output** : `dev/output/assas-calendar.ics`
- **Requis** : `dev/mock-data.json`

### `analyze.js` - Analyse complète
- **Commande** : `npm run analyze`
- **Fonction** : Analyse complète des données CELCAT
  - Échantillons de parsing
  - Stats globales (groupes, salles, staff)
  - Types d'événements et groupes
  - Détection de problèmes (staff manquant, groupes mal parsés, descriptions complexes)
- **Requis** : `dev/mock-data.json`

## 🔧 Build Process

Le script `bookmarklet/build.js` :
1. Lit tous les fichiers source
2. Supprime la syntaxe CommonJS (`require`, `module.exports`)
3. Concatène dans l'ordre des dépendances
4. Minifie avec Terser (garde console.log, mangle toplevel)
5. Wrappe en format bookmarklet `javascript:(function(){...})();`
6. Génère :
   - `bookmarklet.debug.js` (non minifié, debug)
   - `bookmarklet.min.js` (minifié)
   - `bookmarklet.txt` (code final à copier)

## 📊 Données de test

### `mock-data.example.json` ✅
- Committé dans le repo
- 3 événements anonymisés
- Template pour structure CELCAT

### `mock-data.json` ❌
- **NON committé** (`.gitignore`)
- Données universitaires réelles
- Requis par les scripts dev
- **À créer** : `cp dev/mock-data.example.json dev/mock-data.json`

## ⚠️ Règles importantes

### Sécurité
- ❌ **Ne JAMAIS committer `dev/mock-data.json`** (données réelles)
- ❌ Ne pas committer `bookmarklet/dist/` (fichiers buildés)
- ❌ Ne pas committer `dev/output/` (fichiers générés)

### Architecture
- Les modules core (`src/`) utilisent CommonJS pour compatibilité Node + Browser
- Export conditionnel : `if (typeof module !== 'undefined' && module.exports)`
- Le build supprime CommonJS pour le navigateur

### CELCAT API
- **resType** : Hardcodé à `104` (M2 GRH)
- Si ça ne marche pas pour d'autres formations : chercher dans l'URL CELCAT
- Headers obligatoires : `Content-Type: application/x-www-form-urlencoded`, cookies

## 🐛 Debug

- Utilise `bookmarklet/dist/bookmarklet.debug.js` (non minifié)
- Les `console.log` sont préservés même après minification
- Ouvre la console navigateur pour voir les logs

## 📝 Modifier le code

1. Modifie les sources (`src/`, `bookmarklet/src/`)
2. Lance `npm test` pour valider
3. Lance `npm run build` pour rebuilder
4. Teste dans le navigateur avec `bookmarklet.txt`
