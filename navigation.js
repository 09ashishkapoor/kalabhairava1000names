/**
 * Sister-site floating navigation for Kalabhairava Sahasranama.
 */

(() => {
	"use strict";

	const NAVIGATION_BUTTONS = [
		{
			id: "nav-up-button",
			className: "nav-button nav-up hidden",
			label: "Back to top",
			title: "Back to landing page",
			direction: "up",
			onClick: scrollToTop,
		},
		{
			id: "nav-down-button",
			className: "nav-button nav-down",
			label: "Go to names",
			title: "Explore sacred names",
			direction: "down",
			onClick: scrollToNames,
		},
	];

	function init() {
		createNavigationButtons();
		setupScrollDetection();
	}

	function updateNavigationText() {
		NAVIGATION_BUTTONS.forEach(({ id, label, title }) => {
			const button = document.getElementById(id);
			if (button) {
				button.setAttribute("aria-label", label);
				button.setAttribute("title", title);
			}
		});
	}

	window.updateNavigationText = updateNavigationText;

	function createNavigationButtons() {
		NAVIGATION_BUTTONS.forEach((config) => {
			document.body.appendChild(createNavigationButton(config));
		});
	}

	function createSvgElement(name, attrs) {
		const element = document.createElementNS(
			"http://www.w3.org/2000/svg",
			name,
		);
		Object.entries(attrs).forEach(([key, value]) => {
			element.setAttribute(key, value);
		});
		return element;
	}

	function createArrowIcon(direction) {
		const svg = createSvgElement("svg", {
			"aria-hidden": "true",
			xmlns: "http://www.w3.org/2000/svg",
			width: "24",
			height: "24",
			viewBox: "0 0 24 24",
			fill: "none",
			stroke: "currentColor",
			"stroke-width": "2",
			"stroke-linecap": "round",
			"stroke-linejoin": "round",
		});
		const isUp = direction === "up";
		svg.appendChild(
			createSvgElement("line", {
				x1: "12",
				y1: isUp ? "19" : "5",
				x2: "12",
				y2: isUp ? "5" : "19",
			}),
		);
		svg.appendChild(
			createSvgElement("polyline", {
				points: isUp ? "5 12 12 5 19 12" : "19 12 12 19 5 12",
			}),
		);
		return svg;
	}

	function createNavigationButton({
		id,
		className,
		label,
		title,
		direction,
		onClick,
	}) {
		const button = document.createElement("button");
		button.id = id;
		button.className = className;
		button.type = "button";
		button.appendChild(createArrowIcon(direction));
		button.addEventListener("click", onClick);
		button.setAttribute("aria-label", label);
		button.setAttribute("title", title);
		return button;
	}

	function setupScrollDetection() {
		let ticking = false;
		let namesSection = document.getElementById("names-section");
		const upButton = document.getElementById("nav-up-button");
		const downButton = document.getElementById("nav-down-button");

		if (!upButton || !downButton) return;

		let namesSectionTop = null;
		let lastState = null;

		function computeNamesTop() {
			namesSection = document.getElementById("names-section");
			if (!namesSection) return null;
			let el = namesSection;
			let top = 0;
			while (el) {
				top += el.offsetTop;
				el = el.offsetParent;
			}
			namesSectionTop = top;
			return namesSectionTop;
		}

		let resizeTimer = null;
		function onResize() {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(() => {
				computeNamesTop();
				requestUpdate();
			}, 120);
		}

		function updateNavigation() {
			const scrollPosition = window.scrollY;
			const windowHeight = window.innerHeight;

			if (namesSectionTop === null && computeNamesTop() === null) {
				setTimeout(requestUpdate, 500);
				ticking = false;
				return;
			}

			const threshold = namesSectionTop - windowHeight * 0.3;
			const inNamesSection = scrollPosition > threshold;

			if (inNamesSection !== lastState) {
				if (inNamesSection) {
					upButton.classList.remove("hidden");
					downButton.classList.add("hidden");
				} else {
					upButton.classList.add("hidden");
					downButton.classList.remove("hidden");
				}
				lastState = inNamesSection;
			}

			ticking = false;
		}

		function requestUpdate() {
			if (!ticking) {
				window.requestAnimationFrame(updateNavigation);
				ticking = true;
			}
		}

		window.addEventListener("scroll", requestUpdate, { passive: true });
		window.addEventListener("resize", onResize, { passive: true });

		computeNamesTop();
		requestUpdate();
	}

	function getScrollBehavior() {
		return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
			? "auto"
			: "smooth";
	}

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: getScrollBehavior() });
	}

	function scrollToNames() {
		const namesSection = document.getElementById("names-section");
		if (namesSection) {
			namesSection.scrollIntoView({
				behavior: getScrollBehavior(),
				block: "start",
			});
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
