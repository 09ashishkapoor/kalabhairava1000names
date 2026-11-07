const CACHE_PREFIX = "adya-shell-";
const CACHE_VERSION = "v3";
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const CORE_ASSETS = [
	"/",
	"/names/",
	"/MaaAdyaKali_5.webp",
	"/maadya-bg-1111-landscape.webp",
	"/maadya-bg-1111-portrait.webp",
	"/styles.min.css",
	"/navigation.js",
	"/translations.js",
	"/search.js",
	"/data_manifest.json",
	"/data_chunk_1.json",
];

function getCacheKey(input, includeSearch = false) {
	const url = new URL(
		typeof input === "string" ? input : input.url,
		self.location.origin,
	);
	return includeSearch ? url.pathname + url.search : url.pathname;
}

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(CORE_ASSETS))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
						.map((key) => caches.delete(key)),
				),
			)
			.then(() => self.clients.claim()),
	);
});

async function readFromCache(request, includeSearch = false) {
	const cache = await caches.open(CACHE_NAME);
	return cache.match(getCacheKey(request, includeSearch));
}

async function writeToCache(request, response, includeSearch = false) {
	if (!response || !response.ok) return response;
	const cache = await caches.open(CACHE_NAME);
	await cache.put(getCacheKey(request, includeSearch), response.clone());
	return response;
}

async function handleNavigation(request) {
	try {
		const response = await fetch(request);
		return writeToCache(request, response);
	} catch (error) {
		return (
			(await readFromCache(request)) ||
			(await readFromCache("/")) ||
			Response.error()
		);
	}
}

async function handleStaticRequest(request) {
	const cached = await readFromCache(request, true);
	if (cached) return cached;

	try {
		const response = await fetch(request);
		return writeToCache(request, response, true);
	} catch (error) {
		return cached || Response.error();
	}
}

self.addEventListener("fetch", (event) => {
	const { request } = event;
	if (request.method !== "GET") return;

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	// Never cache the version endpoint: returning visitors must see the current
	// deployed version, not the one cached when the service worker installed.
	if (url.pathname === "/version.json") return;

	if (request.mode === "navigate") {
		event.respondWith(handleNavigation(request));
		return;
	}

	if (
		url.pathname.endsWith(".json") ||
		url.pathname.endsWith(".js") ||
		url.pathname.endsWith(".css") ||
		url.pathname.endsWith(".webp") ||
		url.pathname.endsWith(".png") ||
		url.pathname.endsWith(".svg")
	) {
		event.respondWith(handleStaticRequest(request));
	}
});
