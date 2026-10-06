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
 * frameworks.js
 *
 * @package   mod_pdfprotect
 * @copyright 2026 Eduardo Kraus {@link https://eduardokraus.com}
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/* Copyright 2015 Mozilla Foundation
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
/* globals require, module, requirejs,
           workerSrc: true, isWorkerDisabled: true */

// included from api.js for GENERIC build

'use strict';

var useRequireEnsure = false;
if (typeof window === 'undefined') {
    // node.js - disable worker and set require.ensure.
    isWorkerDisabled = true;
    if (typeof require.ensure === 'undefined') {
        require.ensure = require('node-ensure');
    }
    useRequireEnsure = true;
}
if (typeof __webpack_require__ !== 'undefined') {
    useRequireEnsure = true;
}
if (typeof requirejs !== 'undefined' && requirejs.toUrl) {
    workerSrc = requirejs.toUrl('pdfjs-dist/build/pdf.worker.js');
}
var dynamicLoaderSupported = typeof requirejs !== 'undefined' && requirejs.load;
var fakeWorkerFilesLoader = useRequireEnsure ? (function(callback) {
    require.ensure([], function() {
        var worker = require('./pdf.worker.js');
        callback(worker.WorkerMessageHandler);
    });
}) : dynamicLoaderSupported ? (function(callback) {
    requirejs(['pdfjs-dist/build/pdf.worker'], function(worker) {
        callback(worker.WorkerMessageHandler);
    });
}) : null;
