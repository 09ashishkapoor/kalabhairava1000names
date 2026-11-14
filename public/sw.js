// The redesign removed the offline shell. This file stays at /sw.js so browsers
// that registered the old service worker fetch the new one, drop the old
// caches, and unregister. No fetch handler is installed, so navigations go
// straight to the network and unknown URLs get the real 404.
const CACHE_PREFIX = "kalabhairava-shell-";

self.addEventListener("install", function () {
	self.skipWaiting();
});

self.addEventListener("activate", function (event) {
	event.waitUntil(
		(async function () {
			const keys = await caches.keys();
			await Promise.all(
				keys
					.filter(function (key) {
						return key.indexOf(CACHE_PREFIX) === 0 || key.indexOf("kalabhairava") === 0;
					})
					.map(function (key) {
						return caches.delete(key);
					}),
			);
			await self.registration.unregister();
		})(),
	);
});
