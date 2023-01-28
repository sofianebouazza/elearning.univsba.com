var pwaMgr = scOnLoads[scOnLoads.length] = {
	strings: {
		installApp: "Installer l\'application",
		prepareCached: "Télécharger pour usage hors ligne",
		prepareUpdate: "Mettre à jour l\'application",
		updateCache: "Mettre à jour",
		cacheUpdateReady: "<div><span>Une mise à jour est disponible.</span></div>",
		cacheWarningTitle: "Accès hors-ligne",
		cacheWarning: "<div>Le poids de l\'application est estimé à %s.</div><div>Poursuivre le téléchargement ?</div>",
		updateWarning: "<div>Le volume de données à télécharger est estimé à %s.</div><div class='offlineDelete'><a href='#' onclick='pwaMgr.clearCaches(\"updateBtn\");return false;'>Supprimer l\'accès hors-ligne</a></div>",
		cacheLoadingStarted: "Le téléchargement est en cours, vous pouvez continuer votre navigation.",
		cachedReady: "Votre support est maintenant disponible hors ligne.",
		updateReady: "Une mise à jour du contenu hors ligne est disponible.",
		updateReadyNoCache: "Une mise à jour du contenu hors ligne est disponible. Actualiser la page pour mettre à jour ?",
		offlineManagerTitle: "Mise à jour",
		notEnoughSpace: "Le navigateur ne dispose pas d\'assez de place pour installer l\'application (%s disponible sur %s requis)",
		cacheFailed: "Une erreur a eu lieu dans le téléchargement. Vous ne pouvez pas utiliser l\'application hors ligne.",
		featureNotAvailable: "<div>Impossible de télécharger l\'application. Le stockage persistant n\'est pas autorisé par votre navigateur. Ajouter ce site en bookmark, autoriser les notifications ou l\'installer comme une application peut débloquer le stockage du site hors-ligne.</div><div>Vous pouvez également utiliser d\'autres navigateurs, comme Firefox qui vous laisseront la possibilité d\'activer vous même cette fonctionnalité</div>",
		downloading: "Téléchargement en cours",
		downloaded: "Application mise en cache. Cliquez pour supprimer.",
		clearCacheConfirm: "Êtes-vous sûr de vouloir supprimer la mise en cache ?",
		clearCacheConfirmTitle: "Supprimer l\'accès hors-ligne",
		resetCacheSucceeded: "Le cache de l\'application a bien été supprimé. Elle n\'est plus disponible hors ligne.",
		appInstalled: "L\'application a été installée. Vous pouvez fermer cette fenêtre et continuer votre navigation directement sur l\'application.",
		see: "Voir",
		ok: "Ok"
		// notifPermission: "Afficher les notifications",
		// notifActivated: "Notifications activées",
		// notifActivatedAlertMsg: "Merci d\'avoir activé les notifications."
	},

	appSize: 0,

	onLoad: async function () {
		const bd = dom.newBd(document.body);
		this.mobileZone = bd.elt("div", "mobileZone").current();
		this.registration = await navigator.serviceWorker.ready;
		this.worker = this.registration.active;
		if (this.registration.waiting) {
			this.newWorker = this.registration.waiting;
			setTimeout(() => pwaMgr.updateAvailable(null, true), 2000);
		}
		pwaMgr.postMessage({ type: "appReady" });
	},

	updateAvailable: function (newWorker, onStart) {
		if (newWorker) this.newWorker = newWorker;
		navigator.serviceWorker.addEventListener("controllerchange", () => {
			if (pwaMgr.newWorker) window.location.reload();
		});
		if (!this.isCached) {
			if (onStart) this.postMessage({ type: "clearCache" });
			else modalMgr.toast((bd) => bd.text(pwaMgr.strings.updateReadyNoCache), () => pwaMgr.postMessage({ type: "clearCache" }), pwaMgr.strings.ok);
		} else if (this.isCached) this.postMessage({ type: "fetchNewSize", onStart: onStart }, this.newWorker);
		else console.log("DEBUG: Erreur dans le process de maj");
	},

	postMessage (message, worker) {
		const channel = new MessageChannel();
		channel.port1.onmessage = (event) => {
			if (event.data) {
				switch (event.data.type) {
					case "swReady":
						pwaMgr.appSize = event.data.appSize;
						pwaMgr.isCached = event.data.cached;
						pwaMgr.refreshDownloadZone(pwaMgr.isCached ? "downloaded" : "downloadBtn", dom.newBd(pwaMgr.mobileZone));
						if (sessionStorage.getItem("downloadAfterReload") === "true") {
							pwaMgr.downloadCaches();
							sessionStorage.setItem("downloadAfterReload", null);
						}
						break;
					case "cacheSucceeded":
						pwaMgr.isCached = true;
						modalMgr.toast((bd) => bd.text(pwaMgr.strings.cachedReady), null, null, null, 3000);
						pwaMgr.refreshDownloadZone("downloaded");
						if (appInstalled) setTimeout(() => pwaMgr.appInstalled(), 3025);
						break;
					case "cacheCleared":
						pwaMgr.postMessage({ type: "activate" }, pwaMgr.newWorker);
						break;
					case "cacheFailed":
						modalMgr.alert((bd) => bd.text(pwaMgr.strings.cacheFailed), () => window.location.reload());
						pwaMgr.refreshDownloadZone("downloadBtn");
						break;
					case "updateSize":
						pwaMgr.refreshDownloadZone("updateBtn");
						if (!event.data.onStart) pwaMgr.prepareCache(null, pwaMgr.strings.cacheUpdateReady + pwaMgr.strings.updateWarning, event.data.appSize, true);
						break;
					case "cacheReseted":
						modalMgr.alert((bd) => bd.text(pwaMgr.strings.resetCacheSucceeded), () => window.location.reload());
						break;
				}
			}
		};
		(worker || this.worker).postMessage(message, [channel.port2]);
	},

	prepareCache: function (event, message, size, isFirstTimeProposal) {
		message = message || (pwaMgr.isCached ? pwaMgr.strings.updateWarning : pwaMgr.strings.cacheWarning);
		const rawSize = size || scPaLib.findNode("can:button", event.target).appSize;
		const readableSize = pwaMgr.xGetHumanReadableSize(rawSize);
		new Promise((resolve, reject) => {
			if (navigator.storage && navigator.storage.estimate) {
				navigator.storage.estimate()
					.then((storage) => {
						if ((storage.quota + storage.usage) > rawSize) resolve();
						else {
							modalMgr.alert((bd) => bd.text(pwaMgr.strings.notEnoughSpace.replace("%s", size).replace("%s", pwaMgr.xGetHumanReadableSize(storage.quota + storage.usage))));
							pwaMgr.refreshDownloadZone(pwaMgr.isCached ? "updateBtn" : "downloadBtn");
						}
					})
					.catch(reject);
			} else resolve();
		}).then(() => {
			const confirmUpdate = () => {
				modalMgr.confirm(
					(bd) => bd.current().insertAdjacentHTML("afterbegin", message.replace("%s", readableSize)),
					pwaMgr.startCaches,
					() => pwaMgr.refreshDownloadZone(pwaMgr.isCached ? "updateBtn" : "downloadBtn"),
					pwaMgr.isCached ? pwaMgr.strings.offlineManagerTitle : pwaMgr.strings.cacheWarningTitle,
					pwaMgr.isCached ? pwaMgr.strings.updateCache : null
				);
			};
			if (pwaMgr.isCached && isFirstTimeProposal) {
				modalMgr.toast(
					(bd) => bd.text(pwaMgr.strings.updateReady),
					confirmUpdate,
					pwaMgr.strings.see,
					() => pwaMgr.refreshDownloadZone(pwaMgr.isCached ? "updateBtn" : "downloadBtn")
				);
			} else confirmUpdate();
		}).catch(() => {
			console.log("Unable to use navigator.storage. Try to bypass");
			pwaMgr.downloadCaches();
		});
	},

	startCaches: async function () {
		if (navigator.storage && navigator.storage.persist) {
			const persistent = await navigator.storage.persist();
			if (persistent) {
				if (pwaMgr.isCached) {
					sessionStorage.setItem("downloadAfterReload", "true");
					pwaMgr.postMessage({ type: "clearCache" });
				} else pwaMgr.downloadCaches();
			} else {
				modalMgr.alert(
					(bd) => bd.current().insertAdjacentHTML("afterbegin", pwaMgr.strings.featureNotAvailable),
					() => pwaMgr.refreshDownloadZone(pwaMgr.isCached ? "updateBtn" : "downloadBtn")
				);
			}
		} else {
			console.log("Unable to use navigator.storage. Try to bypass");
			pwaMgr.downloadCaches();
		}
	},

	updateInstallAppButton: function () {
		if (win.installPromptEvent && !appInstalled) {
			const installPromptEvent = win.installPromptEvent;
			installPromptEvent.preventDefault();
			const bd = dom.newBd(pwaMgr.mobileZone);
			bd.elt("button", "installApp").att("title", pwaMgr.strings.installApp).prop("appSize", pwaMgr.appSize).listen("click", (event) => {
				var btn = scPaLib.findNode("can:button", event.target);
				btn.parentElement.removeChild(btn);
				installPromptEvent.prompt();
				installPromptEvent.userChoice.then((choice) => {
					if (choice.outcome === "accepted" && !pwaMgr.isCached) {
						const downloadBtn = scPaLib.findNode("des:button.download");
						if (downloadBtn) downloadBtn.remove();
						pwaMgr.startCaches();
					}
				});
			});
			svg(bd, "install");
			bd.elt("span").text(pwaMgr.strings.installApp).up().up();
		}
		// Pas d'utilisation du bouton de notifications
		// if ("Notification" in window && (Notification.permission !== "denied" || Notification.permission === "default") && Notification.permission !== "granted") {
		// 	bd.elt("button", "notificationPermission").att("title", pwaMgr.strings.notifPermission).listen("click", (event) => {
		// 		var btn = scPaLib.findNode("can:button", event.target);
		// 		btn.parentElement.removeChild(btn);
		// 		Notification.requestPermission((permission) => {
		// 			if (permission === "granted") pwaMgr.registration.showNotification(pwaMgr.strings.notifActivated, { body: pwaMgr.strings.notifActivatedAlertMsg, icon: pwaMgr.icon192 });
		// 		});
		// 	}).elt("span").text(pwaMgr.strings.notifPermission).up().up();
		// }
	},

	refreshDownloadZone: function (type, bd) {
		const downloadZone = scPaLib.findNode("des:.downloadZone");
		if (downloadZone) bd = dom.newBd(downloadZone);
		else bd.elt("div", "downloadZone");
		bd.clear();
		switch (type) {
			case "downloadBtn":
				bd.elt("button", "download").att("title", pwaMgr.strings.prepareCached).prop("appSize", pwaMgr.appSize).listen("click", (event) => {
					var btn = scPaLib.findNode("can:button", event.target);
					btn.parentElement.removeChild(btn);
					pwaMgr.prepareCache(event);
				});
				svg(bd, "download");
				bd.elt("span").text(pwaMgr.strings.prepareCached).up().up();
				break;
			case "updateBtn":
				bd.elt("button", "update").att("title", pwaMgr.strings.prepareUpdate).prop("appSize", pwaMgr.appSize).listen("click", (event) => {
					var btn = scPaLib.findNode("can:button", event.target);
					btn.parentElement.removeChild(btn);
					pwaMgr.prepareCache(event);
				});
				svg(bd, "update");
				bd.elt("span").text(pwaMgr.strings.prepareUpdate).up().up();
				break;
			case "downloading":
				bd.elt("span", "downloading").att("title", pwaMgr.strings.downloading);
				svg(bd, "downloading");
				bd.elt("span").text(pwaMgr.strings.downloading).up().up();
				break;
			case "downloaded":
				if (!window.matchMedia("(display-mode: standalone)").matches) {
					bd.elt("button", "downloaded").att("title", pwaMgr.strings.downloaded).listen("click", (event) => {
						var btn = scPaLib.findNode("can:button", event.target);
						btn.parentElement.removeChild(btn);
						pwaMgr.clearCaches("downloaded");
					});
					svg(bd, "downloaded");
					bd.elt("span").text(pwaMgr.strings.downloaded).up().up();
				}
				break;
		}
		bd.up();
	},

	clearCaches: function (buttonToRefresh) {
		modalMgr.confirm(
			(bd) => bd.text(pwaMgr.strings.clearCacheConfirm),
			() => pwaMgr.postMessage({ type: "resetAll" }),
			() => pwaMgr.refreshDownloadZone(buttonToRefresh),
			pwaMgr.strings.clearCacheConfirmTitle
		);
	},

	downloadCaches: function () {
		pwaMgr.postMessage({ type: "downloadCaches" });
		modalMgr.toast((bd) => bd.text(pwaMgr.strings.cacheLoadingStarted), null, null, null, 3000);
		pwaMgr.refreshDownloadZone("downloading");
	},

	appInstalled: function () {
		if (!window.matchMedia("(display-mode: standalone)").matches) {
			modalMgr.alert(
				(bd) => bd.text(pwaMgr.strings.appInstalled),
				() => location.reload()
			);
		}
	},

	xGetHumanReadableSize: function (size) {
		var counter = 0;
		while (size > 1000) {
			size /= 1024;
			counter++;
		}
		size = Math.round(size);
		switch (counter) {
			case 0:size += "octets"; break;
			case 1:size += "Ko"; break;
			case 2:size += "Mo"; break;
			case 3:size += "Go"; break;
			case 4:size += "To"; break;
		}
		return size;
	}

};

