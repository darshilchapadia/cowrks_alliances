/* global Module */

/* Magic Mirror
 * Module: cowrks_events
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

Module.register("cowrks_alliances",{

	// Default module config.
	defaults: {
		feeds: [
			{
				url: "http://127.0.0.1:8000/alliances",
				encoding: "UTF-8" //ISO-8859-1
			}
		],
		showSourceTitle: true,
		showPublishDate: false,
		showDescription: true,
		reloadInterval:  5 * 60 * 1000, // every 5 minutes
		updateInterval: 10 * 1000,
		animationSpeed: 2.5 * 1000,
		aaxAlliances: 0, // 0 for unlimited
		removeStartTags: "",
		removeEndTags: "",
		startTags: [],
		endTags: []

	},

	// Define required translations.
	getTranslations: function() {
		// The translations for the defaut modules are defined in the core translation files.
		// Therefor we can just return false. Otherwise we should have returned a dictionairy.
		// If you're trying to build yiur own module including translations, check out the documentation.
		return false;
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

		// Set locale.
		moment.locale(config.language);

		this.alliances = [];
		this.loaded = false;
		this.activeItem = 0;

		this.registerFeeds();

	},

	// Override socket notification handler.
	socketNotificationReceived: function(notification, payload) {
		if (notification === "ALLIANCES") {
			this.generateFeed(payload);

			if (!this.loaded) {
				this.scheduleUpdateInterval();
			}

			this.loaded = true;
		}
		else if(notification === "VOICE_COMMAND") {
			console.log(payload)
		}
	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");

		if (this.config.feedUrl) {
			wrapper.className = "small bright";
			wrapper.innerHTML = "The configuration options for the cowrks_alliances module have changed.<br>Please check the documentation.";
			return wrapper;
		}

		if (this.activeItem >= this.alliances.length) {
			this.activeItem = 0;
		}

		if (this.alliances.length > 0) {

			if (this.config.showSourceTitle || this.config.showPublishDate) {
				var sourceAndTimestamp = document.createElement("div");
				sourceAndTimestamp.className = "light small dimmed";

				if (this.config.showSourceTitle && this.alliances[this.activeItem].sourceTitle !== "") {
					sourceAndTimestamp.innerHTML = this.alliances[this.activeItem].sourceTitle;
				}
				if (this.config.showSourceTitle && this.alliances[this.activeItem].sourceTitle !== "" && this.config.showPublishDate) {
					sourceAndTimestamp.innerHTML += ", ";
				}
				if (this.config.showPublishDate) {
					sourceAndTimestamp.innerHTML += moment(new Date(this.alliances[this.activeItem].pubdate)).fromNow();
				}
				if (this.config.showSourceTitle && this.alliances[this.activeItem].sourceTitle !== "" || this.config.showPublishDate) {
					sourceAndTimestamp.innerHTML += ":";
				}

				wrapper.appendChild(sourceAndTimestamp);
			}

			var title = document.createElement("div");
			title.className = "bright medium light";
			title.innerHTML = this.alliances[this.activeItem].title;
			wrapper.appendChild(title);

			if (this.config.showDescription) {
				var description = document.createElement("img");
				description.className = "small light";
				description.height = 200
				description.width = 300
				description.src = this.alliances[this.activeItem].url;
				wrapper.appendChild(description);
			}

		} else {
			wrapper.innerHTML = this.translate("LOADING");
			wrapper.className = "small dimmed";
		}

		return wrapper;
	},

	/* registerFeeds()
	 * registers the feeds to be used by the backend.
	 */

	registerFeeds: function() {
		for (var f in this.config.feeds) {
			var feed = this.config.feeds[f];
			this.sendSocketNotification("ADD_EVENTS", {
				feed: feed,
				config: this.config
			});
		}
	},

	/* registerFeeds()
	 * Generate an ordered list of items for this configured module.
	 *
	 * attribute feeds object - An object with feeds returned by the nod helper.
	 */
	generateFeed: function(feeds) {
		var alliances = [];
		for (var feed in feeds) {
			var feedItems = feeds[feed];
			if (this.subscribedToFeed(feed)) {
				for (var i in feedItems) {
					var item = feedItems[i];
					item.sourceTitle = this.titleForFeed(feed);
					alliances.push(item);
				}
			}
		}
		// alliances.sort(function(a,b) {
		// 	var dateA = new Date(a.pubdate);
		// 	var dateB = new Date(b.pubdate);
		// 	return dateB - dateA;
		// });
		if(this.config.aaxAlliances > 0) {
			alliances = alliances.slice(0, this.config.aaxAlliances);
		}
		this.alliances = alliances;
	},

	/* subscribedToFeed(feedUrl)
	 * Check if this module is configured to show this feed.
	 *
	 * attribute feedUrl string - Url of the feed to check.
	 *
	 * returns bool
	 */
	subscribedToFeed: function(feedUrl) {
		for (var f in this.config.feeds) {
			var feed = this.config.feeds[f];
			if (feed.url === feedUrl) {
				return true;
			}
		}
		return false;
	},

	/* subscribedToFeed(feedUrl)
	 * Returns title for a specific feed Url.
	 *
	 * attribute feedUrl string - Url of the feed to check.
	 *
	 * returns string
	 */
	titleForFeed: function(feedUrl) {
		for (var f in this.config.feeds) {
			var feed = this.config.feeds[f];
			if (feed.url === feedUrl) {
				return feed.title || "";
			}
		}
		return "";
	},

	/* scheduleUpdateInterval()
	 * Schedule visual update.
	 */
	scheduleUpdateInterval: function() {
		var self = this;

		self.updateDom(self.config.animationSpeed);

		setInterval(function() {
			self.activeItem++;
			self.updateDom(self.config.animationSpeed);
		}, this.config.updateInterval);
	},

	/* capitalizeFirstLetter(string)
	 * Capitalizes the first character of a string.
	 *
	 * argument string string - Input string.
	 *
	 * return string - Capitalized output string.
	 */
	capitalizeFirstLetter: function(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	},


});
