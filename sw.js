importScripts("./caches/zip-lib/zip.js");
importScripts("./caches/zip-lib/ArrayBufferReader.js");
importScripts("./caches/zip-lib/deflate.js");
importScripts("./caches/zip-lib/inflate.js");
zip.useWebWorkers = false;

const DEBUG = false;

const RUNTIME = "runtime";
const id = location.pathname;
// eslint-disable-next-line no-undef, camelcase
const VERSION = "230128-082238";
// eslint-disable-next-line no-undef, camelcase
const CURRENT_CACHES = [id + "_" + "cache_core-v_230128-082238"];
// eslint-disable-next-line no-undef, camelcase
const CACHE_RESOURCES = "cache_resources-v_230128-082238";
if (CACHE_RESOURCES) CURRENT_CACHES.push(id + "_" + CACHE_RESOURCES);
const CURRENT_CACHES_ZIPS = ["caches/core.zip", "caches/res.zip"];
const FILES_PER_CACHE = 50;
// eslint-disable-next-line no-undef, camelcase
const CACHE_APP_URL = ["index.html","lib-md/s_assmnt.js","lib-md/s_scSearch/scSearch.js","lib-md/w_mathjax/mathjaxMgr.js","lib-md/w_mediaelement/mediaelement.min.js","lib-md/w_molMgr/molMgr.js","lib-md/w_outMgr/outMgr.js","lib-md/w_panel/panelMgr.js","lib-md/w_plainRange/plainRange.css","lib-md/w_plainRange/plainRange.js","lib-md/w_scCodeMgr/scCodeMgr.css","lib-md/w_scCodeMgr/scCodeMgr.js","lib-md/w_scImageMgr/scImageMgr.js","lib-md/w_searchMgr/searchMgr.js","lib-md/w_stlMgr/stlMgr.js","lib-md/w_teMgr/fullscreen-api-polyfill.min.js","lib-md/w_teMgr/teMgr.js","lib-md/w_teMgr/teSubControllers.js","lib-md/w_teMgr/vtt.min.js","lib-md/w_tePlayer/TESettingsFromTracks.js","lib-md/w_tePlayer/icons.svg","lib-md/w_tePlayer/tePlayer.css","lib-md/w_tePlayer/tePlayer.js","lib-md/w_tplMgr/tplMgr.js","lib-md/w_vttTranscript/vttTranscriptMgr.js","lib-sc/assmntDhtmlTransf/empty.gif","lib-sc/assmntDhtmlTransf/select.gif","lib-sc/scAssmntMgr.js","lib-sc/scCoLib.js","lib-sc/scDragMgr.js","lib-sc/scDynUiMgr.js","lib-sc/scMapMgr.js","lib-sc/scPaLib.js","lib-sc/scSiLib.js","lib-sc/scTiLib.js","lib-sc/scTooltipMgr.js","skin/css/main.css","skin/css/print.css","skin/css/skin.css","skin/font/font.css","skin/font/fontello.json","skin/font/fontello.woff2","skin/img/favicon.png","skin/img/lic/by-nc-nd.png","skin/img/lic/by-nc-sa.png","skin/img/lic/by-nc.png","skin/img/lic/by-nd.png","skin/img/lic/by-sa.png","skin/img/lic/by.png","skin/img/lic/gnu-fdl.png","skin/img/lic/publicdomain.png","skin/img/lic/zero.png","skin/img/loader.svg","skin/img/tpl/back-root.png","skin/img/tpl/code.svg","skin/img/tpl/find.svg","skin/img/tpl/scBtn.png","skin/img/tpl/schBtn.svg","skin/img/tpl/schMnuTgle.svg","skin/js/skin.js","skin/player/flv.txt","skin/player/mp3.txt","skin/player/mp4.txt"];
// eslint-disable-next-line no-undef, camelcase
const APP_SIZE = 4977668;
const IS_CHROME = navigator.userAgent.indexOf("Chrome") !== -1;
const EXT_CT_MAP = {
	html: "text/html",
	css: "text/css",
	js: "application/javascript",
	json: "application/json",
	ttf: "application/octet-stream",
	woff: "application/octet-stream",
	eot: "application/octet-stream",
	woff2: "application/octet-stream",
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	gif: "image/gif",
	svg: "image/svg+xml",
	mp3: "audio/mpeg",
	oga: "audio/ogg",
	ogg: "audio/ogg",
	ma4: "audio/mp4",
	mp4: "video/mp4",
	avi: "video/avi",
	f4v: "video/mp4",
	ogv: "video/ogg",
	webm: "video/webm",
	doc: "application/doc",
	docx: "application/vnd.openxmlformats-officedocument.word",
	swf: "application/x-shockwave-flash",
	flv: "video/x-flv",
	odg: "application/vnd.oasis.opendocument.graphics",
	odp: "application/vnd.oasis.opendocument.presentation",
	ods: "application/vnd.oasis.opendocument.spreadsheet",
	odt: "application/vnd.oasis.opendocument.text",
	pdf: "application/pdf",
	ppt: "application/ms-powerpoint",
	pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
	rtf: "application/rtf",
	srt: "text/plain",
	vtt: "text/plain",
	xls: "application/excel",
	xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	zip: "application/zip"
};

