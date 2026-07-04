/*
 * Collapsible left sidebar — edge-handle toggle.
 *
 * Pairs with the CSS in src/styles/global.css and the no-flash <head> setter
 * registered in astro.config.mjs. Responsibilities here:
 *   1. Build the edge handle once and append it to <body>.
 *   2. Toggle html[data-sidebar-collapsed] on click (and on the "[" shortcut),
 *      persisting the choice so it survives navigation between lessons.
 *   3. Keep the hidden nav out of the tab order (inert) and ARIA in sync.
 *
 * Manual only: nothing collapses by screen width. Default (no stored value)
 * is expanded, so a first-time visitor always sees the sidebar open. Below
 * 50em the handle is hidden by CSS and inert is not applied, so Starlight's
 * mobile hamburger drawer keeps working normally.
 */
(function () {
	var KEY = 'sidebarCollapsed';
	var root = document.documentElement;
	var mq = window.matchMedia('(min-width: 50em)');
	var btn;

	function isCollapsed() {
		return root.hasAttribute('data-sidebar-collapsed');
	}

	function apply(collapsed, persist) {
		if (collapsed) root.setAttribute('data-sidebar-collapsed', '');
		else root.removeAttribute('data-sidebar-collapsed');

		// Only make the pane inert on desktop, where it is actually hidden.
		// On mobile the same pane is the hamburger drawer and must stay usable.
		var pane = document.getElementById('starlight__sidebar');
		if (pane) pane.inert = collapsed && mq.matches;

		if (btn) {
			btn.setAttribute('aria-expanded', String(!collapsed));
			btn.setAttribute(
				'aria-label',
				collapsed ? 'Show navigation sidebar' : 'Hide navigation sidebar'
			);
		}

		if (persist) {
			try {
				if (collapsed) localStorage.setItem(KEY, '1');
				else localStorage.removeItem(KEY);
			} catch (e) {
				/* private mode / storage disabled — non-fatal */
			}
		}
	}

	// Build the handle once (guard against double-injection).
	btn = document.querySelector('.sidebar-toggle');
	if (!btn) {
		btn = document.createElement('button');
		btn.className = 'sidebar-toggle';
		btn.type = 'button';
		btn.setAttribute('aria-controls', 'starlight__sidebar');
		btn.innerHTML =
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
			'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
			'<polyline points="15 18 9 12 15 6"></polyline></svg>';
		document.body.appendChild(btn);
		btn.addEventListener('click', function () {
			apply(!isCollapsed(), true);
		});
	}

	// Sync ARIA + inert with whatever the no-flash <head> script already set.
	apply(isCollapsed(), false);

	// Re-evaluate inert when crossing the desktop/mobile breakpoint.
	var onChange = function () {
		apply(isCollapsed(), false);
	};
	if (mq.addEventListener) mq.addEventListener('change', onChange);
	else if (mq.addListener) mq.addListener(onChange);

	// "[" toggles the sidebar — desktop only, and never while typing.
	document.addEventListener('keydown', function (e) {
		if (e.key !== '[' || e.metaKey || e.ctrlKey || e.altKey) return;
		var t = e.target;
		if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
		if (!mq.matches) return;
		e.preventDefault();
		apply(!isCollapsed(), true);
	});
})();
