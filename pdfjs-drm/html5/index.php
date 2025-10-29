<?php

/**
 * pdfprotect module version information
 *
 * @package    mod_pdfprotect
 * @copyright  2021 Eduardo Kraus {@link https://eduardokraus.com}
 */

header('Access-Control-Allow-Origin: *');

require('../../../../config.php');
require_once("{$CFG->dirroot}/mod/pdfprotect/lib.php");
require_once("{$CFG->libdir}/completionlib.php");

$id = optional_param('id', 0, PARAM_INT); // Course Module ID

$token = optional_param('user_status', false, PARAM_TEXT);
if ($token && !isloggedin()) {
    $externaltokens = $DB->get_record('external_tokens', ['token' => $token], '*', IGNORE_MISSING);

    if ($externaltokens) {
        $user = $DB->get_record('user', ['id' => $externaltokens->userid], '*', IGNORE_MISSING);
        complete_user_login($user);
    }
}

if (!$cm = get_coursemodule_from_id('pdfprotect', $id)) {
    throw new moodle_exception('invalidcoursemodule');
}

$pdfprotect = $DB->get_record('pdfprotect', ['id' => $cm->instance], '*', MUST_EXIST);

$course = $DB->get_record('course', ['id' => $cm->course], '*', MUST_EXIST);

require_course_login($course, true, $cm);
$context = context_module::instance($cm->id);
require_capability('mod/pdfprotect:view', $context);

$params = [
    'context' => $context,
    'objectid' => $pdfprotect->id,
];
$event = \mod_pdfprotect\event\course_module_viewed::create($params);
$event->add_record_snapshot('course_modules', $cm);
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('pdfprotect', $pdfprotect);
$event->trigger();

// Update 'viewed' state if required by completion system
$completion = new completion_info($course);
$completion->set_module_viewed($cm);

$PAGE->set_url('/mod/pdfprotect/view.php', ['id' => $cm->id]);

$fs = get_file_storage();
$files = $fs->get_area_files($context->id, 'mod_pdfprotect', 'content', 0, 'sortorder DESC, id ASC', false); // TODO: this is not very efficient!!
if (count($files) < 1) {
    pdfprotect_print_filenotfound($pdfprotect, $cm, $course);
    die;
} else {
    $file = reset($files);
    unset($files);
}

$pdfprotect->mainfile = $file->get_filename();

// coming from course page or url index page
// this redirect trick solves caching problems when tracking views ;-)
$path = '/' . $context->id . '/mod_pdfprotect/content/' . $pdfprotect->revision . $file->get_filepath() . $file->get_filename();
$fullurl = moodle_url::make_file_url('/pluginfile.php', $path, false);

$fullurl = str_replace('.pdf', '.drm', $fullurl);


$lang = $USER->lang;
if (isset($_SESSION["SESSION"]->lang)) {
    $lang = $_SESSION["SESSION"]->lang;
}

if (strpos($lang, "_")) {
    list($firtlang, $lastlang) = explode("_", $lang);
    $lastlang = strtoupper($lastlang);

    $testlang = "{$firtlang}-{$lastlang}";
    if (file_exists("{$CFG->dirroot}/mod/pdfprotect/pdfjs-drm/external/webL10n/locales/{$testlang}/viewer.properties")) {
        $uselang = $testlang;
    } else if (file_exists("{$CFG->dirroot}/mod/pdfprotect/pdfjs-drm/external/webL10n/locales/{$firtlang}/viewer.properties")) {
        $uselang = $firtlang;
    } else {
        $uselang = "en";
    }
} else {
    if (file_exists("{$CFG->dirroot}/mod/pdfprotect/pdfjs-drm/external/webL10n/locales/{$lang}/viewer.properties")) {
        $uselang = $lang;
    } else {
        $uselang = "en";
    }
}

?>
<!--
PDF Protect by DRM
    Microsoft PlayReady DRM - https://www.microsoft.com/playready/overview/
    Licensed By Eduardo Kraus ME - https://www.eduardokraus.com/
