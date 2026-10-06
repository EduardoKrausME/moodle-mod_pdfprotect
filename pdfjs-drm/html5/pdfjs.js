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
 * pdfjs.js
 *
 * @package   mod_pdfprotect
 * @copyright 2026 Eduardo Kraus {@link https://eduardokraus.com}
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/* Copyright 2016 Mozilla Foundation
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
/* umdutils ignore */

'use strict';

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('pdfjs-web/pdfjs', ['exports', 'pdfjs/main_loader'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports, require('../src/main_loader.js'));
    } else {
        factory((root.pdfjsWebPDFJS = {}), root.pdfjsMainLoader);
    }
}(this, function(exports, mainLoader) {
    // Re-export all mainLoader members.
    for (var i in mainLoader) {
        if (Object.prototype.hasOwnProperty.call(mainLoader, i)) {
            exports[i] = mainLoader[i];
        }
    }
}));
