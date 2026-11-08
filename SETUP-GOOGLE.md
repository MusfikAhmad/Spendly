# Turn on Google sign-in + Drive backup (optional)

The app works fully without this. Do these steps once to enable "Sign in with Google" under **Backup & account**.

## 0. Before you install the new APK
Builds are now signed with a fixed key (`android-signing/debug.keystore`), so Google sign-in keeps working across builds.
Your old APK was signed with a different random key, so Android will not install the new one over it.
**In the old app: Settings → Export CSV (and keep the file). Then uninstall it, install the new APK, and use Backup & account → Import a file.**

> Keep your GitHub repo **private**. If it must be public, make your own key and replace the file:
> `keytool -genkeypair -keystore android-signing/debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 36500 -dname "CN=Android Debug,O=Android,C=US"`

## 1. Google Cloud Console
1. Create a project at https://console.cloud.google.com
2. **APIs & Services → Library →** enable **Google Drive API**.
3. **Google Auth Platform → Branding:** app name + your email.
4. **Audience:** External. While it says *Testing*, add your own Gmail under **Test users** (only those accounts can sign in). You can click *Publish app* later; the `drive.appdata` scope needs no Google review.
5. **Data Access → Add scopes:** `https://www.googleapis.com/auth/drive.appdata`
6. **Clients → Create client → Web application** (no origins needed). Copy its **Client ID**.
7. **Clients → Create client → Android:**
   - Package name: `com.spendly.expenses`
   - SHA-1: `83:38:9E:9A:46:E6:F7:36:D1:1E:C5:97:39:FD:C7:E2:6B:8F:04:C3`
     (the build log prints it too, in the "Show the signing SHA-1" step)

## 2. App
Open `www/js/config.js`, paste the **Web** client ID into `googleWebClientId`, commit, let GitHub Actions build, install the APK.
Wait a few minutes after creating the clients; Google can be slow to apply them.

## Troubleshooting
- **28444 / "Google setup does not match"**: the Android client's package name or SHA-1 is wrong, or `config.js` has the Android client ID instead of the **Web** one.
- **"No Google account found"**: add a Google account in Android Settings.
- **"access_denied"**: your Gmail is not in *Test users*.
- **Drive 403**: Drive API not enabled, or the `drive.appdata` scope was not added.
