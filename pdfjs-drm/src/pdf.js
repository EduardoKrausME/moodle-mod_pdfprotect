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
 * pdf.js
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
/* jshint globalstrict: false */
/* umdutils ignore */

(function(root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
//#expand define('__BUNDLE_AMD_NAME__', ['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
//#expand factory((root.__BUNDLE_JS_NAME__ = {}));
    }
}(this, function(exports) {
    // Use strict in our context only - users might not want it
    'use strict';

//#expand var pdfjsVersion = '__BUNDLE_VERSION__';
//#expand var pdfjsBuild = '__BUNDLE_BUILD__';

    var pdfjsFilePath =
            typeof document !== 'undefined' && document.currentScript ?
                document.currentScript.src : null;

    var pdfjsLibs = {};

    (function pdfjsWrapper() {

//#expand __BUNDLE__

    }).call(pdfjsLibs);

//#if MAIN_FILE
    exports.PDFJS = pdfjsLibs.pdfjsDisplayGlobal.PDFJS;
    exports.build = pdfjsLibs.pdfjsDisplayAPI.build;
    exports.version = pdfjsLibs.pdfjsDisplayAPI.version;
    exports.getDocument = pdfjsLibs.pdfjsDisplayAPI.getDocument;
    exports.PDFDataRangeTransport =
        pdfjsLibs.pdfjsDisplayAPI.PDFDataRangeTransport;
    exports.PDFWorker = pdfjsLibs.pdfjsDisplayAPI.PDFWorker;
    exports.renderTextLayer = pdfjsLibs.pdfjsDisplayTextLayer.renderTextLayer;
    exports.AnnotationLayer =
        pdfjsLibs.pdfjsDisplayAnnotationLayer.AnnotationLayer;
    exports.CustomStyle = pdfjsLibs.pdfjsDisplayDOMUtils.CustomStyle;
    exports.PasswordResponses = pdfjsLibs.pdfjsSharedUtil.PasswordResponses;
    exports.InvalidPDFException = pdfjsLibs.pdfjsSharedUtil.InvalidPDFException;
    exports.MissingPDFException = pdfjsLibs.pdfjsSharedUtil.MissingPDFException;
    exports.SVGGraphics = pdfjsLibs.pdfjsDisplaySVG.SVGGraphics;
    exports.UnexpectedResponseException =
        pdfjsLibs.pdfjsSharedUtil.UnexpectedResponseException;
    exports.OPS = pdfjsLibs.pdfjsSharedUtil.OPS;
    exports.UNSUPPORTED_FEATURES = pdfjsLibs.pdfjsSharedUtil.UNSUPPORTED_FEATURES;
    exports.isValidUrl = pdfjsLibs.pdfjsSharedUtil.isValidUrl;
    exports.createObjectURL = pdfjsLibs.pdfjsSharedUtil.createObjectURL;
    exports.removeNullCharacters = pdfjsLibs.pdfjsSharedUtil.removeNullCharacters;
    exports.shadow = pdfjsLibs.pdfjsSharedUtil.shadow;
    exports.createBlob = pdfjsLibs.pdfjsSharedUtil.createBlob;
    exports.getFilenameFromUrl =
        pdfjsLibs.pdfjsDisplayDOMUtils.getFilenameFromUrl;
    exports.addLinkAttributes = pdfjsLibs.pdfjsDisplayDOMUtils.addLinkAttributes;
//#else
    exports.WorkerMessageHandler = pdfjsLibs.pdfjsCoreWorker.WorkerMessageHandler;
//#endif
}));
