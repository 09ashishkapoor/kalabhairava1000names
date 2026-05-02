/**
 * Minimal i18n wrapper for the English-only site.
 */

(() => {
	"use strict";

	const currentLanguage = "en";

	function init() {
		document.documentElement.setAttribute("lang", currentLanguage);
		translatePage();
	}

	function getCurrentLanguage() {
		return currentLanguage;
	}

	function setLanguage() {
		// English-only site: keep API surface stable but ignore switches.
	}

	function t(key) {
		if (!window.translations || !window.translations[currentLanguage]) {
			return key;
		}

		const keys = key.split(".");
		let value = window.translations[currentLanguage];

		for (const k of keys) {
			if (value && typeof value === "object" && k in value) {
				value = value[k];
			} else {
				return key;
			}
		}

		return value;
	}

	function appendSanitizedTranslation(target, translation) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(translation, "text/html");
		const allowedTags = new Set(["STRONG", "EM", "BR", "SPAN"]);
		const allowedAttrs = {
			SPAN: new Set(["class", "title"]),
		};

		target.textContent = "";

		function sanitizeNode(node) {
			if (node.nodeType === Node.TEXT_NODE) {
				return document.createTextNode(node.textContent || "");
			}

			if (node.nodeType !== Node.ELEMENT_NODE) {
				return document.createDocumentFragment();
			}

			if (!allowedTags.has(node.tagName)) {
				const fragment = document.createDocumentFragment();
				node.childNodes.forEach((child) => {
					fragment.appendChild(sanitizeNode(child));
				});
				return fragment;
			}

			const safeElement = document.createElement(node.tagName.toLowerCase());
			const attrs = allowedAttrs[node.tagName];
			if (attrs) {
				attrs.forEach((attr) => {
					if (node.hasAttribute(attr)) {
						safeElement.setAttribute(attr, node.getAttribute(attr) || "");
					}
				});
			}

			node.childNodes.forEach((child) => {
				safeElement.appendChild(sanitizeNode(child));
			});

			return safeElement;
		}

		doc.body.childNodes.forEach((child) => {
			target.appendChild(sanitizeNode(child));
		});
	}

	function translatePage() {
		const elements = document.querySelectorAll("[data-i18n]");

		elements.forEach((element) => {
			const key = element.getAttribute("data-i18n");
			const translation = t(key);

			if (translation && translation !== key) {
				const attrName = element.getAttribute("data-i18n-attr");

				if (attrName) {
					element.setAttribute(attrName, translation);
				} else if (/[<>]/.test(translation)) {
					appendSanitizedTranslation(element, translation);
				} else {
					element.textContent = translation;
				}
			}
		});
	}

	function formatMessage(template, params) {
		let result = template;
		for (const [key, value] of Object.entries(params)) {
			result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
		}
		return result;
	}

	function getStatsMessage(searchQuery, filteredCount, totalCount) {
		if (searchQuery) {
			return formatMessage(t("names.statsSearch"), {
				count: filteredCount,
				plural: filteredCount === 1 ? "" : "s",
				query: searchQuery,
				total: totalCount,
			});
		}

		return formatMessage(t("names.statsDisplay"), {
			total: totalCount,
		});
	}

	function getRevealButtonText(isExpanded) {
		return isExpanded ? t("names.hideButton") : t("names.revealButton");
	}

	window.i18n = {
		init,
		getCurrentLanguage,
		setLanguage,
		t,
		translatePage,
		formatMessage,
		getStatsMessage,
		getRevealButtonText,
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
