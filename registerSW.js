if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		// Avoid registering the production service worker on local/dev servers
		// which may reference build assets that don't exist here.
		const host = location.hostname;
		if (host === 'localhost' || host === '127.0.0.1') {
			console.log('Service worker registration skipped on local host');
			return;
		}
		navigator.serviceWorker.register('/sw.js', { scope: '/' });
	});
}