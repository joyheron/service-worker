/* eslint-env serviceworker */
import { parse } from "parse5";

let VERSION = "0.0.11";
let CACHE_NAME = "resources";

self.addEventListener("install", ev => {
	log("installing");
});

self.addEventListener("activate", ev => {
	log("activating");
});

self.addEventListener("fetch", ev => {
	log("retrieving", ev.request.url);
	ev.respondWith(staleWhileRevalidate(ev));
});

async function cacheFirst(ev) {
	let { request } = ev;

	let cache = await caches.open(CACHE_NAME);
	let cachedResponse = await cache.match(request);
	if(cachedResponse) {
		log("✓ cache retrieval", request.url);
		return cachedResponse;
	}

	let networkResponse = fetch(request);
	ev.waitUntil(networkResponse.
		then(res => {
			log("✓ online retrieval", request.url);
			return add2cacheAndPrefetchUrls(request, res.clone());
		}));
}

async function staleWhileRevalidate(ev) {
	let { request } = ev;
	let networkResponse = fetch(request);
	ev.waitUntil(networkResponse.
		then(res => {
			log("✓ online retrieval", request.url);
			return add2cacheAndPrefetchUrls(request, res.clone());
		}));

	let cache = await caches.open(CACHE_NAME);
	let cachedResponse = await cache.match(request);
	if(cachedResponse) {
		log("✓ cache retrieval", request.url);
		return cachedResponse;
	}

	return networkResponse;
}

async function networkFirst(ev) {
	let { request } = ev;
	try {
		let response = await fetch(request);
		log("✓ online retrieval", request.url);
		ev.waitUntil(add2cacheAndPrefetchUrls(request, response.clone()));
		return response;
	} catch(err) {}

	log("✗ online retrieval", request.url);
	let cache = await caches.open(CACHE_NAME);
	let response = await cache.match(request);
	log("✓ cache retrieval", request.url);
	return response;
}

async function add2cacheAndPrefetchUrls(request, response) {
	log("caching", request.url);
	let cache = await caches.open(CACHE_NAME);
	let clone = response.clone();
	await cache.put(request, response);
	prefetch(clone);
}

function prefetch(clone) {
	clone.text().then(html => {
		parseLinks(html).forEach(link => {
			retrieveAndAddToCache(link);
		});
	});
}

async function retrieveAndAddToCache(href) {
	if (!href.startsWith("/")) {
		log(`Ignoring external resource ${href}`);
		return;
	}
	let cache = await caches.open(CACHE_NAME);
	let cachedResponse = await cache.match(href);
	if (cachedResponse) {
		log(`Already have ${href} in cache. No need to prefetch`);
		return;
	}

	let response = await fetch(href);
	log(`Retrieving ${href} and adding it to the cache`);
	add2cacheAndPrefetchUrls(href, response);
}

function log(...msg) {
	console.log(`[Service Worker] v${VERSION}`, ...msg); // eslint-disable-line no-console
}

// TODO: Use a different library which has a better API for extracting links
function parseLinks(html) {
	let parsed = parse(html);
	return findLinks(parsed);
}

function findLinks(el) {
	if (el.tagName === 'a') {
		let href = el.attrs.find(attr => attr.name === 'href');

		if (!href) {
			return [];
		}
		return [href.value];
	}
	if (!el.childNodes) {
		return [];
	}
	let links = [];
	el.childNodes.forEach(child => {
		links = links.concat(findLinks(child));
	});
	return links;
}
