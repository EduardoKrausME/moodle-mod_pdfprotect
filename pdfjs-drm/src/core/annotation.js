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
        define('pdfjs/core/annotation', ['exports', 'pdfjs/shared/util',
            'pdfjs/core/primitives', 'pdfjs/core/stream', 'pdfjs/core/colorspace',
            'pdfjs/core/obj', 'pdfjs/core/evaluator'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports, require('../shared/util.js'), require('./primitives.js'),
            require('./stream.js'), require('./colorspace.js'), require('./obj.js'),
            require('./evaluator.js'));
    } else {
        factory((root.pdfjsCoreAnnotation = {}), root.pdfjsSharedUtil,
            root.pdfjsCorePrimitives, root.pdfjsCoreStream, root.pdfjsCoreColorSpace,
            root.pdfjsCoreObj, root.pdfjsCoreEvaluator);
    }
}(this, function(exports, sharedUtil, corePrimitives, coreStream,
                 coreColorSpace, coreObj, coreEvaluator) {

    var AnnotationBorderStyleType = sharedUtil.AnnotationBorderStyleType;
    var AnnotationFlag = sharedUtil.AnnotationFlag;
    var AnnotationType = sharedUtil.AnnotationType;
    var OPS = sharedUtil.OPS;
    var Util = sharedUtil.Util;
    var isBool = sharedUtil.isBool;
    var isString = sharedUtil.isString;
    var isArray = sharedUtil.isArray;
    var isInt = sharedUtil.isInt;
    var isValidUrl = sharedUtil.isValidUrl;
    var stringToBytes = sharedUtil.stringToBytes;
    var stringToPDFString = sharedUtil.stringToPDFString;
    var stringToUTF8String = sharedUtil.stringToUTF8String;
    var warn = sharedUtil.warn;
    var Dict = corePrimitives.Dict;
    var isDict = corePrimitives.isDict;
    var isName = corePrimitives.isName;
    var Stream = coreStream.Stream;
    var ColorSpace = coreColorSpace.ColorSpace;
    var ObjectLoader = coreObj.ObjectLoader;
    var FileSpec = coreObj.FileSpec;
    var OperatorList = coreEvaluator.OperatorList;

    /**
     * @class
     * @alias AnnotationFactory
     */
    function AnnotationFactory() {
    }

    AnnotationFactory.prototype = /** @lends AnnotationFactory.prototype */ {
        /**
         * @param {XRef} xref
         * @param {Object} ref
         * @returns {Annotation}
         */
        create : function AnnotationFactory_create(xref, ref) {
            var dict = xref.fetchIfRef(ref);
            if (!isDict(dict)) {
                return;
            }

            // Determine the annotation's subtype.
            var subtype = dict.get('Subtype');
            subtype = isName(subtype) ? subtype.name : '';

            // Return the right annotation object based on the subtype and field type.
            var parameters = {
                xref : xref,
                dict : dict,
                ref  : ref
            };

            switch (subtype) {
                case 'Link':
                    return new LinkAnnotation(parameters);

                case 'Text':
                    return new TextAnnotation(parameters);

                case 'Widget':
                    var fieldType = Util.getInheritableProperty(dict, 'FT');
                    if (isName(fieldType) && fieldType.name === 'Tx') {
                        return new TextWidgetAnnotation(parameters);
                    }
                    return new WidgetAnnotation(parameters);

                case 'Popup':
                    return new PopupAnnotation(parameters);

                case 'Highlight':
                    return new HighlightAnnotation(parameters);

                case 'Underline':
                    return new UnderlineAnnotation(parameters);

                case 'Squiggly':
                    return new SquigglyAnnotation(parameters);

                case 'StrikeOut':
                    return new StrikeOutAnnotation(parameters);

                case 'FileAttachment':
                    return new FileAttachmentAnnotation(parameters);

                default:
                    warn('Unimplemented annotation type "' + subtype + '", ' +
                        'falling back to base annotation');
                    return new Annotation(parameters);
            }
        }
    };

    var Annotation = (function AnnotationClosure() {
        // 12.5.5: Algorithm: Appearance streams
        function getTransformMatrix(rect, bbox, matrix) {
            var bounds = Util.getAxialAlignedBoundingBox(bbox, matrix);
            var minX = bounds[0];
            var minY = bounds[1];
            var maxX = bounds[2];
            var maxY = bounds[3];

            if (minX === maxX || minY === maxY) {
                // From real-life file, bbox was [0, 0, 0, 0]. In this case,
                // just apply the transform for rect
                return [1, 0, 0, 1, rect[0], rect[1]];
            }

            var xRatio = (rect[2] - rect[0]) / (maxX - minX);
            var yRatio = (rect[3] - rect[1]) / (maxY - minY);
            return [
                xRatio,
                0,
                0,
                yRatio,
                rect[0] - minX * xRatio,
                rect[1] - minY * yRatio
            ];
        }

        function getDefaultAppearance(dict) {
            var appearanceState = dict.get('AP');
            if (!isDict(appearanceState)) {
                return;
            }

            var appearance;
            var appearances = appearanceState.get('N');
            if (isDict(appearances)) {
                var as = dict.get('AS');
                if (as && appearances.has(as.name)) {
                    appearance = appearances.get(as.name);
                }
            } else {
                appearance = appearances;
            }
            return appearance;
        }

        function Annotation(params) {
            var dict = params.dict;

            this.setFlags(dict.get('F'));
            this.setRectangle(dict.getArray('Rect'));
            this.setColor(dict.getArray('C'));
            this.setBorderStyle(dict);
            this.appearance = getDefaultAppearance(dict);

            // Expose public properties using a data object.
            this.data = {};
            this.data.id = params.ref.toString();
            this.data.subtype = dict.get('Subtype').name;
            this.data.annotationFlags = this.flags;
            this.data.rect = this.rectangle;
            this.data.color = this.color;
            this.data.borderStyle = this.borderStyle;
            this.data.hasAppearance = !!this.appearance;
        }

        Annotation.prototype = {
            /**
             * @private
             */
            _hasFlag : function Annotation_hasFlag(flags, flag) {
                return !!(flags & flag);
            },

            /**
             * @private
             */
            _isViewable : function Annotation_isViewable(flags) {
                return !this._hasFlag(flags, AnnotationFlag.INVISIBLE) &&
                    !this._hasFlag(flags, AnnotationFlag.HIDDEN) &&
                    !this._hasFlag(flags, AnnotationFlag.NOVIEW);
            },

            /**
             * @private
             */
            _isPrintable : function AnnotationFlag_isPrintable(flags) {
                return this._hasFlag(flags, AnnotationFlag.PRINT) &&
                    !this._hasFlag(flags, AnnotationFlag.INVISIBLE) &&
                    !this._hasFlag(flags, AnnotationFlag.HIDDEN);
            },

            /**
             * @return {boolean}
             */
            get viewable() {
                if (this.flags === 0) {
                    return true;
                }
                return this._isViewable(this.flags);
            },

            /**
             * @return {boolean}
             */
            get printable() {
                if (this.flags === 0) {
                    return false;
                }
                return this._isPrintable(this.flags);
            },

            /**
             * Set the flags.
             *
             * @public
             * @memberof Annotation
             * @param {number} flags - Unsigned 32-bit integer specifying annotation
             *                         characteristics
             * @see {@link shared/util.js}
             */
            setFlags : function Annotation_setFlags(flags) {
                this.flags = (isInt(flags) && flags > 0) ? flags : 0;
            },

            /**
             * Check if a provided flag is set.
             *
             * @public
             * @memberof Annotation
             * @param {number} flag - Hexadecimal representation for an annotation
             *                        characteristic
             * @return {boolean}
             * @see {@link shared/util.js}
             */
            hasFlag : function Annotation_hasFlag(flag) {
                return this._hasFlag(this.flags, flag);
            },

            /**
             * Set the rectangle.
             *
             * @public
             * @memberof Annotation
             * @param {Array} rectangle - The rectangle array with exactly four entries
             */
            setRectangle : function Annotation_setRectangle(rectangle) {
                if (isArray(rectangle) && rectangle.length === 4) {
                    this.rectangle = Util.normalizeRect(rectangle);
                } else {
                    this.rectangle = [0, 0, 0, 0];
                }
            },

            /**
             * Set the color and take care of color space conversion.
             *
             * @public
             * @memberof Annotation
             * @param {Array} color - The color array containing either 0
             *                        (transparent), 1 (grayscale), 3 (RGB) or
             *                        4 (CMYK) elements
             */
            setColor : function Annotation_setColor(color) {
                var rgbColor = new Uint8Array(3); // Black in RGB color space (default)
                if (!isArray(color)) {
                    this.color = rgbColor;
                    return;
                }

                switch (color.length) {
                    case 0: // Transparent, which we indicate with a null value
                        this.color = null;
                        break;

                    case 1: // Convert grayscale to RGB
                        ColorSpace.singletons.gray.getRgbItem(color, 0, rgbColor, 0);
                        this.color = rgbColor;
                        break;

                    case 3: // Convert RGB percentages to RGB
                        ColorSpace.singletons.rgb.getRgbItem(color, 0, rgbColor, 0);
                        this.color = rgbColor;
                        break;

                    case 4: // Convert CMYK to RGB
                        ColorSpace.singletons.cmyk.getRgbItem(color, 0, rgbColor, 0);
                        this.color = rgbColor;
                        break;

                    default:
                        this.color = rgbColor;
                        break;
                }
            },

            /**
             * Set the border style (as AnnotationBorderStyle object).
             *
             * @public
             * @memberof Annotation
             * @param {Dict} borderStyle - The border style dictionary
             */
            setBorderStyle : function Annotation_setBorderStyle(borderStyle) {
                this.borderStyle = new AnnotationBorderStyle();
                if (!isDict(borderStyle)) {
                    return;
                }
                if (borderStyle.has('BS')) {
                    var dict = borderStyle.get('BS');
                    var dictType;

                    if (!dict.has('Type') || (isName(dictType = dict.get('Type')) &&
                        dictType.name === 'Border')) {
                        this.borderStyle.setWidth(dict.get('W'));
                        this.borderStyle.setStyle(dict.get('S'));
                        this.borderStyle.setDashArray(dict.getArray('D'));
                    }
                } else if (borderStyle.has('Border')) {
                    var array = borderStyle.getArray('Border');
                    if (isArray(array) && array.length >= 3) {
                        this.borderStyle.setHorizontalCornerRadius(array[0]);
                        this.borderStyle.setVerticalCornerRadius(array[1]);
                        this.borderStyle.setWidth(array[2]);

                        if (array.length === 4) { // Dash array available
                            this.borderStyle.setDashArray(array[3]);
                        }
                    }
                } else {
                    // There are no border entries in the dictionary. According to the
                    // specification, we should draw a solid border of width 1 in that
                    // case, but Adobe Reader did not implement that part of the
                    // specification and instead draws no border at all, so we do the same.
                    // See also https://github.com/mozilla/DRM/issues/6179.
                    this.borderStyle.setWidth(0);
                }
            },

            /**
             * Prepare the annotation for working with a popup in the display layer.
             *
             * @private
             * @memberof Annotation
             * @param {Dict} dict - The annotation's data dictionary
             */
            _preparePopup : function Annotation_preparePopup(dict) {
                if (!dict.has('C')) {
                    // Fall back to the default background color.
                    this.data.color = null;
                }

                this.data.hasPopup = dict.has('Popup');
                this.data.title = stringToPDFString(dict.get('T') || '');
                this.data.contents = stringToPDFString(dict.get('Contents') || '');
            },

            loadResources : function Annotation_loadResources(keys) {
                return new Promise(function(resolve, reject) {
                    this.appearance.dict.getAsync('Resources').then(function(pdfprotects) {
                        if (!pdfprotects) {
                            resolve();
                            return;
                        }
                        var objectLoader = new ObjectLoader(pdfprotects.map,
                            keys,
                            pdfprotects.xref);
                        objectLoader.load().then(function() {
                            resolve(pdfprotects);
                        }, reject);
                    }, reject);
                }.bind(this));
            },

            getOperatorList : function Annotation_getOperatorList(evaluator, task) {
                if (!this.appearance) {
                    return Promise.resolve(new OperatorList());
                }

                var data = this.data;
                var appearanceDict = this.appearance.dict;
                var pdfprotectsPromise = this.loadResources([
                    'ExtGState',
                    'ColorSpace',
                    'Pattern',
                    'Shading',
                    'XObject',
                    'Font'
                    // ProcSet
                    // Properties
                ]);
                var bbox = appearanceDict.getArray('BBox') || [0, 0, 1, 1];
                var matrix = appearanceDict.getArray('Matrix') || [1, 0, 0, 1, 0, 0];
                var transform = getTransformMatrix(data.rect, bbox, matrix);
                var self = this;

                return pdfprotectsPromise.then(function(pdfprotects) {
                    var opList = new OperatorList();
                    opList.addOp(OPS.beginAnnotation, [data.rect, transform, matrix]);
                    return evaluator.getOperatorList(self.appearance, task,
                        pdfprotects, opList).then(function() {
                        opList.addOp(OPS.endAnnotation, []);
                        self.appearance.reset();
                        return opList;
                    });
                });
            }
        };

        Annotation.appendToOperatorList = function Annotation_appendToOperatorList(
            annotations, opList, partialEvaluator, task, intent) {
            var annotationPromises = [];
            for (var i = 0, n = annotations.length; i < n; ++i) {
                if ((intent === 'display' && annotations[i].viewable) ||
                    (intent === 'print' && annotations[i].printable)) {
                    annotationPromises.push(
                        annotations[i].getOperatorList(partialEvaluator, task));
                }
            }
            return Promise.all(annotationPromises).then(function(operatorLists) {
                opList.addOp(OPS.beginAnnotations, []);
                for (var i = 0, n = operatorLists.length; i < n; ++i) {
                    opList.addOpList(operatorLists[i]);
                }
                opList.addOp(OPS.endAnnotations, []);
            });
        };

        return Annotation;
    })();

    /**
     * Contains all data regarding an annotation's border style.
     *
     * @class
     */
    var AnnotationBorderStyle = (function AnnotationBorderStyleClosure() {
        /**
         * @constructor
         * @private
         */
        function AnnotationBorderStyle() {
            this.width = 1;
            this.style = AnnotationBorderStyleType.SOLID;
            this.dashArray = [3];
            this.horizontalCornerRadius = 0;
            this.verticalCornerRadius = 0;
        }

        AnnotationBorderStyle.prototype = {
            /**
             * Set the width.
             *
             * @public
             * @memberof AnnotationBorderStyle
             * @param {integer} width - The width
             */
            setWidth : function AnnotationBorderStyle_setWidth(width) {
                if (width === (width | 0)) {
                    this.width = width;
                }
            },

            /**
             * Set the style.
             *
             * @public
             * @memberof AnnotationBorderStyle
             * @param {Object} style - The style object
             * @see {@link shared/util.js}
             */
            setStyle : function AnnotationBorderStyle_setStyle(style) {
                if (!style) {
                    return;
                }
                switch (style.name) {
                    case 'S':
                        this.style = AnnotationBorderStyleType.SOLID;
                        break;

                    case 'D':
                        this.style = AnnotationBorderStyleType.DASHED;
                        break;

                    case 'B':
                        this.style = AnnotationBorderStyleType.BEVELED;
                        break;

                    case 'I':
                        this.style = AnnotationBorderStyleType.INSET;
                        break;

                    case 'U':
                        this.style = AnnotationBorderStyleType.UNDERLINE;
                        break;

                    default:
                        break;
                }
            },

            /**
             * Set the dash array.
             *
             * @public
             * @memberof AnnotationBorderStyle
             * @param {Array} dashArray - The dash array with at least one element
             */
            setDashArray : function AnnotationBorderStyle_setDashArray(dashArray) {
                // We validate the dash array, but we do not use it because CSS does not
                // allow us to change spacing of dashes. For more information, visit
                // http://www.w3.org/TR/css3-background/#the-border-style.
                if (isArray(dashArray) && dashArray.length > 0) {
                    // According to the PDF specification: the elements in a dashArray
                    // shall be numbers that are nonnegative and not all equal to zero.
                    var isValid = true;
                    var allZeros = true;
                    for (var i = 0, len = dashArray.length; i < len; i++) {
                        var element = dashArray[i];
                        var validNumber = (+element >= 0);
                        if (!validNumber) {
                            isValid = false;
                            break;
                        } else if (element > 0) {
                            allZeros = false;
                        }
                    }
                    if (isValid && !allZeros) {
                        this.dashArray = dashArray;
                    } else {
                        this.width = 0; // Adobe behavior when the array is invalid.
                    }
                } else if (dashArray) {
                    this.width = 0; // Adobe behavior when the array is invalid.
                }
            },

            /**
             * Set the horizontal corner radius (from a Border dictionary).
             *
             * @public
             * @memberof AnnotationBorderStyle
             * @param {integer} radius - The horizontal corner radius
             */
            setHorizontalCornerRadius :
                function AnnotationBorderStyle_setHorizontalCornerRadius(radius) {
                    if (radius === (radius | 0)) {
                        this.horizontalCornerRadius = radius;
                    }
                },

            /**
             * Set the vertical corner radius (from a Border dictionary).
             *
             * @public
             * @memberof AnnotationBorderStyle
             * @param {integer} radius - The vertical corner radius
             */
            setVerticalCornerRadius :
                function AnnotationBorderStyle_setVerticalCornerRadius(radius) {
                    if (radius === (radius | 0)) {
                        this.verticalCornerRadius = radius;
                    }
                }
        };

        return AnnotationBorderStyle;
    })();

    var WidgetAnnotation = (function WidgetAnnotationClosure() {
        function WidgetAnnotation(params) {
            Annotation.call(this, params);

            var dict = params.dict;
            var data = this.data;

            data.annotationType = AnnotationType.WIDGET;
            data.fieldValue = stringToPDFString(
                Util.getInheritableProperty(dict, 'V') || '');
            data.alternativeText = stringToPDFString(dict.get('TU') || '');
            data.defaultAppearance = Util.getInheritableProperty(dict, 'DA') || '';
            var fieldType = Util.getInheritableProperty(dict, 'FT');
            data.fieldType = isName(fieldType) ? fieldType.name : '';
            data.fieldFlags = Util.getInheritableProperty(dict, 'Ff') || 0;
            this.fieldResources = Util.getInheritableProperty(dict, 'DR') || Dict.empty;

            // Hide unsupported Widget signatures.
            if (data.fieldType === 'Sig') {
                warn('unimplemented annotation type: Widget signature');
                this.setFlags(AnnotationFlag.HIDDEN);
            }

            // Building the full field name by collecting the field and
            // its ancestors 'T' data and joining them using '.'.
            var fieldName = [];
            var namedItem = dict;
            var ref = params.ref;
            while (namedItem) {
                var parent = namedItem.get('Parent');
                var parentRef = namedItem.getRaw('Parent');
                var name = namedItem.get('T');
                if (name) {
                    fieldName.unshift(stringToPDFString(name));
                } else if (parent && ref) {
                    // The field name is absent, that means more than one field
                    // with the same name may exist. Replacing the empty name
                    // with the '`' plus index in the parent's 'Kids' array.
                    // This is not in the PDF spec but necessary to id the
                    // the input controls.
                    var kids = parent.get('Kids');
                    var j, jj;
                    for (j = 0, jj = kids.length; j < jj; j++) {
                        var kidRef = kids[j];
                        if (kidRef.num === ref.num && kidRef.gen === ref.gen) {
                            break;
                        }
                    }
                    fieldName.unshift('`' + j);
                }
                namedItem = parent;
                ref = parentRef;
            }
            data.fullName = fieldName.join('.');
        }

        Util.inherit(WidgetAnnotation, Annotation, {});

        return WidgetAnnotation;
    })();

    var TextWidgetAnnotation = (function TextWidgetAnnotationClosure() {
        function TextWidgetAnnotation(params) {
            WidgetAnnotation.call(this, params);

            this.data.textAlignment = Util.getInheritableProperty(params.dict, 'Q');
        }

        Util.inherit(TextWidgetAnnotation, WidgetAnnotation, {
            getOperatorList : function TextWidgetAnnotation_getOperatorList(evaluator,
                                                                            task) {
                if (this.appearance) {
                    return Annotation.prototype.getOperatorList.call(this, evaluator, task);
                }

                var opList = new OperatorList();
                var data = this.data;

                // Even if there is an appearance stream, ignore it. This is the
                // behaviour used by Adobe Reader.
                if (!data.defaultAppearance) {
                    return Promise.resolve(opList);
                }

                var stream = new Stream(stringToBytes(data.defaultAppearance));
                return evaluator.getOperatorList(stream, task,
                    this.fieldResources, opList).then(function() {
                    return opList;
                });
            }
        });

        return TextWidgetAnnotation;
    })();

    var TextAnnotation = (function TextAnnotationClosure() {
        var DEFAULT_ICON_SIZE = 22; // px

        function TextAnnotation(parameters) {
            Annotation.call(this, parameters);

            this.data.annotationType = AnnotationType.TEXT;

            if (this.data.hasAppearance) {
                this.data.name = 'NoIcon';
            } else {
                this.data.rect[1] = this.data.rect[3] - DEFAULT_ICON_SIZE;
                this.data.rect[2] = this.data.rect[0] + DEFAULT_ICON_SIZE;
                this.data.name = parameters.dict.has('Name') ?
                    parameters.dict.get('Name').name : 'Note';
            }
            this._preparePopup(parameters.dict);
        }

        Util.inherit(TextAnnotation, Annotation, {});

        return TextAnnotation;
    })();

    var LinkAnnotation = (function LinkAnnotationClosure() {
        function LinkAnnotation(params) {
            Annotation.call(this, params);

            var dict = params.dict;
            var data = this.data;
            data.annotationType = AnnotationType.LINK;

            var action = dict.get('A'), url, dest;
            if (action && isDict(action)) {
                var linkType = action.get('S').name;
                switch (linkType) {
                    case 'URI':
                        url = action.get('URI');
                        if (isName(url)) {
                            // Some bad PDFs do not put parentheses around relative URLs.
                            url = '/' + url.name;
                        } else if (url) {
                            url = addDefaultProtocolToUrl(url);
                        }
                        // TODO: pdf spec mentions urls can be relative to a Base
                        // entry in the dictionary.
                        break;

                    case 'GoTo':
                        dest = action.get('D');
                        break;

                    case 'GoToR':
                        var urlDict = action.get('F');
                        if (isDict(urlDict)) {
                            // We assume that we found a FileSpec dictionary
                            // and fetch the URL without checking any further.
                            url = urlDict.get('F') || null;
                        } else if (isString(urlDict)) {
                            url = urlDict;
                        }

                        // NOTE: the destination is relative to the *remote* document.
                        var remoteDest = action.get('D');
                        if (remoteDest) {
                            if (isName(remoteDest)) {
                                remoteDest = remoteDest.name;
                            }
                            if (isString(remoteDest) && isString(url)) {
                                var baseUrl = url.split('#')[0];
                                url = baseUrl + '#' + remoteDest;
                            }
                        }
                        // The 'NewWindow' property, equal to `LinkTarget.BLANK`.
                        var newWindow = action.get('NewWindow');
                        if (isBool(newWindow)) {
                            data.newWindow = newWindow;
                        }
                        break;

                    case 'Named':
                        data.action = action.get('N').name;
                        break;

                    default:
                        warn('unrecognized link type: ' + linkType);
                }
            } else if (dict.has('Dest')) { // Simple destination link.
                dest = dict.get('Dest');
            }

            if (url) {
                if (isValidUrl(url, /* allowRelative = */ false)) {
                    data.url = tryConvertUrlEncoding(url);
                }
            }
            if (dest) {
                data.dest = isName(dest) ? dest.name : dest;
            }
        }

        // Lets URLs beginning with 'www.' default to using the 'http://' protocol.
        function addDefaultProtocolToUrl(url) {
            if (isString(url) && url.indexOf('www.') === 0) {
                return ('http://' + url);
            }
            return url;
        }

        function tryConvertUrlEncoding(url) {
            // According to ISO 32000-1:2008, section 12.6.4.7, URIs should be encoded
            // in 7-bit ASCII. Some bad PDFs use UTF-8 encoding, see Bugzilla 1122280.
            try {
                return stringToUTF8String(url);
            } catch (e) {
                return url;
            }
        }

        Util.inherit(LinkAnnotation, Annotation, {});

        return LinkAnnotation;
    })();

    var PopupAnnotation = (function PopupAnnotationClosure() {
        function PopupAnnotation(parameters) {
            Annotation.call(this, parameters);

            this.data.annotationType = AnnotationType.POPUP;

            var dict = parameters.dict;
            var parentItem = dict.get('Parent');
            if (!parentItem) {
                warn('Popup annotation has a missing or invalid parent annotation.');
                return;
            }

            this.data.parentId = dict.getRaw('Parent').toString();
            this.data.title = stringToPDFString(parentItem.get('T') || '');
            this.data.contents = stringToPDFString(parentItem.get('Contents') || '');

            if (!parentItem.has('C')) {
                // Fall back to the default background color.
                this.data.color = null;
            } else {
                this.setColor(parentItem.getArray('C'));
                this.data.color = this.color;
            }

            // If the Popup annotation is not viewable, but the parent annotation is,
            // that is most likely a bug. Fallback to inherit the flags from the parent
            // annotation (this is consistent with the behaviour in Adobe Reader).
            if (!this.viewable) {
                var parentFlags = parentItem.get('F');
                if (this._isViewable(parentFlags)) {
                    this.setFlags(parentFlags);
                }
            }
        }

        Util.inherit(PopupAnnotation, Annotation, {});

        return PopupAnnotation;
    })();

    var HighlightAnnotation = (function HighlightAnnotationClosure() {
        function HighlightAnnotation(parameters) {
            Annotation.call(this, parameters);

            this.data.annotationType = AnnotationType.HIGHLIGHT;
            this._preparePopup(parameters.dict);

            // PDF viewers completely ignore any border styles.
            this.data.borderStyle.setWidth(0);
        }

        Util.inherit(HighlightAnnotation, Annotation, {});

        return HighlightAnnotation;
    })();

    var UnderlineAnnotation = (function UnderlineAnnotationClosure() {
        function UnderlineAnnotation(parameters) {
            Annotation.call(this, parameters);

            this.data.annotationType = AnnotationType.UNDERLINE;
            this._preparePopup(parameters.dict);

            // PDF viewers completely ignore any border styles.
            this.data.borderStyle.setWidth(0);
        }

        Util.inherit(UnderlineAnnotation, Annotation, {});

        return UnderlineAnnotation;
    })();

    var SquigglyAnnotation = (function SquigglyAnnotationClosure() {
        function SquigglyAnnotation(parameters) {
            Annotation.call(this, parameters);

            this.data.annotationType = AnnotationType.SQUIGGLY;
            this._preparePopup(parameters.dict);

            // PDF viewers completely ignore any border styles.
            this.data.borderStyle.setWidth(0);
        }

        Util.inherit(SquigglyAnnotation, Annotation, {});

        return SquigglyAnnotation;
    })();

    var StrikeOutAnnotation = (function StrikeOutAnnotationClosure() {
        function StrikeOutAnnotation(parameters) {
            Annotation.call(this, parameters);

            this.data.annotationType = AnnotationType.STRIKEOUT;
            this._preparePopup(parameters.dict);

            // PDF viewers completely ignore any border styles.
            this.data.borderStyle.setWidth(0);
        }

        Util.inherit(StrikeOutAnnotation, Annotation, {});

        return StrikeOutAnnotation;
    })();

    var FileAttachmentAnnotation = (function FileAttachmentAnnotationClosure() {
        function FileAttachmentAnnotation(parameters) {
            Annotation.call(this, parameters);

            var file = new FileSpec(parameters.dict.get('FS'), parameters.xref);

            this.data.annotationType = AnnotationType.FILEATTACHMENT;
            this.data.file = file.serializable;
            this._preparePopup(parameters.dict);
        }

        Util.inherit(FileAttachmentAnnotation, Annotation, {});

        return FileAttachmentAnnotation;
    })();

    exports.Annotation = Annotation;
    exports.AnnotationBorderStyle = AnnotationBorderStyle;
    exports.AnnotationFactory = AnnotationFactory;
}));
