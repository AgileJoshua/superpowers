var ProjectClient = (function () {
    function ProjectClient(socket, options) {
        var _this = this;
        this.entriesSubscribers = [];
        this.assetsById = {};
        this.subscribersByAssetId = {};
        this.resourcesById = {};
        this.subscribersByResourceId = {};
        this.onAssetReceived = function (assetId, assetType, err, assetData) {
            // FIXME: The asset was probably trashed in the meantime, handle that
            if (err != null) {
                console.warn("Got an error in ProjectClient._onAssetReceived: " + err);
                return;
            }
            var subscribers = _this.subscribersByAssetId[assetId];
            if (subscribers == null)
                return;
            var asset = null;
            if (assetData != null) {
                asset = _this.assetsById[assetId] = new SupCore.system.data.assetClasses[assetType](assetId, assetData);
                asset.client_load();
            }
            for (var _i = 0; _i < subscribers.length; _i++) {
                var subscriber = subscribers[_i];
                subscriber.onAssetReceived(assetId, asset);
            }
        };
        this.onAssetEdited = function (assetId, command) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            var subscribers = _this.subscribersByAssetId[assetId];
            if (subscribers == null)
                return;
            var asset = _this.assetsById[assetId];
            Object.getPrototypeOf(asset)[("client_" + command)].apply(asset, args);
            for (var _a = 0; _a < subscribers.length; _a++) {
                var subscriber = subscribers[_a];
                subscriber.onAssetEdited.apply(subscriber, [assetId, command].concat(args));
            }
        };
        this.onAssetTrashed = function (assetId) {
            var subscribers = _this.subscribersByAssetId[assetId];
            if (subscribers == null)
                return;
            for (var _i = 0; _i < subscribers.length; _i++) {
                var subscriber = subscribers[_i];
                subscriber.onAssetTrashed(assetId);
            }
            _this.assetsById[assetId].client_unload();
            delete _this.assetsById[assetId];
            delete _this.subscribersByAssetId[assetId];
        };
        this.onResourceReceived = function (resourceId, err, resourceData) {
            if (err != null) {
                console.warn("Got an error in ProjectClient._onResourceReceived: " + err);
                return;
            }
            var subscribers = _this.subscribersByResourceId[resourceId];
            if (subscribers == null)
                return;
            var resource = null;
            if (resourceData != null)
                resource = _this.resourcesById[resourceId] = new SupCore.system.data.resourceClasses[resourceId](resourceData);
            for (var _i = 0; _i < subscribers.length; _i++) {
                var subscriber = subscribers[_i];
                subscriber.onResourceReceived(resourceId, resource);
            }
        };
        this.onResourceEdited = function (resourceId, command) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            var subscribers = _this.subscribersByResourceId[resourceId];
            if (subscribers == null)
                return;
            var resource = _this.resourcesById[resourceId];
            Object.getPrototypeOf(resource)[("client_" + command)].apply(resource, args);
            for (var _a = 0; _a < subscribers.length; _a++) {
                var subscriber = subscribers[_a];
                subscriber.onResourceEdited.apply(subscriber, [resourceId, command].concat(args));
            }
        };
        this.onEntriesReceived = function (err, entries) {
            _this.entries = new SupCore.Data.Entries(entries);
            _this.socket.on("add:entries", _this.onEntryAdded);
            _this.socket.on("move:entries", _this.onEntryMoved);
            _this.socket.on("setProperty:entries", _this.onSetEntryProperty);
            _this.socket.on("trash:entries", _this.onEntryTrashed);
            for (var _i = 0, _a = _this.entriesSubscribers; _i < _a.length; _i++) {
                var subscriber = _a[_i];
                subscriber.onEntriesReceived(_this.entries);
            }
        };
        this.onEntryAdded = function (entry, parentId, index) {
            _this.entries.client_add(entry, parentId, index);
            for (var _i = 0, _a = _this.entriesSubscribers; _i < _a.length; _i++) {
                var subscriber = _a[_i];
                subscriber.onEntryAdded(entry, parentId, index);
            }
        };
        this.onEntryMoved = function (id, parentId, index) {
            _this.entries.client_move(id, parentId, index);
            for (var _i = 0, _a = _this.entriesSubscribers; _i < _a.length; _i++) {
                var subscriber = _a[_i];
                subscriber.onEntryMoved(id, parentId, index);
            }
        };
        this.onSetEntryProperty = function (id, key, value) {
            _this.entries.client_setProperty(id, key, value);
            for (var _i = 0, _a = _this.entriesSubscribers; _i < _a.length; _i++) {
                var subscriber = _a[_i];
                subscriber.onSetEntryProperty(id, key, value);
            }
        };
        this.onEntryTrashed = function (id) {
            _this.entries.client_remove(id);
            for (var _i = 0, _a = _this.entriesSubscribers; _i < _a.length; _i++) {
                var subscriber = _a[_i];
                subscriber.onEntryTrashed(id);
            }
        };
        this.socket = socket;
        this.socket.on("edit:assets", this.onAssetEdited);
        this.socket.on("trash:assets", this.onAssetTrashed);
        this.socket.on("edit:resources", this.onResourceEdited);
        // Allow keeping an entries subscription alive at all times
        // Used in the scene editor to avoid constantly unsub'ing & resub'ing
        this.keepEntriesSubscription = options != null && options.subEntries;
        if (this.keepEntriesSubscription)
            this.socket.emit("sub", "entries", null, this.onEntriesReceived);
    }
    ProjectClient.prototype.subEntries = function (subscriber) {
        this.entriesSubscribers.push(subscriber);
        if (this.entriesSubscribers.length === 1 && !this.keepEntriesSubscription) {
            this.socket.emit("sub", "entries", null, this.onEntriesReceived);
        }
        else if (this.entries != null)
            subscriber.onEntriesReceived(this.entries);
    };
    ProjectClient.prototype.unsubEntries = function (subscriber) {
        this.entriesSubscribers.splice(this.entriesSubscribers.indexOf(subscriber), 1);
        if (this.entriesSubscribers.length === 0 && !this.keepEntriesSubscription) {
            this.socket.emit("unsub", "entries");
            this.socket.off("add:entries", this.onEntryAdded);
            this.socket.off("move:entries", this.onEntryMoved);
            this.socket.off("setProperty:entries", this.onSetEntryProperty);
            this.socket.off("trash:entries", this.onEntryTrashed);
            this.entries = null;
        }
    };
    ProjectClient.prototype.subAsset = function (assetId, assetType, subscriber) {
        var subscribers = this.subscribersByAssetId[assetId];
        if (subscribers == null) {
            subscribers = this.subscribersByAssetId[assetId] = [];
            this.socket.emit("sub", "assets", assetId, this.onAssetReceived.bind(this, assetId, assetType));
        }
        else {
            var asset = this.assetsById[assetId];
            if (asset != null)
                subscriber.onAssetReceived(assetId, asset);
        }
        subscribers.push(subscriber);
    };
    ProjectClient.prototype.unsubAsset = function (assetId, subscriber) {
        var subscribers = this.subscribersByAssetId[assetId];
        if (subscribers == null)
            return;
        var index = subscribers.indexOf(subscriber);
        if (index === -1)
            return;
        subscribers.splice(index, 1);
        if (subscribers.length === 0) {
            delete this.subscribersByAssetId[assetId];
            this.assetsById[assetId].client_unload();
            delete this.assetsById[assetId];
            this.socket.emit("unsub", "assets", assetId);
        }
    };
    ProjectClient.prototype.subResource = function (resourceId, subscriber) {
        var subscribers = this.subscribersByResourceId[resourceId];
        if (subscribers == null) {
            subscribers = this.subscribersByResourceId[resourceId] = [];
            this.socket.emit("sub", "resources", resourceId, this.onResourceReceived.bind(this, resourceId));
        }
        else {
            var resource = this.resourcesById[resourceId];
            if (resource != null)
                subscriber.onResourceReceived(resourceId, resource);
        }
        subscribers.push(subscriber);
    };
    ProjectClient.prototype.unsubResource = function (resourceId, subscriber) {
        var subscribers = this.subscribersByResourceId[resourceId];
        if (subscribers == null)
            return;
        var index = subscribers.indexOf(subscriber);
        if (index === -1)
            return;
        subscribers.splice(index, 1);
        if (subscribers.length === 0) {
            delete this.subscribersByResourceId[resourceId];
            delete this.resourcesById[resourceId];
            this.socket.emit("unsub", "resources", resourceId);
        }
    };
    return ProjectClient;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProjectClient;
