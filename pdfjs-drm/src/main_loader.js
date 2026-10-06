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
 * main_loader.js
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

'use strict';

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('pdfjs/main_loader', ['exports', 'pdfjs/display/api',
                'pdfjs/display/annotation_layer', 'pdfjs/display/text_layer',
                'pdfjs/display/dom_utils', 'pdfjs/shared/util', 'pdfjs/display/svg',
                'pdfjs/display/global'],
            factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports, require('./display/api.js'),
            require('./display/annotation_layer.js'),
            require('./display/text_layer.js'), require('./display/dom_utils.js'),
            require('./shared/util.js'), require('./display/svg.js'),
            require('./display/global.js'));
    } else {
        factory((root.pdfjsMainLoader = {}), root.pdfjsDisplayAPI,
            root.pdfjsDisplayAnnotationLayer, root.pdfjsDisplayTextLayer,
            root.pdfjsDisplayDOMUtils, root.pdfjsSharedUtil, root.pdfjsDisplaySVG,
            root.pdfjsDisplayGlobal);
    }
}(this, function(exports, displayAPI, displayAnnotationLayer,
                 displayTextLayer, displayDOMUtils, sharedUtil,
                 displaySVG, displayGlobal) {

    // Sync the exports below with ./DRM file/template.
    exports.PDFJS = displayGlobal.PDFJS;
    exports.build = displayAPI.build;
    exports.version = displayAPI.version;
    exports.getDocument = displayAPI.getDocument;
    exports.PDFDataRangeTransport = displayAPI.PDFDataRangeTransport;
    exports.PDFWorker = displayAPI.PDFWorker;
    exports.renderTextLayer = displayTextLayer.renderTextLayer;
    exports.AnnotationLayer = displayAnnotationLayer.AnnotationLayer;
    exports.CustomStyle = displayDOMUtils.CustomStyle;
    exports.PasswordResponses = sharedUtil.PasswordResponses;
    exports.InvalidPDFException = sharedUtil.InvalidPDFException;
    exports.MissingPDFException = sharedUtil.MissingPDFException;
    exports.SVGGraphics = displaySVG.SVGGraphics;
    exports.UnexpectedResponseException = sharedUtil.UnexpectedResponseException;
    exports.OPS = sharedUtil.OPS;
    exports.UNSUPPORTED_FEATURES = sharedUtil.UNSUPPORTED_FEATURES;
    exports.isValidUrl = sharedUtil.isValidUrl;
    exports.createObjectURL = sharedUtil.createObjectURL;
    exports.removeNullCharacters = sharedUtil.removeNullCharacters;
    exports.shadow = sharedUtil.shadow;
    exports.createBlob = sharedUtil.createBlob;
    exports.getFilenameFromUrl = displayDOMUtils.getFilenameFromUrl;
    exports.addLinkAttributes = displayDOMUtils.addLinkAttributes;

}));
