/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.json`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		// if document request
		if (request.headers.get("Accept")?.includes("text/html")) {
			const { body, status, statusText, headers } = await env.ASSETS.fetch(
				request
			);
			return new Response(body, {
				status,
				statusText,
				headers: {
					...headers,
					"Cache-Control": "public, max-age=123",
				},
			});
		}
		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
