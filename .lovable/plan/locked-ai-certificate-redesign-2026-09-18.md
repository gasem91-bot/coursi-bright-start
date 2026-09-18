# Locked AI Certificate Redesign

## Scope
Replace the current dark certificate artwork with the approved light, formal design for all three AI levels while preserving unlock logic and existing PDF/PNG download actions.

## Implementation
1. Update the certificate constants without changing their structure:
   - Keep `LEVEL_LABEL`, `LEVEL_ACCENT`, and `LEVEL_STATEMENT`.
   - Use the exact supplied teal, purple, and gold accents and exact Arabic achievement statements.
   - Preserve the existing `COURSI-AI-[B/I/A]-XXXXXXX` certificate ID format.
2. Rebuild the on-page certificate preview to match the reference:
   - Off-white paper, thin geometric level-colored frame, clipped corner details.
   - Tall condensed `COURS!` wordmark using Six Caps.
   - Arabic recipient name, fixed level line, and exact one-line achievement statement.
   - Level-specific medallion with 1, 3, or 5–6 connected glowing nodes.
   - Separate Date Issued and signature-line areas; signature caption only `Founder and CEO`.
   - Small circular `AUTHENTICATED` stamp with `COURS!` centered inside.
3. Rebuild the canvas renderer used by exports so PNG and A4 landscape PDF visually match the preview and reference, including borders, seals, typography, dynamic name/date/ID, and level colors.
4. Load Six Caps through the document head and use Cairo/Noto Sans Arabic for Arabic text. Keep the surrounding achievements card controls and certificate unlock behavior intact.
5. Verify the app build and render earned certificate states at desktop and mobile sizes; verify both export actions still produce the expected landscape certificate.

## Boundaries
- No changes to exams, pricing, course content, certificate unlocking, account persistence, or email logic.
- Only full name, issue date, and certificate ID remain user-specific in the certificate artwork.