-->
<!DOCTYPE html>
<html dir="ltr" mozdisallowselectionprint moznomarginboxes>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <meta name="google" content="notranslate">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title><?php echo $pdfprotect->name ?></title>
    <script>
        var DEFAULT_URL = '<?php echo $fullurl; ?>?amazon=false';
    </script>
    <link rel="stylesheet" href="viewer.css">
    <script src="compatibility.min.js"></script>
    <script src="../external/webL10n/l10n.min.js"></script>
    <script src="requirejs/require.min.js"></script>
    <script src="default_preferences.min.js"></script>
    <script src="viewer.min.js"></script>
    <link rel="resource" type="application/l10n"
          href="../external/webL10n/locales/<?php echo $uselang ?>/viewer.properties">
    <style>
        .toolbarButton.fullscreen {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .toolbarButton.fullscreen::before {
            content: "";
            color: rgba(255, 255, 255, 0.8);
            display: inline-block;
            width: 20px;
            height: 20px;
            background-image: url('./images/fullscreen.svg');
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
            position: relative;
            top: -1px;
            left: unset !important;
            transform: unset;
        }
        
        .fullscreen-active::before {
            background-image: url('./images/fullscreen-exit.svg') !important;
        }

    </style>
</head>

<body tabindex="1" class="loadingInProgress" oncontextmenu="return false">
<script>
    // Dynamically load language.
    document.webL10n.setLanguage('<?php echo $uselang ?>');
</script>
<div id="outerContainer">

    <div id="sidebarContainer">
        <div id="toolbarSidebar"></div>
        <div id="sidebarContent">
            <div id="thumbnailView"></div>
            <div id="outlineView" class="hidden"></div>
            <div id="attachmentsView" class="hidden"></div>
        </div>
    </div>

    <div id="mainContainer">
        <div class="findbar hidden doorHanger hiddenSmallView" id="findbar">
            <label for="findInput" class="toolbarLabel" data-l10n-id="findbar_label">Buscar:</label>
            <input id="findInput" class="toolbarField" tabindex="91">

            <div class="splitToolbarButton">
                <button class="toolbarButton findPrevious" title="" id="findPrevious" tabindex="92"
                        data-l10n-id="find_previous">
                    <span data-l10n-id="find_previous_label">Anterior</span>
                </button>
                <div class="splitToolbarButtonSeparator"></div>
                <button class="toolbarButton findNext" title="" id="findNext" tabindex="93" data-l10n-id="find_next">
                    <span data-l10n-id="find_next_label">Próximo</span>
                </button>
            </div>
            <input type="checkbox" id="findHighlightAll" class="toolbarField" tabindex="94">
            <label for="findHighlightAll" class="toolbarLabel" data-l10n-id="find_highlight">Realce todos</label>
            <input type="checkbox" id="findMatchCase" class="toolbarField" tabindex="95">
            <label for="findMatchCase" class="toolbarLabel" data-l10n-id="find_match_case_label">Diferenciar
                Maiúsculas</label>
            <span id="findResultsCount" class="toolbarLabel hidden"></span>
            <span id="findMsg" class="toolbarLabel"></span>
        </div>

        <div class="toolbar">
            <div id="toolbarContainer">
                <div id="toolbarViewer">
                    <div id="toolbarViewerLeft">
                        <button id="sidebarToggle" class="toolbarButton" title="Mostrar Miniaturas" tabindex="11"
                                data-l10n-id="toggle_sidebar">
                            <span data-l10n-id="toggle_sidebar_label">Mostrar Miniaturas</span>
                        </button>
                        <div class="toolbarButtonSpacer"></div>
                        <button id="viewFind" class="toolbarButton group hiddenSmallView" title="Buscar no Documento"
                                tabindex="12" data-l10n-id="findbar">
                            <span data-l10n-id="findbar_label">Buscar</span>
                        </button>
                        <div class="splitToolbarButton">
                            <button class="toolbarButton pageUp" title="Página anterior" id="previous" tabindex="13"
                                    data-l10n-id="previous">
                                <span data-l10n-id="previous_label">Anterior</span>
                            </button>
                            <div class="splitToolbarButtonSeparator"></div>
                            <button class="toolbarButton pageDown" title="Próxima Página" id="next" tabindex="14"
                                    data-l10n-id="next">
                                <span data-l10n-id="next_label">Próxima</span>
                            </button>
                        </div>
                        <label id="pageNumberLabel" class="toolbarLabel" for="pageNumber"
                               data-l10n-id="document_properties_page_count">Número de páginas: </label>

                        <input type="number" id="pageNumber" class="toolbarField pageNumber" value="1" size="4" min="1"
                               tabindex="15">
                        <span id="numPages" class="toolbarLabel"></span>
                    </div>
                    <div class="outerCenter">
                        <div class="innerCenter" id="toolbarViewerMiddle">
                            <div class="splitToolbarButton">
                                <button id="zoomOut" class="toolbarButton zoomOut" title="Mais Zoom" tabindex="21"
                                        data-l10n-id="zoom_out">
                                    <span data-l10n-id="zoom_out_label">Mais Zoom</span>
                                </button>
                                <div class="splitToolbarButtonSeparator"></div>
                                <button id="zoomIn" class="toolbarButton zoomIn" title="Menos Zoom" tabindex="22"
                                        data-l10n-id="zoom_in">
                                    <span data-l10n-id="zoom_in_label">Menos Zoom</span>
                                </button>
                            </div>
                            <span id="scaleSelectContainer" class="dropdownToolbarButton">
                             <select id="scaleSelect" title="Zoom" tabindex="23" data-l10n-id="zoom">
                                 <option id="pageAutoOption" value="auto"
                                         data-l10n-id="page_scale_auto">Zoom Automático</option>
                                 <option id="pageActualOption" value="page-actual" data-l10n-id="page_scale_actual">Tamanho atual</option>
                                 <option id="pageFitOption" value="page-fit" data-l10n-id="page_scale_fit">Ajustar a página</option>
                                 <option id="pageWidthOption" value="page-width" data-l10n-id="page_scale_width"
                                         selected>Ajustar a largura</option>
                                 <option id="customScaleOption" value="custom" hidden="true"></option>
                                 <option value="0.5" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 50 }'>50%</option>
                                 <option value="0.75" data-l10n-id="page_scale_percent"
                                         data-l10n-args='{ "scale": 75 }'>75%</option>
                                 <option value="1" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 100 }'>100%</option>
                                 <option value="1.25" data-l10n-id="page_scale_percent"
                                         data-l10n-args='{ "scale": 125 }'>125% </option>
                                 <option value="1.5" data-l10n-id="page_scale_percent"
                                         data-l10n-args='{ "scale": 150 }'>150% </option>
                                 <option value="2" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 200 }'>200%</option>
                                 <option value="3" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 300 }'>300%</option>
                                 <option value="4" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 400 }'>400%</option>
                             </select>
                          </span>
                            <button id="fullscreen" class="toolbarButton fullscreen" title="Tela cheia" tabindex="24"
                                    data-l10n-id="fullscreen">
                                <span data-l10n-id="fullscreen_label">Tela cheia</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div id="loadingBar">
                    <div class="progress">
                        <div class="glimmer">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <menu type="context" id="viewerContextMenu">
            <menuitem id="contextFirstPage" label="First Page" data-l10n-id="first_page"></menuitem>
            <menuitem id="contextLastPage" label="Last Page" data-l10n-id="last_page"></menuitem>
            <menuitem id="contextPageRotateCw" label="Rotate Clockwise" data-l10n-id="page_rotate_cw"></menuitem>
            <menuitem id="contextPageRotateCcw" label="Rotate Counter-Clockwise"
                      data-l10n-id="page_rotate_ccw"></menuitem>
        </menu>

        <div id="viewerContainer" tabindex="0">
            <div id="viewer" class="pdfViewer"></div>
        </div>

        <div id="errorWrapper" hidden='true'>
            <div id="errorMessageLeft">
                <span id="errorMessage"></span>
                <button id="errorShowMore" data-l10n-id="error_more_info">
                    Mais informações
                </button>
                <button id="errorShowLess" data-l10n-id="error_less_info" hidden='true'>
                    Menos
                </button>
            </div>
            <div id="errorMessageRight">
                <button id="errorClose" data-l10n-id="error_close">
                    Fechar
                </button>
            </div>
            <div class="clearBoth"></div>
            <textarea id="errorMoreInfo" hidden='true' readonly="readonly"></textarea>
        </div>
    </div>
    <!-- mainContainer -->

    <div id="overlayContainer" class="hidden">
        <div id="passwordOverlay" class="container hidden">
            <div class="dialog">
                <div class="row">
                    <p id="passwordText" data-l10n-id="password_label">Enter the password to open this PDF file:</p>
                </div>
                <div class="row">
                    <input id="password" class="toolbarField">
                </div>
                <div class="buttonRow">
                    <button id="passwordCancel" class="overlayButton">
                        <span data-l10n-id="password_cancel">Cancel</span>
                    </button>
                    <button id="passwordSubmit" class="overlayButton">
                        <span data-l10n-id="password_ok">OK</span>
                    </button>
                </div>
            </div>
        </div>
        <div id="documentPropertiesOverlay" class="container hidden" style="display:none;width:1px;height:1px;">
            <div class="dialog" style="display:none;width:1px;height:1px;">
                <button id="div-nada" style="display:none;width:1px;height:1px;"></button>
            </div>
        </div>
    </div>

