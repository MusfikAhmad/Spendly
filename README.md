# Spendly 2

Offline expense tracker (Capacitor Android app, also runs as a PWA).

## What's inside
- Overview, Activity, Insights (all months & years), Wallets tabs; add/edit/delete with undo
- Multiple wallets with their own currency, transfers, exchange rates
- Repeating transactions (daily / weekly / monthly / yearly)
- Categories with budgets; deleting one asks where to move its transactions
- Backup file (JSON), CSV export/import (old Spendly CSVs still import)
- Optional Google sign-in: syncs with a private Drive folder (see SETUP-GOOGLE.md)
- Data kept in localStorage plus a second copy in the app's private files; one-step Undo after imports/resets

## Layout
```
www/index.html        page shell
www/css/app.css       styles + animations
www/js/config.js      Google Web client ID goes here
www/js/store.js       data, migration, merge, repeating, CSV
www/js/sync.js        Google sign-in + Drive
www/js/app.js         sheets, toasts, charts, screens
www/js/forms.js       add/edit, wallets, settings, backup, boot
android-patch/        MainActivity hook for Google sign-in (copied in by the workflow)
android-signing/      fixed debug key (keep the repo private)
```
Build: push to GitHub → Actions → download the `Spendly-APK` artifact.
