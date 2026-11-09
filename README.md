# Spendly 3

Offline expense tracker (Capacitor Android app, also runs as a PWA).

## Features
- Overview (plan card: how much to spend per day / save), Activity, Insights, Money tabs
- Add / edit / delete with undo; quick-add by typing or voice-dictating ("lunch 250 yesterday")
- Wallets with their own currency, transfers, exchange rates
- Repeating transactions, bill reminders, budget alerts (80% / 100%)
- Savings goals, loans & debts, receipt photos, PDF monthly report
- English and Bengali (বাংলা)
- App lock (PIN + optional fingerprint)
- Optional Google sign-in: syncs with a private Drive folder (see SETUP-GOOGLE.md)
- Backup file (JSON), CSV export/import

## Working with AI assistants
- **Ask an AI** (Overview → plan card): builds a short summary (no notes, no wallet names) and shares it to Gemini or any assistant.
- **Share to Spendly**: share text such as "spent 250 on lunch" from any app; Spendly opens a pre-filled form.
- **Links**: `spendly://add?amount=250&category=Food&note=Lunch` (add `&auto=1` to save without the form; only works if enabled in Settings → Assistants), `spendly://quick?text=...`, `spendly://summary`, `spendly://open?tab=wal`.
- **Long-press the app icon**: Add expense, Add income, Ask AI.
- Direct voice control by Gemini needs Android "AppFunctions" (Android 16+, Gemini access limited). Not included yet.

## Layout
```
www/index.html        page shell
www/css/app.css       styles + animations
www/js/config.js      Google Web client ID goes here
www/js/store.js       data, migration, merge, repeating, CSV
www/js/i18n.js, bn.js translation engine + Bengali strings
www/js/sync.js        Google sign-in + Drive
www/js/app.js         sheets, toasts, charts, screens
www/js/assist.js      quick-add parser, coach, AI summary, links
www/js/extras.js      receipts, PDF, app lock, reminders, goals, loans
www/js/forms.js       add/edit, wallets, settings, backup, boot
android-patch/        MainActivity, shortcuts, strings (copied in by the workflow)
scripts/patch_android.py  adds deep links, share target, permissions to the manifest
android-signing/      fixed debug key (keep the repo private)
```
Build: push to GitHub → Actions → download the `Spendly-APK` artifact.
