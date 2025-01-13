<?php
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
 * Lib file.
 *
 * @package   mod_pdfprotect
 * @copyright 2025 Eduardo kraus (http://eduardokraus.com)
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * List of features supported in Pdfprotect module
 *
 * @param string $feature FEATURE_xx constant for requested feature
 *
 * @return mixed True if module supports feature, false if not, null if doesn't know
 */
function pdfprotect_supports($feature) {
    switch ($feature) {
        case FEATURE_MOD_ARCHETYPE:
            return 1;
        case FEATURE_GROUPS:
            return false;
        case FEATURE_GROUPINGS:
            return false;
        case FEATURE_GROUPMEMBERSONLY:
            return true;
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_COMPLETION_TRACKS_VIEWS:
            return true;
        case FEATURE_GRADE_HAS_GRADE:
            return false;
        case FEATURE_GRADE_OUTCOMES:
            return false;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        case "mod_purpose":
            return "content";
        default:
            return null;
    }
}

/**
 * Returns all other caps used in module
 *
 * @return array
 */
function pdfprotect_get_extra_capabilities() {
    return ["moodle/site:accessallgroups"];
}

/**
 * This function is used by the reset_course_userdata function in moodlelib.
 *
 * @param stdClass $data the data submitted from the reset course.
 *
 * @return array status array
 */
function pdfprotect_reset_userdata($data) {
    return [];
}

/**
 * List the actions that correspond to a view of this module.
 * This is used by the participation report.
 *
 * Note: This is not used by new logging system. Event with
 *       crud = 'r' and edulevel = LEVEL_PARTICIPATING will
 *       be considered as view action.
 *
 * @return array
 */
function pdfprotect_get_view_actions() {
    return ["view", "view all"];
}

/**
 * List the actions that correspond to a post of this module.
 * This is used by the participation report.
 *
 * Note: This is not used by new logging system. Event with
 *       crud = ('c' || 'u' || 'd') and edulevel = LEVEL_PARTICIPATING
 *       will be considered as post action.
 *
 * @return array
 */
function pdfprotect_get_post_actions() {
    return ["update", "add"];
}

/**
 * Add pdfprotect instance.
 *
 * @param stdClass $data
 * @param stdClass $mform
 *
 * @return int new pdfprotect instance id
 * @throws dml_exception
 * @throws coding_exception
 */
function pdfprotect_add_instance($data, $mform) {
    global $CFG, $DB;
    require_once("{$CFG->dirroot}/mod/pdfprotect/locallib.php");
    $cmid = $data->coursemodule;
    $data->timemodified = time();

    $data->id = $DB->insert_record("pdfprotect", $data);

    // We need to use context now, so we need to make sure all needed info is already in db.
    $DB->set_field("course_modules", "instance", $data->id, ["id" => $cmid]);
    pdfprotect_set_mainfile($data);

    return $data->id;
}

/**
 * Update pdfprotect instance.
 *
 * @param stdClass $data
 * @param stdClass $mform
 *
 * @return bool true
 * @throws dml_exception
 * @throws coding_exception
 */
function pdfprotect_update_instance($data, $mform) {
    global $DB;
    $data->timemodified = time();
    $data->id = $data->instance;
    $data->revision++;

    $DB->update_record("pdfprotect", $data);
    pdfprotect_set_mainfile($data);

    return true;
}

/**
 * Delete pdfprotect instance.
 *
 * @param int $id
 *
 * @return bool true
 * @throws dml_exception
 */
function pdfprotect_delete_instance($id) {
    global $DB;

    if (!$pdfprotect = $DB->get_record("pdfprotect", ["id" => $id])) {
        return false;
    }

    $DB->delete_records("pdfprotect", ["id" => $pdfprotect->id]);

    return true;
}

/**
 * Given a course_module object, this function returns any
 * "extra" information that may be needed when printing
 * this activity in a course listing.
 *
 * See {@link get_array_of_activities()} in course/lib.php
 *
 * @param stdClass $coursemodule
 *
 * @return cached_cm_info info
 * @throws dml_exception
 */
function pdfprotect_get_coursemodule_info($coursemodule) {
    global $CFG, $DB;

    require_once("{$CFG->libdir}/filelib.php");
    require_once("{$CFG->dirroot}/mod/pdfprotect/locallib.php");
    require_once("{$CFG->libdir}/completionlib.php");

    if (!$pdfprotect = $DB->get_record("pdfprotect",
        ["id" => $coursemodule->instance],
        "id, name, display, revision, intro, introformat")) {
        return null;
    }

    $info = new cached_cm_info();
    $info->name = $pdfprotect->name;
    if ($coursemodule->showdescription) {
        $info->content = format_module_intro("pdfprotect", $pdfprotect, $coursemodule->id, false);
    }

    $info->completionpassgrade = false;
    $info->downloadcontent = false;
    $info->lang = false;

    return $info;
}

/**
 * Lists all browsable file areas
 *
 * @package  mod_pdfprotect
 * @category files
 *
 * @param stdClass $course  course object
 * @param stdClass $cm      course module object
 * @param stdClass $context context object
 *
 * @return array
 * @throws coding_exception
 */
function pdfprotect_get_file_areas($course, $cm, $context) {
    $areas = [];
    $areas["content"] = get_string("pdfprotectcontent", "pdfprotect");

    return $areas;
}

/**
 * File browsing support for pdfprotect module content area.
 *
 * @package  mod_pdfprotect
 * @category files
 *
 * @param file_browser $browser file browser instance
 * @param stdClass $areas       file areas
 * @param stdClass $course      course object
 * @param stdClass $cm          course module object
 * @param context $context      context object
 * @param string $filearea      file area
 * @param int $itemid           item ID
 * @param string $filepath      file path
 * @param string $filename      file name
 *
 * @return file_info instance or null if not found
 * @throws coding_exception
 */
function pdfprotect_get_file_info($browser, $areas, $course, $cm, $context, $filearea, $itemid, $filepath, $filename) {
    global $CFG;

    if (!has_capability("moodle/course:managefiles", $context)) {
        // Students can not peak here!
        return null;
    }

    $fs = get_file_storage();

    if ($filearea === "content") {
        $filepath = is_null($filepath) ? "/" : $filepath;
        $filename = is_null($filename) ? "." : $filename;

        $urlbase = "{$CFG->wwwroot}/pluginfile.php";
        if (!$storedfile = $fs->get_file($context->id, "mod_pdfprotect", "content", 0, $filepath, $filename)) {
            if ($filepath === "/" && $filename === ".") {
                $storedfile = new virtual_root_file($context->id, "mod_pdfprotect", "content", 0);
            } else {
                // Not found.
                return null;
            }
        }
        require_once("{$CFG->dirroot}/mod/pdfprotect/locallib.php");

        return new pdfprotect_content_file_info(
            $browser, $context, $storedfile, $urlbase, $areas[$filearea], true, true, true, false);
    }

    // Note: pdfprotect_intro handled in file_browser automatically.

    return null;
}

/**
 * Serves the pdfprotect files.
 *
 * @package  mod_pdfprotect
 * @category files
 *
 * @param stdClass $course    course object
 * @param stdClass $cm        course module object
 * @param context $context    context object
 * @param string $filearea    file area
 * @param array $args         extra arguments
 * @param bool $forcedownload whether or not force download
 * @param array $options      additional options affecting the file serving
 *
 * @return bool false if file not found, does not return if found - just send the file
 * @throws coding_exception
 * @throws dml_exception
 */
function pdfprotect_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, array $options = []) {
    global $DB;

    require_course_login($course, true, $cm);
    if (!has_capability("mod/pdfprotect:view", $context)) {
        return false;
    }

    if ($filearea !== "content") {
        // Intro is handled automatically in pluginfile.php.
        return false;
    }

    if (optional_param("sfgsdjfgkhjdsfhkjsdkfhgjsdfgkj", 0, PARAM_INT)) {
        array_shift($args);

        $fs = get_file_storage();
        $relativepath = urldecode(implode("/", $args));
        $fullpath = rtrim("/{$context->id}/mod_pdfprotect/{$filearea}/0/{$relativepath}", "/");
        $file = $fs->get_file_by_hash(sha1($fullpath));

        send_stored_file($file, null, null, $forcedownload, $options);
        die();
    }
    if ($_SERVER["REQUEST_METHOD"] != "POST") {
        die("die!");
    }

    // Ignore revision - designed to prevent caching problems only.
    array_shift($args);

    $fs = get_file_storage();
    $relativepath = implode("/", $args);
    $fullpath = rtrim("/{$context->id}/mod_pdfprotect/{$filearea}/0/{$relativepath}", "/");
    $fullpath = str_replace(".drm", ".pdf", $fullpath);

    $file = $fs->get_file_by_hash(sha1($fullpath));

    $sql = "SELECT f.id AS id, f.contenthash, f.pathnamehash, f.contextid, f.component, f.filearea, f.itemid,
                   f.filepath, f.filename, f.userid, f.filesize, f.mimetype, f.status, f.source, f.author,
                   f.license, f.timecreated, f.timemodified, f.sortorder, f.referencefileid,
                   r.repositoryid AS repositoryid, r.reference AS reference, r.lastsync AS referencelastsync
              FROM {files} f
         LEFT JOIN {files_reference} r ON f.referencefileid = r.id
             WHERE f.id = ?";
    $filerecord = $DB->get_record_sql($sql, [$file->get_id()]);

    $filerecord->filename = str_replace(".pdf", ".drm", $filerecord->filename);
    $filerecord->source = str_replace(".pdf", ".drm", $filerecord->source);
    $filerecord->mimetype = "application/drm";

    $file = $fs->get_file_instance($filerecord);

    \core\session\manager::write_close();

    header('Content-Disposition: attachment; filename="' . $options['filename'] . '"');
    header("Cache-Control:private max-age=1, no-transform");
    header("Expires: " . gmdate("D, d M Y H:i:s", time() + 1) . " GMT");
    header("Pragma: ");

    if (empty($options["dontdie"])) {
        $dontdie = false;
    } else {
        $dontdie = true;
    }

    pdfprotect_readfile_accel($file, $filerecord->mimetype, !$dontdie);

    return true;
}

