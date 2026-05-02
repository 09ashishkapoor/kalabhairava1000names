if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		// Avoid registering the production service worker on local/dev servers
		// which may reference build assets that don't exist here.
		const host = location.hostname;
		if (host === "localhost" || host === "127.0.0.1") {
			return;
		}
		navigator.serviceWorker.register("./sw.js", { scope: "./" });
	});
}
