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
 * Pdfprotect module version information
 *
 * @package   mod_pdfprotect
 * @copyright 2025 Eduardo Kraus {@link https://eduardokraus.com}
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require('../../config.php');
require_once($CFG->libdir . '/completionlib.php');

$id = optional_param('id', 0, PARAM_INT); // Course Module ID.
$r = optional_param('r', 0, PARAM_INT);  // Pdfprotect instance ID.

if ($r) {
    if (!$pdfprotect = $DB->get_record('pdfprotect', ['id' => $r])) {
        throw new Exception('invalidaccessparameter');
    }
    $cm = get_coursemodule_from_instance('pdfprotect', $pdfprotect->id, $pdfprotect->course, false, MUST_EXIST);
} else {
    if (!$cm = get_coursemodule_from_id('pdfprotect', $id)) {
        throw new Exception('invalidcoursemodule');
    }
    $pdfprotect = $DB->get_record('pdfprotect', ['id' => $cm->instance], '*', MUST_EXIST);
}

$course = $DB->get_record('course', ['id' => $cm->course], '*', MUST_EXIST);

if ($token = optional_param("token", false, PARAM_TEXT)) {
    $externalservice = $DB->get_record("external_services", ["shortname" => MOODLE_OFFICIAL_MOBILE_SERVICE]);
    $externaltoken = $DB->get_record("external_tokens", ["token" => $token, "externalserviceid" => $externalservice->id], "userid");
    $user = $DB->get_record("user", ["id" => $externaltoken->userid]);

    if ($user) {
        \core\session\manager::login_user($user);
        $PAGE->set_pagelayout("embedded");
        $PAGE->add_body_class("body-pdfprotect-mobile-view");
    }
    require_course_login($course, false, null, false, true);
} else {
    require_course_login($course, true, $cm);
}
$context = context_module::instance($cm->id);
require_capability('mod/pdfprotect:view', $context);

// Completion and trigger events.
pdfprotect_view($pdfprotect, $course, $cm, $context);

$PAGE->set_url('/mod/pdfprotect/view.php', ['id' => $cm->id]);
$PAGE->set_title(format_string($pdfprotect->name));
$PAGE->set_heading($course->fullname);
$PAGE->set_cm($cm, $course);

echo $OUTPUT->header();

echo $OUTPUT->render_from_template('mod_pdfprotect/view_page', ['id' => $id]);
$PAGE->requires->js_call_amd("mod_pdfprotect/view_page", "init", []);

echo $OUTPUT->footer();
