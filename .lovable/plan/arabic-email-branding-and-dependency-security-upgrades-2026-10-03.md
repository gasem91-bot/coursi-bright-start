# Arabic email branding and dependency security upgrades

## Email branding
- Keep the existing Arabic كورسي wordmark as the single shared email logo source.
- Update the welcome email and the unsubscribe/suppression email source to use that Arabic asset and Arabic brand text only.
- Check rendered previews so neither template contains the Latin `COURS!` wordmark.

## Dependency remediation
- Upgrade the Cloudflare Vite integration to the latest compatible release, which is the direct parent of the affected image, HTTP, WebSocket, and development-server packages.
- Add safe package resolutions only where the framework release still allows a patched transitive version without changing application behavior.
- Keep the pinned TanStack Start/router versions when no newer upstream release exists; do not force incompatible internals.
- Re-run the dependency review and document every remaining advisory with its upstream blocker.

## Verification and release
- Confirm the app builds cleanly.
- Test the portal’s public login and signed-in dashboard/course flow without altering course, quiz, task, certificate, payment, or XP logic.
- Publish once verification passes and confirm the live result.

## Technical details
- Changes are limited to shared email branding sources, package versions/resolutions, and lockfile updates.
- The current TanStack releases are already the newest published versions, so remaining advisories may require an upstream framework release rather than an unsafe forced upgrade.