/**
 * Enhanced readfile() with optional acceleration.
 *
 * @param stored_file $file
 * @param string $mimetype
 * @param bool $accelerate
 *
 * @return void
 */
function pdfprotect_readfile_accel($file, $mimetype, $accelerate) {
    global $CFG;

    $contenthash = $file->get_contenthash();
    $l1 = $contenthash[0] . $contenthash[1];
    $l2 = $contenthash[2] . $contenthash[3];
    $ff = "{$CFG->dataroot}/filedir/{$l1}/{$l2}/{$contenthash}";
    $ffdrm = "{$CFG->dataroot}/filedir/{$l1}/{$l2}/{$contenthash}_drm";

    if (!file_exists($ffdrm)) {
        copy($ff, $ffdrm);
        $fp = fopen($ffdrm, "r+");
        fwrite($fp, "%DRM");
        fclose($fp);
    }

    $handle = fopen($ffdrm, "r");

    header("Content-Type: {$mimetype}");
    header("Last-Modified: " . gmdate("D, d M Y H:i:s", $file->get_timemodified()) . " GMT");

    if ($accelerate && empty($CFG->disablebyteserving)) {
        header("Accept-Ranges: bytes");

        if (!empty($_SERVER["HTTP_RANGE"]) && strpos($_SERVER["HTTP_RANGE"], "bytes=") !== false) {
            $test = preg_match_all('/(\d*)-(\d*)/', $_SERVER["HTTP_RANGE"], $ranges, PREG_SET_ORDER);
            if ($test) {
                foreach ($ranges as $key => $value) {
                    if ($ranges[$key][1] == "") {
                        // Suffix case.
                        $ranges[$key][1] = $file->get_filesize() - $ranges[$key][2];
                        $ranges[$key][2] = $file->get_filesize() - 1;
                    } else if ($ranges[$key][2] == "" || $ranges[$key][2] > $file->get_filesize() - 1) {
                        // Fix range length.
                        $ranges[$key][2] = $file->get_filesize() - 1;
                    }
                    if ($ranges[$key][2] != "" && $ranges[$key][2] < $ranges[$key][1]) {
                        // Invalid byte-range ==> ignore header.
                        $ranges = false;
                        break;
                    }
                    // Prepare multipart header.
                    $ranges[$key][0] = "\r\n--" . BYTESERVING_BOUNDARY . "\r\nContent-Type: $mimetype\r\n";
                    $ranges[$key][0] .= "Content-Range: bytes {$ranges[$key][1]}-{$ranges[$key][2]}/" .
                        $file->get_filesize() . "\r\n\r\n";
                }
            } else {
                $ranges = false;
            }
            if ($ranges) {
                byteserving_send_file($handle, $mimetype, $ranges, $file->get_filesize());
            }
        }
    } else {
        // Do not byteserve.
        header("Accept-Ranges: none");
    }

    header("Content-Length: {$file->get_filesize()}");

    if ($file->get_filesize() > 10000000) {
        // For large files try to flush and close all buffers to conserve memory.
        while (@ob_get_level()) {
            if (!@ob_end_flush()) {
                break;
            }
        }
    }

    // Send the whole file content.
    $left = $file->get_filesize();
    while ($left > 0) {
        $size = min($left, 65536);
        $buffer = fread($handle, $size);
        if ($buffer === false) {
            return;
        }
        echo $buffer;
        $left -= $size;
    }
}

