// Make Mermaid diagrams click-to-zoom: click a rendered diagram to open a
// full-screen overlay you can wheel-zoom and drag-pan; Esc or backdrop closes.
// astro-mermaid renders SVGs client-side, so we observe the DOM and attach.
(function () {
	function diagrams() {
		return document.querySelectorAll(
			'.sl-markdown-content .mermaid svg, .sl-markdown-content pre.mermaid svg, .sl-markdown-content [data-mermaid] svg'
		);
	}

	function enhance() {
		diagrams().forEach(function (svg) {
			var host = svg.closest('.mermaid, pre.mermaid, [data-mermaid]') || svg.parentElement;
			if (!host || host.dataset.zoomReady) return;
			host.dataset.zoomReady = '1';
			host.setAttribute('role', 'button');
			host.setAttribute('tabindex', '0');
			host.setAttribute('aria-label', 'Zoom diagram');
			host.addEventListener('click', function () {
				openZoom(svg);
			});
			host.addEventListener('keydown', function (e) {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					openZoom(svg);
				}
			});
		});
	}

	function openZoom(svg) {
		if (document.querySelector('.mermaid-zoom-overlay')) return;
		var overlay = document.createElement('div');
		overlay.className = 'mermaid-zoom-overlay';

		var content = document.createElement('div');
		content.className = 'mermaid-zoom-content';
		var clone = svg.cloneNode(true);
		clone.removeAttribute('style');
		clone.removeAttribute('width');
		clone.removeAttribute('height');
		content.appendChild(clone);
		overlay.appendChild(content);

		var hint = document.createElement('div');
		hint.className = 'mermaid-zoom-hint';
		hint.textContent = 'scroll to zoom · drag to pan · Esc to close';
		overlay.appendChild(hint);

		document.body.appendChild(overlay);
		document.body.style.overflow = 'hidden';

		var scale = 1, tx = 0, ty = 0, dragging = false, sx = 0, sy = 0;
		function apply() {
			content.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
		}
		overlay.addEventListener(
			'wheel',
			function (e) {
				e.preventDefault();
				var f = e.deltaY < 0 ? 1.15 : 1 / 1.15;
				scale = Math.min(6, Math.max(0.8, scale * f));
				apply();
			},
			{ passive: false }
		);
		content.addEventListener('pointerdown', function (e) {
			dragging = true;
			sx = e.clientX - tx;
			sy = e.clientY - ty;
			content.setPointerCapture(e.pointerId);
		});
		content.addEventListener('pointermove', function (e) {
			if (!dragging) return;
			tx = e.clientX - sx;
			ty = e.clientY - sy;
			apply();
		});
		content.addEventListener('pointerup', function () {
			dragging = false;
		});
		function close() {
			overlay.remove();
			document.body.style.overflow = '';
			document.removeEventListener('keydown', onKey);
		}
		overlay.addEventListener('click', function (e) {
			if (e.target === overlay || e.target === hint) close();
		});
		function onKey(e) {
			if (e.key === 'Escape') close();
		}
		document.addEventListener('keydown', onKey);
	}

	var obs = new MutationObserver(function () {
		enhance();
	});
	function start() {
		enhance();
		obs.observe(document.body, { childList: true, subtree: true });
	}
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', start);
	} else {
		start();
	}
	// Starlight view transitions: re-attach after navigation.
	document.addEventListener('astro:page-load', enhance);
})();
