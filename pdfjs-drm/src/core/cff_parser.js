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

'use strict';

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('pdfjs/core/cff_parser', ['exports', 'pdfjs/shared/util',
            'pdfjs/core/charsets', 'pdfjs/core/encodings'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports, require('../shared/util.js'), require('./charsets.js'),
            require('./encodings.js'));
    } else {
        factory((root.pdfjsCoreCFFParser = {}), root.pdfjsSharedUtil,
            root.pdfjsCoreCharsets, root.pdfjsCoreEncodings);
    }
}(this, function(exports, sharedUtil, coreCharsets, coreEncodings) {

    var error = sharedUtil.error;
    var info = sharedUtil.info;
    var bytesToString = sharedUtil.bytesToString;
    var warn = sharedUtil.warn;
    var isArray = sharedUtil.isArray;
    var Util = sharedUtil.Util;
    var stringToBytes = sharedUtil.stringToBytes;
    var assert = sharedUtil.assert;
    var ISOAdobeCharset = coreCharsets.ISOAdobeCharset;
    var ExpertCharset = coreCharsets.ExpertCharset;
    var ExpertSubsetCharset = coreCharsets.ExpertSubsetCharset;
    var StandardEncoding = coreEncodings.StandardEncoding;
    var ExpertEncoding = coreEncodings.ExpertEncoding;

// Maximum subroutine call depth of type 2 chartrings. Matches OTS.
    var MAX_SUBR_NESTING = 10;

    /**
     * The CFF class takes a Type1 file and wrap it into a
     * 'Compact Font Format' which itself embed Type2 charstrings.
     */
    var CFFStandardStrings = [
        '.notdef', 'space', 'exclam', 'quotedbl', 'numbersign', 'dollar', 'percent',
        'ampersand', 'quoteright', 'parenleft', 'parenright', 'asterisk', 'plus',
        'comma', 'hyphen', 'period', 'slash', 'zero', 'one', 'two', 'three', 'four',
        'five', 'six', 'seven', 'eight', 'nine', 'colon', 'semicolon', 'less',
        'equal', 'greater', 'question', 'at', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
        'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W',
        'X', 'Y', 'Z', 'bracketleft', 'backslash', 'bracketright', 'asciicircum',
        'underscore', 'quoteleft', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
        'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y',
        'z', 'braceleft', 'bar', 'braceright', 'asciitilde', 'exclamdown', 'cent',
        'sterling', 'fraction', 'yen', 'florin', 'section', 'currency',
        'quotesingle', 'quotedblleft', 'guillemotleft', 'guilsinglleft',
        'guilsinglright', 'fi', 'fl', 'endash', 'dagger', 'daggerdbl',
        'periodcentered', 'paragraph', 'bullet', 'quotesinglbase', 'quotedblbase',
        'quotedblright', 'guillemotright', 'ellipsis', 'perthousand', 'questiondown',
        'grave', 'acute', 'circumflex', 'tilde', 'macron', 'breve', 'dotaccent',
        'dieresis', 'ring', 'cedilla', 'hungarumlaut', 'ogonek', 'caron', 'emdash',
        'AE', 'ordfeminine', 'Lslash', 'Oslash', 'OE', 'ordmasculine', 'ae',
        'dotlessi', 'lslash', 'oslash', 'oe', 'germandbls', 'onesuperior',
        'logicalnot', 'mu', 'trademark', 'Eth', 'onehalf', 'plusminus', 'Thorn',
        'onequarter', 'divide', 'brokenbar', 'degree', 'thorn', 'threequarters',
        'twosuperior', 'registered', 'minus', 'eth', 'multiply', 'threesuperior',
        'copyright', 'Aacute', 'Acircumflex', 'Adieresis', 'Agrave', 'Aring',
        'Atilde', 'Ccedilla', 'Eacute', 'Ecircumflex', 'Edieresis', 'Egrave',
        'Iacute', 'Icircumflex', 'Idieresis', 'Igrave', 'Ntilde', 'Oacute',
        'Ocircumflex', 'Odieresis', 'Ograve', 'Otilde', 'Scaron', 'Uacute',
        'Ucircumflex', 'Udieresis', 'Ugrave', 'Yacute', 'Ydieresis', 'Zcaron',
        'aacute', 'acircumflex', 'adieresis', 'agrave', 'aring', 'atilde',
        'ccedilla', 'eacute', 'ecircumflex', 'edieresis', 'egrave', 'iacute',
        'icircumflex', 'idieresis', 'igrave', 'ntilde', 'oacute', 'ocircumflex',
        'odieresis', 'ograve', 'otilde', 'scaron', 'uacute', 'ucircumflex',
        'udieresis', 'ugrave', 'yacute', 'ydieresis', 'zcaron', 'exclamsmall',
        'Hungarumlautsmall', 'dollaroldstyle', 'dollarsuperior', 'ampersandsmall',
        'Acutesmall', 'parenleftsuperior', 'parenrightsuperior', 'twodotenleader',
        'onedotenleader', 'zerooldstyle', 'oneoldstyle', 'twooldstyle',
        'threeoldstyle', 'fouroldstyle', 'fiveoldstyle', 'sixoldstyle',
        'sevenoldstyle', 'eightoldstyle', 'nineoldstyle', 'commasuperior',
        'threequartersemdash', 'periodsuperior', 'questionsmall', 'asuperior',
        'bsuperior', 'centsuperior', 'dsuperior', 'esuperior', 'isuperior',
        'lsuperior', 'msuperior', 'nsuperior', 'osuperior', 'rsuperior', 'ssuperior',
        'tsuperior', 'ff', 'ffi', 'ffl', 'parenleftinferior', 'parenrightinferior',
        'Circumflexsmall', 'hyphensuperior', 'Gravesmall', 'Asmall', 'Bsmall',
        'Csmall', 'Dsmall', 'Esmall', 'Fsmall', 'Gsmall', 'Hsmall', 'Ismall',
        'Jsmall', 'Ksmall', 'Lsmall', 'Msmall', 'Nsmall', 'Osmall', 'Psmall',
        'Qsmall', 'Rsmall', 'Ssmall', 'Tsmall', 'Usmall', 'Vsmall', 'Wsmall',
        'Xsmall', 'Ysmall', 'Zsmall', 'colonmonetary', 'onefitted', 'rupiah',
        'Tildesmall', 'exclamdownsmall', 'centoldstyle', 'Lslashsmall',
        'Scaronsmall', 'Zcaronsmall', 'Dieresissmall', 'Brevesmall', 'Caronsmall',
        'Dotaccentsmall', 'Macronsmall', 'figuredash', 'hypheninferior',
        'Ogoneksmall', 'Ringsmall', 'Cedillasmall', 'questiondownsmall', 'oneeighth',
        'threeeighths', 'fiveeighths', 'seveneighths', 'onethird', 'twothirds',
        'zerosuperior', 'foursuperior', 'fivesuperior', 'sixsuperior',
        'sevensuperior', 'eightsuperior', 'ninesuperior', 'zeroinferior',
        'oneinferior', 'twoinferior', 'threeinferior', 'fourinferior',
        'fiveinferior', 'sixinferior', 'seveninferior', 'eightinferior',
        'nineinferior', 'centinferior', 'dollarinferior', 'periodinferior',
        'commainferior', 'Agravesmall', 'Aacutesmall', 'Acircumflexsmall',
        'Atildesmall', 'Adieresissmall', 'Aringsmall', 'AEsmall', 'Ccedillasmall',
        'Egravesmall', 'Eacutesmall', 'Ecircumflexsmall', 'Edieresissmall',
        'Igravesmall', 'Iacutesmall', 'Icircumflexsmall', 'Idieresissmall',
        'Ethsmall', 'Ntildesmall', 'Ogravesmall', 'Oacutesmall', 'Ocircumflexsmall',
        'Otildesmall', 'Odieresissmall', 'OEsmall', 'Oslashsmall', 'Ugravesmall',
        'Uacutesmall', 'Ucircumflexsmall', 'Udieresissmall', 'Yacutesmall',
        'Thornsmall', 'Ydieresissmall', '001.000', '001.001', '001.002', '001.003',
        'Black', 'Bold', 'Book', 'Light', 'Medium', 'Regular', 'Roman', 'Semibold'
    ];

    var CFFParser = (function CFFParserClosure() {
        var CharstringValidationData = [
            null,
            {id : 'hstem', min : 2, stackClearing : true, stem : true},
            null,
            {id : 'vstem', min : 2, stackClearing : true, stem : true},
            {id : 'vmoveto', min : 1, stackClearing : true},
            {id : 'rlineto', min : 2, resetStack : true},
            {id : 'hlineto', min : 1, resetStack : true},
            {id : 'vlineto', min : 1, resetStack : true},
            {id : 'rrcurveto', min : 6, resetStack : true},
            null,
            {id : 'callsubr', min : 1, undefStack : true},
            {id : 'return', min : 0, undefStack : true},
            null, // 12
            null,
            {id : 'endchar', min : 0, stackClearing : true},
            null,
            null,
            null,
            {id : 'hstemhm', min : 2, stackClearing : true, stem : true},
            {id : 'hintmask', min : 0, stackClearing : true},
            {id : 'cntrmask', min : 0, stackClearing : true},
            {id : 'rmoveto', min : 2, stackClearing : true},
            {id : 'hmoveto', min : 1, stackClearing : true},
            {id : 'vstemhm', min : 2, stackClearing : true, stem : true},
            {id : 'rcurveline', min : 8, resetStack : true},
            {id : 'rlinecurve', min : 8, resetStack : true},
            {id : 'vvcurveto', min : 4, resetStack : true},
            {id : 'hhcurveto', min : 4, resetStack : true},
            null, // shortint
            {id : 'callgsubr', min : 1, undefStack : true},
            {id : 'vhcurveto', min : 4, resetStack : true},
            {id : 'hvcurveto', min : 4, resetStack : true}
        ];
        var CharstringValidationData12 = [
            null,
            null,
            null,
            {id : 'and', min : 2, stackDelta : -1},
            {id : 'or', min : 2, stackDelta : -1},
            {id : 'not', min : 1, stackDelta : 0},
            null,
            null,
            null,
            {id : 'abs', min : 1, stackDelta : 0},
            {
                id      : 'add', min : 2, stackDelta : -1,
                stackFn : function stack_div(stack, index) {
                    stack[index - 2] = stack[index - 2] + stack[index - 1];
                }
            },
            {
                id      : 'sub', min : 2, stackDelta : -1,
                stackFn : function stack_div(stack, index) {
                    stack[index - 2] = stack[index - 2] - stack[index - 1];
                }
            },
            {
                id      : 'div', min : 2, stackDelta : -1,
                stackFn : function stack_div(stack, index) {
                    stack[index - 2] = stack[index - 2] / stack[index - 1];
                }
            },
            null,
            {
                id      : 'neg', min : 1, stackDelta : 0,
                stackFn : function stack_div(stack, index) {
                    stack[index - 1] = -stack[index - 1];
                }
            },
            {id : 'eq', min : 2, stackDelta : -1},
            null,
            null,
            {id : 'drop', min : 1, stackDelta : -1},
            null,
            {id : 'put', min : 2, stackDelta : -2},
            {id : 'get', min : 1, stackDelta : 0},
            {id : 'ifelse', min : 4, stackDelta : -3},
            {id : 'random', min : 0, stackDelta : 1},
            {
                id      : 'mul', min : 2, stackDelta : -1,
                stackFn : function stack_div(stack, index) {
                    stack[index - 2] = stack[index - 2] * stack[index - 1];
                }
            },
            null,
            {id : 'sqrt', min : 1, stackDelta : 0},
            {id : 'dup', min : 1, stackDelta : 1},
            {id : 'exch', min : 2, stackDelta : 0},
            {id : 'index', min : 2, stackDelta : 0},
            {id : 'roll', min : 3, stackDelta : -2},
            null,
            null,
            null,
            {id : 'hflex', min : 7, resetStack : true},
            {id : 'flex', min : 13, resetStack : true},
            {id : 'hflex1', min : 9, resetStack : true},
            {id : 'flex1', min : 11, resetStack : true}
        ];

        function CFFParser(file, properties, seacAnalysisEnabled) {
            this.bytes = file.getBytes();
            this.properties = properties;
            this.seacAnalysisEnabled = !!seacAnalysisEnabled;
        }

        CFFParser.prototype = {
            parse                  : function CFFParser_parse() {
                var properties = this.properties;
                var cff = new CFF();
                this.cff = cff;

                // The first five sections must be in order, all the others are reached
                // via offsets contained in one of the below.
                var header = this.parseHeader();
                var nameIndex = this.parseIndex(header.endPos);
                var topDictIndex = this.parseIndex(nameIndex.endPos);
                var stringIndex = this.parseIndex(topDictIndex.endPos);
                var globalSubrIndex = this.parseIndex(stringIndex.endPos);

                var topDictParsed = this.parseDict(topDictIndex.obj.get(0));
                var topDict = this.createDict(CFFTopDict, topDictParsed, cff.strings);

                cff.header = header.obj;
                cff.names = this.parseNameIndex(nameIndex.obj);
                cff.strings = this.parseStringIndex(stringIndex.obj);
                cff.topDict = topDict;
                cff.globalSubrIndex = globalSubrIndex.obj;

                this.parsePrivateDict(cff.topDict);

                cff.isCIDFont = topDict.hasName('ROS');

                var charStringOffset = topDict.getByName('CharStrings');
                var charStringIndex = this.parseIndex(charStringOffset).obj;

                var fontMatrix = topDict.getByName('FontMatrix');
                if (fontMatrix) {
                    properties.fontMatrix = fontMatrix;
                }

                var fontBBox = topDict.getByName('FontBBox');
                if (fontBBox) {
                    // adjusting ascent/descent
                    properties.ascent = fontBBox[3];
                    properties.descent = fontBBox[1];
                    properties.ascentScaled = true;
                }

                var charset, encoding;
                if (cff.isCIDFont) {
                    var fdArrayIndex = this.parseIndex(topDict.getByName('FDArray')).obj;
                    for (var i = 0, ii = fdArrayIndex.count; i < ii; ++i) {
                        var dictRaw = fdArrayIndex.get(i);
                        var fontDict = this.createDict(CFFTopDict, this.parseDict(dictRaw),
                            cff.strings);
                        this.parsePrivateDict(fontDict);
                        cff.fdArray.push(fontDict);
                    }
                    // cid fonts don't have an encoding
                    encoding = null;
                    charset = this.parseCharsets(topDict.getByName('charset'),
                        charStringIndex.count, cff.strings, true);
                    cff.fdSelect = this.parseFDSelect(topDict.getByName('FDSelect'),
                        charStringIndex.count);
                } else {
                    charset = this.parseCharsets(topDict.getByName('charset'),
                        charStringIndex.count, cff.strings, false);
                    encoding = this.parseEncoding(topDict.getByName('Encoding'),
                        properties,
                        cff.strings, charset.charset);
                }

                cff.charset = charset;
                cff.encoding = encoding;

                var charStringsAndSeacs = this.parseCharStrings(
                    charStringIndex,
                    topDict.privateDict.subrsIndex,
                    globalSubrIndex.obj,
                    cff.fdSelect,
                    cff.fdArray);
                cff.charStrings = charStringsAndSeacs.charStrings;
                cff.seacs = charStringsAndSeacs.seacs;
                cff.widths = charStringsAndSeacs.widths;

                return cff;
            },
            parseHeader            : function CFFParser_parseHeader() {
                var bytes = this.bytes;
                var bytesLength = bytes.length;
                var offset = 0;

                // Prevent an infinite loop, by checking that the offset is within the
                // bounds of the bytes array. Necessary in empty, or invalid, font files.
                while (offset < bytesLength && bytes[offset] !== 1) {
                    ++offset;
                }
                if (offset >= bytesLength) {
                    error('Invalid CFF header');
                } else if (offset !== 0) {
                    info('cff data is shifted');
                    bytes = bytes.subarray(offset);
                    this.bytes = bytes;
                }
                var major = bytes[0];
                var minor = bytes[1];
                var hdrSize = bytes[2];
                var offSize = bytes[3];
                var header = new CFFHeader(major, minor, hdrSize, offSize);
                return {obj : header, endPos : hdrSize};
            },
            parseDict              : function CFFParser_parseDict(dict) {
                var pos = 0;

                function parseOperand() {
                    var value = dict[pos++];
                    if (value === 30) {
                        return parseFloatOperand();
                    } else if (value === 28) {
                        value = dict[pos++];
                        value = ((value << 24) | (dict[pos++] << 16)) >> 16;
                        return value;
                    } else if (value === 29) {
                        value = dict[pos++];
                        value = (value << 8) | dict[pos++];
                        value = (value << 8) | dict[pos++];
                        value = (value << 8) | dict[pos++];
                        return value;
                    } else if (value >= 32 && value <= 246) {
                        return value - 139;
                    } else if (value >= 247 && value <= 250) {
                        return ((value - 247) * 256) + dict[pos++] + 108;
                    } else if (value >= 251 && value <= 254) {
                        return -((value - 251) * 256) - dict[pos++] - 108;
                    } else {
                        error('255 is not a valid DICT command');
                    }
                    return -1;
                }

                function parseFloatOperand() {
                    var str = '';
                    var eof = 15;
                    var lookup = ['0', '1', '2', '3', '4', '5', '6', '7', '8',
                        '9', '.', 'E', 'E-', null, '-'];
                    var length = dict.length;
                    while (pos < length) {
                        var b = dict[pos++];
                        var b1 = b >> 4;
                        var b2 = b & 15;

                        if (b1 === eof) {
                            break;
                        }
                        str += lookup[b1];

                        if (b2 === eof) {
                            break;
                        }
                        str += lookup[b2];
                    }
                    return parseFloat(str);
                }

                var operands = [];
                var entries = [];

                pos = 0;
                var end = dict.length;
                while (pos < end) {
                    var b = dict[pos];
                    if (b <= 21) {
                        if (b === 12) {
                            b = (b << 8) | dict[++pos];
                        }
                        entries.push([b, operands]);
                        operands = [];
                        ++pos;
                    } else {
                        operands.push(parseOperand());
                    }
                }
                return entries;
            },
            parseIndex             : function CFFParser_parseIndex(pos) {
                var cffIndex = new CFFIndex();
                var bytes = this.bytes;
                var count = (bytes[pos++] << 8) | bytes[pos++];
                var offsets = [];
                var end = pos;
                var i, ii;

                if (count !== 0) {
                    var offsetSize = bytes[pos++];
                    // add 1 for offset to determine size of last object
                    var startPos = pos + ((count + 1) * offsetSize) - 1;

                    for (i = 0, ii = count + 1; i < ii; ++i) {
                        var offset = 0;
                        for (var j = 0; j < offsetSize; ++j) {
                            offset <<= 8;
                            offset += bytes[pos++];
                        }
                        offsets.push(startPos + offset);
                    }
                    end = offsets[count];
                }
                for (i = 0, ii = offsets.length - 1; i < ii; ++i) {
                    var offsetStart = offsets[i];
                    var offsetEnd = offsets[i + 1];
                    cffIndex.add(bytes.subarray(offsetStart, offsetEnd));
                }
                return {obj : cffIndex, endPos : end};
            },
            parseNameIndex         : function CFFParser_parseNameIndex(index) {
                var names = [];
                for (var i = 0, ii = index.count; i < ii; ++i) {
                    var name = index.get(i);
                    // OTS doesn't allow names to be over 127 characters.
                    var length = Math.min(name.length, 127);
                    var data = [];
                    // OTS also only permits certain characters in the name.
                    for (var j = 0; j < length; ++j) {
                        var c = name[j];
                        if (j === 0 && c === 0) {
                            data[j] = c;
                            continue;
                        }
                        if ((c < 33 || c > 126) || c === 91 /* [ */ || c === 93 /* ] */ ||
                            c === 40 /* ( */ || c === 41 /* ) */ || c === 123 /* { */ ||
                            c === 125 /* } */ || c === 60 /* < */ || c === 62 /* > */ ||
                            c === 47 /* / */ || c === 37 /* % */ || c === 35 /* # */) {
                            data[j] = 95;
                            continue;
                        }
                        data[j] = c;
                    }
                    names.push(bytesToString(data));
                }
                return names;
            },
            parseStringIndex       : function CFFParser_parseStringIndex(index) {
                var strings = new CFFStrings();
                for (var i = 0, ii = index.count; i < ii; ++i) {
                    var data = index.get(i);
                    strings.add(bytesToString(data));
                }
                return strings;
            },
            createDict             : function CFFParser_createDict(Type, dict, strings) {
                var cffDict = new Type(strings);
                for (var i = 0, ii = dict.length; i < ii; ++i) {
                    var pair = dict[i];
                    var key = pair[0];
                    var value = pair[1];
                    cffDict.setByKey(key, value);
                }
                return cffDict;
            },
            parseCharString        : function CFFParser_parseCharString(state, data,
                                                                        localSubrIndex,
                                                                        globalSubrIndex) {
                if (state.callDepth > MAX_SUBR_NESTING) {
                    return false;
                }
                var stackSize = state.stackSize;
                var stack = state.stack;

                var length = data.length;

                for (var j = 0; j < length;) {
                    var value = data[j++];
                    var validationCommand = null;
                    if (value === 12) {
                        var q = data[j++];
                        if (q === 0) {
                            // The CFF specification state that the 'dotsection' command
                            // (12, 0) is deprecated and treated as a no-op, but all Type2
                            // charstrings processors should support them. Unfortunately
                            // the font sanitizer don't. As a workaround the sequence (12, 0)
                            // is replaced by a useless (0, hmoveto).
                            data[j - 2] = 139;
                            data[j - 1] = 22;
                            stackSize = 0;
                        } else {
                            validationCommand = CharstringValidationData12[q];
                        }
                    } else if (value === 28) { // number (16 bit)
                        stack[stackSize] = ((data[j] << 24) | (data[j + 1] << 16)) >> 16;
                        j += 2;
                        stackSize++;
                    } else if (value === 14) {
                        if (stackSize >= 4) {
                            stackSize -= 4;
                            if (this.seacAnalysisEnabled) {
                                state.seac = stack.slice(stackSize, stackSize + 4);
                                return false;
                            }
                        }
                        validationCommand = CharstringValidationData[value];
                    } else if (value >= 32 && value <= 246) {  // number
                        stack[stackSize] = value - 139;
                        stackSize++;
                    } else if (value >= 247 && value <= 254) {  // number (+1 bytes)
                        stack[stackSize] = (value < 251 ?
                            ((value - 247) << 8) + data[j] + 108 :
                            -((value - 251) << 8) - data[j] - 108);
                        j++;
                        stackSize++;
                    } else if (value === 255) {  // number (32 bit)
                        stack[stackSize] = ((data[j] << 24) | (data[j + 1] << 16) |
                            (data[j + 2] << 8) | data[j + 3]) / 65536;
                        j += 4;
                        stackSize++;
                    } else if (value === 19 || value === 20) {
                        state.hints += stackSize >> 1;
                        // skipping right amount of hints flag data
                        j += (state.hints + 7) >> 3;
                        stackSize %= 2;
                        validationCommand = CharstringValidationData[value];
                    } else if (value === 10 || value === 29) {
                        var subrsIndex;
                        if (value === 10) {
                            subrsIndex = localSubrIndex;
                        } else {
                            subrsIndex = globalSubrIndex;
                        }
                        if (!subrsIndex) {
                            validationCommand = CharstringValidationData[value];
                            warn('Missing subrsIndex for ' + validationCommand.id);
                            return false;
                        }
                        var bias = 32768;
                        if (subrsIndex.count < 1240) {
                            bias = 107;
                        } else if (subrsIndex.count < 33900) {
                            bias = 1131;
                        }
                        var subrNumber = stack[--stackSize] + bias;
                        if (subrNumber < 0 || subrNumber >= subrsIndex.count) {
                            validationCommand = CharstringValidationData[value];
                            warn('Out of bounds subrIndex for ' + validationCommand.id);
                            return false;
                        }
                        state.stackSize = stackSize;
                        state.callDepth++;
                        var valid = this.parseCharString(state, subrsIndex.get(subrNumber),
                            localSubrIndex, globalSubrIndex);
                        if (!valid) {
                            return false;
                        }
                        state.callDepth--;
                        stackSize = state.stackSize;
                        continue;
                    } else if (value === 11) {
                        state.stackSize = stackSize;
                        return true;
                    } else {
                        validationCommand = CharstringValidationData[value];
                    }
                    if (validationCommand) {
                        if (validationCommand.stem) {
                            state.hints += stackSize >> 1;
                        }
                        if ('min' in validationCommand) {
                            if (!state.undefStack && stackSize < validationCommand.min) {
                                warn('Not enough parameters for ' + validationCommand.id +
                                    '; actual: ' + stackSize +
                                    ', expected: ' + validationCommand.min);
                                return false;
                            }
                        }
                        if (state.firstStackClearing && validationCommand.stackClearing) {
                            state.firstStackClearing = false;
                            // the optional character width can be found before the first
                            // stack-clearing command arguments
                            stackSize -= validationCommand.min;
                            if (stackSize >= 2 && validationCommand.stem) {
                                // there are even amount of arguments for stem commands
                                stackSize %= 2;
                            } else if (stackSize > 1) {
                                warn('Found too many parameters for stack-clearing command');
                            }
                            if (stackSize > 0 && stack[stackSize - 1] >= 0) {
                                state.width = stack[stackSize - 1];
                            }
                        }
                        if ('stackDelta' in validationCommand) {
                            if ('stackFn' in validationCommand) {
                                validationCommand.stackFn(stack, stackSize);
                            }
                            stackSize += validationCommand.stackDelta;
                        } else if (validationCommand.stackClearing) {
                            stackSize = 0;
                        } else if (validationCommand.resetStack) {
                            stackSize = 0;
                            state.undefStack = false;
                        } else if (validationCommand.undefStack) {
                            stackSize = 0;
                            state.undefStack = true;
                            state.firstStackClearing = false;
                        }
                    }
                }
                state.stackSize = stackSize;
                return true;
            },
            parseCharStrings       : function CFFParser_parseCharStrings(charStrings,
                                                                         localSubrIndex,
                                                                         globalSubrIndex,
                                                                         fdSelect,
                                                                         fdArray) {
                var seacs = [];
                var widths = [];
                var count = charStrings.count;
                for (var i = 0; i < count; i++) {
                    var charstring = charStrings.get(i);
                    var state = {
                        callDepth          : 0,
                        stackSize          : 0,
                        stack              : [],
                        undefStack         : true,
                        hints              : 0,
                        firstStackClearing : true,
                        seac               : null,
                        width              : null
                    };
                    var valid = true;
                    var localSubrToUse = null;
                    if (fdSelect && fdArray.length) {
                        var fdIndex = fdSelect.getFDIndex(i);
                        if (fdIndex === -1) {
                            warn('Glyph index is not in fd select.');
                            valid = false;
                        }
                        if (fdIndex >= fdArray.length) {
                            warn('Invalid fd index for glyph index.');
                            valid = false;
                        }
                        if (valid) {
                            localSubrToUse = fdArray[fdIndex].privateDict.subrsIndex;
                        }
                    } else if (localSubrIndex) {
                        localSubrToUse = localSubrIndex;
                    }
                    if (valid) {
                        valid = this.parseCharString(state, charstring, localSubrToUse,
                            globalSubrIndex);
                    }
                    if (state.width !== null) {
                        widths[i] = state.width;
                    }
                    if (state.seac !== null) {
                        seacs[i] = state.seac;
                    }
                    if (!valid) {
                        // resetting invalid charstring to single 'endchar'
                        charStrings.set(i, new Uint8Array([14]));
                    }
                }
                return {charStrings : charStrings, seacs : seacs, widths : widths};
            },
            emptyPrivateDictionary :
                function CFFParser_emptyPrivateDictionary(parentDict) {
                    var privateDict = this.createDict(CFFPrivateDict, [],
                        parentDict.strings);
                    parentDict.setByKey(18, [0, 0]);
                    parentDict.privateDict = privateDict;
                },
            parsePrivateDict       : function CFFParser_parsePrivateDict(parentDict) {
                // no private dict, do nothing
                if (!parentDict.hasName('Private')) {
                    this.emptyPrivateDictionary(parentDict);
                    return;
                }
                var privateOffset = parentDict.getByName('Private');
                // make sure the params are formatted correctly
                if (!isArray(privateOffset) || privateOffset.length !== 2) {
                    parentDict.removeByName('Private');
                    return;
                }
                var size = privateOffset[0];
                var offset = privateOffset[1];
                // remove empty dicts or ones that refer to invalid location
                if (size === 0 || offset >= this.bytes.length) {
                    this.emptyPrivateDictionary(parentDict);
                    return;
                }

                var privateDictEnd = offset + size;
                var dictData = this.bytes.subarray(offset, privateDictEnd);
                var dict = this.parseDict(dictData);
                var privateDict = this.createDict(CFFPrivateDict, dict,
                    parentDict.strings);
                parentDict.privateDict = privateDict;

                // Parse the Subrs index also since it's relative to the private dict.
                if (!privateDict.getByName('Subrs')) {
                    return;
                }
                var subrsOffset = privateDict.getByName('Subrs');
                var relativeOffset = offset + subrsOffset;
                // Validate the offset.
                if (subrsOffset === 0 || relativeOffset >= this.bytes.length) {
                    this.emptyPrivateDictionary(parentDict);
                    return;
                }
                var subrsIndex = this.parseIndex(relativeOffset);
                privateDict.subrsIndex = subrsIndex.obj;
            },
            parseCharsets          : function CFFParser_parseCharsets(pos, length, strings, cid) {
                if (pos === 0) {
                    return new CFFCharset(true, CFFCharsetPredefinedTypes.ISO_ADOBE,
                        ISOAdobeCharset);
                } else if (pos === 1) {
                    return new CFFCharset(true, CFFCharsetPredefinedTypes.EXPERT,
                        ExpertCharset);
                } else if (pos === 2) {
                    return new CFFCharset(true, CFFCharsetPredefinedTypes.EXPERT_SUBSET,
                        ExpertSubsetCharset);
                }

                var bytes = this.bytes;
                var start = pos;
                var format = bytes[pos++];
                var charset = ['.notdef'];
                var id, count, i;

                // subtract 1 for the .notdef glyph
                length -= 1;

                switch (format) {
                    case 0:
                        for (i = 0; i < length; i++) {
                            id = (bytes[pos++] << 8) | bytes[pos++];
                            charset.push(cid ? id : strings.get(id));
                        }
                        break;
                    case 1:
                        while (charset.length <= length) {
                            id = (bytes[pos++] << 8) | bytes[pos++];
                            count = bytes[pos++];
                            for (i = 0; i <= count; i++) {
                                charset.push(cid ? id++ : strings.get(id++));
                            }
                        }
                        break;
                    case 2:
                        while (charset.length <= length) {
                            id = (bytes[pos++] << 8) | bytes[pos++];
                            count = (bytes[pos++] << 8) | bytes[pos++];
                            for (i = 0; i <= count; i++) {
                                charset.push(cid ? id++ : strings.get(id++));
                            }
                        }
                        break;
                    default:
                        error('Unknown charset format');
                }
                // Raw won't be needed if we actually compile the charset.
                var end = pos;
                var raw = bytes.subarray(start, end);

                return new CFFCharset(false, format, charset, raw);
            },
            parseEncoding          : function CFFParser_parseEncoding(pos,
                                                                      properties,
                                                                      strings,
                                                                      charset) {
                var encoding = Object.create(null);
                var bytes = this.bytes;
                var predefined = false;
                var hasSupplement = false;
                var format, i, ii;
                var raw = null;

                function readSupplement() {
                    var supplementsCount = bytes[pos++];
                    for (i = 0; i < supplementsCount; i++) {
                        var code = bytes[pos++];
                        var sid = (bytes[pos++] << 8) + (bytes[pos++] & 0xff);
                        encoding[code] = charset.indexOf(strings.get(sid));
                    }
                }

                if (pos === 0 || pos === 1) {
                    predefined = true;
                    format = pos;
                    var baseEncoding = pos ? ExpertEncoding : StandardEncoding;
                    for (i = 0, ii = charset.length; i < ii; i++) {
                        var index = baseEncoding.indexOf(charset[i]);
                        if (index !== -1) {
                            encoding[index] = i;
                        }
                    }
                } else {
                    var dataStart = pos;
                    format = bytes[pos++];
                    switch (format & 0x7f) {
                        case 0:
                            var glyphsCount = bytes[pos++];
                            for (i = 1; i <= glyphsCount; i++) {
                                encoding[bytes[pos++]] = i;
                            }
                            break;

                        case 1:
                            var rangesCount = bytes[pos++];
                            var gid = 1;
                            for (i = 0; i < rangesCount; i++) {
                                var start = bytes[pos++];
                                var left = bytes[pos++];
                                for (var j = start; j <= start + left; j++) {
                                    encoding[j] = gid++;
                                }
                            }
                            break;

                        default:
                            error('Unknow encoding format: ' + format + ' in CFF');
                            break;
                    }
                    var dataEnd = pos;
                    if (format & 0x80) {
                        // The font sanitizer does not support CFF encoding with a
                        // supplement, since the encoding is not really used to map
                        // between gid to glyph, let's overwrite what is declared in
                        // the top dictionary to let the sanitizer think the font use
                        // StandardEncoding, that's a lie but that's ok.
                        bytes[dataStart] &= 0x7f;
                        readSupplement();
                        hasSupplement = true;
                    }
                    raw = bytes.subarray(dataStart, dataEnd);
                }
                format = format & 0x7f;
                return new CFFEncoding(predefined, format, encoding, raw);
            },
            parseFDSelect          : function CFFParser_parseFDSelect(pos, length) {
                var start = pos;
                var bytes = this.bytes;
                var format = bytes[pos++];
                var fdSelect = [];
                var i;

                switch (format) {
                    case 0:
                        for (i = 0; i < length; ++i) {
                            var id = bytes[pos++];
                            fdSelect.push(id);
                        }
                        break;
                    case 3:
                        var rangesCount = (bytes[pos++] << 8) | bytes[pos++];
                        for (i = 0; i < rangesCount; ++i) {
                            var first = (bytes[pos++] << 8) | bytes[pos++];
                            var fdIndex = bytes[pos++];
                            var next = (bytes[pos] << 8) | bytes[pos + 1];
                            for (var j = first; j < next; ++j) {
                                fdSelect.push(fdIndex);
                            }
                        }
                        // Advance past the sentinel(next).
                        pos += 2;
                        break;
                    default:
                        error('Unknown fdselect format ' + format);
                        break;
                }
                var end = pos;
                return new CFFFDSelect(fdSelect, bytes.subarray(start, end));
            }
        };
        return CFFParser;
    })();

// Compact Font Format
    var CFF = (function CFFClosure() {
        function CFF() {
            this.header = null;
            this.names = [];
            this.topDict = null;
            this.strings = new CFFStrings();
            this.globalSubrIndex = null;

            // The following could really be per font, but since we only have one font
            // store them here.
            this.encoding = null;
            this.charset = null;
            this.charStrings = null;
            this.fdArray = [];
            this.fdSelect = null;

            this.isCIDFont = false;
        }

        return CFF;
    })();

    var CFFHeader = (function CFFHeaderClosure() {
        function CFFHeader(major, minor, hdrSize, offSize) {
            this.major = major;
            this.minor = minor;
            this.hdrSize = hdrSize;
            this.offSize = offSize;
        }

        return CFFHeader;
    })();

    var CFFStrings = (function CFFStringsClosure() {
        function CFFStrings() {
            this.strings = [];
        }

        CFFStrings.prototype = {
            get : function CFFStrings_get(index) {
                if (index >= 0 && index <= 390) {
                    return CFFStandardStrings[index];
                }
                if (index - 391 <= this.strings.length) {
                    return this.strings[index - 391];
                }
                return CFFStandardStrings[0];
            },
            add : function CFFStrings_add(value) {
                this.strings.push(value);
            },
            get count() {
                return this.strings.length;
            }
        };
        return CFFStrings;
    })();

    var CFFIndex = (function CFFIndexClosure() {
        function CFFIndex() {
            this.objects = [];
            this.length = 0;
        }

        CFFIndex.prototype = {
            add : function CFFIndex_add(data) {
                this.length += data.length;
                this.objects.push(data);
            },
            set : function CFFIndex_set(index, data) {
                this.length += data.length - this.objects[index].length;
                this.objects[index] = data;
            },
            get : function CFFIndex_get(index) {
                return this.objects[index];
            },
            get count() {
                return this.objects.length;
            }
        };
        return CFFIndex;
    })();

    var CFFDict = (function CFFDictClosure() {
        function CFFDict(tables, strings) {
            this.keyToNameMap = tables.keyToNameMap;
            this.nameToKeyMap = tables.nameToKeyMap;
            this.defaults = tables.defaults;
            this.types = tables.types;
            this.opcodes = tables.opcodes;
            this.order = tables.order;
            this.strings = strings;
            this.values = Object.create(null);
        }

        CFFDict.prototype = {
            // value should always be an array
            setByKey     : function CFFDict_setByKey(key, value) {
                if (!(key in this.keyToNameMap)) {
                    return false;
                }
                // ignore empty values
                if (value.length === 0) {
                    return true;
                }
                var type = this.types[key];
                // remove the array wrapping these types of values
                if (type === 'num' || type === 'sid' || type === 'offset') {
                    value = value[0];
                    // Ignore invalid values (fixes bug 1068432).
                    if (isNaN(value)) {
                        warn('Invalid CFFDict value: ' + value + ', for key: ' + key + '.');
                        return true;
                    }
                }
                this.values[key] = value;
                return true;
            },
            setByName    : function CFFDict_setByName(name, value) {
                if (!(name in this.nameToKeyMap)) {
                    error('Invalid dictionary name "' + name + '"');
                }
                this.values[this.nameToKeyMap[name]] = value;
            },
            hasName      : function CFFDict_hasName(name) {
                return this.nameToKeyMap[name] in this.values;
            },
            getByName    : function CFFDict_getByName(name) {
                if (!(name in this.nameToKeyMap)) {
                    error('Invalid dictionary name "' + name + '"');
                }
                var key = this.nameToKeyMap[name];
                if (!(key in this.values)) {
                    return this.defaults[key];
                }
                return this.values[key];
            },
            removeByName : function CFFDict_removeByName(name) {
                delete this.values[this.nameToKeyMap[name]];
            }
        };
        CFFDict.createTables = function CFFDict_createTables(layout) {
            var tables = {
                keyToNameMap : {},
                nameToKeyMap : {},
                defaults     : {},
                types        : {},
                opcodes      : {},
                order        : []
            };
            for (var i = 0, ii = layout.length; i < ii; ++i) {
                var entry = layout[i];
                var key = isArray(entry[0]) ? (entry[0][0] << 8) + entry[0][1] : entry[0];
                tables.keyToNameMap[key] = entry[1];
                tables.nameToKeyMap[entry[1]] = key;
                tables.types[key] = entry[2];
                tables.defaults[key] = entry[3];
                tables.opcodes[key] = isArray(entry[0]) ? entry[0] : [entry[0]];
                tables.order.push(key);
            }
            return tables;
        };
        return CFFDict;
    })();

    var CFFTopDict = (function CFFTopDictClosure() {
        var layout = [
            [[12, 30], 'ROS', ['sid', 'sid', 'num'], null],
            [[12, 20], 'SyntheticBase', 'num', null],
            [0, 'version', 'sid', null],
            [1, 'Notice', 'sid', null],
            [[12, 0], 'Copyright', 'sid', null],
            [2, 'FullName', 'sid', null],
            [3, 'FamilyName', 'sid', null],
            [4, 'Weight', 'sid', null],
            [[12, 1], 'isFixedPitch', 'num', 0],
            [[12, 2], 'ItalicAngle', 'num', 0],
            [[12, 3], 'UnderlinePosition', 'num', -100],
            [[12, 4], 'UnderlineThickness', 'num', 50],
            [[12, 5], 'PaintType', 'num', 0],
            [[12, 6], 'CharstringType', 'num', 2],
            [[12, 7], 'FontMatrix', ['num', 'num', 'num', 'num', 'num', 'num'],
                [0.001, 0, 0, 0.001, 0, 0]],
            [13, 'UniqueID', 'num', null],
            [5, 'FontBBox', ['num', 'num', 'num', 'num'], [0, 0, 0, 0]],
            [[12, 8], 'StrokeWidth', 'num', 0],
            [14, 'XUID', 'array', null],
            [15, 'charset', 'offset', 0],
            [16, 'Encoding', 'offset', 0],
            [17, 'CharStrings', 'offset', 0],
            [18, 'Private', ['offset', 'offset'], null],
            [[12, 21], 'PostScript', 'sid', null],
            [[12, 22], 'BaseFontName', 'sid', null],
            [[12, 23], 'BaseFontBlend', 'delta', null],
            [[12, 31], 'CIDFontVersion', 'num', 0],
            [[12, 32], 'CIDFontRevision', 'num', 0],
            [[12, 33], 'CIDFontType', 'num', 0],
            [[12, 34], 'CIDCount', 'num', 8720],
            [[12, 35], 'UIDBase', 'num', null],
            // XXX: CID Fonts on DirectWrite 6.1 only seem to work if FDSelect comes
            // before FDArray.
            [[12, 37], 'FDSelect', 'offset', null],
            [[12, 36], 'FDArray', 'offset', null],
            [[12, 38], 'FontName', 'sid', null]
        ];
        var tables = null;

        function CFFTopDict(strings) {
            if (tables === null) {
                tables = CFFDict.createTables(layout);
            }
            CFFDict.call(this, tables, strings);
            this.privateDict = null;
        }

        CFFTopDict.prototype = Object.create(CFFDict.prototype);
        return CFFTopDict;
    })();

    var CFFPrivateDict = (function CFFPrivateDictClosure() {
        var layout = [
            [6, 'BlueValues', 'delta', null],
            [7, 'OtherBlues', 'delta', null],
            [8, 'FamilyBlues', 'delta', null],
            [9, 'FamilyOtherBlues', 'delta', null],
            [[12, 9], 'BlueScale', 'num', 0.039625],
            [[12, 10], 'BlueShift', 'num', 7],
            [[12, 11], 'BlueFuzz', 'num', 1],
            [10, 'StdHW', 'num', null],
            [11, 'StdVW', 'num', null],
            [[12, 12], 'StemSnapH', 'delta', null],
            [[12, 13], 'StemSnapV', 'delta', null],
            [[12, 14], 'ForceBold', 'num', 0],
            [[12, 17], 'LanguageGroup', 'num', 0],
            [[12, 18], 'ExpansionFactor', 'num', 0.06],
            [[12, 19], 'initialRandomSeed', 'num', 0],
            [20, 'defaultWidthX', 'num', 0],
            [21, 'nominalWidthX', 'num', 0],
            [19, 'Subrs', 'offset', null]
        ];
        var tables = null;

        function CFFPrivateDict(strings) {
            if (tables === null) {
                tables = CFFDict.createTables(layout);
            }
            CFFDict.call(this, tables, strings);
            this.subrsIndex = null;
        }

        CFFPrivateDict.prototype = Object.create(CFFDict.prototype);
        return CFFPrivateDict;
    })();

    var CFFCharsetPredefinedTypes = {
        ISO_ADOBE     : 0,
        EXPERT        : 1,
        EXPERT_SUBSET : 2
    };
    var CFFCharset = (function CFFCharsetClosure() {
        function CFFCharset(predefined, format, charset, raw) {
            this.predefined = predefined;
            this.format = format;
            this.charset = charset;
            this.raw = raw;
        }

        return CFFCharset;
    })();

    var CFFEncoding = (function CFFEncodingClosure() {
        function CFFEncoding(predefined, format, encoding, raw) {
            this.predefined = predefined;
            this.format = format;
            this.encoding = encoding;
            this.raw = raw;
        }

        return CFFEncoding;
    })();

    var CFFFDSelect = (function CFFFDSelectClosure() {
        function CFFFDSelect(fdSelect, raw) {
            this.fdSelect = fdSelect;
            this.raw = raw;
        }

        CFFFDSelect.prototype = {
            getFDIndex : function CFFFDSelect_get(glyphIndex) {
                if (glyphIndex < 0 || glyphIndex >= this.fdSelect.length) {
                    return -1;
                }
                return this.fdSelect[glyphIndex];
            }
        };
        return CFFFDSelect;
    })();

// Helper class to keep track of where an offset is within the data and helps
// filling in that offset once it's known.
    var CFFOffsetTracker = (function CFFOffsetTrackerClosure() {
        function CFFOffsetTracker() {
            this.offsets = Object.create(null);
        }

        CFFOffsetTracker.prototype = {
            isTracking       : function CFFOffsetTracker_isTracking(key) {
                return key in this.offsets;
            },
            track            : function CFFOffsetTracker_track(key, location) {
                if (key in this.offsets) {
                    error('Already tracking location of ' + key);
                }
                this.offsets[key] = location;
            },
            offset           : function CFFOffsetTracker_offset(value) {
                for (var key in this.offsets) {
                    this.offsets[key] += value;
                }
            },
            setEntryLocation : function CFFOffsetTracker_setEntryLocation(key,
                                                                          values,
                                                                          output) {
                if (!(key in this.offsets)) {
                    error('Not tracking location of ' + key);
                }
                var data = output.data;
                var dataOffset = this.offsets[key];
                var size = 5;
                for (var i = 0, ii = values.length; i < ii; ++i) {
                    var offset0 = i * size + dataOffset;
                    var offset1 = offset0 + 1;
                    var offset2 = offset0 + 2;
                    var offset3 = offset0 + 3;
                    var offset4 = offset0 + 4;
                    // It's easy to screw up offsets so perform this sanity check.
                    if (data[offset0] !== 0x1d || data[offset1] !== 0 ||
                        data[offset2] !== 0 || data[offset3] !== 0 || data[offset4] !== 0) {
                        error('writing to an offset that is not empty');
                    }
                    var value = values[i];
                    data[offset0] = 0x1d;
                    data[offset1] = (value >> 24) & 0xFF;
                    data[offset2] = (value >> 16) & 0xFF;
                    data[offset3] = (value >> 8) & 0xFF;
                    data[offset4] = value & 0xFF;
                }
            }
        };
        return CFFOffsetTracker;
    })();

// Takes a CFF and converts it to the binary representation.
    var CFFCompiler = (function CFFCompilerClosure() {
        function CFFCompiler(cff) {
            this.cff = cff;
        }

        CFFCompiler.prototype = {
            compile                : function CFFCompiler_compile() {
                var cff = this.cff;
                var output = {
                    data   : [],
                    length : 0,
                    add    : function CFFCompiler_add(data) {
                        this.data = this.data.concat(data);
                        this.length = this.data.length;
                    }
                };

                // Compile the five entries that must be in order.
                var header = this.compileHeader(cff.header);
                output.add(header);

                var nameIndex = this.compileNameIndex(cff.names);
                output.add(nameIndex);

                if (cff.isCIDFont) {
                    // The spec is unclear on how font matrices should relate to each other
                    // when there is one in the main top dict and the sub top dicts.
                    // Windows handles this differently than linux and osx so we have to
                    // normalize to work on all.
                    // Rules based off of some mailing list discussions:
                    // - If main font has a matrix and subfont doesn't, use the main matrix.
                    // - If no main font matrix and there is a subfont matrix, use the
                    //   subfont matrix.
                    // - If both have matrices, concat together.
                    // - If neither have matrices, use default.
                    // To make this work on all platforms we move the top matrix into each
                    // sub top dict and concat if necessary.
                    if (cff.topDict.hasName('FontMatrix')) {
                        var base = cff.topDict.getByName('FontMatrix');
                        cff.topDict.removeByName('FontMatrix');
                        for (var i = 0, ii = cff.fdArray.length; i < ii; i++) {
                            var subDict = cff.fdArray[i];
                            var matrix = base.slice(0);
                            if (subDict.hasName('FontMatrix')) {
                                matrix = Util.transform(matrix, subDict.getByName('FontMatrix'));
                            }
                            subDict.setByName('FontMatrix', matrix);
                        }
                    }
                }

                var compiled = this.compileTopDicts([cff.topDict],
                    output.length,
                    cff.isCIDFont);
                output.add(compiled.output);
                var topDictTracker = compiled.trackers[0];

                var stringIndex = this.compileStringIndex(cff.strings.strings);
                output.add(stringIndex);

                var globalSubrIndex = this.compileIndex(cff.globalSubrIndex);
                output.add(globalSubrIndex);

                // Now start on the other entries that have no specfic order.
                if (cff.encoding && cff.topDict.hasName('Encoding')) {
                    if (cff.encoding.predefined) {
                        topDictTracker.setEntryLocation('Encoding', [cff.encoding.format],
                            output);
                    } else {
                        var encoding = this.compileEncoding(cff.encoding);
                        topDictTracker.setEntryLocation('Encoding', [output.length], output);
                        output.add(encoding);
                    }
                }

                if (cff.charset && cff.topDict.hasName('charset')) {
                    if (cff.charset.predefined) {
                        topDictTracker.setEntryLocation('charset', [cff.charset.format],
                            output);
                    } else {
                        var charset = this.compileCharset(cff.charset);
                        topDictTracker.setEntryLocation('charset', [output.length], output);
                        output.add(charset);
                    }
                }

                var charStrings = this.compileCharStrings(cff.charStrings);
                topDictTracker.setEntryLocation('CharStrings', [output.length], output);
                output.add(charStrings);

                if (cff.isCIDFont) {
                    // For some reason FDSelect must be in front of FDArray on windows. OSX
                    // and linux don't seem to care.
                    topDictTracker.setEntryLocation('FDSelect', [output.length], output);
                    var fdSelect = this.compileFDSelect(cff.fdSelect.raw);
                    output.add(fdSelect);
                    // It is unclear if the sub font dictionary can have CID related
                    // dictionary keys, but the sanitizer doesn't like them so remove them.
                    compiled = this.compileTopDicts(cff.fdArray, output.length, true);
                    topDictTracker.setEntryLocation('FDArray', [output.length], output);
                    output.add(compiled.output);
                    var fontDictTrackers = compiled.trackers;

                    this.compilePrivateDicts(cff.fdArray, fontDictTrackers, output);
                }

                this.compilePrivateDicts([cff.topDict], [topDictTracker], output);

                // If the font data ends with INDEX whose object data is zero-length,
                // the sanitizer will bail out. Add a dummy byte to avoid that.
                output.add([0]);

                return output.data;
            },
            encodeNumber           : function CFFCompiler_encodeNumber(value) {
                if (parseFloat(value) === parseInt(value, 10) && !isNaN(value)) { // isInt
                    return this.encodeInteger(value);
                } else {
                    return this.encodeFloat(value);
                }
            },
            encodeFloat            : function CFFCompiler_encodeFloat(num) {
                var value = num.toString();

                // rounding inaccurate doubles
                var m = /\.(\d*?)(?:9{5,20}|0{5,20})\d{0,2}(?:e(.+)|$)/.exec(value);
                if (m) {
                    var epsilon = parseFloat('1e' + ((m[2] ? +m[2] : 0) + m[1].length));
                    value = (Math.round(num * epsilon) / epsilon).toString();
                }

                var nibbles = '';
                var i, ii;
                for (i = 0, ii = value.length; i < ii; ++i) {
                    var a = value[i];
                    if (a === 'e') {
                        nibbles += value[++i] === '-' ? 'c' : 'b';
                    } else if (a === '.') {
                        nibbles += 'a';
                    } else if (a === '-') {
                        nibbles += 'e';
                    } else {
                        nibbles += a;
                    }
                }
                nibbles += (nibbles.length & 1) ? 'f' : 'ff';
                var out = [30];
                for (i = 0, ii = nibbles.length; i < ii; i += 2) {
                    out.push(parseInt(nibbles.substr(i, 2), 16));
                }
                return out;
            },
            encodeInteger          : function CFFCompiler_encodeInteger(value) {
                var code;
                if (value >= -107 && value <= 107) {
                    code = [value + 139];
                } else if (value >= 108 && value <= 1131) {
                    value = value - 108;
                    code = [(value >> 8) + 247, value & 0xFF];
                } else if (value >= -1131 && value <= -108) {
                    value = -value - 108;
                    code = [(value >> 8) + 251, value & 0xFF];
                } else if (value >= -32768 && value <= 32767) {
                    code = [0x1c, (value >> 8) & 0xFF, value & 0xFF];
                } else {
                    code = [0x1d,
                        (value >> 24) & 0xFF,
                        (value >> 16) & 0xFF,
                        (value >> 8) & 0xFF,
                        value & 0xFF];
                }
                return code;
            },
            compileHeader          : function CFFCompiler_compileHeader(header) {
                return [
                    header.major,
                    header.minor,
                    header.hdrSize,
                    header.offSize
                ];
            },
            compileNameIndex       : function CFFCompiler_compileNameIndex(names) {
                var nameIndex = new CFFIndex();
                for (var i = 0, ii = names.length; i < ii; ++i) {
                    nameIndex.add(stringToBytes(names[i]));
                }
                return this.compileIndex(nameIndex);
            },
            compileTopDicts        : function CFFCompiler_compileTopDicts(dicts,
                                                                          length,
                                                                          removeCidKeys) {
                var fontDictTrackers = [];
                var fdArrayIndex = new CFFIndex();
                for (var i = 0, ii = dicts.length; i < ii; ++i) {
                    var fontDict = dicts[i];
                    if (removeCidKeys) {
                        fontDict.removeByName('CIDFontVersion');
                        fontDict.removeByName('CIDFontRevision');
                        fontDict.removeByName('CIDFontType');
                        fontDict.removeByName('CIDCount');
                        fontDict.removeByName('UIDBase');
                    }
                    var fontDictTracker = new CFFOffsetTracker();
                    var fontDictData = this.compileDict(fontDict, fontDictTracker);
                    fontDictTrackers.push(fontDictTracker);
                    fdArrayIndex.add(fontDictData);
                    fontDictTracker.offset(length);
                }
                fdArrayIndex = this.compileIndex(fdArrayIndex, fontDictTrackers);
                return {
                    trackers : fontDictTrackers,
                    output   : fdArrayIndex
                };
            },
            compilePrivateDicts    : function CFFCompiler_compilePrivateDicts(dicts,
                                                                              trackers,
                                                                              output) {
                for (var i = 0, ii = dicts.length; i < ii; ++i) {
                    var fontDict = dicts[i];
                    assert(fontDict.privateDict && fontDict.hasName('Private'),
                        'There must be an private dictionary.');
                    var privateDict = fontDict.privateDict;
                    var privateDictTracker = new CFFOffsetTracker();
                    var privateDictData = this.compileDict(privateDict, privateDictTracker);

                    var outputLength = output.length;
                    privateDictTracker.offset(outputLength);
                    if (!privateDictData.length) {
                        // The private dictionary was empty, set the output length to zero to
                        // ensure the offset length isn't out of bounds in the eyes of the
                        // sanitizer.
                        outputLength = 0;
                    }

                    trackers[i].setEntryLocation('Private',
                        [privateDictData.length, outputLength],
                        output);
                    output.add(privateDictData);

                    if (privateDict.subrsIndex && privateDict.hasName('Subrs')) {
                        var subrs = this.compileIndex(privateDict.subrsIndex);
                        privateDictTracker.setEntryLocation('Subrs', [privateDictData.length],
                            output);
                        output.add(subrs);
                    }
                }
            },
            compileDict            : function CFFCompiler_compileDict(dict, offsetTracker) {
                var out = [];
                // The dictionary keys must be in a certain order.
                var order = dict.order;
                for (var i = 0; i < order.length; ++i) {
                    var key = order[i];
                    if (!(key in dict.values)) {
                        continue;
                    }
                    var values = dict.values[key];
                    var types = dict.types[key];
                    if (!isArray(types)) {
                        types = [types];
                    }
                    if (!isArray(values)) {
                        values = [values];
                    }

                    // Remove any empty dict values.
                    if (values.length === 0) {
                        continue;
                    }

                    for (var j = 0, jj = types.length; j < jj; ++j) {
                        var type = types[j];
                        var value = values[j];
                        switch (type) {
                            case 'num':
                            case 'sid':
                                out = out.concat(this.encodeNumber(value));
                                break;
                            case 'offset':
                                // For offsets we just insert a 32bit integer so we don't have to
                                // deal with figuring out the length of the offset when it gets
                                // replaced later on by the compiler.
                                var name = dict.keyToNameMap[key];
                                // Some offsets have the offset and the length, so just record the
                                // position of the first one.
                                if (!offsetTracker.isTracking(name)) {
                                    offsetTracker.track(name, out.length);
                                }
                                out = out.concat([0x1d, 0, 0, 0, 0]);
                                break;
                            case 'array':
                            case 'delta':
                                out = out.concat(this.encodeNumber(value));
                                for (var k = 1, kk = values.length; k < kk; ++k) {
                                    out = out.concat(this.encodeNumber(values[k]));
                                }
                                break;
                            default:
                                error('Unknown data type of ' + type);
                                break;
                        }
                    }
                    out = out.concat(dict.opcodes[key]);
                }
                return out;
            },
            compileStringIndex     : function CFFCompiler_compileStringIndex(strings) {
                var stringIndex = new CFFIndex();
                for (var i = 0, ii = strings.length; i < ii; ++i) {
                    stringIndex.add(stringToBytes(strings[i]));
                }
                return this.compileIndex(stringIndex);
            },
            compileGlobalSubrIndex : function CFFCompiler_compileGlobalSubrIndex() {
                var globalSubrIndex = this.cff.globalSubrIndex;
                this.out.writeByteArray(this.compileIndex(globalSubrIndex));
            },
            compileCharStrings     : function CFFCompiler_compileCharStrings(charStrings) {
                return this.compileIndex(charStrings);
            },
            compileCharset         : function CFFCompiler_compileCharset(charset) {
                return this.compileTypedArray(charset.raw);
            },
            compileEncoding        : function CFFCompiler_compileEncoding(encoding) {
                return this.compileTypedArray(encoding.raw);
            },
            compileFDSelect        : function CFFCompiler_compileFDSelect(fdSelect) {
                return this.compileTypedArray(fdSelect);
            },
            compileTypedArray      : function CFFCompiler_compileTypedArray(data) {
                var out = [];
                for (var i = 0, ii = data.length; i < ii; ++i) {
                    out[i] = data[i];
                }
                return out;
            },
            compileIndex           : function CFFCompiler_compileIndex(index, trackers) {
                trackers = trackers || [];
                var objects = index.objects;
                // First 2 bytes contains the number of objects contained into this index
                var count = objects.length;

                // If there is no object, just create an index. This technically
                // should just be [0, 0] but OTS has an issue with that.
                if (count === 0) {
                    return [0, 0, 0];
                }

                var data = [(count >> 8) & 0xFF, count & 0xff];

                var lastOffset = 1, i;
                for (i = 0; i < count; ++i) {
                    lastOffset += objects[i].length;
                }

                var offsetSize;
                if (lastOffset < 0x100) {
                    offsetSize = 1;
                } else if (lastOffset < 0x10000) {
                    offsetSize = 2;
                } else if (lastOffset < 0x1000000) {
                    offsetSize = 3;
                } else {
                    offsetSize = 4;
                }

                // Next byte contains the offset size use to reference object in the file
                data.push(offsetSize);

                // Add another offset after this one because we need a new offset
                var relativeOffset = 1;
                for (i = 0; i < count + 1; i++) {
                    if (offsetSize === 1) {
                        data.push(relativeOffset & 0xFF);
                    } else if (offsetSize === 2) {
                        data.push((relativeOffset >> 8) & 0xFF,
                            relativeOffset & 0xFF);
                    } else if (offsetSize === 3) {
                        data.push((relativeOffset >> 16) & 0xFF,
                            (relativeOffset >> 8) & 0xFF,
                            relativeOffset & 0xFF);
                    } else {
                        data.push((relativeOffset >>> 24) & 0xFF,
                            (relativeOffset >> 16) & 0xFF,
                            (relativeOffset >> 8) & 0xFF,
                            relativeOffset & 0xFF);
                    }

                    if (objects[i]) {
                        relativeOffset += objects[i].length;
                    }
                }

                for (i = 0; i < count; i++) {
                    // Notify the tracker where the object will be offset in the data.
                    if (trackers[i]) {
                        trackers[i].offset(data.length);
                    }
                    for (var j = 0, jj = objects[i].length; j < jj; j++) {
                        data.push(objects[i][j]);
                    }
                }
                return data;
            }
        };
        return CFFCompiler;
    })();

    exports.CFFStandardStrings = CFFStandardStrings;
    exports.CFFParser = CFFParser;
    exports.CFF = CFF;
    exports.CFFHeader = CFFHeader;
    exports.CFFStrings = CFFStrings;
    exports.CFFIndex = CFFIndex;
    exports.CFFCharset = CFFCharset;
    exports.CFFTopDict = CFFTopDict;
    exports.CFFPrivateDict = CFFPrivateDict;
    exports.CFFCompiler = CFFCompiler;
}));
