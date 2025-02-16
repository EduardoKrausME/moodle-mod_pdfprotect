'use strict';
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('pdfjs-web/app', ['exports', 'pdfjs-web/ui_utils', 'pdfjs-web/download_manager', 'pdfjs-web/pdf_history', 'pdfjs-web/preferences', 'pdfjs-web/pdf_sidebar', 'pdfjs-web/view_history', 'pdfjs-web/pdf_thumbnail_viewer', 'pdfjs-web/secondary_toolbar', 'pdfjs-web/password_prompt', 'pdfjs-web/pdf_presentation_mode', 'pdfjs-web/pdf_document_properties', 'pdfjs-web/hand_tool', 'pdfjs-web/pdf_viewer', 'pdfjs-web/pdf_rendering_queue', 'pdfjs-web/pdf_link_service', 'pdfjs-web/pdf_outline_viewer', 'pdfjs-web/overlay_manager', 'pdfjs-web/pdf_attachment_viewer', 'pdfjs-web/pdf_find_controller', 'pdfjs-web/pdf_find_bar', 'pdfjs-web/dom_events', 'pdfjs-web/pdfjs'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports, require('./ui_utils.js'), require('./download_manager.js'), require('./pdf_history.js'), require('./preferences.js'), require('./pdf_sidebar.js'), require('./view_history.js'), require('./pdf_thumbnail_viewer.js'), require('./secondary_toolbar.js'), require('./password_prompt.js'), require('./pdf_presentation_mode.js'), require('./pdf_document_properties.js'), require('./hand_tool.js'), require('./pdf_viewer.js'), require('./pdf_rendering_queue.js'), require('./pdf_link_service.js'), require('./pdf_outline_viewer.js'), require('./overlay_manager.js'), require('./pdf_attachment_viewer.js'), require('./pdf_find_controller.js'), require('./pdf_find_bar.js'), require('./dom_events.js'), require('./pdfjs.js'));
    } else {
        factory((root.pdfjsWebApp = {}), root.pdfjsWebUIUtils, root.pdfjsWebDownloadManager, root.pdfjsWebPDFHistory, root.pdfjsWebPreferences, root.pdfjsWebPDFSidebar, root.pdfjsWebViewHistory, root.pdfjsWebPDFThumbnailViewer, root.pdfjsWebSecondaryToolbar, root.pdfjsWebPasswordPrompt, root.pdfjsWebPDFPresentationMode, root.pdfjsWebPDFDocumentProperties, root.pdfjsWebHandTool, root.pdfjsWebPDFViewer, root.pdfjsWebPDFRenderingQueue, root.pdfjsWebPDFLinkService, root.pdfjsWebPDFOutlineViewer, root.pdfjsWebOverlayManager, root.pdfjsWebPDFAttachmentViewer, root.pdfjsWebPDFFindController, root.pdfjsWebPDFFindBar, root.pdfjsWebDOMEvents, root.pdfjsWebPDFJS);
    }
}(this, function(exports, uiUtilsLib, downloadManagerLib, pdfHistoryLib, preferencesLib, pdfSidebarLib, viewHistoryLib, pdfThumbnailViewerLib, secondaryToolbarLib, passwordPromptLib, pdfPresentationModeLib, pdfDocumentPropertiesLib, handToolLib, pdfViewerLib, pdfRenderingQueueLib, pdfLinkServiceLib, pdfOutlineViewerLib, overlayManagerLib, pdfAttachmentViewerLib, pdfFindControllerLib, pdfFindBarLib, domEventsLib, pdfjsLib) {
    var UNKNOWN_SCALE = uiUtilsLib.UNKNOWN_SCALE;
    var DEFAULT_SCALE_VALUE = uiUtilsLib.DEFAULT_SCALE_VALUE;
    var ProgressBar = uiUtilsLib.ProgressBar;
    var getPDFFileNameFromURL = uiUtilsLib.getPDFFileNameFromURL;
    var noContextMenuHandler = uiUtilsLib.noContextMenuHandler;
    var mozL10n = uiUtilsLib.mozL10n;
    var parseQueryString = uiUtilsLib.parseQueryString;
    var PDFHistory = pdfHistoryLib.PDFHistory;
    var Preferences = preferencesLib.Preferences;
    var SidebarView = pdfSidebarLib.SidebarView;
    var PDFSidebar = pdfSidebarLib.PDFSidebar;
    var ViewHistory = viewHistoryLib.ViewHistory;
    var PDFThumbnailViewer = pdfThumbnailViewerLib.PDFThumbnailViewer;
    var SecondaryToolbar = secondaryToolbarLib.SecondaryToolbar;
    var PasswordPrompt = passwordPromptLib.PasswordPrompt;
    var PDFPresentationMode = pdfPresentationModeLib.PDFPresentationMode;
    var PDFDocumentProperties = pdfDocumentPropertiesLib.PDFDocumentProperties;
    var HandTool = handToolLib.HandTool;
    var PresentationModeState = pdfViewerLib.PresentationModeState;
    var PDFViewer = pdfViewerLib.PDFViewer;
    var RenderingStates = pdfRenderingQueueLib.RenderingStates;
    var PDFRenderingQueue = pdfRenderingQueueLib.PDFRenderingQueue;
    var PDFLinkService = pdfLinkServiceLib.PDFLinkService;
    var PDFOutlineViewer = pdfOutlineViewerLib.PDFOutlineViewer;
    var OverlayManager = overlayManagerLib.OverlayManager;
    var PDFAttachmentViewer = pdfAttachmentViewerLib.PDFAttachmentViewer;
    var PDFFindController = pdfFindControllerLib.PDFFindController;
    var PDFFindBar = pdfFindBarLib.PDFFindBar;
    var getGlobalEventBus = domEventsLib.getGlobalEventBus;
    var DEFAULT_SCALE_DELTA = 1.1;
    var MIN_SCALE = 0.25;
    var MAX_SCALE = 10.0;
    var SCALE_SELECT_CONTAINER_PADDING = 8;
    var SCALE_SELECT_PADDING = 22;
    var PAGE_NUMBER_LOADING_INDICATOR = 'visiblePageIsLoading';
    var DISABLE_AUTO_FETCH_LOADING_BAR_TIMEOUT = 5000;

    function configure(PDFJS) {
        PDFJS.imageResourcesPath = './images/';
        PDFJS.cMapUrl = '../external/bcmaps/';
        PDFJS.cMapPacked = true;
        PDFJS.workerSrc = '../src/worker_loader.js';
    }

    var DefaultExernalServices = {
        updateFindControlState              : function(data) {
        },
        initPassiveLoading                  : function(callbacks) {
        },
        fallback                            : function(data, callback) {
        },
        reportTelemetry                     : function(data) {
        },
        createDownloadManager               : function() {
            return new downloadManagerLib.DownloadManager();
        },
        supportsIntegratedFind              : false,
        supportsDocumentFonts               : true,
        supportsDocumentColors              : true,
        supportedMouseWheelZoomModifierKeys : {ctrlKey : true, metaKey : true,}
    };
    var PDFViewerApplication = {
        initialBookmark                  : document.location.hash.substring(1),
        initialDestination               : null,
        initialized                      : false,
        fellback                         : false,
        appConfig                        : null,
        pdfDocument                      : null,
        pdfLoadingTask                   : null,
        printing                         : false,
        pdfViewer                        : null,
        pdfThumbnailViewer               : null,
        pdfRenderingQueue                : null,
        pdfPresentationMode              : null,
        pdfDocumentProperties            : null,
        pdfLinkService                   : null,
        pdfHistory                       : null,
        pdfSidebar                       : null,
        pdfOutlineViewer                 : null,
        pdfAttachmentViewer              : null,
        store                            : null,
        downloadManager                  : null,
        eventBus                         : null,
        pageRotation                     : 0,
        isInitialViewSet                 : false,
        animationStartedPromise          : null,
        preferenceSidebarViewOnLoad      : SidebarView.NONE,
        preferencePdfBugEnabled          : false,
        preferenceShowPreviousViewOnLoad : true,
        preferenceDefaultZoomValue       : '',
        isViewerEmbedded                 : (window.parent !== window),
        url                              : '',
        externalServices                 : DefaultExernalServices,
        initialize                       : function pdfViewInitialize(appConfig) {
            configure(pdfjsLib.PDFJS);
            this.appConfig = appConfig;
            var eventBus = appConfig.eventBus || getGlobalEventBus();
            this.eventBus = eventBus;
            this.bindEvents();
            var pdfRenderingQueue = new PDFRenderingQueue();
            pdfRenderingQueue.onIdle = this.cleanup.bind(this);
            this.pdfRenderingQueue = pdfRenderingQueue;
            var pdfLinkService = new PDFLinkService({eventBus : eventBus});
            this.pdfLinkService = pdfLinkService;
            var downloadManager = this.externalServices.createDownloadManager();
            this.downloadManager = downloadManager;
            var container = appConfig.mainContainer;
            var viewer = appConfig.viewerContainer;
            this.pdfViewer = new PDFViewer({
                container       : container,
                viewer          : viewer,
                eventBus        : eventBus,
                renderingQueue  : pdfRenderingQueue,
                linkService     : pdfLinkService,
                downloadManager : downloadManager
            });
            pdfRenderingQueue.setViewer(this.pdfViewer);
            pdfLinkService.setViewer(this.pdfViewer);
            var thumbnailContainer = appConfig.sidebar.thumbnailView;
            this.pdfThumbnailViewer = new PDFThumbnailViewer({
                container      : thumbnailContainer,
                renderingQueue : pdfRenderingQueue,
                linkService    : pdfLinkService
            });
            pdfRenderingQueue.setThumbnailViewer(this.pdfThumbnailViewer);
            Preferences.initialize();
            this.preferences = Preferences;
            this.pdfHistory = new PDFHistory({linkService : pdfLinkService, eventBus : this.eventBus});
            pdfLinkService.setHistory(this.pdfHistory);
            this.findController = new PDFFindController({pdfViewer : this.pdfViewer});
            this.findController.onUpdateResultsCount = function(matchCount) {
                if (this.supportsIntegratedFind) {
                    return;
                }
                this.findBar.updateResultsCount(matchCount);
            }.bind(this);
            this.findController.onUpdateState = function(state, previous, matchCount) {
                if (this.supportsIntegratedFind) {
                    this.externalServices.updateFindControlState({result : state, findPrevious : previous});
                } else {
                    this.findBar.updateUIState(state, previous, matchCount);
                }
            }.bind(this);
            this.pdfViewer.setFindController(this.findController);
            var findBarConfig = Object.create(appConfig.findBar);
            findBarConfig.findController = this.findController;
            findBarConfig.eventBus = this.eventBus;
            this.findBar = new PDFFindBar(findBarConfig);
            this.overlayManager = OverlayManager;
            this.handTool = new HandTool({container : container, eventBus : this.eventBus,});
            this.pdfDocumentProperties = new PDFDocumentProperties(appConfig.documentProperties);
            this.secondaryToolbar = new SecondaryToolbar(appConfig.secondaryToolbar, eventBus);
            if (this.supportsFullscreen) {
                this.pdfPresentationMode = new PDFPresentationMode({
                    container        : container,
                    viewer           : viewer,
                    pdfViewer        : this.pdfViewer,
                    eventBus         : this.eventBus,
                    contextMenuItems : appConfig.fullscreen
                });
            }
            this.passwordPrompt = new PasswordPrompt(appConfig.passwordOverlay);
            this.pdfOutlineViewer = new PDFOutlineViewer({
                container   : appConfig.sidebar.outlineView,
                eventBus    : this.eventBus,
                linkService : pdfLinkService,
            });
            this.pdfAttachmentViewer = new PDFAttachmentViewer({
                container       : appConfig.sidebar.attachmentsView,
                eventBus        : this.eventBus,
                downloadManager : downloadManager
            });
            var sidebarConfig = Object.create(appConfig.sidebar);
            sidebarConfig.pdfViewer = this.pdfViewer;
            sidebarConfig.pdfThumbnailViewer = this.pdfThumbnailViewer;
            sidebarConfig.pdfOutlineViewer = this.pdfOutlineViewer;
            sidebarConfig.eventBus = this.eventBus;
            this.pdfSidebar = new PDFSidebar(sidebarConfig);
            this.pdfSidebar.onToggled = this.forceRendering.bind(this);
            var self = this;
            var PDFJS = pdfjsLib.PDFJS;
            var initializedPromise = Promise.all([Preferences.get('enableWebGL').then(function resolved(value) {
                PDFJS.disableWebGL = !value;
            }), Preferences.get('sidebarViewOnLoad').then(function resolved(value) {
                self.preferenceSidebarViewOnLoad = value;
            }), Preferences.get('pdfBugEnabled').then(function resolved(value) {
                self.preferencePdfBugEnabled = value;
            }), Preferences.get('showPreviousViewOnLoad').then(function resolved(value) {
                self.preferenceShowPreviousViewOnLoad = value;
            }), Preferences.get('defaultZoomValue').then(function resolved(value) {
                self.preferenceDefaultZoomValue = value;
            }), Preferences.get('disableTextLayer').then(function resolved(value) {
                if (PDFJS.disableTextLayer === true) {
                    return;
                }
                PDFJS.disableTextLayer = value;
            }), Preferences.get('disableRange').then(function resolved(value) {
                if (PDFJS.disableRange === true) {
                    return;
                }
                PDFJS.disableRange = value;
            }), Preferences.get('disableStream').then(function resolved(value) {
                if (PDFJS.disableStream === true) {
                    return;
                }
                PDFJS.disableStream = value;
            }), Preferences.get('disableAutoFetch').then(function resolved(value) {
                PDFJS.disableAutoFetch = value;
            }), Preferences.get('disableFontFace').then(function resolved(value) {
                if (PDFJS.disableFontFace === true) {
                    return;
                }
                PDFJS.disableFontFace = value;
            }), Preferences.get('useOnlyCssZoom').then(function resolved(value) {
                PDFJS.useOnlyCssZoom = value;
            }), Preferences.get('externalLinkTarget').then(function resolved(value) {
                if (PDFJS.isExternalLinkTargetSet()) {
                    return;
                }
                PDFJS.externalLinkTarget = value;
            }),]).catch(function(reason) {
            });
            return initializedPromise.then(function() {
                if (self.isViewerEmbedded && !PDFJS.isExternalLinkTargetSet()) {
                    PDFJS.externalLinkTarget = PDFJS.LinkTarget.TOP;
                }
                self.initialized = true;
            });
        },
        run                              : function pdfViewRun(config) {
            this.initialize(config).then(webViewerInitialized);
        },
        zoomIn                           : function pdfViewZoomIn(ticks) {
            var newScale = this.pdfViewer.currentScale;
            do {
                newScale = (newScale * DEFAULT_SCALE_DELTA).toFixed(2);
                newScale = Math.ceil(newScale * 10) / 10;
                newScale = Math.min(MAX_SCALE, newScale);
            } while (--ticks > 0 && newScale < MAX_SCALE);
            this.pdfViewer.currentScaleValue = newScale;
        },
        zoomOut                          : function pdfViewZoomOut(ticks) {
            var newScale = this.pdfViewer.currentScale;
            do {
                newScale = (newScale / DEFAULT_SCALE_DELTA).toFixed(2);
                newScale = Math.floor(newScale * 10) / 10;
                newScale = Math.max(MIN_SCALE, newScale);
            } while (--ticks > 0 && newScale > MIN_SCALE);
            this.pdfViewer.currentScaleValue = newScale;
        },
        get pagesCount() {
            return this.pdfDocument.numPages;
        },
        set page(val) {
            this.pdfLinkService.page = val;
        },
        get page() {
            return this.pdfLinkService.page;
        },
        get supportsPrinting() {
            var canvas = document.createElement('canvas');
            var value = 'mozPrintCallback' in canvas;
            return pdfjsLib.shadow(this, 'supportsPrinting', value);
        },
        get supportsFullscreen() {
            var doc = document.documentElement;
            var support = !!(doc.requestFullscreen || doc.mozRequestFullScreen || doc.webkitRequestFullScreen || doc.msRequestFullscreen);
            if (document.fullscreenEnabled === false || document.mozFullScreenEnabled === false || document.webkitFullscreenEnabled === false || document.msFullscreenEnabled === false) {
                support = false;
            }
            if (support && pdfjsLib.PDFJS.disableFullscreen === true) {
                support = false;
            }
            return pdfjsLib.shadow(this, 'supportsFullscreen', support);
        },
        get supportsIntegratedFind() {
            return this.externalServices.supportsIntegratedFind;
        },
        get supportsDocumentFonts() {
            return this.externalServices.supportsDocumentFonts;
        },
        get supportsDocumentColors() {
            return this.externalServices.supportsDocumentColors;
        },
        get loadingBar() {
            var bar = new ProgressBar('#loadingBar', {});
            return pdfjsLib.shadow(this, 'loadingBar', bar);
        },
        get supportedMouseWheelZoomModifierKeys() {
            return this.externalServices.supportedMouseWheelZoomModifierKeys;
        },
        initPassiveLoading               : function pdfViewInitPassiveLoading() {
            this.externalServices.initPassiveLoading({
                onOpenWithTransport : function(url, length, transport) {
                    PDFViewerApplication.open(url, {range : transport});
                    if (length) {
                        PDFViewerApplication.pdfDocumentProperties.setFileSize(length);
                    }
                }, onOpenWithData   : function(data) {
                    PDFViewerApplication.open(data);
                }, onOpenWithURL    : function(url, length, originalURL) {
                    var file = url, args = null;
                    if (length !== undefined) {
                        args = {length : length};
                    }
                    if (originalURL !== undefined) {
                        file = {file : url, originalURL : originalURL};
                    }
                    PDFViewerApplication.open(file, args);
                }, onError          : function(e) {
                    PDFViewerApplication.error(mozL10n.get('loading_error', null, 'An error occurred while loading the PDF.'), e);
                }, onProgress       : function(loaded, total) {
                    PDFViewerApplication.progress(loaded / total);
                }
            });
        },
        setTitleUsingUrl                 : function pdfViewSetTitleUsingUrl(url) {
            this.url = url;
            try {
                this.setTitle(decodeURIComponent(pdfjsLib.getFilenameFromUrl(url)) || url);
            } catch (e) {
                this.setTitle(url);
            }
        },
        setTitle                         : function pdfViewSetTitle(title) {
        },
        close                            : function pdfViewClose() {
            var errorWrapper = this.appConfig.errorWrapper.container;
            errorWrapper.setAttribute('hidden', 'true');
            if (!this.pdfLoadingTask) {
                return Promise.resolve();
            }
            var promise = this.pdfLoadingTask.destroy();
            this.pdfLoadingTask = null;
            if (this.pdfDocument) {
                this.pdfDocument = null;
                this.pdfThumbnailViewer.setDocument(null);
                this.pdfViewer.setDocument(null);
                this.pdfLinkService.setDocument(null, null);
            }
            this.store = null;
            this.isInitialViewSet = false;
            this.pdfSidebar.reset();
            this.pdfOutlineViewer.reset();
            this.pdfAttachmentViewer.reset();
            this.findController.reset();
            this.findBar.reset();
            if (typeof PDFBug !== 'undefined') {
                PDFBug.cleanup();
            }
            return promise;
        },
        open                             : function pdfViewOpen(file, args) {
            var scale = 0;
            if (arguments.length > 2 || typeof args === 'number') {
                console.warn('Call of open() with obsolete signature.');
                if (typeof args === 'number') {
                    scale = args;
                }
                args = arguments[4] || null;
                if (arguments[3] && typeof arguments[3] === 'object') {
                    args = Object.create(args);
                    args.range = arguments[3];
                }
                if (typeof arguments[2] === 'string') {
                    args = Object.create(args);
                    args.password = arguments[2];
                }
            }
            if (this.pdfLoadingTask) {
                return this.close().then(function() {
                    Preferences.reload();
                    return this.open(file, args);
                }.bind(this));
            }
            var parameters = Object.create(null);
            if (typeof file === 'string') {
                this.setTitleUsingUrl(file);
                parameters.url = file;
            } else if (file && 'byteLength' in file) {
                parameters.data = file;
            } else if (file.url && file.originalUrl) {
                this.setTitleUsingUrl(file.originalUrl);
                parameters.url = file.url;
            }
            if (args) {
                for (var prop in args) {
                    parameters[prop] = args[prop];
                }
            }
            var self = this;
            self.downloadComplete = false;
            var loadingTask = pdfjsLib.getDocument(parameters);
            this.pdfLoadingTask = loadingTask;
            loadingTask.onPassword = function passwordNeeded(updateCallback, reason) {
                self.passwordPrompt.setUpdateCallback(updateCallback, reason);
                self.passwordPrompt.open();
            };
            loadingTask.onProgress = function getDocumentProgress(progressData) {
                self.progress(progressData.loaded / progressData.total);
            };
            loadingTask.onUnsupportedFeature = this.fallback.bind(this);
            var result = loadingTask.promise.then(function getDocumentCallback(pdfDocument) {
                self.load(pdfDocument, scale);
            }, function getDocumentError(exception) {
                var message = exception && exception.message;
                var loadingErrorMessage = mozL10n.get('loading_error', null, 'An error occurred while loading the PDF.');
                if (exception instanceof pdfjsLib.InvalidPDFException) {
                    loadingErrorMessage = mozL10n.get('invalid_file_error', null, 'Invalid or corrupted PDF file.');
                } else if (exception instanceof pdfjsLib.MissingPDFException) {
                    loadingErrorMessage = mozL10n.get('missing_file_error', null, 'Missing PDF file.');
                } else if (exception instanceof pdfjsLib.UnexpectedResponseException) {
                    loadingErrorMessage = mozL10n.get('unexpected_response_error', null, 'Unexpected server response.');
                }
                var moreInfo = {message : message};
                self.error(loadingErrorMessage, moreInfo);
                throw new Error(loadingErrorMessage);
            });
            if (args && args.length) {
                PDFViewerApplication.pdfDocumentProperties.setFileSize(args.length);
            }
            return result;
        },
        download                         : function pdfViewDownload() {
            function downloadByUrl() {
                downloadManager.downloadUrl(url, filename);
            }

            var url = this.url.split('#')[0];
            var filename = getPDFFileNameFromURL(url);
            var downloadManager = this.downloadManager;
            downloadManager.onerror = function(err) {
                PDFViewerApplication.error('PDF failed to download.');
            };
            if (!this.pdfDocument) {
                downloadByUrl();
                return;
            }
            if (!this.downloadComplete) {
                downloadByUrl();
                return;
            }
            this.pdfDocument.getData().then(function getDataSuccess(data) {
                var blob = pdfjsLib.createBlob(data, 'application/pdf');
                downloadManager.download(blob, url, filename);
            }, downloadByUrl).then(null, downloadByUrl);
        },
        fallback                         : function pdfViewFallback(featureId) {
            if (true) {
                return;
            }
            if (this.fellback) {
                return;
            }
            this.fellback = true;
            var url = this.url.split('#')[0];
            this.externalServices.fallback({featureId : featureId, url : url}, function response(download) {
                if (!download) {
                    return;
                }
                PDFViewerApplication.download();
            });
        },
        error                            : function pdfViewError(message, moreInfo) {
            var moreInfoText = mozL10n.get('error_version_info', {
                version : pdfjsLib.version || '?',
                build   : pdfjsLib.build || '?'
            }, 'DRM v{{version}} (build: {{build}})') + '\n';
            if (moreInfo) {
                moreInfoText += mozL10n.get('error_message', {message : moreInfo.message}, 'Message: {{message}}');
                if (moreInfo.stack) {
                    moreInfoText += '\n' + mozL10n.get('error_stack', {stack : moreInfo.stack}, 'Stack: {{stack}}');
                } else {
                    if (moreInfo.filename) {
                        moreInfoText += '\n' + mozL10n.get('error_file', {file : moreInfo.filename}, 'File: {{file}}');
                    }
                    if (moreInfo.lineNumber) {
                        moreInfoText += '\n' + mozL10n.get('error_line', {line : moreInfo.lineNumber}, 'Line: {{line}}');
                    }
                }
            }
            var errorWrapperConfig = this.appConfig.errorWrapper;
            var errorWrapper = errorWrapperConfig.container;
            errorWrapper.removeAttribute('hidden');
            var errorMessage = errorWrapperConfig.errorMessage;
            errorMessage.textContent = message;
            var closeButton = errorWrapperConfig.closeButton;
            closeButton.onclick = function() {
                errorWrapper.setAttribute('hidden', 'true');
            };
            var errorMoreInfo = errorWrapperConfig.errorMoreInfo;
            var moreInfoButton = errorWrapperConfig.moreInfoButton;
            var lessInfoButton = errorWrapperConfig.lessInfoButton;
            moreInfoButton.onclick = function() {
                errorMoreInfo.removeAttribute('hidden');
                moreInfoButton.setAttribute('hidden', 'true');
                lessInfoButton.removeAttribute('hidden');
                errorMoreInfo.style.height = errorMoreInfo.scrollHeight + 'px';
            };
            lessInfoButton.onclick = function() {
                errorMoreInfo.setAttribute('hidden', 'true');
                moreInfoButton.removeAttribute('hidden');
                lessInfoButton.setAttribute('hidden', 'true');
            };
            moreInfoButton.oncontextmenu = noContextMenuHandler;
            lessInfoButton.oncontextmenu = noContextMenuHandler;
            closeButton.oncontextmenu = noContextMenuHandler;
            moreInfoButton.removeAttribute('hidden');
            lessInfoButton.setAttribute('hidden', 'true');
            errorMoreInfo.value = moreInfoText;
        },
        progress                         : function pdfViewProgress(level) {
            var percent = Math.round(level * 100);
            if (percent > this.loadingBar.percent || isNaN(percent)) {
                this.loadingBar.percent = percent;
                if (pdfjsLib.PDFJS.disableAutoFetch && percent) {
                    if (this.disableAutoFetchLoadingBarTimeout) {
                        clearTimeout(this.disableAutoFetchLoadingBarTimeout);
                        this.disableAutoFetchLoadingBarTimeout = null;
                    }
                    this.loadingBar.show();
                    this.disableAutoFetchLoadingBarTimeout = setTimeout(function() {
                        this.loadingBar.hide();
                        this.disableAutoFetchLoadingBarTimeout = null;
                    }.bind(this), DISABLE_AUTO_FETCH_LOADING_BAR_TIMEOUT);
                }
            }
        },
        load                             : function pdfViewLoad(pdfDocument, scale) {
            var self = this;
            scale = scale || UNKNOWN_SCALE;
            this.pdfDocument = pdfDocument;
            this.pdfDocumentProperties.setDocumentAndUrl(pdfDocument, this.url);
            var downloadedPromise = pdfDocument.getDownloadInfo().then(function() {
                self.downloadComplete = true;
                self.loadingBar.hide();
            });
            var pagesCount = pdfDocument.numPages;
            var toolbarConfig = this.appConfig.toolbar;
            toolbarConfig.numPages.textContent = mozL10n.get('page_of', {pageCount : pagesCount}, 'of {{pageCount}}');
            toolbarConfig.pageNumber.max = pagesCount;
            var id = this.documentFingerprint = pdfDocument.fingerprint;
            var store = this.store = new ViewHistory(id);
            var baseDocumentUrl = null;
            this.pdfLinkService.setDocument(pdfDocument, baseDocumentUrl);
            var pdfViewer = this.pdfViewer;
            pdfViewer.currentScale = scale;
            pdfViewer.setDocument(pdfDocument);
            var firstPagePromise = pdfViewer.firstPagePromise;
            var pagesPromise = pdfViewer.pagesPromise;
            this.pageRotation = 0;
            this.pdfThumbnailViewer.setDocument(pdfDocument);
            firstPagePromise.then(function(pdfPage) {
                downloadedPromise.then(function() {
                    self.eventBus.dispatch('documentload', {source : self});
                });
                self.loadingBar.setWidth(self.appConfig.viewerContainer);
                if (!pdfjsLib.PDFJS.disableHistory && !self.isViewerEmbedded) {
                    if (!self.preferenceShowPreviousViewOnLoad) {
                        self.pdfHistory.clearHistoryState();
                    }
                    self.pdfHistory.initialize(self.documentFingerprint);
                    if (self.pdfHistory.initialDestination) {
                        self.initialDestination = self.pdfHistory.initialDestination;
                    } else if (self.pdfHistory.initialBookmark) {
                        self.initialBookmark = self.pdfHistory.initialBookmark;
                    }
                }
                var initialParams = {
                    destination : self.initialDestination,
                    bookmark    : self.initialBookmark,
                    hash        : null,
                };
                store.initializedPromise.then(function resolved() {
                    var storedHash = null, sidebarView = null;
                    if (self.preferenceShowPreviousViewOnLoad && store.get('exists', false)) {
                        var pageNum = store.get('page', '1');
                        var zoom = self.preferenceDefaultZoomValue || store.get('zoom', DEFAULT_SCALE_VALUE);
                        var left = store.get('scrollLeft', '0');
                        var top = store.get('scrollTop', '0');
                        storedHash = 'page=' + pageNum + '&zoom=' + zoom + ',' + left + ',' + top;
                        sidebarView = store.get('sidebarView', SidebarView.NONE);
                    } else if (self.preferenceDefaultZoomValue) {
                        storedHash = 'page=1&zoom=' + self.preferenceDefaultZoomValue;
                    }
                    self.setInitialView(storedHash, {scale : scale, sidebarView : sidebarView});
                    initialParams.hash = storedHash;
                    if (!self.isViewerEmbedded) {
                        self.pdfViewer.focus();
                    }
                }, function rejected(reason) {
                    console.error(reason);
                    self.setInitialView(null, {scale : scale});
                });
                pagesPromise.then(function resolved() {
                    if (!initialParams.destination && !initialParams.bookmark && !initialParams.hash) {
                        return;
                    }
                    if (self.hasEqualPageSizes) {
                        return;
                    }
                    self.initialDestination = initialParams.destination;
                    self.initialBookmark = initialParams.bookmark;
                    self.pdfViewer.currentScaleValue = self.pdfViewer.currentScaleValue;
                    self.setInitialView(initialParams.hash);
                });
            });
            pagesPromise.then(function() {
                if (self.supportsPrinting) {
                    pdfDocument.getJavaScript().then(function(javaScript) {
                        if (javaScript.length) {
                            console.warn('Warning: JavaScript is not supported');
                            self.fallback(pdfjsLib.UNSUPPORTED_FEATURES.javaScript);
                        }
                        var regex = /\bprint\s*\(/;
                        for (var i = 0, ii = javaScript.length; i < ii; i++) {
                            var js = javaScript[i];
                            if (js && regex.test(js)) {
                                setTimeout(function() {
                                    window.print();
                                });
                                return;
                            }
                        }
                    });
                }
            });
            var promises = [pagesPromise, this.animationStartedPromise];
            Promise.all(promises).then(function() {
                pdfDocument.getOutline().then(function(outline) {
                    self.pdfOutlineViewer.render({outline : outline});
                });
                pdfDocument.getAttachments().then(function(attachments) {
                    self.pdfAttachmentViewer.render({attachments : attachments});
                });
            });
            pdfDocument.getMetadata().then(function(data) {
                var info = data.info, metadata = data.metadata;
                self.documentInfo = info;
                self.metadata = metadata;
                var pdfTitle;
                if (metadata && metadata.has('dc:title')) {
                    var title = metadata.get('dc:title');
                    if (title !== 'Untitled') {
                        pdfTitle = title;
                    }
                }
                if (!pdfTitle && info && info['Title']) {
                    pdfTitle = info['Title'];
                }
                if (pdfTitle) {
                    self.setTitle(pdfTitle + ' - ' + document.title);
                }
                if (info.IsAcroFormPresent) {
                    console.warn('Warning: AcroForm/XFA is not supported');
                    self.fallback(pdfjsLib.UNSUPPORTED_FEATURES.forms);
                }
                if (true) {
                    return;
                }
                var versionId = String(info.PDFFormatVersion).slice(-1) | 0;
                var generatorId = 0;
                var KNOWN_GENERATORS = ['acrobat distiller', 'acrobat pdfwriter', 'adobe livecycle', 'adobe pdf library', 'adobe photoshop', 'ghostscript', 'tcpdf', 'cairo', 'dvipdfm', 'dvips', 'pdftex', 'pdfkit', 'itext', 'prince', 'quarkxpress', 'mac os x', 'microsoft', 'openoffice', 'oracle', 'luradocument', 'pdf-xchange', 'antenna house', 'aspose.cells', 'fpdf'];
                if (info.Producer) {
                    KNOWN_GENERATORS.some(function(generator, s, i) {
                        if (generator.indexOf(s) < 0) {
                            return false;
                        }
                        generatorId = i + 1;
                        return true;
                    }.bind(null, info.Producer.toLowerCase()));
                }
                var formType = !info.IsAcroFormPresent ? null : info.IsXFAPresent ? 'xfa' : 'acroform';
                self.externalServices.reportTelemetry({
                    type      : 'documentInfo',
                    version   : versionId,
                    generator : generatorId,
                    formType  : formType
                });
            });
        },
        setInitialView                   : function pdfViewSetInitialView(storedHash, options) {
            var scale = options && options.scale;
            var sidebarView = options && options.sidebarView;
            this.isInitialViewSet = true;
            this.appConfig.toolbar.pageNumber.value = this.pdfViewer.currentPageNumber;
            this.pdfSidebar.setInitialView(this.preferenceSidebarViewOnLoad || (sidebarView | 0));
            if (this.initialDestination) {
                this.pdfLinkService.navigateTo(this.initialDestination);
                this.initialDestination = null;
            } else if (this.initialBookmark) {
                this.pdfLinkService.setHash(this.initialBookmark);
                this.pdfHistory.push({hash : this.initialBookmark}, true);
                this.initialBookmark = null;
            } else if (storedHash) {
                this.pdfLinkService.setHash(storedHash);
            } else if (scale) {
                this.pdfViewer.currentScaleValue = scale;
                this.page = 1;
            }
            if (!this.pdfViewer.currentScaleValue) {
                this.pdfViewer.currentScaleValue = DEFAULT_SCALE_VALUE;
            }
        },
        cleanup                          : function pdfViewCleanup() {
            if (!this.pdfDocument) {
                return;
            }
            this.pdfViewer.cleanup();
            this.pdfThumbnailViewer.cleanup();
            this.pdfDocument.cleanup();
        },
        forceRendering                   : function pdfViewForceRendering() {
            this.pdfRenderingQueue.printing = this.printing;
            this.pdfRenderingQueue.isThumbnailViewEnabled = this.pdfSidebar.isThumbnailViewVisible;
            this.pdfRenderingQueue.renderHighestPriority();
        },
        beforePrint                      : function pdfViewSetupBeforePrint() {
            if (!this.supportsPrinting) {
                var printMessage = mozL10n.get('printing_not_supported', null, 'Warning: Printing is not fully supported by this browser.');
                this.error(printMessage);
                return;
            }
            var alertNotReady = false;
            var i, ii;
            if (!this.pdfDocument || !this.pagesCount) {
                alertNotReady = true;
            } else {
                for (i = 0, ii = this.pagesCount; i < ii; ++i) {
                    if (!this.pdfViewer.getPageView(i).pdfPage) {
                        alertNotReady = true;
                        break;
                    }
                }
            }
            if (alertNotReady) {
                var notReadyMessage = mozL10n.get('printing_not_ready', null, 'Warning: The PDF is not fully loaded for printing.');
                window.alert(notReadyMessage);
                return;
            }
            this.printing = true;
            this.forceRendering();
            var printContainer = this.appConfig.printContainer;
            var body = document.querySelector('body');
            body.setAttribute('data-mozPrintCallback', true);
            if (!this.hasEqualPageSizes) {
                console.warn('Not all pages have the same size. The printed result ' + 'may be incorrect!');
            }
            this.pageStyleSheet = document.createElement('style');
            var pageSize = this.pdfViewer.getPageView(0).pdfPage.getViewport(1);
            this.pageStyleSheet.textContent = '@supports ((size:A4) and (size:1pt 1pt)) {' + '@page { size: ' + pageSize.width + 'pt ' + pageSize.height + 'pt;}' + '}';
            body.appendChild(this.pageStyleSheet);
            for (i = 0, ii = this.pagesCount; i < ii; ++i) {
                this.pdfViewer.getPageView(i).beforePrint(printContainer);
            }
            if (true) {
                return;
            }
            this.externalServices.reportTelemetry({type : 'print'});
        },
        get hasEqualPageSizes() {
            var firstPage = this.pdfViewer.getPageView(0);
            for (var i = 1, ii = this.pagesCount; i < ii; ++i) {
                var pageView = this.pdfViewer.getPageView(i);
                if (pageView.width !== firstPage.width || pageView.height !== firstPage.height) {
                    return false;
                }
            }
            return true;
        },
        afterPrint                       : function pdfViewSetupAfterPrint() {
            var div = this.appConfig.printContainer;
            while (div.hasChildNodes()) {
                div.removeChild(div.lastChild);
            }
            if (this.pageStyleSheet && this.pageStyleSheet.parentNode) {
                this.pageStyleSheet.parentNode.removeChild(this.pageStyleSheet);
                this.pageStyleSheet = null;
            }
            this.printing = false;
            this.forceRendering();
        },
        rotatePages                      : function pdfViewRotatePages(delta) {
            var pageNumber = this.page;
            this.pageRotation = (this.pageRotation + 360 + delta) % 360;
            this.pdfViewer.pagesRotation = this.pageRotation;
            this.pdfThumbnailViewer.pagesRotation = this.pageRotation;
            this.forceRendering();
            this.pdfViewer.scrollPageIntoView(pageNumber);
        },
        requestPresentationMode          : function pdfViewRequestPresentationMode() {
            if (!this.pdfPresentationMode) {
                return;
            }
            this.pdfPresentationMode.request();
        },
        scrollPresentationMode           : function pdfViewScrollPresentationMode(delta) {
            if (!this.pdfPresentationMode) {
                return;
            }
            this.pdfPresentationMode.mouseScroll(delta);
        },
        bindEvents                       : function pdfViewBindEvents() {
            var eventBus = this.eventBus;
            eventBus.on('resize', webViewerResize);
            eventBus.on('localized', webViewerLocalized);
            eventBus.on('hashchange', webViewerHashchange);
            eventBus.on('beforeprint', this.beforePrint.bind(this));
            eventBus.on('afterprint', this.afterPrint.bind(this));
            eventBus.on('pagerendered', webViewerPageRendered);
            eventBus.on('textlayerrendered', webViewerTextLayerRendered);
            eventBus.on('updateviewarea', webViewerUpdateViewarea);
            eventBus.on('pagechanging', webViewerPageChanging);
            eventBus.on('scalechanging', webViewerScaleChanging);
            eventBus.on('sidebarviewchanged', webViewerSidebarViewChanged);
            eventBus.on('pagemode', webViewerPageMode);
            eventBus.on('namedaction', webViewerNamedAction);
            eventBus.on('presentationmodechanged', webViewerPresentationModeChanged);
            eventBus.on('presentationmode', webViewerPresentationMode);
            eventBus.on('openfile', webViewerOpenFile);
            eventBus.on('print', webViewerPrint);
            eventBus.on('download', webViewerDownload);
            eventBus.on('firstpage', webViewerFirstPage);
            eventBus.on('lastpage', webViewerLastPage);
            eventBus.on('rotatecw', webViewerRotateCw);
            eventBus.on('rotateccw', webViewerRotateCcw);
            eventBus.on('documentproperties', webViewerDocumentProperties);
            eventBus.on('find', webViewerFind);
            eventBus.on('findfromurlhash', webViewerFindFromUrlHash);
            eventBus.on('fileinputchange', webViewerFileInputChange);
        }
    };
    var HOSTED_VIEWER_ORIGINS = ['null', 'http://mozilla.github.io', 'https://mozilla.github.io'];

    function validateFileURL(file) {
        try {
            var viewerOrigin = new URL(window.location.href).origin || 'null';
            if (HOSTED_VIEWER_ORIGINS.indexOf(viewerOrigin) >= 0) {
                return;
            }
            var fileOrigin = new URL(file, window.location.href).origin;
            if (fileOrigin !== viewerOrigin) {
                throw new Error('file origin does not match viewer\'s');
            }
        } catch (e) {
            var message = e && e.message;
            var loadingErrorMessage = mozL10n.get('loading_error', null, 'An error occurred while loading the PDF.');
            var moreInfo = {message : message};
            PDFViewerApplication.error(loadingErrorMessage, moreInfo);
            throw e;
        }
    }

    function loadAndEnablePDFBug(enabledTabs) {
        return new Promise(function(resolve, reject) {
            var appConfig = PDFViewerApplication.appConfig;
            var script = document.createElement('script');
            script.src = appConfig.debuggerScriptPath;
            script.onload = function() {
                PDFBug.enable(enabledTabs);
                PDFBug.init(pdfjsLib, appConfig.mainContainer);
                resolve();
            };
            script.onerror = function() {
                reject(new Error('Cannot load debugger at ' + script.src));
            };
            (document.getElementsByTagName('head')[0] || document.body).appendChild(script);
        });
    }

    function webViewerInitialized() {
        var queryString = document.location.search.substring(1);
        var params = parseQueryString(queryString);
        var file = 'file' in params ? params.file : DEFAULT_URL;
        validateFileURL(file);
        var waitForBeforeOpening = [];
        var appConfig = PDFViewerApplication.appConfig;
        var fileInput = document.createElement('input');
        fileInput.id = appConfig.openFileInputName;
        fileInput.className = 'fileInput';
        fileInput.setAttribute('type', 'file');
        fileInput.oncontextmenu = noContextMenuHandler;
        document.body.appendChild(fileInput);
        if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
            appConfig.toolbar.openFile.setAttribute('hidden', 'true');
            appConfig.secondaryToolbar.openFileButton.setAttribute('hidden', 'true');
        } else {
            fileInput.value = null;
        }
        var PDFJS = pdfjsLib.PDFJS;
        if (true) {
            var hash = document.location.hash.substring(1);
            var hashParams = parseQueryString(hash);
            if ('disableworker' in hashParams) {
                PDFJS.disableWorker = (hashParams['disableworker'] === 'true');
            }
            if ('disablerange' in hashParams) {
                PDFJS.disableRange = (hashParams['disablerange'] === 'true');
            }
            if ('disablestream' in hashParams) {
                PDFJS.disableStream = (hashParams['disablestream'] === 'true');
            }
            if ('disableautofetch' in hashParams) {
                PDFJS.disableAutoFetch = (hashParams['disableautofetch'] === 'true');
            }
            if ('disablefontface' in hashParams) {
                PDFJS.disableFontFace = (hashParams['disablefontface'] === 'true');
            }
            if ('disablehistory' in hashParams) {
                PDFJS.disableHistory = (hashParams['disablehistory'] === 'true');
            }
            if ('webgl' in hashParams) {
                PDFJS.disableWebGL = (hashParams['webgl'] !== 'true');
            }
            if ('useonlycsszoom' in hashParams) {
                PDFJS.useOnlyCssZoom = (hashParams['useonlycsszoom'] === 'true');
            }
            if ('verbosity' in hashParams) {
                PDFJS.verbosity = hashParams['verbosity'] | 0;
            }
            if ('ignorecurrentpositiononzoom' in hashParams) {
                PDFJS.ignoreCurrentPositionOnZoom = (hashParams['ignorecurrentpositiononzoom'] === 'true');
            }
            if ('disablebcmaps' in hashParams && hashParams['disablebcmaps']) {
                PDFJS.cMapUrl = '../external/cmaps/';
                PDFJS.cMapPacked = false;
            }
            if ('locale' in hashParams) {
                PDFJS.locale = hashParams['locale'];
            }
            if ('textlayer' in hashParams) {
                switch (hashParams['textlayer']) {
                    case 'off':
                        PDFJS.disableTextLayer = true;
                        break;
                    case 'visible':
                    case 'shadow':
                    case 'hover':
                        var viewer = appConfig.viewerContainer;
                        viewer.classList.add('textLayer-' + hashParams['textlayer']);
                        break;
                }
            }
            if ('pdfbug' in hashParams) {
                PDFJS.pdfBug = true;
                var pdfBug = hashParams['pdfbug'];
                var enabled = pdfBug.split(',');
                waitForBeforeOpening.push(loadAndEnablePDFBug(enabled));
            }
        }
        mozL10n.setLanguage(PDFJS.locale);
        if (!PDFViewerApplication.supportsDocumentFonts) {
            PDFJS.disableFontFace = true;
//console.warn(mozL10n.get('web_fonts_disabled', null,'Web fonts are disabled: unable to use embedded PDF fonts.'));
        }
        if (!PDFViewerApplication.supportsPrinting) {
            appConfig.toolbar.print.classList.add('hidden');
            appConfig.secondaryToolbar.printButton.classList.add('hidden');
        }
        if (!PDFViewerApplication.supportsFullscreen) {
            appConfig.toolbar.presentationModeButton.classList.add('hidden');
            appConfig.secondaryToolbar.presentationModeButton.classList.add('hidden');
        }
        if (PDFViewerApplication.supportsIntegratedFind) {
            appConfig.toolbar.viewFind.classList.add('hidden');
        }
        appConfig.toolbar.scaleSelect.oncontextmenu = noContextMenuHandler;
        appConfig.sidebar.mainContainer.addEventListener('transitionend', function(e) {
            if (e.target === this) {
                PDFViewerApplication.eventBus.dispatch('resize');
            }
        }, true);
        appConfig.sidebar.toggleButton.addEventListener('click', function() {
            PDFViewerApplication.pdfSidebar.toggle();
        });
        appConfig.toolbar.previous.addEventListener('click', function() {
            PDFViewerApplication.page--;
        });
        appConfig.toolbar.next.addEventListener('click', function() {
            PDFViewerApplication.page++;
        });
        appConfig.toolbar.zoomIn.addEventListener('click', function() {
            PDFViewerApplication.zoomIn();
        });
        appConfig.toolbar.zoomOut.addEventListener('click', function() {
            PDFViewerApplication.zoomOut();
        });
        appConfig.toolbar.pageNumber.addEventListener('click', function() {
            this.select();
        });
        appConfig.toolbar.pageNumber.addEventListener('change', function() {
            PDFViewerApplication.page = (this.value | 0);
            if (this.value !== (this.value | 0).toString()) {
                this.value = PDFViewerApplication.page;
            }
        });
        appConfig.toolbar.scaleSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                return;
            }
            PDFViewerApplication.pdfViewer.currentScaleValue = this.value;
        });
        appConfig.toolbar.presentationModeButton.addEventListener('click', function(e) {
            PDFViewerApplication.eventBus.dispatch('presentationmode');
        });
        appConfig.toolbar.openFile.addEventListener('click', function(e) {
            PDFViewerApplication.eventBus.dispatch('openfile');
        });
        appConfig.toolbar.print.addEventListener('click', function(e) {
            PDFViewerApplication.eventBus.dispatch('print');
        });
        appConfig.toolbar.download.addEventListener('click', function(e) {
            PDFViewerApplication.eventBus.dispatch('download');
        });
        Promise.all(waitForBeforeOpening).then(function() {
            webViewerOpenFileViaURL(file);
        }).catch(function(reason) {
            PDFViewerApplication.error(mozL10n.get('loading_error', null, 'An error occurred while opening.'), reason);
        });
    }

    function webViewerOpenFileViaURL(file) {
        if (file && file.lastIndexOf('file:', 0) === 0) {
            PDFViewerApplication.setTitleUsingUrl(file);
            var xhr = new XMLHttpRequest();
            xhr.onload = function() {
                PDFViewerApplication.open(new Uint8Array(xhr.response));
            };
            try {
                xhr.open('GET', file);
                xhr.responseType = 'arraybuffer';
                xhr.send();
            } catch (e) {
                PDFViewerApplication.error(mozL10n.get('loading_error', null, 'An error occurred while loading the PDF.'), e);
            }
            return;
        }
        if (file) {
            PDFViewerApplication.open(file);
        }
    }

    function webViewerPageRendered(e) {
        var pageNumber = e.pageNumber;
        var pageIndex = pageNumber - 1;
        var pageView = PDFViewerApplication.pdfViewer.getPageView(pageIndex);
        if (PDFViewerApplication.pdfSidebar.isThumbnailViewVisible) {
            var thumbnailView = PDFViewerApplication.pdfThumbnailViewer.getThumbnail(pageIndex);
            thumbnailView.setImage(pageView);
        }
        if (pdfjsLib.PDFJS.pdfBug && Stats.enabled && pageView.stats) {
            Stats.add(pageNumber, pageView.stats);
        }
        if (pageView.error) {
            PDFViewerApplication.error(mozL10n.get('rendering_error', null, 'An error occurred while rendering the page.'), pageView.error);
        }
        if (pageNumber === PDFViewerApplication.page) {
            var pageNumberInput = PDFViewerApplication.appConfig.toolbar.pageNumber;
            pageNumberInput.classList.remove(PAGE_NUMBER_LOADING_INDICATOR);
        }
        if (true) {
            return;
        }
        PDFViewerApplication.externalServices.reportTelemetry({type : 'pageInfo'});
        PDFViewerApplication.pdfDocument.getStats().then(function(stats) {
            PDFViewerApplication.externalServices.reportTelemetry({type : 'documentStats', stats : stats});
        });
    }

    function webViewerTextLayerRendered(e) {
        var pageIndex = e.pageNumber - 1;
        var pageView = PDFViewerApplication.pdfViewer.getPageView(pageIndex);
        if (true) {
            return;
        }
        if (pageView.textLayer && pageView.textLayer.textDivs && pageView.textLayer.textDivs.length > 0 && !PDFViewerApplication.supportsDocumentColors) {
            console.error(mozL10n.get('document_colors_not_allowed', null, 'PDF documents are not allowed to use their own colors: ' + '\'Allow pages to choose their own colors\' ' + 'is deactivated in the browser.'));
            PDFViewerApplication.fallback();
        }
    }

    function webViewerPageMode(e) {
        if (!PDFViewerApplication.initialized) {
            return;
        }
        var mode = e.mode, view;
        switch (mode) {
            case 'thumbs':
                view = SidebarView.THUMBS;
                break;
            case 'bookmarks':
            case 'outline':
                view = SidebarView.OUTLINE;
                break;
            case 'attachments':
                view = SidebarView.ATTACHMENTS;
                break;
            case 'none':
                view = SidebarView.NONE;
                break;
            default:
                ;
                return;
        }
        PDFViewerApplication.pdfSidebar.switchView(view, true);
    }

    function webViewerNamedAction(e) {
        if (!PDFViewerApplication.initialized) {
            return;
        }
        var action = e.action;
        switch (action) {
            case 'GoToPage':
                PDFViewerApplication.appConfig.toolbar.pageNumber.focus();
                break;
            case 'Find':
                if (!PDFViewerApplication.supportsIntegratedFind) {
                    PDFViewerApplication.findBar.toggle();
                }
                break;
        }
    }

    function webViewerPresentationModeChanged(e) {
        var active = e.active;
        var switchInProgress = e.switchInProgress;
        PDFViewerApplication.pdfViewer.presentationModeState = switchInProgress ? PresentationModeState.CHANGING : active ? PresentationModeState.FULLSCREEN : PresentationModeState.NORMAL;
    }

    function webViewerSidebarViewChanged(e) {
        if (!PDFViewerApplication.initialized) {
            return;
        }
        PDFViewerApplication.pdfRenderingQueue.isThumbnailViewEnabled = PDFViewerApplication.pdfSidebar.isThumbnailViewVisible;
        var store = PDFViewerApplication.store;
        if (!store || !PDFViewerApplication.isInitialViewSet) {
            return;
        }
        store.initializedPromise.then(function() {
            store.set('sidebarView', e.view).catch(function() {
            });
        });
    }

    function webViewerUpdateViewarea(e) {
        if (!PDFViewerApplication.initialized) {
            return;
        }
        var location = e.location, store = PDFViewerApplication.store;
        if (store) {
            store.initializedPromise.then(function() {
                store.setMultiple({
                    'exists'     : true,
                    'page'       : location.pageNumber,
                    'zoom'       : location.scale,
                    'scrollLeft' : location.left,
                    'scrollTop'  : location.top,
                }).catch(function() {
                });
            });
        }
        var href = PDFViewerApplication.pdfLinkService.getAnchorUrl(location.pdfOpenParams);
        PDFViewerApplication.appConfig.toolbar.viewBookmark.href = href;
        PDFViewerApplication.appConfig.secondaryToolbar.viewBookmarkButton.href = href;
        PDFViewerApplication.pdfHistory.updateCurrentBookmark(location.pdfOpenParams, location.pageNumber);
        var pageNumberInput = PDFViewerApplication.appConfig.toolbar.pageNumber;
        var currentPage = PDFViewerApplication.pdfViewer.getPageView(PDFViewerApplication.page - 1);
        if (currentPage.renderingState === RenderingStates.FINISHED) {
            pageNumberInput.classList.remove(PAGE_NUMBER_LOADING_INDICATOR);
        } else {
            pageNumberInput.classList.add(PAGE_NUMBER_LOADING_INDICATOR);
        }
    }

    window.addEventListener('resize', function webViewerResize(evt) {
        PDFViewerApplication.eventBus.dispatch('resize');
    });

    function webViewerResize() {
        if (PDFViewerApplication.initialized) {
            var currentScaleValue = PDFViewerApplication.pdfViewer.currentScaleValue;
            if (currentScaleValue === 'auto' || currentScaleValue === 'page-fit' || currentScaleValue === 'page-width') {
                PDFViewerApplication.pdfViewer.currentScaleValue = currentScaleValue;
            } else if (!currentScaleValue) {
                PDFViewerApplication.pdfViewer.currentScaleValue = DEFAULT_SCALE_VALUE;
            }
            PDFViewerApplication.pdfViewer.update();
        }
        var mainContainer = PDFViewerApplication.appConfig.mainContainer;
        PDFViewerApplication.secondaryToolbar.setMaxHeight(mainContainer);
    }

    window.addEventListener('hashchange', function webViewerHashchange(evt) {
        var hash = document.location.hash.substring(1);
        PDFViewerApplication.eventBus.dispatch('hashchange', {hash : hash});
    });

    function webViewerHashchange(e) {
        if (PDFViewerApplication.pdfHistory.isHashChangeUnlocked) {
            var hash = e.hash;
            if (!hash) {
                return;
            }
            if (!PDFViewerApplication.isInitialViewSet) {
                PDFViewerApplication.initialBookmark = hash;
            } else {
                PDFViewerApplication.pdfLinkService.setHash(hash);
            }
        }
    }

    window.addEventListener('change', function webViewerChange(evt) {
        var files = evt.target.files;
        if (!files || files.length === 0) {
            return;
        }
        PDFViewerApplication.eventBus.dispatch('fileinputchange', {fileInput : evt.target});
    }, true);

    function webViewerFileInputChange(e) {
        var file = e.fileInput.files[0];
        if (!pdfjsLib.PDFJS.disableCreateObjectURL && typeof URL !== 'undefined' && URL.createObjectURL) {
            PDFViewerApplication.open(URL.createObjectURL(file));
        } else {
            var fileReader = new FileReader();
            fileReader.onload = function webViewerChangeFileReaderOnload(evt) {
                var buffer = evt.target.result;
                var uint8Array = new Uint8Array(buffer);
                PDFViewerApplication.open(uint8Array);
            };
            fileReader.readAsArrayBuffer(file);
        }
        PDFViewerApplication.setTitleUsingUrl(file.name);
        var appConfig = PDFViewerApplication.appConfig;
        appConfig.toolbar.viewBookmark.setAttribute('hidden', 'true');
        appConfig.secondaryToolbar.viewBookmarkButton.setAttribute('hidden', 'true');
        appConfig.toolbar.download.setAttribute('hidden', 'true');
        appConfig.secondaryToolbar.downloadButton.setAttribute('hidden', 'true');
    }

    function selectScaleOption(value) {
        var options = PDFViewerApplication.appConfig.toolbar.scaleSelect.options;
        var predefinedValueFound = false;
        for (var i = 0, ii = options.length; i < ii; i++) {
            var option = options[i];
            if (option.value !== value) {
                option.selected = false;
                continue;
            }
            option.selected = true;
            predefinedValueFound = true;
        }
        return predefinedValueFound;
    }

    window.addEventListener('localized', function localized(evt) {
        PDFViewerApplication.eventBus.dispatch('localized');
    });

    function webViewerLocalized() {
        document.getElementsByTagName('html')[0].dir = mozL10n.getDirection();
        PDFViewerApplication.animationStartedPromise.then(function() {
            var container = PDFViewerApplication.appConfig.toolbar.scaleSelectContainer;
            if (container.clientWidth === 0) {
                container.setAttribute('style', 'display: inherit;');
            }
            if (container.clientWidth > 0) {
                var select = PDFViewerApplication.appConfig.toolbar.scaleSelect;
                select.setAttribute('style', 'min-width: inherit;');
                var width = select.clientWidth + SCALE_SELECT_CONTAINER_PADDING;
                select.setAttribute('style', 'min-width: ' + (width + SCALE_SELECT_PADDING) + 'px;');
                container.setAttribute('style', 'min-width: ' + width + 'px; ' + 'max-width: ' + width + 'px;');
            }
            var mainContainer = PDFViewerApplication.appConfig.mainContainer;
            PDFViewerApplication.secondaryToolbar.setMaxHeight(mainContainer);
        });
    }

    function webViewerPresentationMode() {
        PDFViewerApplication.requestPresentationMode();
    }

    function webViewerOpenFile() {
        var openFileInputName = PDFViewerApplication.appConfig.openFileInputName;
        document.getElementById(openFileInputName).click();
    }

    function webViewerPrint() {
        window.print();
    }

    function webViewerDownload() {
        PDFViewerApplication.download();
    }

    function webViewerFirstPage() {
        if (PDFViewerApplication.pdfDocument) {
            PDFViewerApplication.page = 1;
        }
    }

    function webViewerLastPage() {
        if (PDFViewerApplication.pdfDocument) {
            PDFViewerApplication.page = PDFViewerApplication.pagesCount;
        }
    }

    function webViewerRotateCw() {
        PDFViewerApplication.rotatePages(90);
    }

    function webViewerRotateCcw() {
        PDFViewerApplication.rotatePages(-90);
    }

    function webViewerDocumentProperties() {
        PDFViewerApplication.pdfDocumentProperties.open();
    }

    function webViewerFind(e) {
        PDFViewerApplication.findController.executeCommand('find' + e.type, {
            query         : e.query,
            phraseSearch  : e.phraseSearch,
            caseSensitive : e.caseSensitive,
            highlightAll  : e.highlightAll,
            findPrevious  : e.findPrevious
        });
    }

    function webViewerFindFromUrlHash(e) {
        PDFViewerApplication.findController.executeCommand('find', {
            query         : e.query,
            phraseSearch  : e.phraseSearch,
            caseSensitive : false,
            highlightAll  : true,
            findPrevious  : false
        });
    }

    function webViewerScaleChanging(e) {
        var appConfig = PDFViewerApplication.appConfig;
        appConfig.toolbar.zoomOut.disabled = (e.scale === MIN_SCALE);
        appConfig.toolbar.zoomIn.disabled = (e.scale === MAX_SCALE);
        var predefinedValueFound = selectScaleOption(e.presetValue || '' + e.scale);
        if (!predefinedValueFound) {
            var customScaleOption = appConfig.toolbar.customScaleOption;
            var customScale = Math.round(e.scale * 10000) / 100;
            customScaleOption.textContent = mozL10n.get('page_scale_percent', {scale : customScale}, '{{scale}}%');
            customScaleOption.selected = true;
        }
        if (!PDFViewerApplication.initialized) {
            return;
        }
        PDFViewerApplication.pdfViewer.update();
    }

    function webViewerPageChanging(e) {
        var page = e.pageNumber;
        if (e.previousPageNumber !== page) {
            PDFViewerApplication.appConfig.toolbar.pageNumber.value = page;
            if (PDFViewerApplication.pdfSidebar.isThumbnailViewVisible) {
                PDFViewerApplication.pdfThumbnailViewer.scrollThumbnailIntoView(page);
            }
        }
        var numPages = PDFViewerApplication.pagesCount;
        PDFViewerApplication.appConfig.toolbar.previous.disabled = (page <= 1);
        PDFViewerApplication.appConfig.toolbar.next.disabled = (page >= numPages);
        PDFViewerApplication.appConfig.toolbar.firstPage.disabled = (page <= 1);
        PDFViewerApplication.appConfig.toolbar.lastPage.disabled = (page >= numPages);
        if (pdfjsLib.PDFJS.pdfBug && Stats.enabled) {
            var pageView = PDFViewerApplication.pdfViewer.getPageView(page - 1);
            if (pageView.stats) {
                Stats.add(page, pageView.stats);
            }
        }
    }

    var zoomDisabled = false, zoomDisabledTimeout;

    function handleMouseWheel(evt) {
        var MOUSE_WHEEL_DELTA_FACTOR = 40;
        var ticks = (evt.type === 'DOMMouseScroll') ? -evt.detail : evt.wheelDelta / MOUSE_WHEEL_DELTA_FACTOR;
        var direction = (ticks < 0) ? 'zoomOut' : 'zoomIn';
        var pdfViewer = PDFViewerApplication.pdfViewer;
        if (pdfViewer.isInPresentationMode) {
            evt.preventDefault();
            PDFViewerApplication.scrollPresentationMode(ticks * MOUSE_WHEEL_DELTA_FACTOR);
        } else if (evt.ctrlKey || evt.metaKey) {
            var support = PDFViewerApplication.supportedMouseWheelZoomModifierKeys;
            if ((evt.ctrlKey && !support.ctrlKey) || (evt.metaKey && !support.metaKey)) {
                return;
            }
            evt.preventDefault();
            if (zoomDisabled) {
                return;
            }
            var previousScale = pdfViewer.currentScale;
            PDFViewerApplication[direction](Math.abs(ticks));
            var currentScale = pdfViewer.currentScale;
            if (previousScale !== currentScale) {
                var scaleCorrectionFactor = currentScale / previousScale - 1;
                var rect = pdfViewer.container.getBoundingClientRect();
                var dx = evt.clientX - rect.left;
                var dy = evt.clientY - rect.top;
                pdfViewer.container.scrollLeft += dx * scaleCorrectionFactor;
                pdfViewer.container.scrollTop += dy * scaleCorrectionFactor;
            }
        } else {
            zoomDisabled = true;
            clearTimeout(zoomDisabledTimeout);
            zoomDisabledTimeout = setTimeout(function() {
                zoomDisabled = false;
            }, 1000);
        }
    }

    window.addEventListener('DOMMouseScroll', handleMouseWheel);
    window.addEventListener('mousewheel', handleMouseWheel);
    window.addEventListener('click', function click(evt) {
        if (!PDFViewerApplication.secondaryToolbar.isOpen) {
            return;
        }
        var appConfig = PDFViewerApplication.appConfig;
        if (PDFViewerApplication.pdfViewer.containsElement(evt.target) || (appConfig.toolbar.container.contains(evt.target) && evt.target !== appConfig.secondaryToolbar.toggleButton)) {
            PDFViewerApplication.secondaryToolbar.close();
        }
    }, true);
    window.addEventListener('keydown', function keydown(evt) {
        if (OverlayManager.active) {
            return;
        }
        var handled = false;
        var cmd = (evt.ctrlKey ? 1 : 0) | (evt.altKey ? 2 : 0) | (evt.shiftKey ? 4 : 0) | (evt.metaKey ? 8 : 0);
        var pdfViewer = PDFViewerApplication.pdfViewer;
        var isViewerInPresentationMode = pdfViewer && pdfViewer.isInPresentationMode;
        if (cmd === 1 || cmd === 8 || cmd === 5 || cmd === 12) {
            switch (evt.keyCode) {
                case 70:
                    if (!PDFViewerApplication.supportsIntegratedFind) {
                        PDFViewerApplication.findBar.open();
                        handled = true;
                    }
                    break;
                case 71:
                    if (!PDFViewerApplication.supportsIntegratedFind) {
                        var findState = PDFViewerApplication.findController.state;
                        if (findState) {
                            PDFViewerApplication.findController.executeCommand('findagain', {
                                query         : findState.query,
                                phraseSearch  : findState.phraseSearch,
                                caseSensitive : findState.caseSensitive,
                                highlightAll  : findState.highlightAll,
                                findPrevious  : cmd === 5 || cmd === 12
                            });
                        }
                        handled = true;
                    }
                    break;
                case 61:
                case 107:
                case 187:
                case 171:
                    if (!isViewerInPresentationMode) {
                        PDFViewerApplication.zoomIn();
                    }
                    handled = true;
                    break;
                case 173:
                case 109:
                case 189:
                    if (!isViewerInPresentationMode) {
                        PDFViewerApplication.zoomOut();
                    }
                    handled = true;
                    break;
                case 48:
                case 96:
                    if (!isViewerInPresentationMode) {
                        setTimeout(function() {
                            pdfViewer.currentScaleValue = DEFAULT_SCALE_VALUE;
                        });
                        handled = false;
                    }
                    break;
            }
        }
        if (cmd === 1 || cmd === 8) {
            switch (evt.keyCode) {
                case 83:
                    PDFViewerApplication.download();
                    handled = true;
                    break;
            }
        }
        if (cmd === 3 || cmd === 10) {
            switch (evt.keyCode) {
                case 80:
                    PDFViewerApplication.requestPresentationMode();
                    handled = true;
                    break;
                case 71:
                    PDFViewerApplication.appConfig.toolbar.pageNumber.select();
                    handled = true;
                    break;
            }
        }
        if (handled) {
            evt.preventDefault();
            return;
        }
        var curElement = document.activeElement || document.querySelector(':focus');
        var curElementTagName = curElement && curElement.tagName.toUpperCase();
        if (curElementTagName === 'INPUT' || curElementTagName === 'TEXTAREA' || curElementTagName === 'SELECT') {
            if (evt.keyCode !== 27) {
                return;
            }
        }
        var ensureViewerFocused = false;
        if (cmd === 0) {
            switch (evt.keyCode) {
                case 38:
                case 33:
                case 8:
                    if (!isViewerInPresentationMode && pdfViewer.currentScaleValue !== 'page-fit') {
                        break;
                    }
                case 37:
                    if (pdfViewer.isHorizontalScrollbarEnabled) {
                        break;
                    }
                case 75:
                case 80:
                    PDFViewerApplication.page--;
                    handled = true;
                    break;
                case 27:
                    if (PDFViewerApplication.secondaryToolbar.isOpen) {
                        PDFViewerApplication.secondaryToolbar.close();
                        handled = true;
                    }
                    if (!PDFViewerApplication.supportsIntegratedFind && PDFViewerApplication.findBar.opened) {
                        PDFViewerApplication.findBar.close();
                        handled = true;
                    }
                    break;
                case 40:
                case 34:
                case 32:
                    if (!isViewerInPresentationMode && pdfViewer.currentScaleValue !== 'page-fit') {
                        break;
                    }
                case 39:
                    if (pdfViewer.isHorizontalScrollbarEnabled) {
                        break;
                    }
                case 74:
                case 78:
                    PDFViewerApplication.page++;
                    handled = true;
                    break;
                case 36:
                    if (isViewerInPresentationMode || PDFViewerApplication.page > 1) {
                        PDFViewerApplication.page = 1;
                        handled = true;
                        ensureViewerFocused = true;
                    }
                    break;
                case 35:
                    if (isViewerInPresentationMode || (PDFViewerApplication.pdfDocument && PDFViewerApplication.page < PDFViewerApplication.pagesCount)) {
                        PDFViewerApplication.page = PDFViewerApplication.pagesCount;
                        handled = true;
                        ensureViewerFocused = true;
                    }
                    break;
                case 72:
                    if (!isViewerInPresentationMode) {
                        PDFViewerApplication.handTool.toggle();
                    }
                    break;
                case 82:
                    PDFViewerApplication.rotatePages(90);
                    break;
            }
        }
        if (cmd === 4) {
            switch (evt.keyCode) {
                case 32:
                    if (!isViewerInPresentationMode && pdfViewer.currentScaleValue !== 'page-fit') {
                        break;
                    }
                    PDFViewerApplication.page--;
                    handled = true;
                    break;
                case 82:
                    PDFViewerApplication.rotatePages(-90);
                    break;
            }
        }
        if (!handled && !isViewerInPresentationMode) {
            if ((evt.keyCode >= 33 && evt.keyCode <= 40) || (evt.keyCode === 32 && curElementTagName !== 'BUTTON')) {
                ensureViewerFocused = true;
            }
        }
        if (cmd === 2) {
            switch (evt.keyCode) {
                case 37:
                    if (isViewerInPresentationMode) {
                        PDFViewerApplication.pdfHistory.back();
                        handled = true;
                    }
                    break;
                case 39:
                    if (isViewerInPresentationMode) {
                        PDFViewerApplication.pdfHistory.forward();
                        handled = true;
                    }
                    break;
            }
        }
        if (ensureViewerFocused && !pdfViewer.containsElement(curElement)) {
            pdfViewer.focus();
        }
        if (handled) {
            evt.preventDefault();
        }
    });
    window.addEventListener('beforeprint', function beforePrint(evt) {
        PDFViewerApplication.eventBus.dispatch('beforeprint');
    });
    window.addEventListener('afterprint', function afterPrint(evt) {
        PDFViewerApplication.eventBus.dispatch('afterprint');
    });
    (function animationStartedClosure() {
        PDFViewerApplication.animationStartedPromise = new Promise(function(resolve) {
            window.requestAnimationFrame(resolve);
        });
    })();
    exports.PDFViewerApplication = PDFViewerApplication;
    exports.DefaultExernalServices = DefaultExernalServices;
}));