/**
 * pi-hide-radius — drop the "Sign in with Radius" row from `/login`.
 *
 * pi ships Radius as a built-in OAuth provider. The top-level `/login` selector hardcodes
 * Radius as its last option (`interactive-mode.ts`: `showLoginAuthTypeSelector` looks up the
 * provider whose id is `radius` and appends `Sign in with Radius`). There is no setting for it:
 * `models.json` and `settings.json` can neither disable a built-in provider nor strip its
 * `auth.oauth` — `provider-composer.ts` always falls back to `base?.auth.oauth`.
 *
 * The extension API does expose native provider registration (`pi.registerProvider(provider)`
 * with a `Provider` argument), and a native provider registered by an extension replaces the
 * built-in one in `ModelRuntime.composeProvider`
 * (`const base = this.nativeExtensionProviders.get(id) ?? this.builtins.get(id)`). So we take
 * the built-in Radius provider and re-register it with its OAuth method removed. The model
 * catalog and the streaming implementation are the built-in objects, untouched; only the OAuth
 * login entry point is gone.
 *
 * What this changes:
 *   - `/login` no longer lists "Sign in with Radius".
 *   - `/logout` and session sharing no longer see a Radius OAuth credential.
 *   - `/login radius` offers only the API-key method, which reads `RADIUS_API_KEY`.
 *     Without that variable set, Radius models stay unconfigured as before.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { builtinProviders } from "@earendil-works/pi-ai/providers/all";
import type { Provider } from "@earendil-works/pi-ai";

/** Provider id of the built-in Radius gateway (pi's `RADIUS_PROVIDER_ID`). */
const RADIUS_PROVIDER_ID = "radius";

export default function (pi: ExtensionAPI): void {
	const builtin = builtinProviders().find((provider) => provider.id === RADIUS_PROVIDER_ID);
	if (!builtin) return;

	const { oauth: _oauth, ...apiKeyOnly } = builtin.auth;
	const withoutOauth: Provider = { ...builtin, auth: apiKeyOnly };

	pi.registerProvider(withoutOauth);
}