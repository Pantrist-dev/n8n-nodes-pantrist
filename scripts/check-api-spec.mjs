#!/usr/bin/env node
// Verifies that every Pantrist endpoint the node calls still exists in the
// public OpenAPI spec. Run with `pnpm check-api-spec` (or `npm run …`) before
// publishing a release. Override the spec URL with PANTRIST_SPEC_URL.

const SPEC_URL =
	process.env.PANTRIST_SPEC_URL ?? 'https://api.pantrist.app/swagger-ui-json';

// (method, path-template) pairs called by Pantrist.node.ts, PantristTrigger.node.ts
// and PantristApi.credentials.ts. Keep in sync when adding or removing operations.
const ENDPOINTS = [
	['get', '/list'],
	['get', '/list/{listId}/shoppingList'],
	['get', '/list/{listId}/shoppingList/search'],
	['post', '/list/{listId}/shoppingList/add-by-name'],
	['post', '/list/{listId}/shoppingList/add-by-barcode'],
	['post', '/list/{listId}/shoppingList/{itemId}/check'],
	['delete', '/list/{listId}/shoppingList/{itemId}'],
	['get', '/list/{listId}/pantryList'],
	['post', '/list/{listId}/pantryList/add-by-name'],
	['post', '/list/{listId}/pantryList/add-by-barcode'],
	['put', '/list/{listId}/pantryList/{itemId}/change-amount'],
	['delete', '/list/{listId}/pantryList/{itemId}'],
];

const response = await fetch(SPEC_URL);
if (!response.ok) {
	console.error(`Failed to fetch spec from ${SPEC_URL}: HTTP ${response.status}`);
	process.exit(2);
}
const spec = await response.json();

const missing = ENDPOINTS.filter(([method, path]) => !spec.paths?.[path]?.[method]);

if (missing.length > 0) {
	console.error(`Mismatch against ${SPEC_URL} — the following endpoints are missing:`);
	for (const [method, path] of missing) {
		console.error(`  ${method.toUpperCase()} ${path}`);
	}
	process.exit(1);
}

console.log(`OK — all ${ENDPOINTS.length} endpoints exist in ${SPEC_URL}`);