/**
 * Return a list of page types
 *
 * @param string $pagetype         current page type
 * @param stdClass $parentcontext  Block's parent context
 * @param stdClass $currentcontext Current context of block
 *
 * @return array
 * @throws coding_exception
 */
function pdfprotect_page_type_list($pagetype, $parentcontext, $currentcontext) {
    $modulepagetype = ["mod-pdfprotect-*" => get_string("page-mod-pdfprotect-x", "pdfprotect")];

    return $modulepagetype;
}

/**
 * Export file pdfprotect contents
 *
 * @param $cm
 * @param $baseurl
 *
 * @return array of file content
 * @throws coding_exception
 * @throws dml_exception
 */
function pdfprotect_export_contents($cm, $baseurl) {
    global $CFG, $DB;

    $contents = [];
    $context = context_module::instance($cm->id);
    $pdfprotect = $DB->get_record("pdfprotect", ["id" => $cm->instance], "*", MUST_EXIST);

    $fs = get_file_storage();
    $files = $fs->get_area_files($context->id, "mod_pdfprotect", "content", 0, "sortorder DESC, id ASC", false);

    foreach ($files as $fileinfo) {

        $filename = urlencode($fileinfo->get_filename());
        $fileurl = "{$CFG->wwwroot}/{$baseurl}/{$context->id}/mod_pdfprotect/content/" .
            "{$pdfprotect->revision}{$fileinfo->get_filepath()}{$filename}";
        $file = [
            "type" => "file",
            "filename" => $fileinfo->get_filename(),
            "filepath" => $fileinfo->get_filepath(),
            "filesize" => $fileinfo->get_filesize(),
            "fileurl" => $fileurl,
            "timecreated" => $fileinfo->get_timecreated(),
            "timemodified" => $fileinfo->get_timemodified(),
            "sortorder" => $fileinfo->get_sortorder(),
            "userid" => $fileinfo->get_userid(),
            "author" => $fileinfo->get_author(),
            "license" => $fileinfo->get_license(),
        ];
        $contents[] = $file;
    }

    return $contents;
}

