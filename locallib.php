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
 * Private pdfprotect module utility functions
 *
 * @package   mod_pdfprotect
 * @copyright 2025 Eduardo kraus (http://eduardokraus.com)
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die;

require_once("{$CFG->libdir}/filelib.php");
require_once("{$CFG->dirroot}/mod/pdfprotect/lib.php");

/**
 * Print pdfprotect header.
 *
 * @param object $pdfprotect
 * @param object $cm
 * @param object $course
 *
 * @return void
 * @throws coding_exception
 */
function pdfprotect_print_header($pdfprotect, $cm, $course, $embed = false) {
    global $PAGE, $OUTPUT;

    $PAGE->set_title("{$course->shortname}: {$pdfprotect->name}");
    $PAGE->set_heading($course->fullname);
    $PAGE->set_activity_record($pdfprotect);
    if ($embed) {
        $PAGE->set_pagelayout("embedded");
    }
    echo $OUTPUT->header();
}

/**
 * Print pdfprotect heading.
 *
 * @param object $pdfprotect
 * @param object $cm
 * @param object $course
 * @param bool $notused This variable is no longer used
 *
 * @return void
 */
function pdfprotect_print_heading($pdfprotect, $cm, $course, $notused = false) {
    global $OUTPUT;
    echo $OUTPUT->heading(format_string($pdfprotect->name), 2);
}

/**
 * Print pdfprotect introduction.
 *
 * @param object $pdfprotect
 * @param object $cm
 * @param object $course
 * @param bool $ignoresettings print even if not specified in modedit
 *
 * @return void
 */
function pdfprotect_print_intro($pdfprotect, $cm, $course, $ignoresettings = false) {
    global $OUTPUT;

    if ($ignoresettings) {
        $gotintro = trim(strip_tags($pdfprotect->intro));
        if ($gotintro) {
            echo $OUTPUT->box_start("mod_introbox", "pdfprotectintro");
            if ($gotintro) {
                echo format_module_intro("pdfprotect", $pdfprotect, $cm->id);
            }
            echo $OUTPUT->box_end();
        }
    }
}

/**
 * Print warning that file can not be found.
 *
 * @param object $pdfprotect
 * @param object $cm
 * @param object $course
 *
 * @return void, does not return
 * @throws coding_exception
 */
function pdfprotect_print_filenotfound($pdfprotect, $cm, $course) {
    global $OUTPUT;

    pdfprotect_print_header($pdfprotect, $cm, $course, true);
    pdfprotect_print_heading($pdfprotect, $cm, $course);
    pdfprotect_print_intro($pdfprotect, $cm, $course);
    echo $OUTPUT->notification(get_string("filenotfound", "pdfprotect"));
    echo $OUTPUT->footer();
    die;
}

/**
 * File browsing support class
 */
class pdfprotect_content_file_info extends file_info_stored {
    /**
     * Function get_parent
     *
     * @return file_info|null
     */
    public function get_parent() {
        if ($this->lf->get_filepath() === "/" && $this->lf->get_filename() === ".") {
            return $this->browser->get_file_info($this->context);
        }

        return parent::get_parent();
    }

    /**
     * Function get_visible_name
     *
     * @return string
     */
    public function get_visible_name() {
        if ($this->lf->get_filepath() === "/" && $this->lf->get_filename() === ".") {
            return $this->topvisiblename;
        }

        return parent::get_visible_name();
    }
}

/**
 * Function pdfprotect_set_mainfile
 *
 * @param $data
 *
 * @throws coding_exception
 */
function pdfprotect_set_mainfile($data) {
    $fs = get_file_storage();
    $cmid = $data->coursemodule;
    $draftitemid = $data->files;

    $context = context_module::instance($cmid);
    if ($draftitemid) {
        file_save_draft_area_files($draftitemid, $context->id, "mod_pdfprotect", "content", 0, ["subdirs" => true]);
    }
    $files = $fs->get_area_files($context->id, "mod_pdfprotect", "content", 0, "sortorder", false);
    if (count($files) == 1) {
        // Only one file attached, set it as main file automatically.
        $file = reset($files);
        file_set_sortorder($context->id, "mod_pdfprotect", "content", 0, $file->get_filepath(), $file->get_filename(), 1);
    }
}
