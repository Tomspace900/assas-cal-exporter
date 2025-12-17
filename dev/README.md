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
npm test         # Lance les tests unitaires (15 tests)
```

## 📁 Structure du projet

```
assas-cal-exporter/
├── bookmarklet/           # Code source du bookmarklet
│   ├── src/              # Tous les modules (CommonJS)
│   │   ├── utils.js           # Utilitaires (dates ICS, escape, fold)
│   │   ├── parser.js          # Parse les descriptions CELCAT
│   │   ├── ics-generator.js   # Génère fichiers ICS (RFC 5545)
│   │   ├── browser-adapter.js # APIs navigateur (fetch, download, mobile share)
│   │   ├── dialog.js          # Dialogues interactifs
│   │   ├── student-id-extractor.js  # Extrait ID étudiant
│   │   └── main.js            # Orchestration workflow
│   ├── build.js          # Script de build (concat + minify)
│   ├── template.html     # Template page GitHub Pages
│   └── dist/             # Sortie build (ignoré git)
├── dev/                  # Outils de développement
│   ├── test-parser.js    # Tests unitaires
│   └── mock-data.example.json  # Template données test
├── docs/                 # GitHub Pages (généré depuis template)
│   └── index.html        # Page d'installation
├── CLAUDE.md             # Documentation pour Claude Code
└── README.md             # Documentation utilisateur
```

## 🧪 Scripts de développement

### `test-parser.js` - Tests unitaires
- **Commande** : `npm test`
- **Fonction** : 15 tests sur le parsing CELCAT
- **Tests** : HTML entities, rooms, staff, groups, edge cases
- **Exit code** : 0 si succès, 1 si échec (CI/CD-ready)

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
- Utile comme référence pour comprendre le format des données CELCAT

## ⚠️ Règles importantes

### Sécurité
- ❌ Ne pas committer `bookmarklet/dist/` (fichiers buildés, déjà dans .gitignore)
- ❌ Ne pas committer `dev/output/` (fichiers générés, déjà dans .gitignore)

### Architecture
- Tous les modules (`bookmarklet/src/`) utilisent CommonJS pour compatibilité Node + Browser
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
