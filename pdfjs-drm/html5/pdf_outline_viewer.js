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
 * pdf_outline_viewer.js
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
        define('pdfjs-web/pdf_outline_viewer', ['exports', 'pdfjs-web/pdfjs'],
            factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports, require('./pdfjs.js'));
    } else {
        factory((root.pdfjsWebPDFOutlineViewer = {}), root.pdfjsWebPDFJS);
    }
}(this, function(exports, pdfjsLib) {

    var DEFAULT_TITLE = '\u2013';

    /**
     * @typedef {Object} PDFOutlineViewerOptions
     * @property {HTMLDivElement} container - The viewer element.
     * @property {IPDFLinkService} linkService - The navigation/linking service.
     * @property {EventBus} eventBus - The application event bus.
     */

    /**
     * @typedef {Object} PDFOutlineViewerRenderParameters
     * @property {Array|null} outline - An array of outline objects.
     */

    /**
     * @class
     */
    var PDFOutlineViewer = (function PDFOutlineViewerClosure() {
        /**
         * @constructs PDFOutlineViewer
         * @param {PDFOutlineViewerOptions} options
         */
        function PDFOutlineViewer(options) {
            this.outline = null;
            this.lastToggleIsShow = true;
            this.container = options.container;
            this.linkService = options.linkService;
            this.eventBus = options.eventBus;
        }

        PDFOutlineViewer.prototype = {
            reset : function PDFOutlineViewer_reset() {
                this.outline = null;
                this.lastToggleIsShow = true;

                var container = this.container;
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
            },

            /**
             * @private
             */
            _dispatchEvent : function PDFOutlineViewer_dispatchEvent(outlineCount) {
                this.eventBus.dispatch('outlineloaded', {
                    source       : this,
                    outlineCount : outlineCount
                });
            },

            /**
             * @private
             */
            _bindLink : function PDFOutlineViewer_bindLink(element, item) {
                if (item.url) {
                    pdfjsLib.addLinkAttributes(element, {url : item.url});
                    return;
                }
                var linkService = this.linkService;
                element.href = linkService.getDestinationHash(item.dest);
                element.onclick = function goToDestination(e) {
                    linkService.navigateTo(item.dest);
                    return false;
                };
            },

            /**
             * @private
             */
            _setStyles : function PDFOutlineViewer_setStyles(element, item) {
                var styleStr = '';
                if (item.bold) {
                    styleStr += 'font-weight: bold;';
                }
                if (item.italic) {
                    styleStr += 'font-style: italic;';
                }

                if (styleStr) {
                    element.setAttribute('style', styleStr);
                }
            },

            /**
             * Prepend a button before an outline item which allows the user to toggle
             * the visibility of all outline items at that level.
             *
             * @private
             */
            _addToggleButton : function PDFOutlineViewer_addToggleButton(div) {
                var toggler = document.createElement('div');
                toggler.className = 'outlineItemToggler';
                toggler.onclick = function(event) {
                    event.stopPropagation();
                    toggler.classList.toggle('outlineItemsHidden');

                    if (event.shiftKey) {
                        var shouldShowAll = !toggler.classList.contains('outlineItemsHidden');
                        this._toggleOutlineItem(div, shouldShowAll);
                    }
                }.bind(this);
                div.insertBefore(toggler, div.firstChild);
            },

            /**
             * Toggle the visibility of the subtree of an outline item.
             *
             * @param {Element} root - the root of the outline (sub)tree.
             * @param {boolean} show - whether to show the outline (sub)tree. If false,
             *   the outline subtree rooted at |root| will be collapsed.
             *
             * @private
             */
            _toggleOutlineItem :
                function PDFOutlineViewer_toggleOutlineItem(root, show) {
                    this.lastToggleIsShow = show;
                    var togglers = root.querySelectorAll('.outlineItemToggler');
                    for (var i = 0, ii = togglers.length; i < ii; ++i) {
                        togglers[i].classList[show ? 'remove' : 'add']('outlineItemsHidden');
                    }
                },

            /**
             * Collapse or expand all subtrees of the outline.
             */
            toggleOutlineTree : function PDFOutlineViewer_toggleOutlineTree() {
                if (!this.outline) {
                    return;
                }
                this._toggleOutlineItem(this.container, !this.lastToggleIsShow);
            },

            /**
             * @param {PDFOutlineViewerRenderParameters} params
             */
            render : function PDFOutlineViewer_render(params) {
                var outline = (params && params.outline) || null;
                var outlineCount = 0;

                if (this.outline) {
                    this.reset();
                }
                this.outline = outline;

                if (!outline) {
                    this._dispatchEvent(outlineCount);
                    return;
                }

                var fragment = document.createDocumentFragment();
                var queue = [{parent : fragment, items : this.outline}];
                var hasAnyNesting = false;
                while (queue.length > 0) {
                    var levelData = queue.shift();
                    for (var i = 0, len = levelData.items.length; i < len; i++) {
                        var item = levelData.items[i];

                        var div = document.createElement('div');
                        div.className = 'outlineItem';

                        var element = document.createElement('a');
                        this._bindLink(element, item);
                        this._setStyles(element, item);
                        element.textContent =
                            pdfjsLib.removeNullCharacters(item.title) || DEFAULT_TITLE;

                        div.appendChild(element);

                        if (item.items.length > 0) {
                            hasAnyNesting = true;
                            this._addToggleButton(div);

                            var itemsDiv = document.createElement('div');
                            itemsDiv.className = 'outlineItems';
                            div.appendChild(itemsDiv);
                            queue.push({parent : itemsDiv, items : item.items});
                        }

                        levelData.parent.appendChild(div);
                        outlineCount++;
                    }
                }
                if (hasAnyNesting) {
                    this.container.classList.add('outlineWithDeepNesting');
                }

                this.container.appendChild(fragment);

                this._dispatchEvent(outlineCount);
            }
        };

        return PDFOutlineViewer;
    })();

    exports.PDFOutlineViewer = PDFOutlineViewer;
}));
