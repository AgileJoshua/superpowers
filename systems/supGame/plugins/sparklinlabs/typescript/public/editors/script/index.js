(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require("./ui");
require("./network");

},{"./network":6,"./ui":7}],2:[function(require,module,exports){
(function (process,global){
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
(function () {

    var async = {};
    function noop() {}
    function identity(v) {
        return v;
    }
    function toBool(v) {
        return !!v;
    }
    function notId(v) {
        return !v;
    }

    // global on the server, window in the browser
    var previous_async;

    // Establish the root object, `window` (`self`) in the browser, `global`
    // on the server, or `this` in some virtual machines. We use `self`
    // instead of `window` for `WebWorker` support.
    var root = typeof self === 'object' && self.self === self && self ||
            typeof global === 'object' && global.global === global && global ||
            this;

    if (root != null) {
        previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        return function() {
            if (fn === null) throw new Error("Callback was already called.");
            fn.apply(this, arguments);
            fn = null;
        };
    }

    function _once(fn) {
        return function() {
            if (fn === null) return;
            fn.apply(this, arguments);
            fn = null;
        };
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    // Ported from underscore.js isObject
    var _isObject = function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };

    function _isArrayLike(arr) {
        return _isArray(arr) || (
            // has a positive integer length property
            typeof arr.length === "number" &&
            arr.length >= 0 &&
            arr.length % 1 === 0
        );
    }

    function _arrayEach(arr, iterator) {
        var index = -1,
            length = arr.length;

        while (++index < length) {
            iterator(arr[index], index, arr);
        }
    }

    function _map(arr, iterator) {
        var index = -1,
            length = arr.length,
            result = Array(length);

        while (++index < length) {
            result[index] = iterator(arr[index], index, arr);
        }
        return result;
    }

    function _range(count) {
        return _map(Array(count), function (v, i) { return i; });
    }

    function _reduce(arr, iterator, memo) {
        _arrayEach(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    }

    function _forEachOf(object, iterator) {
        _arrayEach(_keys(object), function (key) {
            iterator(object[key], key);
        });
    }

    function _indexOf(arr, item) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === item) return i;
        }
        return -1;
    }

    var _keys = Object.keys || function (obj) {
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    function _keyIterator(coll) {
        var i = -1;
        var len;
        var keys;
        if (_isArrayLike(coll)) {
            len = coll.length;
            return function next() {
                i++;
                return i < len ? i : null;
            };
        } else {
            keys = _keys(coll);
            len = keys.length;
            return function next() {
                i++;
                return i < len ? keys[i] : null;
            };
        }
    }

    // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
    // This accumulates the arguments passed into an array, after a given index.
    // From underscore.js (https://github.com/jashkenas/underscore/pull/2140).
    function _restParam(func, startIndex) {
        startIndex = startIndex == null ? func.length - 1 : +startIndex;
        return function() {
            var length = Math.max(arguments.length - startIndex, 0);
            var rest = Array(length);
            for (var index = 0; index < length; index++) {
                rest[index] = arguments[index + startIndex];
            }
            switch (startIndex) {
                case 0: return func.call(this, rest);
                case 1: return func.call(this, arguments[0], rest);
            }
            // Currently unused but handle cases outside of the switch statement:
            // var args = Array(startIndex + 1);
            // for (index = 0; index < startIndex; index++) {
            //     args[index] = arguments[index];
            // }
            // args[startIndex] = rest;
            // return func.apply(this, args);
        };
    }

    function _withoutIndex(iterator) {
        return function (value, index, callback) {
            return iterator(value, callback);
        };
    }

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////

    // capture the global reference to guard against fakeTimer mocks
    var _setImmediate = typeof setImmediate === 'function' && setImmediate;

    var _delay = _setImmediate ? function(fn) {
        // not a direct alias for IE10 compatibility
        _setImmediate(fn);
    } : function(fn) {
        setTimeout(fn, 0);
    };

    if (typeof process === 'object' && typeof process.nextTick === 'function') {
        async.nextTick = process.nextTick;
    } else {
        async.nextTick = _delay;
    }
    async.setImmediate = _setImmediate ? _delay : async.nextTick;


    async.forEach =
    async.each = function (arr, iterator, callback) {
        return async.eachOf(arr, _withoutIndex(iterator), callback);
    };

    async.forEachSeries =
    async.eachSeries = function (arr, iterator, callback) {
        return async.eachOfSeries(arr, _withoutIndex(iterator), callback);
    };


    async.forEachLimit =
    async.eachLimit = function (arr, limit, iterator, callback) {
        return _eachOfLimit(limit)(arr, _withoutIndex(iterator), callback);
    };

    async.forEachOf =
    async.eachOf = function (object, iterator, callback) {
        callback = _once(callback || noop);
        object = object || [];

        var iter = _keyIterator(object);
        var key, completed = 0;

        while ((key = iter()) != null) {
            completed += 1;
            iterator(object[key], key, only_once(done));
        }

        if (completed === 0) callback(null);

        function done(err) {
            completed--;
            if (err) {
                callback(err);
            }
            // Check key is null in case iterator isn't exhausted
            // and done resolved synchronously.
            else if (key === null && completed <= 0) {
                callback(null);
            }
        }
    };

    async.forEachOfSeries =
    async.eachOfSeries = function (obj, iterator, callback) {
        callback = _once(callback || noop);
        obj = obj || [];
        var nextKey = _keyIterator(obj);
        var key = nextKey();
        function iterate() {
            var sync = true;
            if (key === null) {
                return callback(null);
            }
            iterator(obj[key], key, only_once(function (err) {
                if (err) {
                    callback(err);
                }
                else {
                    key = nextKey();
                    if (key === null) {
                        return callback(null);
                    } else {
                        if (sync) {
                            async.setImmediate(iterate);
                        } else {
                            iterate();
                        }
                    }
                }
            }));
            sync = false;
        }
        iterate();
    };



    async.forEachOfLimit =
    async.eachOfLimit = function (obj, limit, iterator, callback) {
        _eachOfLimit(limit)(obj, iterator, callback);
    };

    function _eachOfLimit(limit) {

        return function (obj, iterator, callback) {
            callback = _once(callback || noop);
            obj = obj || [];
            var nextKey = _keyIterator(obj);
            if (limit <= 0) {
                return callback(null);
            }
            var done = false;
            var running = 0;
            var errored = false;

            (function replenish () {
                if (done && running <= 0) {
                    return callback(null);
                }

                while (running < limit && !errored) {
                    var key = nextKey();
                    if (key === null) {
                        done = true;
                        if (running <= 0) {
                            callback(null);
                        }
                        return;
                    }
                    running += 1;
                    iterator(obj[key], key, only_once(function (err) {
                        running -= 1;
                        if (err) {
                            callback(err);
                            errored = true;
                        }
                        else {
                            replenish();
                        }
                    }));
                }
            })();
        };
    }


    function doParallel(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOf, obj, iterator, callback);
        };
    }
    function doParallelLimit(fn) {
        return function (obj, limit, iterator, callback) {
            return fn(_eachOfLimit(limit), obj, iterator, callback);
        };
    }
    function doSeries(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOfSeries, obj, iterator, callback);
        };
    }

    function _asyncMap(eachfn, arr, iterator, callback) {
        callback = _once(callback || noop);
        arr = arr || [];
        var results = _isArrayLike(arr) ? [] : {};
        eachfn(arr, function (value, index, callback) {
            iterator(value, function (err, v) {
                results[index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    }

    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = doParallelLimit(_asyncMap);

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.inject =
    async.foldl =
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachOfSeries(arr, function (x, i, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };

    async.foldr =
    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, identity).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };

    async.transform = function (arr, memo, iterator, callback) {
        if (arguments.length === 3) {
            callback = iterator;
            iterator = memo;
            memo = _isArray(arr) ? [] : {};
        }

        async.eachOf(arr, function(v, k, cb) {
            iterator(memo, v, k, cb);
        }, function(err) {
            callback(err, memo);
        });
    };

    function _filter(eachfn, arr, iterator, callback) {
        var results = [];
        eachfn(arr, function (x, index, callback) {
            iterator(x, function (v) {
                if (v) {
                    results.push({index: index, value: x});
                }
                callback();
            });
        }, function () {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    }

    async.select =
    async.filter = doParallel(_filter);

    async.selectLimit =
    async.filterLimit = doParallelLimit(_filter);

    async.selectSeries =
    async.filterSeries = doSeries(_filter);

    function _reject(eachfn, arr, iterator, callback) {
        _filter(eachfn, arr, function(value, cb) {
            iterator(value, function(v) {
                cb(!v);
            });
        }, callback);
    }
    async.reject = doParallel(_reject);
    async.rejectLimit = doParallelLimit(_reject);
    async.rejectSeries = doSeries(_reject);

    function _createTester(eachfn, check, getResult) {
        return function(arr, limit, iterator, cb) {
            function done() {
                if (cb) cb(getResult(false, void 0));
            }
            function iteratee(x, _, callback) {
                if (!cb) return callback();
                iterator(x, function (v) {
                    if (cb && check(v)) {
                        cb(getResult(true, x));
                        cb = iterator = false;
                    }
                    callback();
                });
            }
            if (arguments.length > 3) {
                eachfn(arr, limit, iteratee, done);
            } else {
                cb = iterator;
                iterator = limit;
                eachfn(arr, iteratee, done);
            }
        };
    }

    async.any =
    async.some = _createTester(async.eachOf, toBool, identity);

    async.someLimit = _createTester(async.eachOfLimit, toBool, identity);

    async.all =
    async.every = _createTester(async.eachOf, notId, notId);

    async.everyLimit = _createTester(async.eachOfLimit, notId, notId);

    function _findGetResult(v, x) {
        return x;
    }
    async.detect = _createTester(async.eachOf, identity, _findGetResult);
    async.detectSeries = _createTester(async.eachOfSeries, identity, _findGetResult);
    async.detectLimit = _createTester(async.eachOfLimit, identity, _findGetResult);

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                callback(null, _map(results.sort(comparator), function (x) {
                    return x.value;
                }));
            }

        });

        function comparator(left, right) {
            var a = left.criteria, b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }
    };

    async.auto = function (tasks, concurrency, callback) {
        if (!callback) {
            // concurrency is optional, shift the args.
            callback = concurrency;
            concurrency = null;
        }
        callback = _once(callback || noop);
        var keys = _keys(tasks);
        var remainingTasks = keys.length;
        if (!remainingTasks) {
            return callback(null);
        }
        if (!concurrency) {
            concurrency = remainingTasks;
        }

        var results = {};
        var runningTasks = 0;

        var listeners = [];
        function addListener(fn) {
            listeners.unshift(fn);
        }
        function removeListener(fn) {
            var idx = _indexOf(listeners, fn);
            if (idx >= 0) listeners.splice(idx, 1);
        }
        function taskComplete() {
            remainingTasks--;
            _arrayEach(listeners.slice(0), function (fn) {
                fn();
            });
        }

        addListener(function () {
            if (!remainingTasks) {
                callback(null, results);
            }
        });

        _arrayEach(keys, function (k) {
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = _restParam(function(err, args) {
                runningTasks--;
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _forEachOf(results, function(val, rkey) {
                        safeResults[rkey] = val;
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            });
            var requires = task.slice(0, task.length - 1);
            // prevent dead-locks
            var len = requires.length;
            var dep;
            while (len--) {
                if (!(dep = tasks[requires[len]])) {
                    throw new Error('Has inexistant dependency');
                }
                if (_isArray(dep) && _indexOf(dep, k) >= 0) {
                    throw new Error('Has cyclic dependencies');
                }
            }
            function ready() {
                return runningTasks < concurrency && _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            }
            if (ready()) {
                runningTasks++;
                task[task.length - 1](taskCallback, results);
            }
            else {
                addListener(listener);
            }
            function listener() {
                if (ready()) {
                    runningTasks++;
                    removeListener(listener);
                    task[task.length - 1](taskCallback, results);
                }
            }
        });
    };



    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var DEFAULT_INTERVAL = 0;

        var attempts = [];

        var opts = {
            times: DEFAULT_TIMES,
            interval: DEFAULT_INTERVAL
        };

        function parseTimes(acc, t){
            if(typeof t === 'number'){
                acc.times = parseInt(t, 10) || DEFAULT_TIMES;
            } else if(typeof t === 'object'){
                acc.times = parseInt(t.times, 10) || DEFAULT_TIMES;
                acc.interval = parseInt(t.interval, 10) || DEFAULT_INTERVAL;
            } else {
                throw new Error('Unsupported argument type for \'times\': ' + typeof t);
            }
        }

        var length = arguments.length;
        if (length < 1 || length > 3) {
            throw new Error('Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)');
        } else if (length <= 2 && typeof times === 'function') {
            callback = task;
            task = times;
        }
        if (typeof times !== 'function') {
            parseTimes(opts, times);
        }
        opts.callback = callback;
        opts.task = task;

        function wrappedTask(wrappedCallback, wrappedResults) {
            function retryAttempt(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            }

            function retryInterval(interval){
                return function(seriesCallback){
                    setTimeout(function(){
                        seriesCallback(null);
                    }, interval);
                };
            }

            while (opts.times) {

                var finalAttempt = !(opts.times-=1);
                attempts.push(retryAttempt(opts.task, finalAttempt));
                if(!finalAttempt && opts.interval > 0){
                    attempts.push(retryInterval(opts.interval));
                }
            }

            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || opts.callback)(data.err, data.result);
            });
        }

        // If a callback is passed, run this as a controll flow
        return opts.callback ? wrappedTask() : wrappedTask;
    };

    async.waterfall = function (tasks, callback) {
        callback = _once(callback || noop);
        if (!_isArray(tasks)) {
            var err = new Error('First argument to waterfall must be an array of functions');
            return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        function wrapIterator(iterator) {
            return _restParam(function (err, args) {
                if (err) {
                    callback.apply(null, [err].concat(args));
                }
                else {
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    ensureAsync(iterator).apply(null, args);
                }
            });
        }
        wrapIterator(async.iterator(tasks))();
    };

    function _parallel(eachfn, tasks, callback) {
        callback = callback || noop;
        var results = _isArrayLike(tasks) ? [] : {};

        eachfn(tasks, function (task, key, callback) {
            task(_restParam(function (err, args) {
                if (args.length <= 1) {
                    args = args[0];
                }
                results[key] = args;
                callback(err);
            }));
        }, function (err) {
            callback(err, results);
        });
    }

    async.parallel = function (tasks, callback) {
        _parallel(async.eachOf, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel(_eachOfLimit(limit), tasks, callback);
    };

    async.series = function(tasks, callback) {
        _parallel(async.eachOfSeries, tasks, callback);
    };

    async.iterator = function (tasks) {
        function makeCallback(index) {
            function fn() {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            }
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        }
        return makeCallback(0);
    };

    async.apply = _restParam(function (fn, args) {
        return _restParam(function (callArgs) {
            return fn.apply(
                null, args.concat(callArgs)
            );
        });
    });

    function _concat(eachfn, arr, fn, callback) {
        var result = [];
        eachfn(arr, function (x, index, cb) {
            fn(x, function (err, y) {
                result = result.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, result);
        });
    }
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        callback = callback || noop;
        if (test()) {
            var next = _restParam(function(err, args) {
                if (err) {
                    callback(err);
                } else if (test.apply(this, args)) {
                    iterator(next);
                } else {
                    callback(null);
                }
            });
            iterator(next);
        } else {
            callback(null);
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        var calls = 0;
        return async.whilst(function() {
            return ++calls <= 1 || test.apply(this, arguments);
        }, iterator, callback);
    };

    async.until = function (test, iterator, callback) {
        return async.whilst(function() {
            return !test.apply(this, arguments);
        }, iterator, callback);
    };

    async.doUntil = function (iterator, test, callback) {
        return async.doWhilst(iterator, function() {
            return !test.apply(this, arguments);
        }, callback);
    };

    async.during = function (test, iterator, callback) {
        callback = callback || noop;

        var next = _restParam(function(err, args) {
            if (err) {
                callback(err);
            } else {
                args.push(check);
                test.apply(this, args);
            }
        });

        var check = function(err, truth) {
            if (err) {
                callback(err);
            } else if (truth) {
                iterator(next);
            } else {
                callback(null);
            }
        };

        test(check);
    };

    async.doDuring = function (iterator, test, callback) {
        var calls = 0;
        async.during(function(next) {
            if (calls++ < 1) {
                next(null, true);
            } else {
                test.apply(this, arguments);
            }
        }, iterator, callback);
    };

    function _queue(worker, concurrency, payload) {
        if (concurrency == null) {
            concurrency = 1;
        }
        else if(concurrency === 0) {
            throw new Error('Concurrency must not be zero');
        }
        function _insert(q, data, pos, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0 && q.idle()) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    callback: callback || noop
                };

                if (pos) {
                    q.tasks.unshift(item);
                } else {
                    q.tasks.push(item);
                }

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
            });
            async.setImmediate(q.process);
        }
        function _next(q, tasks) {
            return function(){
                workers -= 1;

                var removed = false;
                var args = arguments;
                _arrayEach(tasks, function (task) {
                    _arrayEach(workersList, function (worker, index) {
                        if (worker === task && !removed) {
                            workersList.splice(index, 1);
                            removed = true;
                        }
                    });

                    task.callback.apply(task, args);
                });
                if (q.tasks.length + workers === 0) {
                    q.drain();
                }
                q.process();
            };
        }

        var workers = 0;
        var workersList = [];
        var q = {
            tasks: [],
            concurrency: concurrency,
            payload: payload,
            saturated: noop,
            empty: noop,
            drain: noop,
            started: false,
            paused: false,
            push: function (data, callback) {
                _insert(q, data, false, callback);
            },
            kill: function () {
                q.drain = noop;
                q.tasks = [];
            },
            unshift: function (data, callback) {
                _insert(q, data, true, callback);
            },
            process: function () {
                if (!q.paused && workers < q.concurrency && q.tasks.length) {
                    while(workers < q.concurrency && q.tasks.length){
                        var tasks = q.payload ?
                            q.tasks.splice(0, q.payload) :
                            q.tasks.splice(0, q.tasks.length);

                        var data = _map(tasks, function (task) {
                            return task.data;
                        });

                        if (q.tasks.length === 0) {
                            q.empty();
                        }
                        workers += 1;
                        workersList.push(tasks[0]);
                        var cb = only_once(_next(q, tasks));
                        worker(data, cb);
                    }
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            workersList: function () {
                return workersList;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                var resumeCount = Math.min(q.concurrency, q.tasks.length);
                // Need to call q.process once per concurrent
                // worker to preserve full concurrency after pause
                for (var w = 1; w <= resumeCount; w++) {
                    async.setImmediate(q.process);
                }
            }
        };
        return q;
    }

    async.queue = function (worker, concurrency) {
        var q = _queue(function (items, cb) {
            worker(items[0], cb);
        }, concurrency, 1);

        return q;
    };

    async.priorityQueue = function (worker, concurrency) {

        function _compareTasks(a, b){
            return a.priority - b.priority;
        }

        function _binarySearch(sequence, item, compare) {
            var beg = -1,
                end = sequence.length - 1;
            while (beg < end) {
                var mid = beg + ((end - beg + 1) >>> 1);
                if (compare(item, sequence[mid]) >= 0) {
                    beg = mid;
                } else {
                    end = mid - 1;
                }
            }
            return beg;
        }

        function _insert(q, data, priority, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    priority: priority,
                    callback: typeof callback === 'function' ? callback : noop
                };

                q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
                async.setImmediate(q.process);
            });
        }

        // Start with a normal queue
        var q = async.queue(worker, concurrency);

        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
            _insert(q, data, priority, callback);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        return _queue(worker, 1, payload);
    };

    function _console_fn(name) {
        return _restParam(function (fn, args) {
            fn.apply(null, args.concat([_restParam(function (err, args) {
                if (typeof console === 'object') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _arrayEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            })]));
        });
    }
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || identity;
        var memoized = _restParam(function memoized(args) {
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                async.setImmediate(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([_restParam(function (args) {
                    memo[key] = args;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                        q[i].apply(null, args);
                    }
                })]));
            }
        });
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
        return function () {
            return (fn.unmemoized || fn).apply(null, arguments);
        };
    };

    function _times(mapper) {
        return function (count, iterator, callback) {
            mapper(_range(count), iterator, callback);
        };
    }

    async.times = _times(async.map);
    async.timesSeries = _times(async.mapSeries);
    async.timesLimit = function (count, limit, iterator, callback) {
        return async.mapLimit(_range(count), limit, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return _restParam(function (args) {
            var that = this;

            var callback = args[args.length - 1];
            if (typeof callback == 'function') {
                args.pop();
            } else {
                callback = noop;
            }

            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([_restParam(function (err, nextargs) {
                    cb(err, nextargs);
                })]));
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        });
    };

    async.compose = function (/* functions... */) {
        return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };


    function _applyEach(eachfn) {
        return _restParam(function(fns, args) {
            var go = _restParam(function(args) {
                var that = this;
                var callback = args.pop();
                return eachfn(fns, function (fn, _, cb) {
                    fn.apply(that, args.concat([cb]));
                },
                callback);
            });
            if (args.length) {
                return go.apply(this, args);
            }
            else {
                return go;
            }
        });
    }

    async.applyEach = _applyEach(async.eachOf);
    async.applyEachSeries = _applyEach(async.eachOfSeries);


    async.forever = function (fn, callback) {
        var done = only_once(callback || noop);
        var task = ensureAsync(fn);
        function next(err) {
            if (err) {
                return done(err);
            }
            task(next);
        }
        next();
    };

    function ensureAsync(fn) {
        return _restParam(function (args) {
            var callback = args.pop();
            args.push(function () {
                var innerArgs = arguments;
                if (sync) {
                    async.setImmediate(function () {
                        callback.apply(null, innerArgs);
                    });
                } else {
                    callback.apply(null, innerArgs);
                }
            });
            var sync = true;
            fn.apply(this, args);
            sync = false;
        });
    }

    async.ensureAsync = ensureAsync;

    async.constant = _restParam(function(values) {
        var args = [null].concat(values);
        return function (callback) {
            return callback.apply(this, args);
        };
    });

    async.wrapSync =
    async.asyncify = function asyncify(func) {
        return _restParam(function (args) {
            var callback = args.pop();
            var result;
            try {
                result = func.apply(this, args);
            } catch (e) {
                return callback(e);
            }
            // if result is Promise object
            if (_isObject(result) && typeof result.then === "function") {
                result.then(function(value) {
                    callback(null, value);
                })["catch"](function(err) {
                    callback(err.message ? err : new Error(err));
                });
            } else {
                callback(null, result);
            }
        });
    };

    // Node.js
    if (typeof module === 'object' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define === 'function' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":5}],3:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],4:[function(require,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.PerfectResize = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
/// <reference path="../typings/tsd.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var events = require("events");
var ResizeHandle = (function (_super) {
    __extends(ResizeHandle, _super);
    function ResizeHandle(targetElt, direction, options) {
        var _this = this;
        _super.call(this);
        this.savedSize = null;
        this.onDoubleClick = function (event) {
            if (event.button !== 0 || !_this.handleElt.classList.contains("collapsable"))
                return;
            var size = _this.targetElt.getBoundingClientRect()[_this.horizontal ? "width" : "height"];
            var newSize;
            if (size > 0) {
                _this.savedSize = size;
                newSize = 0;
                _this.targetElt.style.display = "none";
            }
            else {
                newSize = _this.savedSize;
                _this.savedSize = null;
                _this.targetElt.style.display = "";
            }
            if (_this.horizontal)
                _this.targetElt.style.width = newSize + "px";
            else
                _this.targetElt.style.height = newSize + "px";
        };
        this.onMouseDown = function (event) {
            if (event.button !== 0)
                return;
            if (_this.targetElt.style.display === "none")
                return;
            if (_this.handleElt.classList.contains("disabled"))
                return;
            event.preventDefault();
            _this.emit("dragStart");
            var initialSize;
            var startDrag;
            var directionClass;
            if (_this.horizontal) {
                initialSize = _this.targetElt.getBoundingClientRect().width;
                startDrag = event.clientX;
                directionClass = "vertical";
            }
            else {
                initialSize = _this.targetElt.getBoundingClientRect().height;
                startDrag = event.clientY;
                directionClass = "horizontal";
            }
            var dragTarget;
            if (_this.handleElt.setCapture != null) {
                dragTarget = _this.handleElt;
                dragTarget.setCapture();
            }
            else {
                dragTarget = window;
            }
            document.documentElement.classList.add("handle-dragging", directionClass);
            var onMouseMove = function (event) {
                var size = initialSize + (_this.start ? -startDrag : startDrag);
                _this.emit("drag");
                if (_this.horizontal) {
                    size += _this.start ? event.clientX : -event.clientX;
                    _this.targetElt.style.width = size + "px";
                }
                else {
                    size += _this.start ? event.clientY : -event.clientY;
                    _this.targetElt.style.height = size + "px";
                }
            };
            var onMouseUp = function (event) {
                if (dragTarget.releaseCapture != null)
                    dragTarget.releaseCapture();
                document.documentElement.classList.remove("handle-dragging", directionClass);
                dragTarget.removeEventListener("mousemove", onMouseMove);
                dragTarget.removeEventListener("mouseup", onMouseUp);
                _this.emit("dragEnd");
            };
            dragTarget.addEventListener("mousemove", onMouseMove);
            dragTarget.addEventListener("mouseup", onMouseUp);
        };
        if (["left", "right", "top", "bottom"].indexOf(direction) === -1)
            throw new Error("Invalid direction");
        this.horizontal = ["left", "right"].indexOf(direction) !== -1;
        this.start = ["left", "top"].indexOf(direction) !== -1;
        if (options == null)
            options = {};
        this.targetElt = targetElt;
        this.direction = direction;
        this.handleElt = document.createElement("div");
        this.handleElt.classList.add("resize-handle");
        this.handleElt.classList.add(direction);
        if (options.collapsable)
            this.handleElt.classList.add("collapsable");
        if (this.start)
            targetElt.parentNode.insertBefore(this.handleElt, targetElt.nextSibling);
        else
            targetElt.parentNode.insertBefore(this.handleElt, targetElt);
        this.handleElt.addEventListener("dblclick", this.onDoubleClick);
        this.handleElt.addEventListener("mousedown", this.onMouseDown);
    }
    return ResizeHandle;
})(events.EventEmitter);
module.exports = ResizeHandle;

},{"events":1}]},{},[2])(2)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"events":3}],5:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],6:[function(require,module,exports){
var ui_1 = require("./ui");
var async = require("async");
exports.data = {
    clientId: null,
    projectClient: null,
    typescriptWorker: new Worker("typescriptWorker.js"),
    assetsById: {},
    asset: null,
    fileNames: [],
    files: {},
    fileNamesByScriptId: {}
};
exports.socket = SupClient.connect(SupClient.query.project);
exports.socket.on("welcome", onWelcome);
exports.socket.on("disconnect", SupClient.onDisconnected);
var onEditCommands = {};
function onWelcome(clientId) {
    exports.data.clientId = clientId;
    loadPlugins();
}
function loadPlugins() {
    window.fetch("/systems/" + SupCore.system.name + "/plugins.json").then(function (response) { return response.json(); }).then(function (pluginsInfo) {
        async.each(pluginsInfo.list, function (pluginName, pluginCallback) {
            if (pluginName === "sparklinlabs/typescript") {
                pluginCallback();
                return;
            }
            var apiScript = document.createElement("script");
            apiScript.src = "/systems/" + SupCore.system.name + "/plugins/" + pluginName + "/api.js";
            apiScript.addEventListener("load", function () { pluginCallback(); });
            apiScript.addEventListener("error", function () { pluginCallback(); });
            document.body.appendChild(apiScript);
        }, function (err) {
            // Read API definitions
            var globalDefs = "";
            var actorComponentAccessors = [];
            for (var pluginName in SupCore.system.api.contexts["typescript"].plugins) {
                var plugin = SupCore.system.api.contexts["typescript"].plugins[pluginName];
                if (plugin.defs != null)
                    globalDefs += plugin.defs;
                if (plugin.exposeActorComponent != null)
                    actorComponentAccessors.push(plugin.exposeActorComponent.propertyName + ": " + plugin.exposeActorComponent.className + ";");
            }
            globalDefs = globalDefs.replace("// INSERT_COMPONENT_ACCESSORS", actorComponentAccessors.join("\n    "));
            exports.data.fileNames.push("lib.d.ts");
            exports.data.files["lib.d.ts"] = { id: "lib.d.ts", text: globalDefs, version: "" };
            exports.data.projectClient = new SupClient.ProjectClient(exports.socket);
            exports.data.projectClient.subEntries(entriesSubscriber);
            ui_1.setupEditor(exports.data.clientId);
        });
    });
}
var entriesSubscriber = {
    onEntriesReceived: function (entries) {
        entries.walk(function (entry) {
            if (entry.type !== "script")
                return;
            var fileName = exports.data.projectClient.entries.getPathFromId(entry.id) + ".ts";
            exports.data.fileNames.push(fileName);
            exports.data.fileNamesByScriptId[entry.id] = fileName;
            exports.data.projectClient.subAsset(entry.id, "script", scriptSubscriber);
        });
    },
    onEntryAdded: function (newEntry, parentId, index) {
        if (newEntry.type !== "script")
            return;
        var fileName = exports.data.projectClient.entries.getPathFromId(newEntry.id) + ".ts";
        var i = 0;
        exports.data.projectClient.entries.walk(function (entry) {
            if (entry.type !== "script")
                return;
            if (entry.id === newEntry.id)
                exports.data.fileNames.splice(i, 0, fileName);
            i++;
        });
        exports.data.fileNamesByScriptId[newEntry.id] = fileName;
        exports.data.projectClient.subAsset(newEntry.id, "script", scriptSubscriber);
    },
    onEntryMoved: function (id, parentId, index) {
        var entry = exports.data.projectClient.entries.byId[id];
        if (entry.type !== "script")
            return;
        var oldFileName = exports.data.fileNamesByScriptId[id];
        var newFileName = exports.data.projectClient.entries.getPathFromId(id) + ".ts";
        exports.data.fileNames.splice(exports.data.fileNames.indexOf(oldFileName), 1);
        var i = 0;
        exports.data.projectClient.entries.walk(function (entry) {
            if (entry.type !== "script")
                return;
            if (entry.id === id)
                exports.data.fileNames.splice(i, 0, newFileName);
            i++;
        });
        exports.data.fileNamesByScriptId[id] = newFileName;
        var file = exports.data.files[oldFileName];
        exports.data.files[newFileName] = file;
        if (newFileName !== oldFileName)
            delete exports.data.files[oldFileName];
        exports.data.typescriptWorker.postMessage({ type: "removeFile", fileName: oldFileName });
        exports.data.typescriptWorker.postMessage({ type: "addFile", fileName: newFileName, index: exports.data.fileNames.indexOf(newFileName), file: file });
        scheduleErrorCheck();
    },
    onSetEntryProperty: function (id, key, value) {
        var entry = exports.data.projectClient.entries.byId[id];
        if (entry.type !== "script" || key !== "name")
            return;
        var oldFileName = exports.data.fileNamesByScriptId[id];
        var newFileName = exports.data.projectClient.entries.getPathFromId(entry.id) + ".ts";
        if (newFileName === oldFileName)
            return;
        var scriptIndex = exports.data.fileNames.indexOf(oldFileName);
        exports.data.fileNames[scriptIndex] = newFileName;
        exports.data.fileNamesByScriptId[id] = newFileName;
        var file = exports.data.files[oldFileName];
        exports.data.files[newFileName] = file;
        delete exports.data.files[oldFileName];
        exports.data.typescriptWorker.postMessage({ type: "removeFile", fileName: oldFileName });
        exports.data.typescriptWorker.postMessage({ type: "addFile", fileName: newFileName, index: exports.data.fileNames.indexOf(newFileName), file: file });
        scheduleErrorCheck();
    },
    onEntryTrashed: function (id) {
        var fileName = exports.data.fileNamesByScriptId[id];
        if (fileName == null)
            return;
        exports.data.fileNames.splice(exports.data.fileNames.indexOf(fileName), 1);
        delete exports.data.files[fileName];
        delete exports.data.fileNamesByScriptId[id];
        exports.data.typescriptWorker.postMessage({ type: "removeFile", fileName: fileName });
        scheduleErrorCheck();
    },
};
var allScriptsReceived = false;
var scriptSubscriber = {
    onAssetReceived: function (err, asset) {
        exports.data.assetsById[asset.id] = asset;
        var fileName = exports.data.projectClient.entries.getPathFromId(asset.id) + ".ts";
        var file = { id: asset.id, text: asset.pub.text, version: asset.pub.revisionId.toString() };
        exports.data.files[fileName] = file;
        if (asset.id === SupClient.query.asset) {
            exports.data.asset = asset;
            ui_1.default.errorPaneStatus.classList.toggle("has-draft", exports.data.asset.hasDraft);
            ui_1.default.editor.setText(exports.data.asset.pub.draft);
            if (SupClient.query["line"] != null && SupClient.query["ch"] != null)
                ui_1.default.editor.codeMirrorInstance.getDoc().setCursor({ line: parseInt(SupClient.query["line"], 10), ch: parseInt(SupClient.query["ch"], 10) });
        }
        if (!allScriptsReceived) {
            if (Object.keys(exports.data.files).length === exports.data.fileNames.length) {
                allScriptsReceived = true;
                exports.data.typescriptWorker.postMessage({ type: "setup", fileNames: exports.data.fileNames, files: exports.data.files });
                scheduleErrorCheck();
            }
        }
        else {
            // All scripts have been received so this must be a newly created script
            exports.data.typescriptWorker.postMessage({ type: "addFile", fileName: fileName, index: exports.data.fileNames.indexOf(fileName), file: file });
            scheduleErrorCheck();
        }
    },
    onAssetEdited: function (id, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (id !== SupClient.query.asset) {
            if (command === "saveText") {
                var fileName = exports.data.projectClient.entries.getPathFromId(id) + ".ts";
                var asset = exports.data.assetsById[id];
                var file = exports.data.files[fileName];
                file.text = asset.pub.text;
                file.version = asset.pub.revisionId.toString();
                exports.data.typescriptWorker.postMessage({ type: "updateFile", fileName: fileName, text: file.text, version: file.version });
                scheduleErrorCheck();
            }
            return;
        }
        if (onAssetCommands[command] != null)
            onAssetCommands[command].apply(exports.data.asset, args);
    },
    onAssetTrashed: function (id) {
        if (id !== SupClient.query.asset)
            return;
        ui_1.default.editor.clear();
        if (ui_1.default.errorCheckTimeout != null)
            clearTimeout(ui_1.default.errorCheckTimeout);
        if (ui_1.default.completionTimeout != null)
            clearTimeout(ui_1.default.completionTimeout);
        SupClient.onAssetTrashed();
    },
};
var onAssetCommands = {};
onAssetCommands.editText = function (operationData) {
    ui_1.default.errorPaneStatus.classList.add("has-draft");
    ui_1.default.editor.receiveEditText(operationData);
};
onAssetCommands.saveText = function () {
    ui_1.default.errorPaneStatus.classList.remove("has-draft");
};
var isCheckingForErrors = false;
var hasScheduledErrorCheck = false;
var activeCompletion;
var nextCompletion;
exports.data.typescriptWorker.onmessage = function (event) {
    switch (event.data.type) {
        case "errors":
            ui_1.refreshErrors(event.data.errors);
            isCheckingForErrors = false;
            if (hasScheduledErrorCheck)
                startErrorCheck();
            break;
        case "completion":
            if (nextCompletion != null) {
                activeCompletion = null;
                startAutocomplete();
                return;
            }
            for (var _i = 0, _a = event.data.list; _i < _a.length; _i++) {
                var item = _a[_i];
                item.render = function (parentElt, data, item) {
                    parentElt.style.maxWidth = "100em";
                    var rowElement = document.createElement("div");
                    rowElement.style.display = "flex";
                    parentElt.appendChild(rowElement);
                    var kindElement = document.createElement("div");
                    kindElement.style.marginRight = "0.5em";
                    kindElement.style.width = "6em";
                    kindElement.textContent = item.kind;
                    rowElement.appendChild(kindElement);
                    var nameElement = document.createElement("div");
                    nameElement.style.marginRight = "0.5em";
                    nameElement.style.width = "15em";
                    nameElement.style.fontWeight = "bold";
                    nameElement.textContent = item.name;
                    rowElement.appendChild(nameElement);
                    var infoElement = document.createElement("div");
                    infoElement.textContent = item.info;
                    rowElement.appendChild(infoElement);
                };
            }
            var from = { line: activeCompletion.cursor.line, ch: activeCompletion.token.start };
            var to = { line: activeCompletion.cursor.line, ch: activeCompletion.token.end };
            activeCompletion.callback({ list: event.data.list, from: from, to: to });
            activeCompletion = null;
            break;
        case "quickInfo":
            if (ui_1.default.infoTimeout == null) {
                ui_1.default.infoElement.textContent = event.data.text;
                ui_1.default.editor.codeMirrorInstance.addWidget(ui_1.default.infoPosition, ui_1.default.infoElement, false);
            }
            break;
        case "parameterHint":
            ui_1.clearParameterPopup();
            if (event.data.texts != null)
                ui_1.showParameterPopup(event.data.texts, event.data.selectedItemIndex, event.data.selectedArgumentIndex);
            break;
        case "definition":
            if (window.parent != null) {
                var entry = SupClient.findEntryByPath(exports.data.projectClient.entries.pub, event.data.fileName);
                window.parent.postMessage({ type: "openEntry", id: entry.id, options: { line: event.data.line, ch: event.data.ch } }, window.location.origin);
            }
            break;
    }
};
function startErrorCheck() {
    if (isCheckingForErrors)
        return;
    isCheckingForErrors = true;
    hasScheduledErrorCheck = false;
    exports.data.typescriptWorker.postMessage({ type: "checkForErrors" });
}
activeCompletion = null;
function scheduleErrorCheck() {
    if (ui_1.default.errorCheckTimeout != null)
        clearTimeout(ui_1.default.errorCheckTimeout);
    ui_1.default.errorCheckTimeout = window.setTimeout(function () {
        hasScheduledErrorCheck = true;
        if (!isCheckingForErrors)
            startErrorCheck();
    }, 300);
}
exports.scheduleErrorCheck = scheduleErrorCheck;
function startAutocomplete() {
    if (activeCompletion != null)
        return;
    activeCompletion = nextCompletion;
    nextCompletion = null;
    exports.data.typescriptWorker.postMessage({
        type: "getCompletionAt",
        tokenString: activeCompletion.token.string,
        name: exports.data.fileNamesByScriptId[SupClient.query.asset],
        start: activeCompletion.start
    });
}
function setNextCompletion(completion) {
    nextCompletion = completion;
    if (activeCompletion == null)
        startAutocomplete();
}
exports.setNextCompletion = setNextCompletion;

},{"./ui":7,"async":2}],7:[function(require,module,exports){
var network_1 = require("./network");
/* tslint:disable */
var PerfectResize = require("perfect-resize");
/* tslint:enable */
var ui = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ui;
SupClient.setupHotkeys();
window.addEventListener("message", function (event) {
    if (event.data.type === "activate")
        ui.editor.codeMirrorInstance.focus();
    if (event.data.line != null && event.data.ch != null)
        ui.editor.codeMirrorInstance.getDoc().setCursor({ line: parseInt(event.data.line, 10), ch: parseInt(event.data.ch, 10) });
});
// Context menu
if (window.navigator.userAgent.indexOf("Electron") !== -1) {
    var remote = top.global.require("remote");
    var win = remote.getCurrentWindow();
    var Menu = remote.require("menu");
    var MenuItem = remote.require("menu-item");
    var menu = new Menu();
    menu.append(new MenuItem({ label: "Cut (Ctrl+X)", click: function () { document.execCommand("cut"); } }));
    menu.append(new MenuItem({ label: "Copy (Ctrl+C)", click: function () { document.execCommand("copy"); } }));
    menu.append(new MenuItem({ label: "Paste (Ctrl+V)", click: function () { document.execCommand("paste"); } }));
    document.querySelector(".text-editor-container").addEventListener("contextmenu", function (event) {
        event.preventDefault();
        var bounds = win.getBounds();
        menu.popup(win, event.screenX - bounds.x, event.screenY - bounds.y);
        return false;
    });
}
// Setup editor
function setupEditor(clientId) {
    var textArea = document.querySelector(".text-editor");
    ui.editor = new TextEditorWidget(network_1.data.projectClient, clientId, textArea, {
        mode: "text/typescript",
        extraKeys: {
            "Ctrl-Space": function () {
                scheduleParameterHint();
                scheduleCompletion();
            },
            "Cmd-Space": function () {
                scheduleParameterHint();
                scheduleCompletion();
            },
            "Shift-Ctrl-F": function () { onGlobalSearch(); },
            "Shift-Cmd-F": function () { onGlobalSearch(); },
            "F8": function () {
                var cursor = ui.editor.codeMirrorInstance.getDoc().getCursor();
                var token = ui.editor.codeMirrorInstance.getTokenAt(cursor);
                if (token.string === ".")
                    token.start = token.end;
                var start = 0;
                for (var i = 0; i < cursor.line; i++)
                    start += ui.editor.codeMirrorInstance.getDoc().getLine(i).length + 1;
                start += cursor.ch;
                network_1.data.typescriptWorker.postMessage({
                    type: "getDefinitionAt",
                    name: network_1.data.fileNamesByScriptId[SupClient.query.asset],
                    start: start
                });
            }
        },
        editCallback: onEditText,
        sendOperationCallback: onSendOperation,
        saveCallback: onSaveText
    });
    ui.previousLine = -1;
    ui.editor.codeMirrorInstance.on("keyup", function (instance, event) {
        clearInfoPopup();
        // "("" character triggers the parameter hint
        if (event.keyCode === 53 ||
            (ui.parameterElement.parentElement != null && event.keyCode !== 27 && event.keyCode !== 38 && event.keyCode !== 40))
            scheduleParameterHint();
        // Ignore Ctrl, Cmd, Escape, Return, Tab, arrow keys, F8
        if (event.ctrlKey || event.metaKey || [27, 9, 13, 37, 38, 39, 40, 119, 16].indexOf(event.keyCode) !== -1)
            return;
        // If the completion popup is active, the hint() method will automatically
        // call for more autocomplete, so we don't need to do anything here.
        if (ui.editor.codeMirrorInstance.state.completionActive != null && ui.editor.codeMirrorInstance.state.completionActive.active())
            return;
        scheduleCompletion();
    });
    ui.editor.codeMirrorInstance.on("cursorActivity", function () {
        var currentLine = ui.editor.codeMirrorInstance.getDoc().getCursor().line;
        if (Math.abs(currentLine - ui.previousLine) >= 1)
            clearParameterPopup();
        else if (ui.parameterElement.parentElement != null)
            scheduleParameterHint();
        ui.previousLine = currentLine;
    });
    ui.editor.codeMirrorInstance.on("endCompletion", function () {
        ui.completionOpened = false;
        if (ui.parameterElement.parentElement != null)
            ui.editor.codeMirrorInstance.addKeyMap(parameterPopupKeyMap);
    });
}
exports.setupEditor = setupEditor;
var localVersionNumber = 0;
function onEditText(text, origin) {
    var localFileName = network_1.data.fileNamesByScriptId[SupClient.query.asset];
    var localFile = network_1.data.files[localFileName];
    localFile.text = text;
    localVersionNumber++;
    localFile.version = "l" + localVersionNumber;
    // We ignore the initial setValue
    if (origin !== "setValue") {
        network_1.data.typescriptWorker.postMessage({ type: "updateFile", fileName: localFileName, text: localFile.text, version: localFile.version });
        network_1.scheduleErrorCheck();
    }
}
function onSendOperation(operation) {
    network_1.socket.emit("edit:assets", SupClient.query.asset, "editText", operation, network_1.data.asset.document.getRevisionId(), function (err) {
        if (err != null) {
            alert(err);
            SupClient.onDisconnected();
        }
    });
}
// Error pane
ui.errorPane = document.querySelector(".error-pane");
ui.errorPaneStatus = ui.errorPane.querySelector(".status");
ui.errorPaneInfo = ui.errorPaneStatus.querySelector(".info");
ui.errorsTBody = ui.errorPane.querySelector(".errors tbody");
ui.errorsTBody.addEventListener("click", onErrorTBodyClick);
var errorPaneResizeHandle = new PerfectResize(ui.errorPane, "bottom");
errorPaneResizeHandle.on("drag", function () { ui.editor.codeMirrorInstance.refresh(); });
var errorPaneToggleButton = ui.errorPane.querySelector("button.toggle");
ui.errorPaneStatus.addEventListener("click", function (event) {
    if (event.target.tagName === "BUTTON" && event.target.parentElement.className === "draft")
        return;
    var collapsed = ui.errorPane.classList.toggle("collapsed");
    errorPaneToggleButton.textContent = collapsed ? "+" : "–";
    errorPaneResizeHandle.handleElt.classList.toggle("disabled", collapsed);
    ui.editor.codeMirrorInstance.refresh();
});
function refreshErrors(errors) {
    // Remove all previous erros
    for (var _i = 0, _a = ui.editor.codeMirrorInstance.getDoc().getAllMarks(); _i < _a.length; _i++) {
        var textMarker = _a[_i];
        if (textMarker.className !== "line-error")
            continue;
        textMarker.clear();
    }
    ui.editor.codeMirrorInstance.clearGutter("line-error-gutter");
    ui.errorsTBody.innerHTML = "";
    if (errors.length === 0) {
        ui.errorPaneInfo.textContent = "No errors";
        ui.errorPaneStatus.classList.remove("has-errors");
        return;
    }
    ui.errorPaneStatus.classList.add("has-errors");
    var selfErrorsCount = 0;
    var lastSelfErrorRow = null;
    // Display new ones
    for (var _b = 0; _b < errors.length; _b++) {
        var error = errors[_b];
        var errorRow = document.createElement("tr");
        errorRow.dataset["line"] = error.position.line.toString();
        errorRow.dataset["character"] = error.position.character.toString();
        var positionCell = document.createElement("td");
        positionCell.textContent = (error.position.line + 1).toString();
        errorRow.appendChild(positionCell);
        var messageCell = document.createElement("td");
        messageCell.textContent = error.message;
        errorRow.appendChild(messageCell);
        var scriptCell = document.createElement("td");
        errorRow.appendChild(scriptCell);
        if (error.file !== "") {
            errorRow.dataset["assetId"] = network_1.data.files[error.file].id;
            scriptCell.textContent = error.file.substring(0, error.file.length - 3);
        }
        else
            scriptCell.textContent = "Internal";
        if (error.file !== network_1.data.fileNamesByScriptId[SupClient.query.asset]) {
            ui.errorsTBody.appendChild(errorRow);
            continue;
        }
        ui.errorsTBody.insertBefore(errorRow, (lastSelfErrorRow != null) ? lastSelfErrorRow.nextElementSibling : ui.errorsTBody.firstChild);
        lastSelfErrorRow = errorRow;
        selfErrorsCount++;
        var line = error.position.line;
        ui.editor.codeMirrorInstance.getDoc().markText({ line: line, ch: error.position.character }, { line: line, ch: error.position.character + error.length }, { className: "line-error" });
        var gutter = document.createElement("div");
        gutter.className = "line-error-gutter";
        gutter.innerHTML = "●";
        ui.editor.codeMirrorInstance.setGutterMarker(line, "line-error-gutter", gutter);
    }
    var otherErrorsCount = errors.length - selfErrorsCount;
    if (selfErrorsCount > 0) {
        if (otherErrorsCount === 0)
            ui.errorPaneInfo.textContent = selfErrorsCount + " error" + (selfErrorsCount > 1 ? "s" : "");
        else
            ui.errorPaneInfo.textContent = selfErrorsCount + " error" + (selfErrorsCount > 1 ? "s" : "") + " in this script, " + otherErrorsCount + " in other scripts";
    }
    else {
        ui.errorPaneInfo.textContent = errors.length + " error" + (errors.length > 1 ? "s" : "") + " in other scripts";
    }
}
exports.refreshErrors = refreshErrors;
function onErrorTBodyClick(event) {
    var target = event.target;
    while (true) {
        if (target.tagName === "TBODY")
            return;
        if (target.tagName === "TR")
            break;
        target = target.parentElement;
    }
    var assetId = target.dataset["assetId"];
    if (assetId == null)
        return;
    var line = target.dataset["line"];
    var character = target.dataset["character"];
    if (assetId === SupClient.query.asset) {
        ui.editor.codeMirrorInstance.getDoc().setCursor({ line: parseInt(line, 10), ch: parseInt(character, 10) });
        ui.editor.codeMirrorInstance.focus();
    }
    else {
        var origin = window.location.origin;
        if (window.parent != null)
            window.parent.postMessage({ type: "openEntry", id: assetId, options: { line: line, ch: character } }, origin);
    }
}
// Save button
var saveButton = ui.errorPane.querySelector(".draft button");
saveButton.addEventListener("click", function (event) {
    event.preventDefault();
    onSaveText();
});
function onSaveText() {
    network_1.socket.emit("edit:assets", SupClient.query.asset, "saveText", function (err) { if (err != null) {
        alert(err);
        SupClient.onDisconnected();
    } });
}
// Info popup
ui.infoElement = document.createElement("div");
ui.infoElement.classList.add("popup-info");
document.addEventListener("mouseout", function (event) { clearInfoPopup(); });
var previousMousePosition = { x: -1, y: -1 };
document.addEventListener("mousemove", function (event) {
    if (ui.editor == null)
        return;
    // On some systems, Chrome (at least v43) generates
    // spurious "mousemove" events every second or so.
    if (event.clientX === previousMousePosition.x && event.clientY === previousMousePosition.y)
        return;
    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;
    clearInfoPopup();
    ui.infoTimeout = window.setTimeout(function () {
        ui.infoPosition = ui.editor.codeMirrorInstance.coordsChar({ left: event.clientX, top: event.clientY });
        if (ui.infoPosition.outside)
            return;
        var start = 0;
        for (var i = 0; i < ui.infoPosition.line; i++)
            start += ui.editor.codeMirrorInstance.getDoc().getLine(i).length + 1;
        start += ui.infoPosition.ch;
        ui.infoTimeout = null;
        network_1.data.typescriptWorker.postMessage({
            type: "getQuickInfoAt",
            name: network_1.data.fileNamesByScriptId[SupClient.query.asset],
            start: start
        });
    }, 200);
});
function clearInfoPopup() {
    if (ui.infoElement.parentElement != null)
        ui.infoElement.parentElement.removeChild(ui.infoElement);
    if (ui.infoTimeout != null)
        clearTimeout(ui.infoTimeout);
}
// Parameter hint popup
ui.parameterElement = document.querySelector(".popup-parameter");
ui.parameterElement.parentElement.removeChild(ui.parameterElement);
ui.parameterElement.style.display = "";
var parameterPopupKeyMap = {
    "Esc": function () { clearParameterPopup(); },
    "Up": function () { updateParameterHint(ui.selectedSignatureIndex - 1); },
    "Down": function () { updateParameterHint(ui.selectedSignatureIndex + 1); },
    "Enter": function () {
        var selectedSignature = ui.signatureTexts[ui.selectedSignatureIndex];
        if (selectedSignature.parameters.length === 0)
            return;
        var cursorPosition = ui.editor.codeMirrorInstance.getDoc().getCursor();
        var text = "";
        for (var parameterIndex = 0; parameterIndex < selectedSignature.parameters.length; parameterIndex++) {
            if (parameterIndex !== 0)
                text += ", ";
            text += selectedSignature.parameters[parameterIndex];
        }
        ui.editor.codeMirrorInstance.getDoc().replaceRange(text, cursorPosition, null);
        var endSelection = { line: cursorPosition.line, ch: cursorPosition.ch + selectedSignature.parameters[0].length };
        ui.editor.codeMirrorInstance.getDoc().setSelection(cursorPosition, endSelection);
    },
    "Tab": function () {
        var selectedSignature = ui.signatureTexts[ui.selectedSignatureIndex];
        if (selectedSignature.parameters.length === 0)
            return;
        if (ui.selectedArgumentIndex === selectedSignature.parameters.length - 1)
            return;
        var cursorPosition = ui.editor.codeMirrorInstance.getDoc().getCursor();
        cursorPosition.ch += 2;
        var endSelection = { line: cursorPosition.line, ch: cursorPosition.ch + selectedSignature.parameters[ui.selectedArgumentIndex + 1].length };
        ui.editor.codeMirrorInstance.getDoc().setSelection(cursorPosition, endSelection);
    }
};
function showParameterPopup(texts, selectedItemIndex, selectedArgumentIndex) {
    ui.signatureTexts = texts;
    ui.selectedArgumentIndex = selectedArgumentIndex;
    updateParameterHint(selectedItemIndex);
    var position = ui.editor.codeMirrorInstance.getDoc().getCursor();
    var coordinates = ui.editor.codeMirrorInstance.cursorCoords(position, "page");
    ui.parameterElement.style.top = Math.round(coordinates.top - 30) + "px";
    ui.parameterElement.style.left = coordinates.left + "px";
    document.body.appendChild(ui.parameterElement);
    if (!ui.completionOpened)
        ui.editor.codeMirrorInstance.addKeyMap(parameterPopupKeyMap);
}
exports.showParameterPopup = showParameterPopup;
function updateParameterHint(index) {
    if (index < 0)
        index = ui.signatureTexts.length - 1;
    else if (index >= ui.signatureTexts.length)
        index = 0;
    ui.selectedSignatureIndex = index;
    ui.parameterElement.querySelector(".item").textContent = "(" + (index + 1) + "/" + ui.signatureTexts.length + ")";
    var text = ui.signatureTexts[index];
    var prefix = text.prefix;
    var parameter = "";
    var suffix = "";
    for (var parameterIndex = 0; parameterIndex < text.parameters.length; parameterIndex++) {
        var parameterItem = text.parameters[parameterIndex];
        if (parameterIndex < ui.selectedArgumentIndex) {
            if (parameterIndex !== 0)
                prefix += ", ";
            prefix += parameterItem;
        }
        else if (parameterIndex === ui.selectedArgumentIndex) {
            if (parameterIndex !== 0)
                prefix += ", ";
            parameter = parameterItem;
        }
        else {
            if (parameterIndex !== 0)
                suffix += ", ";
            suffix += parameterItem;
        }
    }
    ui.parameterElement.querySelector(".prefix").textContent = prefix;
    ui.parameterElement.querySelector(".parameter").textContent = parameter;
    suffix += text.suffix;
    ui.parameterElement.querySelector(".suffix").textContent = suffix;
}
function clearParameterPopup() {
    if (ui.parameterElement.parentElement != null)
        ui.parameterElement.parentElement.removeChild(ui.parameterElement);
    ui.editor.codeMirrorInstance.removeKeyMap(parameterPopupKeyMap);
}
exports.clearParameterPopup = clearParameterPopup;
function scheduleParameterHint() {
    if (ui.parameterTimeout != null)
        clearTimeout(ui.parameterTimeout);
    ui.parameterTimeout = window.setTimeout(function () {
        var cursor = ui.editor.codeMirrorInstance.getDoc().getCursor();
        var token = ui.editor.codeMirrorInstance.getTokenAt(cursor);
        if (token.string === ".")
            token.start = token.end;
        var start = 0;
        for (var i = 0; i < cursor.line; i++)
            start += ui.editor.codeMirrorInstance.getDoc().getLine(i).length + 1;
        start += cursor.ch;
        network_1.data.typescriptWorker.postMessage({
            type: "getParameterHintAt",
            name: network_1.data.fileNamesByScriptId[SupClient.query.asset],
            start: start
        });
        ui.parameterTimeout = null;
    }, 100);
}
function hint(instance, callback) {
    var cursor = ui.editor.codeMirrorInstance.getDoc().getCursor();
    var token = ui.editor.codeMirrorInstance.getTokenAt(cursor);
    if (token.string === ".")
        token.start = token.end;
    var start = 0;
    for (var i = 0; i < cursor.line; i++)
        start += ui.editor.codeMirrorInstance.getDoc().getLine(i).length + 1;
    start += cursor.ch;
    network_1.setNextCompletion({ callback: callback, cursor: cursor, token: token, start: start });
}
hint.async = true;
var hintCustomKeys = {
    "Up": function (cm, commands) { commands.moveFocus(-1); },
    "Down": function (cm, commands) { commands.moveFocus(1); },
    "Enter": function (cm, commands) { commands.pick(); },
    "Tab": function (cm, commands) { commands.pick(); },
    "Esc": function (cm, commands) { commands.close(); },
};
function scheduleCompletion() {
    if (ui.completionTimeout != null)
        clearTimeout(ui.completionTimeout);
    ui.completionTimeout = window.setTimeout(function () {
        ui.completionOpened = true;
        if (ui.parameterElement.parentElement != null)
            ui.editor.codeMirrorInstance.removeKeyMap(parameterPopupKeyMap);
        ui.editor.codeMirrorInstance.showHint({ completeSingle: false, customKeys: hintCustomKeys, hint: hint });
        ui.completionTimeout = null;
    }, 100);
}
// Global search
function onGlobalSearch() {
    if (window.parent == null) {
        // TODO: Find a way to make it work? or display a message saying that you can't?
        return;
    }
    var options = {
        placeholder: "Find in project",
        initialValue: ui.editor.codeMirrorInstance.getDoc().getSelection(),
        validationLabel: "Search"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Search in all TypeScript scripts.", options, function (text) {
        /* tslint:enable:no-unused-expression */
        if (text == null) {
            ui.editor.codeMirrorInstance.focus();
            return;
        }
        window.parent.postMessage({ type: "openTool", name: "search", options: { text: text } }, window.location.origin);
    });
}

},{"./network":6,"perfect-resize":4}]},{},[1]);