</div>
<div id="printContainer"></div>
<script>
    document.addEventListener('DOMContentLoaded', function() {
        var fullscreenButton = document.getElementById('fullscreen');
        if (fullscreenButton) {
            fullscreenButton.addEventListener('click', function() {
                toggleFullScreen();
            });
        }
        
        function toggleFullScreen() {
            var container = document.getElementById('outerContainer');
            
            if (!document.fullscreenElement &&    // alternative standard method
                !document.mozFullScreenElement && 
                !document.webkitFullscreenElement && 
                !document.msFullscreenElement ) {  // current working methods
                
                if (container.requestFullscreen) {
                    container.requestFullscreen();
                } else if (container.msRequestFullscreen) {
                    container.msRequestFullscreen();
                } else if (container.mozRequestFullScreen) {
                    container.mozRequestFullScreen();
                } else if (container.webkitRequestFullscreen) {
                    container.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                }
                
                fullscreenButton.classList.add('fullscreen-active');
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
                
                fullscreenButton.classList.remove('fullscreen-active');
            }
        }
        
        // Listen for fullscreen change and update button icon
        document.addEventListener('fullscreenchange', updateFullscreenButtonIcon);
        document.addEventListener('webkitfullscreenchange', updateFullscreenButtonIcon);
        document.addEventListener('mozfullscreenchange', updateFullscreenButtonIcon);
        document.addEventListener('MSFullscreenChange', updateFullscreenButtonIcon);
        
        function updateFullscreenButtonIcon() {
            if (document.fullscreenElement || 
                document.webkitFullscreenElement || 
                document.mozFullScreenElement ||
                document.msFullscreenElement) {
                fullscreenButton.classList.add('fullscreen-active');
            } else {
                fullscreenButton.classList.remove('fullscreen-active');
            }
        }
    });
</script>
</body>
</html>
