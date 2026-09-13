# Weekly Basket

A one-page grocery list you install on your iPhone from Safari (Share, then Add to Home Screen).

- Regulars stay on the list every week; one-off items clear when you start a new week.
- Tap an item once it is in the trolley and it drops into "In the basket" at the bottom.
- Works on its own with the list saved on the phone. Paste a Firebase config into
  `config.js` to sync the same list between phones, then use "Share list" to link a second phone.

Files: `index.html` (the app), `config.js` (Firebase config, optional), `database.rules.json`
(security rules to paste into the Firebase console), `make-icon.js` (regenerates the icons).
