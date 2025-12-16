# 📅 Assas Calendar Exporter

Un bookmarklet pour exporter ton emploi du temps CELCAT en fichier `.ics` (compatible Google Calendar, Apple Calendar, Outlook).

## 🚀 Installation (2 min)

1. **Build le bookmarklet** :

   ```bash
   npm install
   npm run build
   ```

2. **Crée un favori** dans ton navigateur :

   - Ouvre `bookmarklet/dist/bookmarklet.txt`
   - Copie tout le contenu
   - Crée un nouveau favori avec ce code comme URL
   - Nomme-le `📅 Export Calendar`

3. **Utilise-le** :
   - Va sur [CELCAT](https://celcat-web.u-paris2.fr/calendar/) et connecte-toi
   - Clique sur ton bookmarklet
   - Suis les instructions
   - Télécharge ton `.ics` et importe-le dans ton calendrier !

## ✨ Fonctionnalités

- Exporte tout le calendrier en un clic
- Personnalise le message de bienvenue avec ton prénom
- Transforme les types de cours en abréviations (CM, TD, TP)
- Génère un fichier `.ics` compatible avec tous les calendriers
- Inclut tous les cours de l'année

## 🛠️ Développement

Voir [dev/README.md](dev/README.md) pour la documentation développeur.

## 📝 License

MIT - [Thomas GENDRON](https://github.com/thomasgendron)
