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
 * pdf_attachment_viewer.js
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
        define('pdfjs-web/pdf_attachment_viewer', ['exports', 'pdfjs-web/pdfjs'],
            factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports, require('./pdfjs.js'));
    } else {
        factory((root.pdfjsWebPDFAttachmentViewer = {}), root.pdfjsWebPDFJS);
    }
}(this, function(exports, pdfjsLib) {

    /**
     * @typedef {Object} PDFAttachmentViewerOptions
     * @property {HTMLDivElement} container - The viewer element.
     * @property {EventBus} eventBus - The application event bus.
     * @property {DownloadManager} downloadManager - The download manager.
     */

    /**
     * @typedef {Object} PDFAttachmentViewerRenderParameters
     * @property {Array|null} attachments - An array of attachment objects.
     */

    /**
     * @class
     */
    var PDFAttachmentViewer = (function PDFAttachmentViewerClosure() {
        /**
         * @constructs PDFAttachmentViewer
         * @param {PDFAttachmentViewerOptions} options
         */
        function PDFAttachmentViewer(options) {
            this.attachments = null;
            this.container = options.container;
            this.eventBus = options.eventBus;
            this.downloadManager = options.downloadManager;
        }

        PDFAttachmentViewer.prototype = {
            reset : function PDFAttachmentViewer_reset() {
                this.attachments = null;

                var container = this.container;
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
            },

            /**
             * @private
             */
            _dispatchEvent :
                function PDFAttachmentViewer_dispatchEvent(attachmentsCount) {
                    this.eventBus.dispatch('attachmentsloaded', {
                        source           : this,
                        attachmentsCount : attachmentsCount
                    });
                },

            /**
             * @private
             */
            _bindLink :
                function PDFAttachmentViewer_bindLink(button, content, filename) {
                    button.onclick = function downloadFile(e) {
                        this.downloadManager.downloadData(content, filename, '');
                        return false;
                    }.bind(this);
                },

            /**
             * @param {PDFAttachmentViewerRenderParameters} params
             */
            render : function PDFAttachmentViewer_render(params) {
                var attachments = (params && params.attachments) || null;
                var attachmentsCount = 0;

                if (this.attachments) {
                    this.reset();
                }
                this.attachments = attachments;

                if (!attachments) {
                    this._dispatchEvent(attachmentsCount);
                    return;
                }

                var names = Object.keys(attachments).sort(function(a, b) {
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                });
                attachmentsCount = names.length;

                for (var i = 0; i < attachmentsCount; i++) {
                    var item = attachments[names[i]];
                    var filename = pdfjsLib.getFilenameFromUrl(item.filename);
                    var div = document.createElement('div');
                    div.className = 'attachmentsItem';
                    var button = document.createElement('button');
                    this._bindLink(button, item.content, filename);
                    button.textContent = pdfjsLib.removeNullCharacters(filename);
                    div.appendChild(button);
                    this.container.appendChild(div);
                }

                this._dispatchEvent(attachmentsCount);
            }
        };

        return PDFAttachmentViewer;
    })();

    exports.PDFAttachmentViewer = PDFAttachmentViewer;
}));