const win = window.parent || window;
win.addEventListener("beforeinstallprompt", (event) => {
	win.installPromptEvent = event;
	pwaMgr.updateInstallAppButton();
});

let appInstalled = false;
win.addEventListener("appinstalled", () => {
	if (pwaMgr.isCached) pwaMgr.appInstalled();
	else appInstalled = true;
});

const svg = function (bd, name) {
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.classList.add("icon");
	const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
	svg.appendChild(use);
	use.setAttribute("href", "#icon-" + name);
	bd.current().appendChild(svg);
	return bd;
};

const modalMgr = {
	strings: {
		valid: "Confirmer",
		cancel: "Annuler",
		close: "Fermer"
	},

	new: function (className, title, cb, bd, modalClass) {
		bd = bd || dom.newBd(document.body);
		bd.elt("div", modalClass || "modal")
			// .elt("div", "background").up()
			.elt("div", "content " + className)
			.elt("button", "close").att("title", modalMgr.strings.close).listen("click", () => {
				modalMgr.close();
				if (cb) cb();
			});
		// Close Button
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("id", "icon-close");
		svg.classList.add("icon");
		svg.setAttribute("viewBox", "0 0 32 32");
		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("d", "M3.363 0.188l-3.363 3.363 12.652 12.652-12.652 12.652 3.363 3.363 12.652-12.652 12.652 12.652 3.363-3.363-12.652-12.652 12.652-12.652-3.363-3.363-12.652 12.652z");
		svg.appendChild(path);
		//
		bd.current().appendChild(svg);
		bd.elt("span").text(modalMgr.strings.close).up().up();
		if (title) bd.elt("div", "title").elt("span").text(title).up().up();
		return bd.elt("div", "inner");
	},

	close: function () {
		var modal = scPaLib.findNode("des:div.modal|div.toast");
		if (modal) modal.remove();
	},

	confirm: function (content, cbValid, cbCancel, title, validText, requiredFields = 0) {
		modalMgr.close();
		const bd = modalMgr.new("confirm", title, cbCancel);
		const modal = bd.current();
		content(bd);
		bd.elt("div", "tools");
		bd.elt("button", "cancel").listen("click", () => {
			modalMgr.close();
			if (cbCancel) cbCancel();
		}).att("title", modalMgr.strings.cancel).elt("span").text(modalMgr.strings.cancel).up().up();
		bd.elt("button", "valid").listen("click", cbValid);
		if (requiredFields !== 0) bd.att("disabled", "true");
		bd.att("title", validText || modalMgr.strings.valid);
		const create = bd.current();
		bd.elt("span").text(validText || modalMgr.strings.valid).up();
		bd.up().up();
		bd.current().validRequiredFields = {};
		modal.addEventListener("requiredField", function (e) { create.disabled = Object.values(e.detail.required).filter(function (pBool) { return pBool; }).length !== requiredFields; });
		return bd;
	},

	alert: function (content, cb, title) {
		modalMgr.close();
		const bd = modalMgr.new("alert", title, cb);
		content(bd);
		bd.elt("div", "tools");
		bd.elt("button", "valid").listen("click", () => {
			modalMgr.close();
			if (cb) cb();
		}).att("title", modalMgr.strings.close).elt("span").text(modalMgr.strings.close).up().up();
		bd.up();
		return bd;
	},

	toast: function (content, cbValid, validButtonText, cbCancel, timeStamp) {
		modalMgr.close();
		const bd = modalMgr.new("", null, cbCancel, null, "toast");
		content(bd);
		bd.elt("div", "tools");
		if (validButtonText) {
			bd.elt("button", "valid").listen("click", () => {
				modalMgr.close();
				if (cbValid) cbValid();
			}).att("title", validButtonText).elt("span").text(validButtonText).up().up();
		}
		bd.up();
		let timeOut;
		if (timeStamp) {
			timeOut = setTimeout(() => {
				modalMgr.close();
				clearTimeout(timeOut);
			}, timeStamp);
		}
		return bd;
	}
};
