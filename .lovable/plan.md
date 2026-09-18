# Shared AI badge medallions

## Build
- Extract the certificate seal artwork into one reusable `BadgeMedallion` component with beginner, intermediate, advanced, and locked states
- Keep the certificate renderer visually unchanged while making its on-screen seal use the shared component
- Add the current-level seal over the AI course card corner on the dashboard
- Add seals beside the profile name and XP area for levels represented by the user’s existing progress/current enrollment
- Replace the three AI level tiles on achievements with full-color completed seals and grayscale locked seals with a padlock overlay

## Data and behavior
- Reuse existing profile level, course progress chapter IDs, and earned level certificates; add no new storage or business logic
- Preserve all existing content, controls, spacing structure, course logic, exams, certificates, and navigation

## Verification
- Check dashboard, profile, and achievements at desktop and mobile widths
- Confirm locked/completed visuals and run the existing build checks
