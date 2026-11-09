package com.spendly.expenses;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;
import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

    // Text shared to Spendly from another app (for example an AI chat) becomes a spendly://quick link.
    private Intent shareToLink(Intent i) {
        if (i != null && Intent.ACTION_SEND.equals(i.getAction()) && i.getType() != null && i.getType().startsWith("text/")) {
            String text = i.getStringExtra(Intent.EXTRA_TEXT);
            if (text != null && !text.isEmpty()) {
                Intent n = new Intent(Intent.ACTION_VIEW, Uri.parse("spendly://quick?text=" + Uri.encode(text)));
                n.setPackage(getPackageName());
                return n;
            }
        }
        return i;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        setIntent(shareToLink(getIntent()));
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        Intent fixed = shareToLink(intent);
        setIntent(fixed);
        super.onNewIntent(fixed);
    }

    // Needed by the Google sign-in plugin so it can ask for Drive access (scopes).
    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN
                && requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            PluginHandle handle = getBridge().getPlugin("SocialLogin");
            if (handle == null) return;
            Plugin plugin = handle.getInstance();
            if (plugin instanceof SocialLoginPlugin) {
                ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
            }
        }
    }

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}