/**
 * Sur installation, on récupère uniquement le coeur de l'app : index.html, skin, lib js
 */
self.addEventListener("install", (event) => event.waitUntil(installSW()));
async function installSW () {
	await caches.delete(RUNTIME);
	const cache = await caches.open(RUNTIME);
	cache.addAll(CACHE_APP_URL);
}

self.addEventListener("fetch", (event) => event.respondWith(cacheThenNetwork(event)));
async function cacheThenNetwork (event) {
	const opt = { ignoreSearch: true, ignoreMethod: true, ignoreVary: true };
	if (IS_CHROME) opt.cacheName = await getCacheName(event.request.url);
	const cachedResponse = await caches.match(event.request, opt);
	if (cachedResponse) return cachedResponse;
	const runtimeCache = await caches.open(RUNTIME);
	const networkResponse = await fetch(event.request, { credentials: "include", mode: "no-cors" });
	await runtimeCache.put(event.request, networkResponse.clone());
	return networkResponse;
}

self.addEventListener("message", async (event) => {
	if (event.data) {
		switch (event.data.type) {
			case "appReady":
				try {
					isCached()
						.then(() => { event.ports[0].postMessage({ type: "swReady", appSize: APP_SIZE, cached: true }); })
						.catch((e) => { event.ports[0].postMessage({ type: "swReady", appSize: APP_SIZE, cached: false }); });
				} catch (e) {
					log(e);
				}
				break;
			case "clearCache":
				try {
					await resetCache();
					event.ports[0].postMessage({ type: "cacheCleared" });
				} catch (e) {
					log(e);
				}
				break;
			case "activate":
				self.skipWaiting();
				break;
			case "fetchNewSize":
				event.ports[0].postMessage({ type: "updateSize", appSize: APP_SIZE, onStart: event.data.onStart });
				break;
			case "downloadCaches":
				try {
					await downloadAllCaches();
					event.ports[0].postMessage({ type: "cacheSucceeded" });
				} catch (e) {
					log(e);
					event.ports[0].postMessage({ type: "cacheSucceeded" });
				}
				break;
			case "resetAll":
				// await resetCaches(true);
				await resetCache();
				event.ports[0].postMessage({ type: "cacheReseted" });
				break;
			default:
				log("unknown message : " + JSON.stringify(event.data));
				break;
		}
	}
});

function isCached () {
	return new Promise(function (resolve, reject) {
		getDb().catch(reject)
			.then((db) => {
				const cachesStore = db.transaction("caches").objectStore("caches");
				const request = cachesStore.getAll();
				request.onerror = reject;
				request.onsuccess = function (reqEvent) {
					let count = 0;
					reqEvent.target.result.forEach((line) => { if (CURRENT_CACHES.indexOf(line.key) !== -1) count++; });
					if (CURRENT_CACHES.length === count) resolve();
					// eslint-disable-next-line prefer-promise-reject-errors
					else reject();
				};
			});
	});
}

async function downloadAllCaches () {
	const getZipReader = function (data) { return new Promise(function (resolve, reject) { zip.createReader(new zip.ArrayBufferReader(data), resolve, reject); }); };
	const getBaseUrl = function () {
		const curPath = location.pathname.split("/");
		curPath.pop();
		return location.origin + curPath.join("/") + "/";
	};
	const cacheContents = function (reader, cacheName) {
		return new Promise(function (resolve) {
			let curCache = null;
			let curCacheName = null;
			const baseUrl = getBaseUrl();
			reader.getEntries(async function (entries) {
				if (IS_CHROME) {
					let filesRecord = [];
					for (let i = 0; i < entries.length; i++) {
						if (i % FILES_PER_CACHE === 0) {
							curCache = null;
							if (filesRecord.length) await writeFilesOnDb(filesRecord);
						}
						if (curCache == null) {
							curCacheName = cacheName + "_" + Math.trunc(i / FILES_PER_CACHE);
							curCache = await caches.open(curCacheName);
							filesRecord = [];
						}

						/** on groupe toutes les ecritures dans l'indexedDb on une seule transaction */
						if (entries[i].filename === "index.html") filesRecord.push({ url: baseUrl, cache: curCacheName, version: VERSION });
						filesRecord.push({ url: baseUrl + entries[i].filename, cache: curCacheName, version: VERSION });
						/**  */

						await cacheEntry(entries[i], curCache);
					}
					if (filesRecord.length) await writeFilesOnDb(filesRecord);
					resolve();
				} else {
					curCache = await caches.open(cacheName);
					for (let i = 0; i < entries.length; i++) await cacheEntry(entries[i], curCache);
					resolve();
				}
			});
		});
	};
	const writeFilesOnDb = function (filesRecords) {
		return new Promise(function (resolve, reject) {
			getDb().catch(reject).then(async (db) => {
				const filesTx = db.transaction("files", "readwrite");
				filesTx.onerror = reject;
				const files = filesTx.objectStore("files");
				filesRecords.forEach(async function (fileRecord) { await files.put(fileRecord); });
				await filesTx.complete;
				resolve();
			});
		});
	};
	const cacheEntry = function (entry, cache) {
		if (entry.directory) { return Promise.resolve(); }
		return new Promise(function (resolve) {
			entry.getData(new zip.BlobWriter(), async function (data) {
				const baseUrl = getBaseUrl();
				const response = new Response(data, { headers: { "Content-Type": EXT_CT_MAP[entry.filename.split(".").pop().toLowerCase()] || "text/plain" } });
				if (entry.filename === "index.html") await cache.put(baseUrl, response.clone());
				await cache.put(baseUrl + entry.filename, response);
				resolve();
			});
		});
	};
	const promises = [];
	return new Promise(function (resolve, reject) {
		getDb().catch(reject).then((db) => {
			CURRENT_CACHES_ZIPS.forEach(function (url, index) {
				promises.push(new Promise(async function (subResolve, subReject) {
					const response = await fetch(url)
					if (response.status === 200) {
						const buffer = await response.arrayBuffer()
						const reader = await getZipReader(buffer)
						await cacheContents(reader, CURRENT_CACHES[index])
					}
					const dbReq = db.transaction("caches", "readwrite").objectStore("caches").put({ key: CURRENT_CACHES[index] });
					dbReq.onerror = subReject;
					dbReq.onsuccess = subResolve;
				}));
			});
			Promise.all(promises).then(resolve).catch(reject);
		});
	});
}

