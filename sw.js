if (!self.define) {
  let currentScript;
  const modules = {};

  const loadModule = (moduleName, parentUrl) => {
    const moduleUrl = new URL(`${moduleName}.js`, parentUrl).href;
    if (!modules[moduleUrl]) {
      modules[moduleUrl] = new Promise((resolve) => {
        if ("document" in self) {
          const script = document.createElement("script");
          script.src = moduleUrl;
          script.onload = resolve;
          document.head.appendChild(script);
          return;
        }

        currentScript = moduleUrl;
        importScripts(moduleUrl);
        resolve();
      }).then(() => {
        const module = modules[moduleUrl];
        if (!module) {
          throw new Error(`Module ${moduleUrl} did not register its module`);
        }

        return module;
      });
    }

    return modules[moduleUrl];
  };

  self.define = (dependencies, factory) => {
    const scriptUrl =
      currentScript ||
      ("document" in self ? document.currentScript?.src : "") ||
      location.href;

    if (modules[scriptUrl]) {
      return;
    }

    const exports = {};
    const require = (dependency) => loadModule(dependency, scriptUrl);
    const args = dependencies.map((dependency) => {
      if (dependency === "exports") {
        return exports;
      }

      if (dependency === "module") {
        return { uri: scriptUrl };
      }

      return require(dependency);
    });

    modules[scriptUrl] = Promise.all(args).then((resolvedArgs) => {
      factory(...resolvedArgs);
      return exports;
    });
  };
}

define(["./workbox-239d0d27"], function (workbox) {
  "use strict";

  self.skipWaiting();
  workbox.clientsClaim();
  workbox.cleanupOutdatedCaches();

  // Always fetch HTML from the network so content updates are visible immediately.
  workbox.registerRoute(
    new workbox.NavigationRoute(function ({ request }) {
      return fetch(request);
    })
  );

  workbox.registerRoute(
    /^https:\/\/fonts\.googleapis\.com\/.*/i,
    new workbox.CacheFirst({
      cacheName: "google-fonts-cache",
      plugins: [
        new workbox.ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 31536000,
        }),
      ],
    }),
    "GET"
  );

  workbox.registerRoute(
    /^https:\/\/fonts\.gstatic\.com\/.*/i,
    new workbox.CacheFirst({
      cacheName: "google-fonts-cache",
      plugins: [
        new workbox.ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 31536000,
        }),
      ],
    }),
    "GET"
  );

  workbox.registerRoute(
    /\/sahasranama_meanings\.json$/,
    new workbox.NetworkFirst({
      cacheName: "sahasranama-data",
      plugins: [
        new workbox.ExpirationPlugin({
          maxEntries: 1,
          maxAgeSeconds: 604800,
        }),
      ],
    }),
    "GET"
  );
});
