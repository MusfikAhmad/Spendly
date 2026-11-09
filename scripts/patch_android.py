"""Run after `npx cap add android`: adds deep links, share-text target, app shortcuts and permissions."""
import re, sys
P = 'android/app/src/main/AndroidManifest.xml'
s = open(P, encoding='utf-8').read()
if 'android:scheme="spendly"' in s:
    print('manifest already patched'); sys.exit(0)
filters = '''
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="spendly" />
            </intent-filter>

            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="text/plain" />
            </intent-filter>

            <meta-data android:name="android.app.shortcuts" android:resource="@xml/shortcuts" />

        '''
n = s.count('</activity>')
if n != 1:
    sys.exit('expected exactly one <activity> in the manifest, found %d' % n)
s = s.replace('</activity>', filters + '</activity>', 1)
perms = '''
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
'''
s = s.replace('</manifest>', perms + '</manifest>')
open(P, 'w', encoding='utf-8').write(s)
import xml.dom.minidom as m
m.parse(P)  # fails the build if the result is not valid XML
print('manifest patched')