/**
 * Mark the activity completed (if required) and trigger the course_module_viewed event.
 *
 * @param  stdClass $pdfprotect pdfprotect object
 * @param  stdClass $course     course object
 * @param  stdClass $cm         course module object
 * @param  stdClass $context    context object
 *
 * @since Moodle 3.0
 * @throws coding_exception
 */
function pdfprotect_view($pdfprotect, $course, $cm, $context) {
    // Trigger course_module_viewed event.
    $params = [
        "context" => $context,
        "objectid" => $pdfprotect->id,
    ];

    $event = \mod_pdfprotect\event\course_module_viewed::create($params);
    $event->add_record_snapshot("course_modules", $cm);
    $event->add_record_snapshot("course", $course);
    $event->add_record_snapshot("pdfprotect", $pdfprotect);
    $event->trigger();

    // Completion.
    $completion = new completion_info($course);
    $completion->set_module_viewed($cm);
}

/**
 * Register the ability to handle drag and drop file uploads
 *
 * @return array containing details of the files / types the mod can handle
 * @throws coding_exception
 */
function pdfprotect_dndupload_register() {
    return ["files" =>
        [
            [
                "extension" => "pdf",
                "message" => get_string("dnduploadpdfprotect", "mod_pdfprotect"),
            ],
        ],
    ];
}

/**
 * Handle a file that has been uploaded
 *
 * @param object $uploadinfo details of the file / content that has been uploaded
 *
 * @return int instance id of the newly created mod
 * @throws coding_exception
 * @throws dml_exception
 */
function pdfprotect_dndupload_handle($uploadinfo) {
    $data = new stdClass();
    $data->course = $uploadinfo->course->id;
    $data->name = $uploadinfo->displayname;
    $data->intro = "";
    $data->introformat = FORMAT_HTML;
    $data->coursemodule = $uploadinfo->coursemodule;
    $data->files = $uploadinfo->draftitemid;

    return pdfprotect_add_instance($data, null);
}
