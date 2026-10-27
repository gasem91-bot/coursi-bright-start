package ai.coursi.app;

import android.graphics.Color;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getBridge() == null) return;

        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView())
            .setAppearanceLightStatusBars(false);

        // Android 15/16 enforce edge-to-edge, so the web page would otherwise
        // draw underneath the status bar AND the system navigation bar (back /
        // home buttons or gesture pill). Reserve a solid black strip on every
        // system edge (top, bottom, sides, keyboard) and place the page between
        // them, so system UI never overlaps the app and vice versa.
        if (Build.VERSION.SDK_INT >= 35) {
            View content = findViewById(android.R.id.content);
            content.setBackgroundColor(Color.BLACK); // black strips around the page
            getWindow().getDecorView().setBackgroundColor(Color.BLACK);
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView())
                .setAppearanceLightNavigationBars(false);
            final int left = content.getPaddingLeft();
            final int top = content.getPaddingTop();
            final int right = content.getPaddingRight();
            final int bottom = content.getPaddingBottom();
            ViewCompat.setOnApplyWindowInsetsListener(content, (view, windowInsets) -> {
                Insets safe = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars()
                        | WindowInsetsCompat.Type.displayCutout()
                        | WindowInsetsCompat.Type.ime()
                );
                view.setPadding(left + safe.left, top + safe.top, right + safe.right, bottom + safe.bottom);
                // The WebView now sits inside the strips; do not apply insets twice.
                return windowInsets.inset(safe.left, safe.top, safe.right, safe.bottom);
            });
            ViewCompat.requestApplyInsets(content);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        // Run after Capacitor's built-in SystemBars applies its theme default.
        getWindow().getDecorView().post(this::useLightStatusBarIcons);
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        useLightStatusBarIcons();
    }

    private void useLightStatusBarIcons() {
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView())
            .setAppearanceLightStatusBars(false);
    }
}