function getDb () {
	return new Promise(function (resolve, reject) {
		const request = self.indexedDB.open("pwa", 1);
		request.onupgradeneeded = function (event) {
			event.target.result.createObjectStore("caches", { keyPath: "key" });
			if (IS_CHROME) {
				event.target.result.createObjectStore("files", { keyPath: "url" })
					.createIndex("version", "version", { unique: false });
			}
		};
		request.onerror = reject;
		request.onsuccess = function (event) { resolve(event.target.result); };
	});
}

function resetCache () {
	const resetFilesRecord = function () {
		return new Promise(function (resolve, reject) {
			getDb().then(db => {
				const version = db.transaction("files", "readwrite").objectStore("files").index("version");
				const cursorRequest = version.openCursor(IDBKeyRange.only(VERSION));
				cursorRequest.onerror = reject;
				const usedCaches = {};
				cursorRequest.onsuccess = function (event) {
					const cursor = event.target.result;
					if (cursor) {
						usedCaches[cursor.value.cache] = true;
						cursor.delete(cursor.value.url);
						cursor.continue();
					} else { resolve(Object.keys(usedCaches)); }
				};
			}).catch(reject);
		});
	};
	const resetUsedCaches = function (usedCaches) {
		return new Promise(function (resolve, reject) {
			getDb().then(db => {
				const cacheTx = db.transaction("caches", "readwrite").objectStore("caches");
				const promises = [];
				CURRENT_CACHES.forEach(function (masterCacheKey) { cacheTx.delete(masterCacheKey).onerror = reject; });
				usedCaches.forEach(function (key) {
					promises.push(new Promise(function (subResolve, subReject) {
						const req = cacheTx.delete(key);
						req.onerror = reject;
						req.onsuccess = async function () {
							await caches.delete(key);
							subResolve();
						};
					}));
				});
				Promise.all(promises).then(resolve, reject);
			}).catch(reject);
		});
	};
	// eslint-disable-next-line no-async-promise-executor
	return new Promise(async function (resolve, reject) {
		await caches.delete(RUNTIME);
		if (IS_CHROME) resetFilesRecord().then(resetUsedCaches).then(resolve).catch(reject);
		else {
			return getDb().then(async db => {
				db.transaction("caches", "readwrite").objectStore("caches").clear();
				caches.keys().then(async function (names) {
					for (const name of names) { await caches.delete(name); }
					resolve();
				});
			});
		}
	});
}

function getCacheName (request) {
	return new Promise(function (resolve, reject) {
		const url = (request.indexOf("?") !== -1 ? request.substring(0, request.indexOf("?")) : request);
		getDb().catch(reject).then((db) => {
			const files = db.transaction("files").objectStore("files");
			const request = files.get(url);
			// Fichiers de premier niveau
			request.onerror = reject;
			request.onsuccess = function (event) {
				resolve(event.target.result ? event.target.result.cache : RUNTIME);
			};
		});
	});
}

/**
 * log si debug à true
 */
function log (message, ...data) {
	if (DEBUG) {
		// eslint-disable-next-line no-console
		if (data.length > 0) console.log(VERSION, message, data);
		// eslint-disable-next-line no-console
		else console.log(VERSION, message);
	}
}

/**
 * Affiche une notification locale simple -> Pas d'utilisation des notfications
 */
// function showNotification (title, datas = {}) {
// 	if (Notification.permission === "granted") {
// 		datas.icon = "";
// 		self.registration.showNotification(title, datas);
// 	}
// }
