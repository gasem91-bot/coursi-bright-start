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

        // Android 15/16 enforce edge-to-edge: StatusBar.overlay/color alone
        // cannot reserve this space. Paint and inset only the native top edge.
        if (Build.VERSION.SDK_INT >= 35) {
            View content = findViewById(android.R.id.content);
            int background = Color.parseColor(getBridge().getConfig().getBackgroundColor());
            content.setBackgroundColor(background);
            getWindow().getDecorView().setBackgroundColor(background);
            final int left = content.getPaddingLeft();
            final int top = content.getPaddingTop();
            final int right = content.getPaddingRight();
            final int bottom = content.getPaddingBottom();
            ViewCompat.setOnApplyWindowInsetsListener(content, (view, windowInsets) -> {
                Insets safeTop = windowInsets.getInsets(
                    WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.displayCutout()
                );
                view.setPadding(left, top + safeTop.top, right, bottom);
                // The WebView is now below the bar; do not apply this top inset twice.
                return windowInsets.inset(0, safeTop.top, 0, 0);
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
