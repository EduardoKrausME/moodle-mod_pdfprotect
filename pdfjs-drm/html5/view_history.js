// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * view_history.js
 *
 * @package   mod_pdfprotect
 * @copyright 2026 Eduardo Kraus {@link https://eduardokraus.com}
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('pdfjs-web/view_history', ['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((root.pdfjsWebViewHistory = {}));
    }
}(this, function(exports) {

    var DEFAULT_VIEW_HISTORY_CACHE_SIZE = 20;

    /**
     * View History - This is a utility for saving various view parameters for
     *                recently opened files.
     *
     * The way that the view parameters are stored depends on how DRM is built,
     * for 'gulp <flag>' the following cases exist:
     *  - FIREFOX or MOZCENTRAL - uses sessionStorage.
     *  - GENERIC or CHROME     - uses localStorage, if it is available.
     */
    var ViewHistory = (function ViewHistoryClosure() {
        function ViewHistory(fingerprint, cacheSize) {
            this.fingerprint = fingerprint;
            this.cacheSize = cacheSize || DEFAULT_VIEW_HISTORY_CACHE_SIZE;
            this.isInitializedPromiseResolved = false;
            this.initializedPromise =
                this._readFromStorage().then(function(databaseStr) {
                    this.isInitializedPromiseResolved = true;

                    var database = JSON.parse(databaseStr || '{}');
                    if (!('files' in database)) {
                        database.files = [];
                    }
                    if (database.files.length >= this.cacheSize) {
                        database.files.shift();
                    }
                    var index;
                    for (var i = 0, length = database.files.length; i < length; i++) {
                        var branch = database.files[i];
                        if (branch.fingerprint === this.fingerprint) {
                            index = i;
                            break;
                        }
                    }
                    if (typeof index !== 'number') {
                        index = database.files.push({fingerprint : this.fingerprint}) - 1;
                    }
                    this.file = database.files[index];
                    this.database = database;
                }.bind(this));
        }

        ViewHistory.prototype = {
            _writeToStorage : function ViewHistory_writeToStorage() {
                return new Promise(function(resolve) {
                    var databaseStr = JSON.stringify(this.database);

//#if FIREFOX || MOZCENTRAL
//      sessionStorage.setItem('pdfjsHistory', databaseStr);
//      resolve();
//#endif

//#if !(FIREFOX || MOZCENTRAL)
                    localStorage.setItem('database', databaseStr);
                    resolve();
//#endif
                }.bind(this));
            },

            _readFromStorage : function ViewHistory_readFromStorage() {
                return new Promise(function(resolve) {
//#if FIREFOX || MOZCENTRAL
//      resolve(sessionStorage.getItem('pdfjsHistory'));
//#endif

//#if !(FIREFOX || MOZCENTRAL)
                    resolve(localStorage.getItem('database'));
//#endif
                });
            },

            set : function ViewHistory_set(name, val) {
                if (!this.isInitializedPromiseResolved) {
                    return;
                }
                this.file[name] = val;
                return this._writeToStorage();
            },

            setMultiple : function ViewHistory_setMultiple(properties) {
                if (!this.isInitializedPromiseResolved) {
                    return;
                }
                for (var name in properties) {
                    this.file[name] = properties[name];
                }
                return this._writeToStorage();
            },

            get : function ViewHistory_get(name, defaultValue) {
                if (!this.isInitializedPromiseResolved) {
                    return defaultValue;
                }
                return this.file[name] || defaultValue;
            }
        };

        return ViewHistory;
    })();

    exports.ViewHistory = ViewHistory;
}));
