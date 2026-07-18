# StudySmart mobile

Native iOS and Android client for the StudySmart K–12 platform. It shares the website's Supabase accounts and server APIs; service-role keys and other server secrets must never be included here.

## Local setup

1. Copy `.env.example` to `.env.local` and use the same public Supabase URL/key as the website.
2. Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WEB_URL` to the HTTPS StudySmart deployment. A physical phone cannot use the computer's `localhost` address.
3. Run `npm install`, then `npm start`.
4. Use an Expo development build—not Expo Go—to test push notifications and verified links.

The initial store release is consumption-only: plans are managed by an adult, school, or district outside the app. There is no Stripe checkout or real-money virtual currency in the native client.

Universal links require a real production domain, Apple Team ID, and Android signing-certificate fingerprint. Configure the domain variables and publish the association files only after those account values are available.

The website serves both association files automatically after these server variables are set:

- `APPLE_APP_TEAM_ID`
- `ANDROID_APP_SHA256_CERT_FINGERPRINT`
- optional `MOBILE_APP_BUNDLE_ID` and `MOBILE_ANDROID_PACKAGE` overrides

## Release verification

Run `npm run lint`, `npm run typecheck`, and `npm run test:bundle`. Expo Doctor must report all checks passing before an EAS preview or production build. Test push notifications on a physical-device development build; Expo Go does not provide the final native notification and verified-link behavior.
