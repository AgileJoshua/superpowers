(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require("./ui");
require("./engine");
require("./network");

},{"./engine":19,"./network":20,"./ui":22}],2:[function(require,module,exports){
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
},{"_process":11}],3:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],4:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
 *     on objects.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

function typedArraySupport () {
  function Bar () {}
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    arr.constructor = Bar
    return arr.foo() === 42 && // typed array instances can be augmented
        arr.constructor === Bar && // constructor can be set
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  this.length = 0
  this.parent = undefined

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    array.byteLength
    that = Buffer._augment(new Uint8Array(array))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` is deprecated
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` is deprecated
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":3,"ieee754":7,"is-array":8}],5:[function(require,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.TreeView = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
/// <reference path="../lib/TreeView.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var events_1 = require("events");
var TreeView = (function (_super) {
    __extends(TreeView, _super);
    function TreeView(container, options) {
        var _this = this;
        _super.call(this);
        this._onClick = function (event) {
            // Toggle groups
            var element = event.target;
            if (element.className === "toggle") {
                if (element.parentElement.tagName === "LI" && element.parentElement.classList.contains("group")) {
                    element.parentElement.classList.toggle("collapsed");
                    return;
                }
            }
            // Update selection
            if (_this._updateSelection(event))
                _this.emit("selectionChange");
        };
        this._onDoubleClick = function (event) {
            if (_this.selectedNodes.length !== 1)
                return;
            var element = event.target;
            if (element.className === "toggle")
                return;
            _this.emit("activate");
        };
        this._onKeyDown = function (event) {
            if (document.activeElement !== _this.treeRoot)
                return;
            if (_this._firstSelectedNode == null) {
                // TODO: Remove once we have this._focusedNode
                if (event.keyCode === 40) {
                    _this.addToSelection(_this.treeRoot.firstElementChild);
                    event.preventDefault();
                }
                return;
            }
            switch (event.keyCode) {
                case 38: // up
                case 40:
                    _this._moveVertically(event.keyCode === 40 ? 1 : -1);
                    event.preventDefault();
                    break;
                case 37: // left
                case 39:
                    _this._moveHorizontally(event.keyCode == 39 ? 1 : -1);
                    event.preventDefault();
                    break;
                case 13:
                    if (_this.selectedNodes.length !== 1)
                        return;
                    _this.emit("activate");
                    event.preventDefault();
                    break;
            }
        };
        this._moveHorizontally = function (offset) {
            // TODO: this._focusedNode;
            var node = _this._firstSelectedNode;
            if (offset === -1) {
                if (!node.classList.contains("group") || node.classList.contains("collapsed")) {
                    if (!node.parentElement.classList.contains("children"))
                        return;
                    node = node.parentElement.previousElementSibling;
                }
                else if (node.classList.contains("group")) {
                    node.classList.add("collapsed");
                }
            }
            else {
                if (node.classList.contains("group")) {
                    if (node.classList.contains("collapsed"))
                        node.classList.remove("collapsed");
                    else
                        node = node.nextSibling.firstChild;
                }
            }
            if (node == null)
                return;
            _this.clearSelection();
            _this.addToSelection(node);
            _this.scrollIntoView(node);
            _this.emit("selectionChange");
        };
        this._onDragStart = function (event) {
            var element = event.target;
            if (element.tagName !== "LI")
                return false;
            if (!element.classList.contains("item") && !element.classList.contains("group"))
                return false;
            // NOTE: Required for Firefox to start the actual dragging
            // "try" is required for IE11 to not raise an exception
            try {
                event.dataTransfer.setData("text/plain", element.dataset.dndText ? element.dataset.dndText : null);
            }
            catch (e) { }
            if (_this.selectedNodes.indexOf(element) === -1) {
                _this.clearSelection();
                _this.addToSelection(element);
                _this.emit("selectionChange");
            }
            return true;
        };
        this._onDragOver = function (event) {
            if (_this.selectedNodes.length === 0)
                return false;
            var dropInfo = _this._getDropInfo(event);
            // Prevent dropping onto null or descendant
            if (dropInfo == null)
                return false;
            if (dropInfo.where === "inside" && _this.selectedNodes.indexOf(dropInfo.target) !== -1)
                return false;
            for (var _i = 0, _a = _this.selectedNodes; _i < _a.length; _i++) {
                var selectedNode = _a[_i];
                if (selectedNode.classList.contains("group") && selectedNode.nextSibling.contains(dropInfo.target))
                    return false;
            }
            _this._hasDraggedOverAfterLeaving = true;
            _this._clearDropClasses();
            dropInfo.target.classList.add("drop-" + dropInfo.where);
            event.preventDefault();
        };
        this._onDragLeave = function (event) {
            _this._hasDraggedOverAfterLeaving = false;
            setTimeout(function () { if (!_this._hasDraggedOverAfterLeaving)
                _this._clearDropClasses(); }, 300);
        };
        this._onDrop = function (event) {
            event.preventDefault();
            if (_this.selectedNodes.length === 0)
                return;
            var dropInfo = _this._getDropInfo(event);
            if (dropInfo == null)
                return;
            _this._clearDropClasses();
            var children = _this.selectedNodes[0].parentElement.children;
            var orderedNodes = [];
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (_this.selectedNodes.indexOf(child) !== -1)
                    orderedNodes.push(child);
            }
            var reparent = (_this.dropCallback != null) ? _this.dropCallback(dropInfo, orderedNodes) : true;
            if (!reparent)
                return;
            var newParent;
            var referenceElt;
            switch (dropInfo.where) {
                case "inside":
                    if (!dropInfo.target.classList.contains("group"))
                        return;
                    newParent = dropInfo.target.nextSibling;
                    referenceElt = newParent.firstChild;
                    break;
                case "below":
                    newParent = dropInfo.target.parentElement;
                    referenceElt = dropInfo.target.nextSibling;
                    if (referenceElt != null && referenceElt.tagName === "OL")
                        referenceElt = referenceElt.nextSibling;
                    break;
                case "above":
                    newParent = dropInfo.target.parentElement;
                    referenceElt = dropInfo.target;
                    break;
            }
            var draggedChildren;
            for (var _i = 0; _i < orderedNodes.length; _i++) {
                var selectedNode = orderedNodes[_i];
                if (selectedNode.classList.contains("group")) {
                    draggedChildren = selectedNode.nextSibling;
                    draggedChildren.parentElement.removeChild(draggedChildren);
                }
                if (referenceElt === selectedNode) {
                    referenceElt = selectedNode.nextSibling;
                }
                selectedNode.parentElement.removeChild(selectedNode);
                newParent.insertBefore(selectedNode, referenceElt);
                referenceElt = selectedNode.nextSibling;
                if (draggedChildren != null) {
                    newParent.insertBefore(draggedChildren, referenceElt);
                    referenceElt = draggedChildren.nextSibling;
                }
            }
        };
        if (options == null)
            options = {};
        this.multipleSelection = (options.multipleSelection != null) ? options.multipleSelection : true;
        this.dropCallback = options.dropCallback;
        this.treeRoot = document.createElement("ol");
        this.treeRoot.tabIndex = 0;
        this.treeRoot.classList.add("tree");
        container.appendChild(this.treeRoot);
        this.selectedNodes = [];
        this._firstSelectedNode = null;
        this.treeRoot.addEventListener("click", this._onClick);
        this.treeRoot.addEventListener("dblclick", this._onDoubleClick);
        this.treeRoot.addEventListener("keydown", this._onKeyDown);
        container.addEventListener("keydown", function (event) {
            if (event.keyCode === 37 || event.keyCode === 39)
                event.preventDefault();
        });
        if (this.dropCallback != null) {
            this.treeRoot.addEventListener("dragstart", this._onDragStart);
            this.treeRoot.addEventListener("dragover", this._onDragOver);
            this.treeRoot.addEventListener("dragleave", this._onDragLeave);
            this.treeRoot.addEventListener("drop", this._onDrop);
        }
    }
    TreeView.prototype.clearSelection = function () {
        for (var _i = 0, _a = this.selectedNodes; _i < _a.length; _i++) {
            var selectedNode = _a[_i];
            selectedNode.classList.remove("selected");
        }
        this.selectedNodes.length = 0;
        this._firstSelectedNode = null;
    };
    TreeView.prototype.addToSelection = function (element) {
        if (this.selectedNodes.indexOf(element) !== -1)
            return;
        this.selectedNodes.push(element);
        element.classList.add("selected");
        if (this.selectedNodes.length === 1)
            this._firstSelectedNode = element;
    };
    TreeView.prototype.scrollIntoView = function (element) {
        var elementRect = element.getBoundingClientRect();
        var containerRect = this.treeRoot.parentElement.getBoundingClientRect();
        if (elementRect.top < containerRect.top)
            element.scrollIntoView(true);
        else if (elementRect.bottom > containerRect.bottom)
            element.scrollIntoView(false);
    };
    TreeView.prototype.append = function (element, type, parentGroupElement) {
        if (type !== "item" && type !== "group")
            throw new Error("Invalid type");
        var childrenElt;
        var siblingsElt;
        if (parentGroupElement != null) {
            if (parentGroupElement.tagName !== "LI" || !parentGroupElement.classList.contains("group"))
                throw new Error("Invalid parent group");
            siblingsElt = parentGroupElement.nextSibling;
        }
        else {
            siblingsElt = this.treeRoot;
        }
        if (!element.classList.contains(type)) {
            element.classList.add(type);
            if (this.dropCallback != null)
                element.draggable = true;
            if (type === "group") {
                var toggleElt = document.createElement("div");
                toggleElt.classList.add("toggle");
                element.insertBefore(toggleElt, element.firstChild);
                childrenElt = document.createElement("ol");
                childrenElt.classList.add("children");
            }
        }
        else if (type === "group") {
            childrenElt = element.nextSibling;
        }
        siblingsElt.appendChild(element);
        if (childrenElt != null)
            siblingsElt.appendChild(childrenElt);
        return element;
    };
    TreeView.prototype.insertBefore = function (element, type, referenceElement) {
        if (type !== "item" && type !== "group")
            throw new Error("Invalid type");
        if (referenceElement == null)
            throw new Error("A reference element is required");
        if (referenceElement.tagName !== "LI")
            throw new Error("Invalid reference element");
        var childrenElt;
        if (!element.classList.contains(type)) {
            element.classList.add(type);
            if (this.dropCallback != null)
                element.draggable = true;
            if (type === "group") {
                var toggleElt = document.createElement("div");
                toggleElt.classList.add("toggle");
                element.insertBefore(toggleElt, element.firstChild);
                childrenElt = document.createElement("ol");
                childrenElt.classList.add("children");
            }
        }
        else if (type === "group") {
            childrenElt = element.nextSibling;
        }
        referenceElement.parentElement.insertBefore(element, referenceElement);
        if (childrenElt != null)
            referenceElement.parentElement.insertBefore(childrenElt, element.nextSibling);
        return element;
    };
    TreeView.prototype.insertAt = function (element, type, index, parentElement) {
        var referenceElt;
        if (index != null) {
            referenceElt =
                (parentElement != null)
                    ? parentElement.nextSibling.querySelector(":scope > li:nth-of-type(" + (index + 1) + ")")
                    : this.treeRoot.querySelector(":scope > li:nth-of-type(" + (index + 1) + ")");
        }
        if (referenceElt != null)
            this.insertBefore(element, type, referenceElt);
        else
            this.append(element, type, parentElement);
    };
    TreeView.prototype.remove = function (element) {
        var selectedIndex = this.selectedNodes.indexOf(element);
        if (selectedIndex !== -1)
            this.selectedNodes.splice(selectedIndex, 1);
        if (this._firstSelectedNode === element)
            this._firstSelectedNode = this.selectedNodes[0];
        if (element.classList.contains("group")) {
            var childrenElement = element.nextSibling;
            var removedSelectedNodes = [];
            for (var _i = 0, _a = this.selectedNodes; _i < _a.length; _i++) {
                var selectedNode = _a[_i];
                if (childrenElement.contains(selectedNode)) {
                    removedSelectedNodes.push(selectedNode);
                }
            }
            for (var _b = 0; _b < removedSelectedNodes.length; _b++) {
                var removedSelectedNode = removedSelectedNodes[_b];
                this.selectedNodes.splice(this.selectedNodes.indexOf(removedSelectedNode), 1);
                if (this._firstSelectedNode === removedSelectedNode)
                    this._firstSelectedNode = this.selectedNodes[0];
            }
            element.parentElement.removeChild(childrenElement);
        }
        element.parentElement.removeChild(element);
    };
    // Returns whether the selection changed
    TreeView.prototype._updateSelection = function (event) {
        var selectionChanged = false;
        if ((!this.multipleSelection || (!event.shiftKey && !event.ctrlKey)) && this.selectedNodes.length > 0) {
            this.clearSelection();
            selectionChanged = true;
        }
        var ancestorElement = event.target;
        while (ancestorElement.tagName !== "LI" || (!ancestorElement.classList.contains("item") && !ancestorElement.classList.contains("group"))) {
            if (ancestorElement === this.treeRoot)
                return selectionChanged;
            ancestorElement = ancestorElement.parentElement;
        }
        var element = ancestorElement;
        if (this.selectedNodes.length > 0 && this.selectedNodes[0].parentElement !== element.parentElement) {
            return selectionChanged;
        }
        if (this.multipleSelection && event.shiftKey && this.selectedNodes.length > 0) {
            var startElement = this._firstSelectedNode;
            var elements = [];
            var inside = false;
            for (var i = 0; i < element.parentElement.children.length; i++) {
                var child = element.parentElement.children[i];
                if (child === startElement || child === element) {
                    if (inside || startElement === element) {
                        elements.push(child);
                        break;
                    }
                    inside = true;
                }
                if (inside && child.tagName === "LI")
                    elements.push(child);
            }
            this.clearSelection();
            this.selectedNodes = elements;
            this._firstSelectedNode = startElement;
            for (var _i = 0, _a = this.selectedNodes; _i < _a.length; _i++) {
                var selectedNode = _a[_i];
                selectedNode.classList.add("selected");
            }
            return true;
        }
        var index;
        if (event.ctrlKey && (index = this.selectedNodes.indexOf(element)) !== -1) {
            this.selectedNodes.splice(index, 1);
            element.classList.remove("selected");
            if (this._firstSelectedNode === element) {
                this._firstSelectedNode = this.selectedNodes[0];
            }
            return true;
        }
        this.addToSelection(element);
        return true;
    };
    TreeView.prototype._moveVertically = function (offset) {
        // TODO: this._focusedNode;
        var node = this._firstSelectedNode;
        if (offset === -1) {
            if (node.previousElementSibling != null) {
                var target = node.previousElementSibling;
                while (target.classList.contains("children")) {
                    if (!target.previousElementSibling.classList.contains("collapsed") && target.childElementCount > 0)
                        target = target.lastElementChild;
                    else
                        target = target.previousElementSibling;
                }
                node = target;
            }
            else if (node.parentElement.classList.contains("children"))
                node = node.parentElement.previousElementSibling;
            else
                return;
        }
        else {
            var walkUp = false;
            if (node.classList.contains("group")) {
                if (!node.classList.contains("collapsed") && node.nextElementSibling.childElementCount > 0)
                    node = node.nextElementSibling.firstElementChild;
                else if (node.nextElementSibling.nextElementSibling != null)
                    node = node.nextElementSibling.nextElementSibling;
                else
                    walkUp = true;
            }
            else {
                if (node.nextElementSibling != null)
                    node = node.nextElementSibling;
                else
                    walkUp = true;
            }
            if (walkUp) {
                if (node.parentElement.classList.contains("children")) {
                    var target = node.parentElement;
                    while (target.nextElementSibling == null) {
                        target = target.parentElement;
                        if (!target.classList.contains("children"))
                            return;
                    }
                    node = target.nextElementSibling;
                }
                else
                    return;
            }
        }
        if (node == null)
            return;
        this.clearSelection();
        this.addToSelection(node);
        this.scrollIntoView(node);
        this.emit("selectionChange");
    };
    ;
    TreeView.prototype._getDropInfo = function (event) {
        var element = event.target;
        if (element.tagName === "OL" && element.classList.contains("children")) {
            element = element.parentElement;
        }
        if (element === this.treeRoot) {
            element = element.lastChild;
            if (element.tagName === "OL")
                element = element.previousSibling;
            return { target: element, where: "below" };
        }
        while (element.tagName !== "LI" || (!element.classList.contains("item") && !element.classList.contains("group"))) {
            if (element === this.treeRoot)
                return null;
            element = element.parentElement;
        }
        var where = this._getInsertionPoint(element, event.pageY);
        if (where === "below") {
            if (element.classList.contains("item") && element.nextSibling != null && element.nextSibling.tagName === "LI") {
                element = element.nextSibling;
                where = "above";
            }
            else if (element.classList.contains("group") && element.nextSibling.nextSibling != null && element.nextSibling.nextSibling.tagName === "LI") {
                element = element.nextSibling.nextSibling;
                where = "above";
            }
        }
        return { target: element, where: where };
    };
    TreeView.prototype._getInsertionPoint = function (element, y) {
        var rect = element.getBoundingClientRect();
        var offset = y - rect.top;
        if (offset < rect.height / 4)
            return "above";
        if (offset > rect.height * 3 / 4)
            return (element.classList.contains("group") && element.nextSibling.childElementCount > 0) ? "inside" : "below";
        return element.classList.contains("item") ? "below" : "inside";
    };
    TreeView.prototype._clearDropClasses = function () {
        var dropAbove = this.treeRoot.querySelector(".drop-above");
        if (dropAbove != null)
            dropAbove.classList.remove("drop-above");
        var dropInside = this.treeRoot.querySelector(".drop-inside");
        if (dropInside != null)
            dropInside.classList.remove("drop-inside");
        var dropBelow = this.treeRoot.querySelector(".drop-below");
        if (dropBelow != null)
            dropBelow.classList.remove("drop-below");
    };
    return TreeView;
})(events_1.EventEmitter);
module.exports = TreeView;

},{"events":1}]},{},[2])(2)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"events":6}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],8:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],9:[function(require,module,exports){
(function (process){
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

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":11}],10:[function(require,module,exports){
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
},{"events":6}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var SpriteRendererUpdater_1 = require("./SpriteRendererUpdater");
var SpriteRenderer = (function (_super) {
    __extends(SpriteRenderer, _super);
    function SpriteRenderer(actor) {
        _super.call(this, actor, "SpriteRenderer");
        this.color = { r: 1, g: 1, b: 1 };
        this.hasFrameBeenUpdated = false;
        this.materialType = "basic";
        this.horizontalFlip = false;
        this.verticalFlip = false;
        this.castShadow = false;
        this.receiveShadow = false;
        this.playbackSpeed = 1;
    }
    SpriteRenderer.prototype.setSprite = function (asset, materialType, customShader) {
        this._clearMesh();
        this.asset = asset;
        if (materialType != null)
            this.materialType = materialType;
        this.animationName = null;
        this.animationsByName = {};
        if (this.asset == null || this.asset.textures[this.asset.mapSlots["map"]] == null)
            return;
        this.frameToSecond = this.actor.gameInstance.framesPerSecond / this.asset.framesPerSecond;
        this.updateAnimationsByName();
        this.geometry = new THREE.PlaneBufferGeometry(this.asset.grid.width, this.asset.grid.height);
        if (this.materialType === "shader") {
            this.material = SupEngine.componentClasses["Shader"].createShaderMaterial(customShader, this.asset.textures, this.geometry);
            this.material.map = this.asset.textures[this.asset.mapSlots["map"]];
        }
        else {
            var material;
            if (this.materialType === "basic")
                material = new THREE.MeshBasicMaterial();
            else if (this.materialType === "phong") {
                material = new THREE.MeshPhongMaterial();
                material.lightMap = this.asset.textures[this.asset.mapSlots["light"]];
            }
            material.map = this.asset.textures[this.asset.mapSlots["map"]];
            material.specularMap = this.asset.textures[this.asset.mapSlots["specular"]];
            material.alphaMap = this.asset.textures[this.asset.mapSlots["alpha"]];
            if (this.materialType === "phong")
                material.normalMap = this.asset.textures[this.asset.mapSlots["normal"]];
            material.alphaTest = this.asset.alphaTest;
            material.color.setRGB(this.color.r, this.color.g, this.color.b);
            this.material = material;
            this.setOpacity(this.opacity);
        }
        this.material.side = THREE.DoubleSide;
        this.threeMesh = new THREE.Mesh(this.geometry, this.material);
        this.setCastShadow(this.castShadow);
        this.threeMesh.receiveShadow = this.receiveShadow;
        this.setFrame(0);
        this.actor.threeObject.add(this.threeMesh);
        this.updateShape();
    };
    SpriteRenderer.prototype.updateShape = function () {
        if (this.threeMesh == null)
            return;
        var scaleRatio = 1 / this.asset.pixelsPerUnit;
        this.threeMesh.scale.set(scaleRatio, scaleRatio, scaleRatio);
        var x;
        if (this.horizontalFlip)
            x = this.asset.origin.x - 0.5;
        else
            x = 0.5 - this.asset.origin.x;
        var y;
        if (this.verticalFlip)
            y = this.asset.origin.y - 0.5;
        else
            y = 0.5 - this.asset.origin.y;
        this.threeMesh.position.setX(x * this.asset.grid.width * scaleRatio);
        this.threeMesh.position.setY(y * this.asset.grid.height * scaleRatio);
        this.threeMesh.updateMatrixWorld(false);
    };
    SpriteRenderer.prototype.setOpacity = function (opacity) {
        this.opacity = opacity;
        if (this.material == null)
            return;
        if (this.opacity != null) {
            this.material.transparent = true;
            this.material.opacity = this.opacity;
        }
        else {
            this.material.transparent = false;
            this.material.opacity = 1;
        }
        this.material.needsUpdate = true;
    };
    SpriteRenderer.prototype.setHorizontalFlip = function (horizontalFlip) {
        this.horizontalFlip = horizontalFlip;
        if (this.asset == null)
            return;
        this.updateShape();
        if (this.animationName == null)
            this.setFrame(0);
        else
            this.updateFrame(false);
    };
    SpriteRenderer.prototype.setVerticalFlip = function (verticalFlip) {
        this.verticalFlip = verticalFlip;
        if (this.asset == null)
            return;
        this.updateShape();
        if (this.animationName == null)
            this.setFrame(0);
        else
            this.updateFrame(false);
    };
    SpriteRenderer.prototype.updateAnimationsByName = function () {
        this.animationsByName = {};
        for (var _i = 0, _a = this.asset.animations; _i < _a.length; _i++) {
            var animation = _a[_i];
            this.animationsByName[animation.name] = animation;
        }
    };
    SpriteRenderer.prototype._clearMesh = function () {
        if (this.threeMesh == null)
            return;
        this.actor.threeObject.remove(this.threeMesh);
        this.threeMesh.geometry.dispose();
        this.threeMesh.material.dispose();
        this.threeMesh = null;
        this.material = null;
    };
    SpriteRenderer.prototype.setCastShadow = function (castShadow) {
        this.castShadow = castShadow;
        this.threeMesh.castShadow = castShadow;
        if (!castShadow)
            return;
        this.actor.gameInstance.threeScene.traverse(function (object) {
            var material = object.material;
            if (material != null)
                material.needsUpdate = true;
        });
    };
    SpriteRenderer.prototype._destroy = function () {
        this._clearMesh();
        this.asset = null;
        _super.prototype._destroy.call(this);
    };
    SpriteRenderer.prototype.setFrame = function (frame) {
        var map = this.material.map;
        var frameX, frameY;
        if (this.asset.frameOrder === "rows") {
            var framesPerRow = Math.floor(map.size.width / this.asset.grid.width);
            frameX = frame % framesPerRow;
            frameY = Math.floor(frame / framesPerRow);
        }
        else {
            var framesPerColumn = Math.floor(map.size.height / this.asset.grid.height);
            frameX = Math.floor(frame / framesPerColumn);
            frameY = frame % framesPerColumn;
        }
        var left = (frameX * this.asset.grid.width) / map.size.width;
        var right = ((frameX + 1) * this.asset.grid.width) / map.size.width;
        var bottom = (map.size.height - (frameY + 1) * this.asset.grid.height) / map.size.height;
        var top = (map.size.height - frameY * this.asset.grid.height) / map.size.height;
        if (this.horizontalFlip)
            _a = [right, left], left = _a[0], right = _a[1];
        if (this.verticalFlip)
            _b = [bottom, top], top = _b[0], bottom = _b[1];
        var uvs = this.geometry.getAttribute("uv");
        uvs.needsUpdate = true;
        uvs.array[0] = left;
        uvs.array[1] = top;
        uvs.array[2] = right;
        uvs.array[3] = top;
        uvs.array[4] = left;
        uvs.array[5] = bottom;
        uvs.array[6] = right;
        uvs.array[7] = bottom;
        var _a, _b;
    };
    SpriteRenderer.prototype.setAnimation = function (newAnimationName, newAnimationLooping) {
        if (newAnimationLooping === void 0) { newAnimationLooping = true; }
        if (newAnimationName != null) {
            var animation = this.animationsByName[newAnimationName];
            if (animation == null)
                throw new Error("Animation " + newAnimationName + " doesn't exist");
            this.animationLooping = newAnimationLooping;
            if (newAnimationName === this.animationName && this.isAnimationPlaying)
                return;
            this.animation = animation;
            this.animationName = newAnimationName;
            if (this.playbackSpeed * animation.speed >= 0)
                this.animationTimer = 0;
            else
                this.animationTimer = this.getAnimationFrameCount() / this.frameToSecond - 1;
            this.isAnimationPlaying = true;
            this.updateFrame();
        }
        else {
            this.animation = null;
            this.animationName = null;
            this.setFrame(0);
        }
    };
    SpriteRenderer.prototype.getAnimation = function () { return this.animationName; };
    SpriteRenderer.prototype.setAnimationFrameTime = function (frameTime) {
        if (this.animationName == null)
            return;
        if (frameTime < 0 || frameTime > this.getAnimationFrameCount())
            throw new Error("Frame time must be >= 0 and < " + this.getAnimationFrameCount());
        this.animationTimer = frameTime * this.frameToSecond;
        this.updateFrame();
    };
    SpriteRenderer.prototype.getAnimationFrameTime = function () {
        if (this.animationName == null)
            return 0;
        return this.computeAbsoluteFrameTime() - this.animation.startFrameIndex;
    };
    SpriteRenderer.prototype.getAnimationFrameIndex = function () {
        if (this.animationName == null)
            return 0;
        return Math.floor(this.computeAbsoluteFrameTime()) - this.animation.startFrameIndex;
    };
    SpriteRenderer.prototype.getAnimationFrameCount = function () {
        if (this.animationName == null)
            return 0;
        return this.animation.endFrameIndex - this.animation.startFrameIndex + 1;
    };
    SpriteRenderer.prototype.playAnimation = function (animationLooping) {
        if (animationLooping === void 0) { animationLooping = true; }
        this.animationLooping = animationLooping;
        this.isAnimationPlaying = true;
        if (this.animationLooping)
            return;
        if (this.playbackSpeed * this.animation.speed > 0 && this.getAnimationFrameIndex() === this.getAnimationFrameCount() - 1)
            this.animationTimer = 0;
        else if (this.playbackSpeed * this.animation.speed < 0 && this.getAnimationFrameIndex() === 0)
            this.animationTimer = (this.getAnimationFrameCount() - 0.01) * this.frameToSecond;
    };
    SpriteRenderer.prototype.pauseAnimation = function () { this.isAnimationPlaying = false; };
    SpriteRenderer.prototype.stopAnimation = function () {
        if (this.animationName == null)
            return;
        this.isAnimationPlaying = false;
        this.animationTimer = 0;
        this.updateFrame();
    };
    SpriteRenderer.prototype.computeAbsoluteFrameTime = function () {
        var frame = this.animation.startFrameIndex;
        frame += this.animationTimer / this.frameToSecond;
        return frame;
    };
    SpriteRenderer.prototype.updateFrame = function (flagFrameUpdated) {
        if (flagFrameUpdated === void 0) { flagFrameUpdated = true; }
        if (flagFrameUpdated)
            this.hasFrameBeenUpdated = true;
        var frame = Math.floor(this.computeAbsoluteFrameTime());
        if (frame > this.animation.endFrameIndex) {
            if (this.animationLooping) {
                frame = this.animation.startFrameIndex;
                this.animationTimer = this.playbackSpeed * this.animation.speed;
            }
            else {
                frame = this.animation.endFrameIndex;
                this.animationTimer = (this.getAnimationFrameCount() - 0.01) * this.frameToSecond;
                this.isAnimationPlaying = false;
            }
        }
        else if (frame < this.animation.startFrameIndex) {
            if (this.animationLooping) {
                frame = this.animation.endFrameIndex;
                this.animationTimer = (this.getAnimationFrameCount() - 0.01) * this.frameToSecond + this.playbackSpeed * this.animation.speed;
            }
            else {
                frame = this.animation.startFrameIndex;
                this.animationTimer = 0;
                this.isAnimationPlaying = false;
            }
        }
        this.setFrame(frame);
    };
    SpriteRenderer.prototype.update = function () {
        if (this.material != null) {
            var uniforms = this.material.uniforms;
            if (uniforms != null)
                uniforms.time.value += 1 / this.actor.gameInstance.framesPerSecond;
        }
        if (this.hasFrameBeenUpdated) {
            this.hasFrameBeenUpdated = false;
            return;
        }
        this._tickAnimation();
        this.hasFrameBeenUpdated = false;
    };
    SpriteRenderer.prototype._tickAnimation = function () {
        if (this.animationName == null || !this.isAnimationPlaying)
            return;
        this.animationTimer += this.playbackSpeed * this.animation.speed;
        this.updateFrame();
    };
    SpriteRenderer.prototype.setIsLayerActive = function (active) { if (this.threeMesh != null)
        this.threeMesh.visible = active; };
    SpriteRenderer.Updater = SpriteRendererUpdater_1.default;
    return SpriteRenderer;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SpriteRenderer;

},{"./SpriteRendererUpdater":13}],13:[function(require,module,exports){
var THREE = SupEngine.THREE;
var SpriteRendererUpdater = (function () {
    function SpriteRendererUpdater(client, spriteRenderer, config, receiveAssetCallbacks, editAssetCallbacks) {
        this.looping = true;
        this.overrideOpacity = false;
        this.spriteSubscriber = {
            onAssetReceived: this._onSpriteAssetReceived.bind(this),
            onAssetEdited: this._onSpriteAssetEdited.bind(this),
            onAssetTrashed: this._onSpriteAssetTrashed.bind(this)
        };
        this.shaderSubscriber = {
            onAssetReceived: this._onShaderAssetReceived.bind(this),
            onAssetEdited: this._onShaderAssetEdited.bind(this),
            onAssetTrashed: this._onShaderAssetTrashed.bind(this)
        };
        this.client = client;
        this.spriteRenderer = spriteRenderer;
        this.receiveAssetCallbacks = receiveAssetCallbacks;
        this.editAssetCallbacks = editAssetCallbacks;
        this.spriteAssetId = config.spriteAssetId;
        this.animationId = config.animationId;
        this.materialType = config.materialType;
        this.shaderAssetId = config.shaderAssetId;
        if (config.overrideOpacity != null)
            this.overrideOpacity = config.overrideOpacity;
        this.spriteAsset = null;
        this.spriteRenderer.horizontalFlip = config.horizontalFlip;
        this.spriteRenderer.verticalFlip = config.verticalFlip;
        this.spriteRenderer.castShadow = config.castShadow;
        this.spriteRenderer.receiveShadow = config.receiveShadow;
        if (config.overrideOpacity)
            this.spriteRenderer.opacity = config.opacity;
        if (config.color != null) {
            var hex = parseInt(config.color, 16);
            this.spriteRenderer.color.r = (hex >> 16 & 255) / 255;
            this.spriteRenderer.color.g = (hex >> 8 & 255) / 255;
            this.spriteRenderer.color.b = (hex & 255) / 255;
        }
        if (this.spriteAssetId != null)
            this.client.subAsset(this.spriteAssetId, "sprite", this.spriteSubscriber);
        if (this.shaderAssetId != null)
            this.client.subAsset(this.shaderAssetId, "shader", this.shaderSubscriber);
    }
    SpriteRendererUpdater.prototype.destroy = function () {
        if (this.spriteAssetId != null)
            this.client.unsubAsset(this.spriteAssetId, this.spriteSubscriber);
        if (this.shaderAssetId != null)
            this.client.unsubAsset(this.shaderAssetId, this.shaderSubscriber);
    };
    SpriteRendererUpdater.prototype._onSpriteAssetReceived = function (assetId, asset) {
        var _this = this;
        if (this.spriteRenderer.opacity == null)
            this.spriteRenderer.opacity = asset.pub.opacity;
        this._prepareMaps(asset.pub.textures, function () {
            _this.spriteAsset = asset;
            _this._setSprite();
            if (_this.receiveAssetCallbacks != null)
                _this.receiveAssetCallbacks.sprite();
        });
    };
    SpriteRendererUpdater.prototype._prepareMaps = function (textures, callback) {
        var textureNames = Object.keys(textures);
        var texturesToLoad = textureNames.length;
        if (texturesToLoad === 0) {
            callback();
            return;
        }
        function onTextureLoaded() {
            texturesToLoad--;
            if (texturesToLoad === 0)
                callback();
        }
        textureNames.forEach(function (key) {
            var image = textures[key].image;
            if (!image.complete)
                image.addEventListener("load", onTextureLoaded);
            else
                onTextureLoaded();
        });
    };
    SpriteRendererUpdater.prototype._setSprite = function () {
        if (this.spriteAsset == null || (this.materialType === "shader" && this.shaderPub == null)) {
            this.spriteRenderer.setSprite(null);
            return;
        }
        this.spriteRenderer.setSprite(this.spriteAsset.pub, this.materialType, this.shaderPub);
        if (this.animationId != null)
            this._playAnimation();
    };
    SpriteRendererUpdater.prototype._playAnimation = function () {
        var animation = this.spriteAsset.animations.byId[this.animationId];
        if (animation == null)
            return;
        this.spriteRenderer.setAnimation(animation.name, this.looping);
    };
    SpriteRendererUpdater.prototype._onSpriteAssetEdited = function (id, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var callEditCallback = true;
        var commandFunction = this[("_onEditCommand_" + command)];
        if (commandFunction != null) {
            if (commandFunction.apply(this, args) === false)
                callEditCallback = false;
        }
        if (callEditCallback && this.editAssetCallbacks != null) {
            var editCallback = this.editAssetCallbacks.sprite[command];
            if (editCallback != null)
                editCallback.apply(null, args);
        }
    };
    SpriteRendererUpdater.prototype._onEditCommand_setMaps = function (maps) {
        var _this = this;
        // TODO: Only update the maps that changed, don't recreate the whole model
        this._prepareMaps(this.spriteAsset.pub.textures, function () {
            _this._setSprite();
            var editCallback = (_this.editAssetCallbacks != null) ? _this.editAssetCallbacks.sprite["setMaps"] : null;
            if (editCallback != null)
                editCallback();
        });
        return false;
    };
    SpriteRendererUpdater.prototype._onEditCommand_setMapSlot = function (slot, name) { this._setSprite(); };
    SpriteRendererUpdater.prototype._onEditCommand_deleteMap = function (name) { this._setSprite(); };
    SpriteRendererUpdater.prototype._onEditCommand_setProperty = function (path, value) {
        switch (path) {
            case "filtering":
                break;
            case "opacity":
                if (!this.overrideOpacity)
                    this.spriteRenderer.setOpacity(value);
                break;
            case "alphaTest":
                this.spriteRenderer.material.alphaTest = value;
                this.spriteRenderer.material.needsUpdate = true;
                break;
            case "pixelsPerUnit":
            case "origin.x":
            case "origin.y":
                this.spriteRenderer.updateShape();
                break;
            default:
                this._setSprite();
                break;
        }
    };
    SpriteRendererUpdater.prototype._onEditCommand_newAnimation = function () {
        this.spriteRenderer.updateAnimationsByName();
        this._playAnimation();
    };
    SpriteRendererUpdater.prototype._onEditCommand_deleteAnimation = function () {
        this.spriteRenderer.updateAnimationsByName();
        this._playAnimation();
    };
    SpriteRendererUpdater.prototype._onEditCommand_setAnimationProperty = function () {
        this.spriteRenderer.updateAnimationsByName();
        this._playAnimation();
    };
    SpriteRendererUpdater.prototype._onSpriteAssetTrashed = function () {
        this.spriteAsset = null;
        this.spriteRenderer.setSprite(null);
        // FIXME: the updater shouldn't be dealing with SupClient.onAssetTrashed directly
        if (this.editAssetCallbacks != null)
            SupClient.onAssetTrashed();
    };
    SpriteRendererUpdater.prototype._onShaderAssetReceived = function (assetId, asset) {
        this.shaderPub = asset.pub;
        this._setSprite();
    };
    SpriteRendererUpdater.prototype._onShaderAssetEdited = function (id, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (command !== "editVertexShader" && command !== "editFragmentShader")
            this._setSprite();
    };
    SpriteRendererUpdater.prototype._onShaderAssetTrashed = function () {
        this.shaderPub = null;
        this._setSprite();
    };
    SpriteRendererUpdater.prototype.config_setProperty = function (path, value) {
        switch (path) {
            case "spriteAssetId":
                if (this.spriteAssetId != null)
                    this.client.unsubAsset(this.spriteAssetId, this.spriteSubscriber);
                this.spriteAssetId = value;
                this.spriteAsset = null;
                this.spriteRenderer.setSprite(null);
                if (this.spriteAssetId != null)
                    this.client.subAsset(this.spriteAssetId, "sprite", this.spriteSubscriber);
                break;
            case "animationId":
                this.animationId = value;
                this._setSprite();
                break;
            case "looping":
                this.looping = value;
                if (this.animationId != null)
                    this._playAnimation();
                break;
            case "horizontalFlip":
                this.spriteRenderer.setHorizontalFlip(value);
                break;
            case "verticalFlip":
                this.spriteRenderer.setVerticalFlip(value);
                break;
            case "castShadow":
                this.spriteRenderer.setCastShadow(value);
                break;
            case "receiveShadow":
                this.spriteRenderer.receiveShadow = value;
                this.spriteRenderer.threeMesh.receiveShadow = value;
                this.spriteRenderer.threeMesh.material.needsUpdate = true;
                break;
            case "color":
                var hex = parseInt(value, 16);
                this.spriteRenderer.color.r = (hex >> 16 & 255) / 255;
                this.spriteRenderer.color.g = (hex >> 8 & 255) / 255;
                this.spriteRenderer.color.b = (hex & 255) / 255;
                var material = this.spriteRenderer.threeMesh.material;
                material.color.setRGB(this.spriteRenderer.color.r, this.spriteRenderer.color.g, this.spriteRenderer.color.b);
                material.needsUpdate = true;
                break;
            case "overrideOpacity":
                this.overrideOpacity = value;
                this.spriteRenderer.setOpacity(value ? null : this.spriteAsset.pub.opacity);
                break;
            case "opacity":
                this.spriteRenderer.setOpacity(value);
                break;
            case "materialType":
                this.materialType = value;
                this._setSprite();
                break;
            case "shaderAssetId":
                if (this.shaderAssetId != null)
                    this.client.unsubAsset(this.shaderAssetId, this.shaderSubscriber);
                this.shaderAssetId = value;
                this.shaderPub = null;
                this.spriteRenderer.setSprite(null);
                if (this.shaderAssetId != null)
                    this.client.subAsset(this.shaderAssetId, "shader", this.shaderSubscriber);
                break;
        }
    };
    return SpriteRendererUpdater;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SpriteRendererUpdater;

},{}],14:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SpriteAnimations = (function (_super) {
    __extends(SpriteAnimations, _super);
    function SpriteAnimations(pub) {
        _super.call(this, pub, SpriteAnimations.schema);
    }
    SpriteAnimations.schema = {
        name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
        startFrameIndex: { type: "number", min: 0, mutable: true },
        endFrameIndex: { type: "number", min: 0, mutable: true },
        speed: { type: "number", mutable: true }
    };
    return SpriteAnimations;
})(SupCore.Data.Base.ListById);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SpriteAnimations;

},{}],15:[function(require,module,exports){
(function (global,Buffer){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var path = require("path");

var async = require("async");
var SpriteAnimations_1 = require("./SpriteAnimations");
// Reference to THREE, client-side only
var THREE;
if (global.window != null && window.SupEngine != null)
    THREE = SupEngine.THREE;
var SpriteAsset = (function (_super) {
    __extends(SpriteAsset, _super);
    function SpriteAsset(id, pub, server) {
        _super.call(this, id, pub, SpriteAsset.schema, server);
    }
    SpriteAsset.prototype.init = function (options, callback) {
        var _this = this;
        this.server.data.resources.acquire("spriteSettings", null, function (err, spriteSettings) {
            _this.pub = {
                formatVersion: SpriteAsset.currentFormatVersion,
                maps: { map: new Buffer(0) },
                filtering: spriteSettings.pub.filtering,
                pixelsPerUnit: spriteSettings.pub.pixelsPerUnit,
                framesPerSecond: spriteSettings.pub.framesPerSecond,
                opacity: null,
                alphaTest: spriteSettings.pub.alphaTest,
                frameOrder: "rows",
                grid: { width: 100, height: 100 },
                origin: { x: 0.5, y: 0.5 },
                animations: [],
                advancedTextures: false,
                mapSlots: {
                    map: "map",
                    light: null,
                    specular: null,
                    alpha: null,
                    normal: null
                }
            };
            _this.server.data.resources.release("spriteSettings", null);
            _super.prototype.init.call(_this, options, callback);
        });
    };
    SpriteAsset.prototype.setup = function () {
        this.animations = new SpriteAnimations_1.default(this.pub.animations);
    };
    SpriteAsset.prototype.load = function (assetPath) {
        var _this = this;
        var pub;
        var loadMaps = function () {
            var mapsName = pub.maps;
            // NOTE: Support for multiple maps was introduced in Superpowers 0.11
            if (mapsName == null)
                mapsName = ["map"];
            pub.maps = {};
            async.series([
                function (callback) {
                    async.each(mapsName, function (key, cb) {
                        fs.readFile(path.join(assetPath, "map-" + key + ".dat"), function (err, buffer) {
                            // TODO: Handle error but ignore ENOENT
                            if (err != null) {
                                // NOTE: image.dat was renamed to "map-map.dat" in Superpowers 0.11
                                if (err.code === "ENOENT" && key === "map") {
                                    fs.readFile(path.join(assetPath, "image.dat"), function (err, buffer) {
                                        pub.maps[key] = buffer;
                                        fs.writeFile(path.join(assetPath, "map-" + key + ".dat"), buffer);
                                        fs.unlink(path.join(assetPath, "image.dat"));
                                        cb();
                                    });
                                }
                                else
                                    cb();
                                return;
                            }
                            pub.maps[key] = buffer;
                            cb();
                        });
                    }, function (err) { callback(err, null); });
                }
            ], function (err) { _this._onLoaded(assetPath, pub); });
        };
        fs.readFile(path.join(assetPath, "sprite.json"), { encoding: "utf8" }, function (err, json) {
            // NOTE: "asset.json" was renamed to "sprite.json" in Superpowers 0.11
            if (err != null && err.code === "ENOENT") {
                fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, function (err, json) {
                    fs.rename(path.join(assetPath, "asset.json"), path.join(assetPath, "sprite.json"), function (err) {
                        pub = JSON.parse(json);
                        loadMaps();
                    });
                });
            }
            else {
                pub = JSON.parse(json);
                loadMaps();
            }
        });
    };
    SpriteAsset.prototype.migrate = function (assetPath, pub, callback) {
        if (pub.formatVersion === SpriteAsset.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            // NOTE: Opacity setting was introduced in Superpowers 0.8
            if (typeof pub.opacity === "undefined")
                pub.opacity = 1;
            // NOTE: Support for multiple maps was introduced in Superpowers 0.11
            if (pub.frameOrder == null)
                pub.frameOrder = "rows";
            if (pub.advancedTextures == null) {
                pub.advancedTextures = false;
                pub.mapSlots = {
                    map: "map",
                    light: null,
                    specular: null,
                    alpha: null,
                    normal: null
                };
            }
            // NOTE: Animation speed was introduced in Superpowers 0.12
            for (var _i = 0, _a = pub.animations; _i < _a.length; _i++) {
                var animation = _a[_i];
                if (animation.speed == null)
                    animation.speed = 1;
            }
            pub.formatVersion = 1;
        }
        callback(true);
    };
    SpriteAsset.prototype.client_load = function () {
        this.mapObjectURLs = {};
        this._loadTextures();
    };
    SpriteAsset.prototype.client_unload = function () {
        this._unloadTextures();
    };
    SpriteAsset.prototype.save = function (assetPath, saveCallback) {
        var maps = this.pub.maps;
        var mapsName = [];
        for (var key in maps) {
            if (maps[key] != null)
                mapsName.push(key);
        }
        this.pub.maps = mapsName;
        var json = JSON.stringify(this.pub, null, 2);
        this.pub.maps = maps;
        async.series([
            function (callback) { fs.writeFile(path.join(assetPath, "sprite.json"), json, { encoding: "utf8" }, function (err) { callback(err, null); }); },
            function (callback) {
                async.each(mapsName, function (key, cb) {
                    var value = maps[key];
                    if (value == null) {
                        fs.unlink(path.join(assetPath, "map-" + key + ".dat"), function (err) {
                            if (err != null && err.code !== "ENOENT") {
                                cb(err);
                                return;
                            }
                            cb();
                        });
                        return;
                    }
                    fs.writeFile(path.join(assetPath, "map-" + key + ".dat"), value, cb);
                }, function (err) { callback(err, null); });
            }
        ], function (err) { saveCallback(err); });
    };
    SpriteAsset.prototype._unloadTextures = function () {
        for (var textureName in this.pub.textures)
            this.pub.textures[textureName].dispose();
        for (var key in this.mapObjectURLs) {
            URL.revokeObjectURL(this.mapObjectURLs[key]);
            delete this.mapObjectURLs[key];
        }
    };
    SpriteAsset.prototype._loadTextures = function () {
        var _this = this;
        this._unloadTextures();
        this.pub.textures = {};
        Object.keys(this.pub.maps).forEach(function (key) {
            var buffer = _this.pub.maps[key];
            if (buffer == null || buffer.byteLength === 0)
                return;
            var texture = _this.pub.textures[key];
            var image = (texture != null) ? texture.image : null;
            if (image == null) {
                image = new Image;
                texture = _this.pub.textures[key] = new THREE.Texture(image);
                if (_this.pub.filtering === "pixelated") {
                    texture.magFilter = THREE.NearestFilter;
                    texture.minFilter = THREE.NearestFilter;
                }
                var typedArray = new Uint8Array(buffer);
                var blob = new Blob([typedArray], { type: "image/*" });
                image.src = _this.mapObjectURLs[key] = URL.createObjectURL(blob);
            }
            if (!image.complete) {
                image.addEventListener("load", function () {
                    // Three.js might resize our texture to make its dimensions power-of-twos
                    // because of WebGL limitations (see https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL#Non_power-of-two_textures)
                    // so we store its original, non-power-of-two size for later use
                    texture.size = { width: image.width, height: image.height };
                    texture.needsUpdate = true;
                });
            }
        });
    };
    SpriteAsset.prototype.client_setProperty = function (path, value) {
        _super.prototype.client_setProperty.call(this, path, value);
        switch (path) {
            case "filtering":
                for (var textureName in this.pub.textures) {
                    var texture = this.pub.textures[textureName];
                    if (this.pub.filtering === "pixelated") {
                        texture.magFilter = THREE.NearestFilter;
                        texture.minFilter = THREE.NearestFilter;
                    }
                    else {
                        texture.magFilter = THREE.LinearFilter;
                        texture.minFilter = THREE.LinearMipMapLinearFilter;
                    }
                    texture.needsUpdate = true;
                }
                break;
        }
    };
    SpriteAsset.prototype.server_setMaps = function (client, maps, callback) {
        if (maps == null || typeof maps !== "object") {
            callback("Maps must be an object");
            return;
        }
        for (var key in maps) {
            var value = maps[key];
            if (this.pub.maps[key] == null) {
                callback("The map " + key + " doesn't exist");
                return;
            }
            if (value != null && !(value instanceof Buffer)) {
                callback("Value for " + key + " must be an ArrayBuffer or null");
                return;
            }
        }
        for (var key in maps)
            this.pub.maps[key] = maps[key];
        callback(null, maps);
        this.emit("change");
    };
    SpriteAsset.prototype.client_setMaps = function (maps) {
        for (var key in maps)
            this.pub.maps[key] = maps[key];
        this._loadTextures();
    };
    SpriteAsset.prototype.server_newMap = function (client, name, callback) {
        if (name == null || typeof name !== "string") {
            callback("Name of the map must be a string", null);
            return;
        }
        if (this.pub.maps[name] != null) {
            callback("The map " + name + " already exists", null);
            return;
        }
        this.pub.maps[name] = new Buffer(0);
        callback(null, name);
        this.emit("change");
    };
    SpriteAsset.prototype.client_newMap = function (name) {
        this.pub.maps[name] = new Buffer(0);
    };
    SpriteAsset.prototype.server_deleteMap = function (client, name, callback) {
        if (name == null || typeof name !== "string") {
            callback("Name of the map must be a string", null);
            return;
        }
        if (this.pub.maps[name] == null) {
            callback("The map " + name + " doesn't exist", null);
            return;
        }
        if (this.pub.mapSlots["map"] === name) {
            callback("The main map can't be deleted", null);
            return;
        }
        this.client_deleteMap(name);
        callback(null, name);
        this.emit("change");
    };
    SpriteAsset.prototype.client_deleteMap = function (name) {
        for (var slotName in this.pub.mapSlots) {
            var map = this.pub.mapSlots[slotName];
            if (map === name)
                this.pub.mapSlots[slotName] = null;
        }
        //NOTE: do not delete, the key must exist so the file can be deleted from the disk when the asset is saved
        this.pub.maps[name] = null;
    };
    SpriteAsset.prototype.server_renameMap = function (client, oldName, newName, callback) {
        if (oldName == null || typeof oldName !== "string") {
            callback("Name of the map must be a string", null, null);
            return;
        }
        if (newName == null || typeof newName !== "string") {
            callback("New name of the map must be a string", null, null);
            return;
        }
        if (this.pub.maps[newName] != null) {
            callback("The map " + newName + " already exists", null, null);
            return;
        }
        this.client_renameMap(oldName, newName);
        callback(null, oldName, newName);
        this.emit("change");
    };
    SpriteAsset.prototype.client_renameMap = function (oldName, newName) {
        this.pub.maps[newName] = this.pub.maps[oldName];
        this.pub.maps[oldName] = null;
        for (var slotName in this.pub.mapSlots) {
            var map = this.pub.mapSlots[slotName];
            if (map === oldName)
                this.pub.mapSlots[slotName] = newName;
        }
    };
    SpriteAsset.prototype.server_setMapSlot = function (client, slot, map, callback) {
        if (slot == null || typeof slot !== "string") {
            callback("Name of the slot must be a string", null, null);
            return;
        }
        if (map != null && typeof map !== "string") {
            callback("Name of the map must be a string", null, null);
            return;
        }
        if (map != null && this.pub.maps[map] == null) {
            callback("The map " + map + " doesn't exist", null, null);
            return;
        }
        if (slot === "map" && map == null) {
            callback("The main map can't be empty", null, null);
            return;
        }
        this.pub.mapSlots[slot] = map;
        callback(null, slot, map);
        this.emit("change");
    };
    SpriteAsset.prototype.client_setMapSlot = function (slot, map) {
        this.pub.mapSlots[slot] = map;
    };
    SpriteAsset.prototype.server_newAnimation = function (client, name, callback) {
        var _this = this;
        var animation = { id: null, name: name, startFrameIndex: 0, endFrameIndex: 0, speed: 1 };
        this.animations.add(animation, null, function (err, actualIndex) {
            if (err != null) {
                callback(err);
                return;
            }
            animation.name = SupCore.Data.ensureUniqueName(animation.id, animation.name, _this.animations.pub);
            callback(null, animation, actualIndex);
            _this.emit("change");
        });
    };
    SpriteAsset.prototype.client_newAnimation = function (animation, actualIndex) {
        this.animations.client_add(animation, actualIndex);
    };
    SpriteAsset.prototype.server_deleteAnimation = function (client, id, callback) {
        var _this = this;
        this.animations.remove(id, function (err) {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, id);
            _this.emit("change");
        });
    };
    SpriteAsset.prototype.client_deleteAnimation = function (id) {
        this.animations.client_remove(id);
        return;
    };
    SpriteAsset.prototype.server_moveAnimation = function (client, id, newIndex, callback) {
        var _this = this;
        this.animations.move(id, newIndex, function (err, actualIndex) {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, id, actualIndex);
            _this.emit("change");
        });
    };
    SpriteAsset.prototype.client_moveAnimation = function (id, newIndex) {
        this.animations.client_move(id, newIndex);
    };
    SpriteAsset.prototype.server_setAnimationProperty = function (client, id, key, value, callback) {
        var _this = this;
        if (key === "name") {
            if (typeof (value) !== "string") {
                callback("Invalid value");
                return;
            }
            value = value.trim();
            if (SupCore.Data.hasDuplicateName(id, value, this.animations.pub)) {
                callback("There's already an animation with this name");
                return;
            }
        }
        this.animations.setProperty(id, key, value, function (err, actualValue) {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, id, key, actualValue);
            _this.emit("change");
        });
    };
    SpriteAsset.prototype.client_setAnimationProperty = function (id, key, actualValue) {
        this.animations.client_setProperty(id, key, actualValue);
    };
    SpriteAsset.currentFormatVersion = 1;
    SpriteAsset.schema = {
        formatVersion: { type: "integer" },
        maps: {
            type: "hash",
            values: {
                type: "buffer",
            }
        },
        filtering: { type: "enum", items: ["pixelated", "smooth"], mutable: true },
        pixelsPerUnit: { type: "number", minExcluded: 0, mutable: true },
        framesPerSecond: { type: "number", minExcluded: 0, mutable: true },
        opacity: { type: "number?", min: 0, max: 1, mutable: true },
        alphaTest: { type: "number", min: 0, max: 1, mutable: true },
        frameOrder: { type: "enum", items: ["rows", "columns"], mutable: true },
        grid: {
            type: "hash",
            properties: {
                width: { type: "integer", min: 1, mutable: true },
                height: { type: "integer", min: 1, mutable: true }
            }
        },
        origin: {
            type: "hash",
            properties: {
                x: { type: "number", min: 0, max: 1, mutable: true },
                y: { type: "number", min: 0, max: 1, mutable: true }
            }
        },
        animations: { type: "array" },
        advancedTextures: { type: "boolean", mutable: true },
        mapSlots: {
            type: "hash",
            properties: {
                map: { type: "string?", mutable: true },
                light: { type: "string?", mutable: true },
                specular: { type: "string?", mutable: true },
                alpha: { type: "string?", mutable: true },
                normal: { type: "string?", mutable: true }
            }
        }
    };
    return SpriteAsset;
})(SupCore.Data.Base.Asset);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SpriteAsset;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"./SpriteAnimations":14,"async":2,"buffer":4,"path":9}],16:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var SelectionRenderer = (function (_super) {
    __extends(SelectionRenderer, _super);
    function SelectionRenderer(actor) {
        _super.call(this, actor, "SelectionRenderer");
        this.meshes = [];
    }
    SelectionRenderer.prototype.setIsLayerActive = function (active) {
        for (var _i = 0, _a = this.meshes; _i < _a.length; _i++) {
            var mesh = _a[_i];
            mesh.visible = active;
        }
    };
    SelectionRenderer.prototype.setup = function (width, height, start, end, frameOrder, framesPerDirection) {
        this.clearMesh();
        for (var i = start; i <= end; i++) {
            var geometry = new THREE.PlaneBufferGeometry(width, height);
            var material = new THREE.MeshBasicMaterial({
                color: 0x900090,
                alphaTest: 0.1,
                transparent: true,
                opacity: 0.5
            });
            var mesh = new THREE.Mesh(geometry, material);
            this.meshes.push(mesh);
            var x = void 0, y = void 0;
            if (frameOrder === "rows") {
                x = i % framesPerDirection;
                y = Math.floor(i / framesPerDirection);
            }
            else {
                x = Math.floor(i / framesPerDirection);
                y = i % framesPerDirection;
            }
            mesh.position.setX((x + 0.5) * width);
            mesh.position.setY(-(y + 0.5) * height);
            mesh.updateMatrixWorld(false);
            this.actor.threeObject.add(mesh);
        }
    };
    SelectionRenderer.prototype.clearMesh = function () {
        for (var _i = 0, _a = this.meshes; _i < _a.length; _i++) {
            var mesh = _a[_i];
            mesh.geometry.dispose();
            mesh.material.dispose();
            this.actor.threeObject.remove(mesh);
        }
        this.meshes.length = 0;
    };
    SelectionRenderer.prototype._destroy = function () {
        this.clearMesh();
        _super.prototype._destroy.call(this);
    };
    return SelectionRenderer;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SelectionRenderer;

},{}],17:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var SpriteOriginMarker = (function (_super) {
    __extends(SpriteOriginMarker, _super);
    function SpriteOriginMarker(actor) {
        _super.call(this, actor, "SpriteOriginMarker");
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(-0.2, 0, 0), new THREE.Vector3(0.2, 0, 0), new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(0, 0.2, 0));
        this.line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x333333, opacity: 0.25, transparent: true }));
        this.actor.threeObject.add(this.line);
        this.line.updateMatrixWorld(false);
    }
    SpriteOriginMarker.prototype.setIsLayerActive = function (active) {
        this.line.visible = active;
    };
    SpriteOriginMarker.prototype.setScale = function (scale) {
        this.line.scale.set(scale, scale, scale);
        this.line.updateMatrixWorld(false);
    };
    SpriteOriginMarker.prototype._destroy = function () {
        this.actor.threeObject.remove(this.line);
        this.line.geometry.dispose();
        this.line.material.dispose();
        this.line = null;
        _super.prototype._destroy.call(this);
    };
    return SpriteOriginMarker;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SpriteOriginMarker;

},{}],18:[function(require,module,exports){
var network_1 = require("./network");
var ui_1 = require("./ui");
var SpriteOriginMarker_1 = require("./SpriteOriginMarker");
var PerfectResize = require("perfect-resize");
var animationArea = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = animationArea;
new PerfectResize(document.querySelector(".animation-container"), "bottom");
animationArea.gameInstance = new SupEngine.GameInstance(document.querySelector(".animation-container canvas"));
animationArea.gameInstance.threeRenderer.setClearColor(0xbbbbbb);
var cameraActor = new SupEngine.Actor(animationArea.gameInstance, "Camera");
cameraActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 10));
var cameraComponent = new SupEngine.componentClasses["Camera"](cameraActor);
cameraComponent.setOrthographicMode(true);
cameraComponent.setOrthographicScale(10);
animationArea.cameraControls = new SupEngine.editorComponentClasses["Camera2DControls"](cameraActor, cameraComponent, { zoomSpeed: 1.5, zoomMin: 1, zoomMax: 200 });
var originActor = new SupEngine.Actor(animationArea.gameInstance, "Origin");
originActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 1));
animationArea.originMakerComponent = new SpriteOriginMarker_1.default(originActor);
function centerCamera() {
    if (network_1.data.spriteUpdater.spriteRenderer.asset == null)
        return;
    var pub = network_1.data.spriteUpdater.spriteAsset.pub;
    var scaleRatio = 1 / cameraComponent.orthographicScale;
    cameraActor.setLocalPosition(new SupEngine.THREE.Vector3((0.5 - pub.origin.x) * pub.grid.width * scaleRatio, (0.5 - pub.origin.y) * pub.grid.height * scaleRatio, 10));
}
exports.centerCamera = centerCamera;
function handleAnimationArea() {
    if (network_1.data != null && ui_1.default.selectedAnimationId != null) {
        if (!network_1.data.spriteUpdater.spriteRenderer.isAnimationPlaying) {
            ui_1.default.animationPlay.textContent = "▶";
        }
        else {
            ui_1.default.animationSlider.value = network_1.data.spriteUpdater.spriteRenderer.getAnimationFrameIndex().toString();
        }
    }
}
exports.handleAnimationArea = handleAnimationArea;

},{"./SpriteOriginMarker":17,"./network":20,"./ui":22,"perfect-resize":10}],19:[function(require,module,exports){
var spritesheetArea_1 = require("./spritesheetArea");
var animationArea_1 = require("./animationArea");
var lastTimestamp = 0;
var accumulatedTime = 0;
function tick(timestamp) {
    if (timestamp === void 0) { timestamp = 0; }
    accumulatedTime += timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    var _a = spritesheetArea_1.default.gameInstance.tick(accumulatedTime), updates = _a.updates, timeLeft = _a.timeLeft;
    accumulatedTime = timeLeft;
    if (updates > 0) {
        for (var i = 0; i < updates; i++) {
            animationArea_1.default.gameInstance.update();
            animationArea_1.handleAnimationArea();
        }
        spritesheetArea_1.default.gameInstance.draw();
        animationArea_1.default.gameInstance.draw();
    }
    requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

},{"./animationArea":18,"./spritesheetArea":21}],20:[function(require,module,exports){
var ui_1 = require("./ui");
var animationArea_1 = require("./animationArea");
var spritesheetArea_1 = require("./spritesheetArea");
var SpriteRenderer_1 = require("../../components/SpriteRenderer");
var SpriteRendererUpdater_1 = require("../../components/SpriteRendererUpdater");
exports.socket = SupClient.connect(SupClient.query.project);
exports.socket.on("connect", onConnected);
exports.socket.on("disconnect", SupClient.onDisconnected);
var onEditCommands = {};
function onConnected() {
    exports.data = {};
    exports.data.projectClient = new SupClient.ProjectClient(exports.socket);
    var spriteActor = new SupEngine.Actor(animationArea_1.default.gameInstance, "Sprite");
    var spriteRenderer = new SpriteRenderer_1.default(spriteActor);
    var config = { spriteAssetId: SupClient.query.asset, materialType: "basic" };
    var receiveCallbacks = { sprite: onAssetReceived };
    var editCallbacks = { sprite: onEditCommands };
    exports.data.spriteUpdater = new SpriteRendererUpdater_1.default(exports.data.projectClient, spriteRenderer, config, receiveCallbacks, editCallbacks);
}
function onAssetReceived() {
    var pub = exports.data.spriteUpdater.spriteAsset.pub;
    var texture = pub.textures[pub.mapSlots["map"]];
    var map = pub.maps[pub.mapSlots["map"]];
    spritesheetArea_1.default.spritesheet = {
        textures: { map: texture },
        filtering: pub.filtering,
        pixelsPerUnit: pub.pixelsPerUnit,
        framesPerSecond: pub.framesPerSecond,
        alphaTest: pub.alphaTest,
        mapSlots: { map: "map" },
        grid: { width: 0, height: 0 },
        origin: { x: 0, y: 1 },
        animations: []
    };
    if (texture != null) {
        spritesheetArea_1.default.spritesheet.grid.width = texture.size.width;
        spritesheetArea_1.default.spritesheet.grid.height = texture.size.height;
        spritesheetArea_1.default.spritesheet.textures["map"].needsUpdate = true;
        spritesheetArea_1.default.spriteRenderer.setSprite(spritesheetArea_1.default.spritesheet);
        ui_1.default.imageSize.value = texture.size.width + " \u00D7 " + texture.size.height;
    }
    animationArea_1.centerCamera();
    spritesheetArea_1.centerCamera();
    var width = texture != null ? texture.size.width / pub.grid.width : 1;
    var height = texture != null ? texture.size.height / pub.grid.height : 1;
    spritesheetArea_1.default.gridRenderer.setGrid({
        width: width, height: height,
        orthographicScale: 5,
        direction: -1,
        ratio: { x: pub.pixelsPerUnit / pub.grid.width, y: pub.pixelsPerUnit / pub.grid.height }
    });
    ui_1.default.allSettings.forEach(function (setting) {
        var parts = setting.split(".");
        var obj = pub;
        parts.slice(0, parts.length - 1).forEach(function (part) { obj = obj[part]; });
        ui_1.setupProperty(setting, obj[parts[parts.length - 1]]);
    });
    pub.animations.forEach(function (animation, index) {
        ui_1.setupAnimation(animation, index);
    });
    ui_1.setupAdvancedTextures(pub.advancedTextures);
    for (var mapName in pub.maps)
        if (pub.maps[mapName] != null)
            ui_1.setupMap(mapName);
    for (var slotName in pub.mapSlots)
        ui_1.default.mapSlotsInput[slotName].value = pub.mapSlots[slotName] != null ? pub.mapSlots[slotName] : "";
}
function editAsset() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    var callback;
    if (typeof args[args.length - 1] === "function")
        callback = args.pop();
    args.push(function (err, id) {
        if (err != null) {
            alert(err);
            return;
        }
        if (callback != null)
            callback(id);
    });
    exports.socket.emit.apply(exports.socket, ["edit:assets", SupClient.query.asset].concat(args));
}
exports.editAsset = editAsset;
onEditCommands.setProperty = function (path, value) {
    if (path === "advancedTextures")
        ui_1.setupAdvancedTextures(value);
    else
        ui_1.setupProperty(path, value);
};
onEditCommands.newAnimation = function (animation, index) { ui_1.setupAnimation(animation, index); };
onEditCommands.deleteAnimation = function (id) {
    var animationElt = ui_1.default.animationsTreeView.treeRoot.querySelector("[data-id='" + id + "']");
    ui_1.default.animationsTreeView.remove(animationElt);
    if (ui_1.default.selectedAnimationId === id)
        ui_1.updateSelectedAnimation();
};
onEditCommands.moveAnimation = function (id, index) {
    var animationElt = ui_1.default.animationsTreeView.treeRoot.querySelector("[data-id='" + id + "']");
    ui_1.default.animationsTreeView.insertAt(animationElt, "item", index);
};
onEditCommands.setAnimationProperty = function (id, key, value) {
    var animationElt = ui_1.default.animationsTreeView.treeRoot.querySelector("[data-id='" + id + "']");
    switch (key) {
        case "name":
            animationElt.querySelector(".name").textContent = value;
            break;
        case "startFrameIndex":
            animationElt.querySelector(".start-frame-index").value = value;
            if (id == ui_1.default.selectedAnimationId)
                spritesheetArea_1.updateSelection();
            break;
        case "endFrameIndex":
            animationElt.querySelector(".end-frame-index").value = value;
            if (id == ui_1.default.selectedAnimationId)
                spritesheetArea_1.updateSelection();
            break;
        case "speed":
            animationElt.querySelector(".speed").value = value;
            break;
    }
};
function updateSpritesheet() {
    var pub = exports.data.spriteUpdater.spriteAsset.pub;
    var texture = pub.textures[pub.mapSlots["map"]];
    if (texture == null)
        return;
    var asset = spritesheetArea_1.default.spritesheet;
    asset.textures["map"] = texture;
    asset.textures["map"].needsUpdate = true;
    asset.grid.width = texture.size.width;
    asset.grid.height = texture.size.height;
    asset.pixelsPerUnit = pub.pixelsPerUnit;
    spritesheetArea_1.default.spriteRenderer.setSprite(asset);
    spritesheetArea_1.default.gridRenderer.resize(texture.size.width / pub.grid.width, texture.size.height / pub.grid.height);
    ui_1.updateSelectedAnimation();
    ui_1.default.imageSize.value = texture.size.width + " \u00D7 " + texture.size.height;
}
onEditCommands.setMaps = function () { updateSpritesheet(); };
onEditCommands.newMap = function (name) { ui_1.setupMap(name); };
onEditCommands.renameMap = function (oldName, newName) {
    var pub = exports.data.spriteUpdater.spriteAsset.pub;
    var textureElt = ui_1.default.texturesTreeView.treeRoot.querySelector("[data-name=\"" + oldName + "\"]");
    textureElt.dataset["name"] = newName;
    textureElt.querySelector("span").textContent = newName;
    for (var slotName in pub.mapSlots)
        if (ui_1.default.mapSlotsInput[slotName].value === oldName)
            ui_1.default.mapSlotsInput[slotName].value = newName;
};
onEditCommands.deleteMap = function (name) {
    var textureElt = ui_1.default.texturesTreeView.treeRoot.querySelector("[data-name=\"" + name + "\"]");
    ui_1.default.texturesTreeView.remove(textureElt);
    var pub = exports.data.spriteUpdater.spriteAsset.pub;
    for (var slotName in pub.mapSlots)
        if (ui_1.default.mapSlotsInput[slotName].value === name)
            ui_1.default.mapSlotsInput[slotName].value = "";
};
onEditCommands.setMapSlot = function (slot, map) {
    ui_1.default.mapSlotsInput[slot].value = map != null ? map : "";
    if (slot === "map")
        updateSpritesheet();
};

},{"../../components/SpriteRenderer":12,"../../components/SpriteRendererUpdater":13,"./animationArea":18,"./spritesheetArea":21,"./ui":22}],21:[function(require,module,exports){
var ui_1 = require("./ui");
var network_1 = require("./network");
var SpriteRenderer_1 = require("../../components/SpriteRenderer");
var SelectionRenderer_1 = require("./SelectionRenderer");
var spritesheetArea = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = spritesheetArea;
spritesheetArea.gameInstance = new SupEngine.GameInstance(document.querySelector(".spritesheet-container canvas"));
spritesheetArea.gameInstance.threeRenderer.setClearColor(0xbbbbbb);
var cameraActor = new SupEngine.Actor(spritesheetArea.gameInstance, "Camera");
cameraActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 10));
var cameraComponent = new SupEngine.componentClasses["Camera"](cameraActor);
cameraComponent.setOrthographicMode(true);
cameraComponent.setOrthographicScale(10);
spritesheetArea.cameraControls = new SupEngine.editorComponentClasses["Camera2DControls"](cameraActor, cameraComponent, { zoomSpeed: 1.5, zoomMin: 1, zoomMax: 200 }, function () { spritesheetArea.gridRenderer.setOrthgraphicScale(cameraComponent.orthographicScale); });
var spriteActor = new SupEngine.Actor(spritesheetArea.gameInstance, "Sprite");
spritesheetArea.spriteRenderer = new SpriteRenderer_1.default(spriteActor);
var gridActor = new SupEngine.Actor(spritesheetArea.gameInstance, "Grid");
gridActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 1));
spritesheetArea.gridRenderer = new SupEngine.editorComponentClasses["GridRenderer"](gridActor);
var selectionActor = new SupEngine.Actor(spritesheetArea.gameInstance, "Selection");
selectionActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 2));
spritesheetArea.selectionRenderer = new SelectionRenderer_1.default(selectionActor);
function centerCamera() {
    if (spritesheetArea.spriteRenderer.asset == null)
        return;
    var pub = network_1.data.spriteUpdater.spriteAsset.pub;
    var scaleRatio = 1 / cameraComponent.orthographicScale;
    cameraActor.setLocalPosition(new SupEngine.THREE.Vector3(0.5 * pub.grid.width * scaleRatio, -0.5 * pub.grid.height * scaleRatio, 10));
}
exports.centerCamera = centerCamera;
function updateSelection() {
    if (ui_1.default.selectedAnimationId == null)
        return;
    var pub = network_1.data.spriteUpdater.spriteAsset.pub;
    var texture = pub.textures[pub.mapSlots["map"]];
    if (texture == null)
        return;
    var animation = network_1.data.spriteUpdater.spriteAsset.animations.byId[ui_1.default.selectedAnimationId];
    var width = pub.grid.width / pub.pixelsPerUnit;
    var height = pub.grid.height / pub.pixelsPerUnit;
    var framesPerDirection;
    if (pub.frameOrder === "rows")
        framesPerDirection = texture.size.width / pub.grid.width;
    else
        framesPerDirection = texture.size.height / pub.grid.height;
    spritesheetArea.selectionRenderer.setup(width, height, animation.startFrameIndex, animation.endFrameIndex, pub.frameOrder, framesPerDirection);
}
exports.updateSelection = updateSelection;

},{"../../components/SpriteRenderer":12,"./SelectionRenderer":16,"./network":20,"./ui":22}],22:[function(require,module,exports){
var network_1 = require("./network");
var animationArea_1 = require("./animationArea");
var spritesheetArea_1 = require("./spritesheetArea");
var SpriteAsset_1 = require("../../data/SpriteAsset");
/* tslint:disable */
var PerfectResize = require("perfect-resize");
var TreeView = require("dnd-tree-view");
/* tslint:enable */
var ui = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ui;
// Setup hotkeys
SupClient.setupHotkeys();
// Setup resizable panes
new PerfectResize(document.querySelector(".sidebar"), "right");
// Setup properties
var fileSelect = document.querySelector("input.file-select");
fileSelect.addEventListener("change", onFileSelectChange);
document.querySelector("button.upload").addEventListener("click", function () { fileSelect.click(); });
document.querySelector("button.download").addEventListener("click", function () {
    var textureName = network_1.data.spriteUpdater.spriteAsset.pub.mapSlots["map"];
    downloadTexture(textureName);
});
ui.allSettings = [
    "filtering", "pixelsPerUnit", "framesPerSecond", "opacity", "alphaTest",
    "frameOrder", "grid.width", "grid.height", "origin.x", "origin.y"];
ui.settings = {};
ui.allSettings.forEach(function (setting) {
    var parts = setting.split(".");
    var obj = ui.settings;
    var queryName = ".property-";
    parts.slice(0, parts.length - 1).forEach(function (part) {
        if (obj[part] == null)
            obj[part] = {};
        obj = obj[part];
        queryName += part + "-";
    });
    queryName += parts[parts.length - 1];
    var settingObj = obj[parts[parts.length - 1]] = document.querySelector(queryName);
    switch (setting) {
        case "filtering":
        case "frameOrder":
            settingObj.addEventListener("change", function (event) { network_1.editAsset("setProperty", setting, event.target.value); });
            break;
        case "opacity":
        case "alphaTest":
            settingObj.addEventListener("change", function (event) { network_1.editAsset("setProperty", setting, parseFloat(event.target.value)); });
            break;
        default:
            if (setting.indexOf("origin") !== -1)
                settingObj.addEventListener("change", function (event) { network_1.editAsset("setProperty", setting, event.target.value / 100); });
            else
                settingObj.addEventListener("change", function (event) { network_1.editAsset("setProperty", setting, parseInt(event.target.value, 10)); });
            break;
    }
});
ui.opacityCheckbox = document.querySelector("input.opacity-checkbox");
ui.opacityCheckbox.addEventListener("click", onCheckOpacity);
document.querySelector("button.set-grid-width").addEventListener("click", onSetGridWidth);
document.querySelector("button.set-grid-height").addEventListener("click", onSetGridHeight);
ui.imageSize = document.querySelector("td.image-size input");
// Animations
ui.animationsTreeView = new TreeView(document.querySelector(".animations-tree-view"), { dropCallback: onAnimationDrop });
ui.animationsTreeView.on("selectionChange", updateSelectedAnimation);
document.querySelector("button.new-animation").addEventListener("click", onNewAnimationClick);
document.querySelector("button.rename-animation").addEventListener("click", onRenameAnimationClick);
document.querySelector("button.delete-animation").addEventListener("click", onDeleteAnimationClick);
ui.animationPlay = document.querySelector("button.animation-play");
ui.animationPlay.addEventListener("click", onPlayAnimation);
ui.animationSlider = document.querySelector("input.animation-slider");
ui.animationSlider.addEventListener("input", onChangeAnimationTime);
document.querySelector("input.animation-loop").addEventListener("change", function (event) {
    network_1.data.spriteUpdater.config_setProperty("looping", event.target.checked);
});
// Advanced textures
ui.texturesPane = document.querySelector(".advanced-textures");
var texturePaneResizeHandle = new PerfectResize(ui.texturesPane, "bottom");
ui.texturesToogleButton = document.querySelector(".advanced-textures button.plus");
ui.texturesToogleButton.addEventListener("click", function () {
    var advancedTextures = !network_1.data.spriteUpdater.spriteAsset.pub.advancedTextures;
    network_1.editAsset("setProperty", "advancedTextures", advancedTextures);
});
ui.texturesTreeView = new TreeView(document.querySelector(".textures-tree-view"));
ui.texturesTreeView.on("selectionChange", updateSelectedMap);
ui.mapSlotsInput = {};
for (var slotName in SpriteAsset_1.default.schema["mapSlots"].properties) {
    ui.mapSlotsInput[slotName] = document.querySelector(".map-" + slotName);
    ui.mapSlotsInput[slotName].dataset["name"] = slotName;
    ui.mapSlotsInput[slotName].addEventListener("input", onEditMapSlot);
}
document.querySelector("button.new-map").addEventListener("click", onNewMapClick);
var mapFileSelect = document.querySelector(".upload-map.file-select");
mapFileSelect.addEventListener("change", onMapFileSelectChange);
document.querySelector("button.upload-map").addEventListener("click", function () { mapFileSelect.click(); });
document.querySelector("button.download-map").addEventListener("click", function () {
    if (ui.texturesTreeView.selectedNodes.length !== 1)
        return;
    var selectedNode = ui.texturesTreeView.selectedNodes[0];
    var textureName = selectedNode.dataset.name;
    downloadTexture(textureName);
});
document.querySelector("button.rename-map").addEventListener("click", onRenameMapClick);
document.querySelector("button.delete-map").addEventListener("click", onDeleteMapClick);
function onFileSelectChange(event) {
    if (event.target.files.length === 0)
        return;
    var reader = new FileReader();
    reader.onload = function (event) { network_1.editAsset("setMaps", { map: event.target.result }); };
    reader.readAsArrayBuffer(event.target.files[0]);
    event.target.parentElement.reset();
}
function downloadTexture(textureName) {
    var options = {
        initialValue: "Image",
        validationLabel: "Download"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a name for the image.", options, function (name) {
        /* tslint:enable:no-unused-expression */
        if (name == null)
            return;
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = network_1.data.spriteUpdater.spriteAsset.mapObjectURLs[textureName];
        a.download = name + ".png";
        a.click();
        document.body.removeChild(a);
    });
}
function onCheckOpacity(event) {
    var opacity = (event.target.checked) ? 1 : null;
    network_1.editAsset("setProperty", "opacity", opacity);
}
function onSetGridWidth(event) {
    var texture = network_1.data.spriteUpdater.spriteAsset.pub.textures["map"];
    if (texture == null)
        return;
    var options = {
        initialValue: "1",
        validationLabel: "Set grid width"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("How many frames per row?", options, function (framesPerRow) {
        /* tslint:enable:no-unused-expression */
        if (framesPerRow == null)
            return;
        var framesPerRowNum = parseInt(framesPerRow, 10);
        if (isNaN(framesPerRowNum))
            return;
        network_1.editAsset("setProperty", "grid.width", Math.floor(texture.size.width / framesPerRowNum));
    });
}
function onSetGridHeight(event) {
    var texture = network_1.data.spriteUpdater.spriteAsset.pub.textures["map"];
    if (texture == null)
        return;
    var options = {
        initialValue: "1",
        validationLabel: "Set grid height"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("How many frames per column?", options, function (framesPerColumn) {
        /* tslint:enable:no-unused-expression */
        if (framesPerColumn == null)
            return;
        var framesPerColumnNum = parseInt(framesPerColumn, 10);
        if (isNaN(framesPerColumnNum))
            return;
        network_1.editAsset("setProperty", "grid.height", Math.floor(texture.size.height / framesPerColumnNum));
    });
}
function onNewAnimationClick() {
    var options = {
        initialValue: "Animation",
        validationLabel: "Create"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a name for the animation.", options, function (name) {
        /* tslint:enable:no-unused-expression */
        if (name == null)
            return;
        network_1.editAsset("newAnimation", name, function (animationId) {
            ui.animationsTreeView.clearSelection();
            ui.animationsTreeView.addToSelection(ui.animationsTreeView.treeRoot.querySelector("li[data-id='" + animationId + "']"));
            updateSelectedAnimation();
        });
    });
}
function onRenameAnimationClick() {
    if (ui.animationsTreeView.selectedNodes.length !== 1)
        return;
    var selectedNode = ui.animationsTreeView.selectedNodes[0];
    var animation = network_1.data.spriteUpdater.spriteAsset.animations.byId[selectedNode.dataset.id];
    var options = {
        initialValue: animation.name,
        validationLabel: "Rename"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a new name for the animation.", options, function (newName) {
        /* tslint:enable:no-unused-expression */
        if (newName == null)
            return;
        network_1.editAsset("setAnimationProperty", animation.id, "name", newName);
    });
}
function onDeleteAnimationClick() {
    if (ui.animationsTreeView.selectedNodes.length === 0)
        return;
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.ConfirmDialog("Are you sure you want to delete the selected animations?", "Delete", function (confirm) {
        /* tslint:enable:no-unused-expression */
        if (!confirm)
            return;
        ui.animationsTreeView.selectedNodes.forEach(function (selectedNode) { network_1.editAsset("deleteAnimation", selectedNode.dataset.id); });
    });
}
function onAnimationDrop(dropInfo, orderedNodes) {
    var animationIds = [];
    orderedNodes.forEach(function (animation) { animationIds.push(animation.dataset.id); });
    var index = SupClient.getListViewDropIndex(dropInfo, network_1.data.spriteUpdater.spriteAsset.animations);
    animationIds.forEach(function (id, i) { network_1.editAsset("moveAnimation", id, index + i); });
    return false;
}
function updateSelectedAnimation() {
    var selectedAnimElt = ui.animationsTreeView.selectedNodes[0];
    if (selectedAnimElt != null) {
        ui.selectedAnimationId = selectedAnimElt.dataset.id;
        network_1.data.spriteUpdater.config_setProperty("animationId", ui.selectedAnimationId);
        ui.animationPlay.disabled = false;
        ui.animationSlider.disabled = false;
        ui.animationSlider.max = (network_1.data.spriteUpdater.spriteRenderer.getAnimationFrameCount() - 1).toString();
        spritesheetArea_1.updateSelection();
    }
    else {
        ui.selectedAnimationId = null;
        network_1.data.spriteUpdater.config_setProperty("animationId", null);
        ui.animationPlay.disabled = true;
        ui.animationSlider.disabled = true;
        ui.animationSlider.value = "0";
        spritesheetArea_1.default.selectionRenderer.clearMesh();
    }
    ui.animationPlay.textContent = "▐ ▌";
    var buttons = document.querySelectorAll(".animations-buttons button");
    for (var index = 0; index < buttons.length; index++) {
        var button = buttons.item(index);
        button.disabled = ui.selectedAnimationId == null && button.className !== "new-animation";
    }
}
exports.updateSelectedAnimation = updateSelectedAnimation;
function onPlayAnimation() {
    if (ui.animationPlay.textContent === "▐ ▌") {
        network_1.data.spriteUpdater.spriteRenderer.pauseAnimation();
        ui.animationPlay.textContent = "▶";
    }
    else {
        network_1.data.spriteUpdater.spriteRenderer.playAnimation(network_1.data.spriteUpdater.looping);
        ui.animationPlay.textContent = "▐ ▌";
    }
}
function onChangeAnimationTime() {
    if (network_1.data.spriteUpdater == null)
        return;
    network_1.data.spriteUpdater.spriteRenderer.setAnimationFrameTime(parseInt(ui.animationSlider.value, 10));
}
function setupProperty(path, value) {
    var parts = path.split(".");
    var obj = ui.settings;
    parts.slice(0, parts.length - 1).forEach(function (part) { obj = obj[part]; });
    if (path.indexOf("origin") !== -1)
        value *= 100;
    obj[parts[parts.length - 1]].value = value;
    var pub = network_1.data.spriteUpdater.spriteAsset.pub;
    if (path === "filtering" && spritesheetArea_1.default.spriteRenderer.asset != null) {
        if (pub.filtering === "pixelated") {
            spritesheetArea_1.default.spritesheet.textures["map"].magFilter = SupEngine.THREE.NearestFilter;
            spritesheetArea_1.default.spritesheet.textures["map"].minFilter = SupEngine.THREE.NearestFilter;
        }
        else {
            spritesheetArea_1.default.spritesheet.textures["map"].magFilter = SupEngine.THREE.LinearFilter;
            spritesheetArea_1.default.spritesheet.textures["map"].minFilter = SupEngine.THREE.LinearMipMapLinearFilter;
        }
        spritesheetArea_1.default.spritesheet.textures["map"].needsUpdate = true;
    }
    if (path === "opacity") {
        obj[parts[parts.length - 1]].disabled = value == null;
        ui.opacityCheckbox.checked = value != null;
        spritesheetArea_1.default.spriteRenderer.setOpacity(value != null ? 1 : null);
    }
    if (path === "alphaTest" && spritesheetArea_1.default.spriteRenderer.material != null) {
        spritesheetArea_1.default.spriteRenderer.material.alphaTest = value;
        spritesheetArea_1.default.spriteRenderer.material.needsUpdate = true;
    }
    if (path === "pixelsPerUnit") {
        // FIXME: .setPixelsPerUnit(...) maybe?
        spritesheetArea_1.default.spritesheet.pixelsPerUnit = value;
        spritesheetArea_1.default.spriteRenderer.updateShape();
        spritesheetArea_1.default.gridRenderer.setRatio({ x: pub.pixelsPerUnit / pub.grid.width, y: pub.pixelsPerUnit / pub.grid.height });
        spritesheetArea_1.default.cameraControls.setMultiplier(value);
        animationArea_1.default.cameraControls.setMultiplier(value);
        animationArea_1.default.originMakerComponent.setScale(100 / value);
        spritesheetArea_1.updateSelection();
    }
    if (path === "grid.width" || path === "grid.height") {
        spritesheetArea_1.default.gridRenderer.setRatio({ x: pub.pixelsPerUnit / pub.grid.width, y: pub.pixelsPerUnit / pub.grid.height });
        var texture = pub.textures[pub.mapSlots["map"]];
        if (texture != null) {
            spritesheetArea_1.default.gridRenderer.resize(texture.size.width / pub.grid.width, texture.size.height / pub.grid.height);
        }
        spritesheetArea_1.updateSelection();
    }
    if (path === "frameOrder")
        spritesheetArea_1.updateSelection();
}
exports.setupProperty = setupProperty;
function setupAnimation(animation, index) {
    var liElt = document.createElement("li");
    liElt.dataset["id"] = animation.id;
    var nameSpan = document.createElement("span");
    nameSpan.className = "name";
    nameSpan.textContent = animation.name;
    liElt.appendChild(nameSpan);
    var startFrameIndexInput = document.createElement("input");
    startFrameIndexInput.type = "number";
    startFrameIndexInput.min = "0";
    startFrameIndexInput.className = "start-frame-index";
    startFrameIndexInput.value = animation.startFrameIndex;
    liElt.appendChild(startFrameIndexInput);
    startFrameIndexInput.addEventListener("change", function (event) {
        var startFrameIndex = parseInt(event.target.value, 10);
        network_1.editAsset("setAnimationProperty", animation.id, "startFrameIndex", startFrameIndex);
        if (startFrameIndex > network_1.data.spriteUpdater.spriteAsset.animations.byId[ui.selectedAnimationId].endFrameIndex)
            network_1.editAsset("setAnimationProperty", animation.id, "endFrameIndex", startFrameIndex);
    });
    var endFrameIndexInput = document.createElement("input");
    endFrameIndexInput.type = "number";
    endFrameIndexInput.min = "0";
    endFrameIndexInput.className = "end-frame-index";
    endFrameIndexInput.value = animation.endFrameIndex;
    liElt.appendChild(endFrameIndexInput);
    endFrameIndexInput.addEventListener("change", function (event) {
        var endFrameIndex = parseInt(event.target.value, 10);
        network_1.editAsset("setAnimationProperty", animation.id, "endFrameIndex", endFrameIndex);
        if (endFrameIndex < network_1.data.spriteUpdater.spriteAsset.animations.byId[ui.selectedAnimationId].startFrameIndex)
            network_1.editAsset("setAnimationProperty", animation.id, "startFrameIndex", endFrameIndex);
    });
    var speedInput = document.createElement("input");
    speedInput.type = "number";
    speedInput.className = "speed";
    speedInput.value = animation.speed;
    liElt.appendChild(speedInput);
    speedInput.addEventListener("change", function (event) {
        network_1.editAsset("setAnimationProperty", animation.id, "speed", parseFloat(event.target.value));
    });
    ui.animationsTreeView.insertAt(liElt, "item", index, null);
}
exports.setupAnimation = setupAnimation;
function onEditMapSlot(event) {
    if (event.target.value !== "" && network_1.data.spriteUpdater.spriteAsset.pub.maps[event.target.value] == null)
        return;
    var slot = event.target.value !== "" ? event.target.value : null;
    network_1.editAsset("setMapSlot", event.target.dataset.name, slot);
}
function onNewMapClick() {
    var options = {
        initialValue: "map",
        validationLabel: "Create"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a new name for the map.", options, function (name) {
        /* tslint:enable:no-unused-expression */
        if (name == null)
            return;
        network_1.editAsset("newMap", name);
    });
}
function onMapFileSelectChange(event) {
    var reader = new FileReader;
    var maps = {};
    reader.onload = function (event) {
        maps[ui.selectedTextureName] = reader.result;
        network_1.editAsset("setMaps", maps);
    };
    var element = event.target;
    reader.readAsArrayBuffer(element.files[0]);
    element.parentElement.reset();
    return;
}
function onRenameMapClick() {
    if (ui.texturesTreeView.selectedNodes.length !== 1)
        return;
    var selectedNode = ui.texturesTreeView.selectedNodes[0];
    var textureName = selectedNode.dataset.name;
    var options = {
        initialValue: textureName,
        validationLabel: "Rename"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a new name for the texture.", options, function (newName) {
        /* tslint:enable:no-unused-expression */
        if (newName == null)
            return;
        network_1.editAsset("renameMap", textureName, newName);
    });
}
function onDeleteMapClick() {
    if (ui.texturesTreeView.selectedNodes.length === 0)
        return;
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.ConfirmDialog("Are you sure you want to delete the selected textures?", "Delete", function (confirm) {
        /* tslint:enable:no-unused-expression */
        if (!confirm)
            return;
        for (var _i = 0, _a = ui.texturesTreeView.selectedNodes; _i < _a.length; _i++) {
            var selectedNode = _a[_i];
            network_1.editAsset("deleteMap", selectedNode.dataset.name);
        }
    });
}
function setupAdvancedTextures(advancedTextures) {
    ui.texturesPane.classList.toggle("collapsed", !advancedTextures);
    ui.texturesToogleButton.textContent = !advancedTextures ? "+" : "–";
    texturePaneResizeHandle.handleElt.classList.toggle("disabled", !advancedTextures);
}
exports.setupAdvancedTextures = setupAdvancedTextures;
function updateSelectedMap() {
    var selectedMapElt = ui.texturesTreeView.selectedNodes[0];
    if (selectedMapElt != null)
        ui.selectedTextureName = selectedMapElt.dataset.name;
    else
        ui.selectedTextureName = null;
    var buttons = document.querySelectorAll(".textures-buttons button");
    for (var i = 0; i < buttons.length; i++) {
        var button = buttons[i];
        button.disabled = ui.selectedTextureName == null && button.className !== "new-map";
    }
}
exports.updateSelectedMap = updateSelectedMap;
function setupMap(mapName) {
    var liElt = document.createElement("li");
    liElt.dataset["name"] = mapName;
    var nameSpan = document.createElement("span");
    nameSpan.className = "name";
    nameSpan.textContent = mapName;
    liElt.appendChild(nameSpan);
    ui.texturesTreeView.insertAt(liElt, "item", 0, null);
}
exports.setupMap = setupMap;

},{"../../data/SpriteAsset":15,"./animationArea":18,"./network":20,"./spritesheetArea":21,"dnd-tree-view":5,"perfect-resize":10}]},{},[1]);
