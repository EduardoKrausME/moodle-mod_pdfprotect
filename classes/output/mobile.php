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

namespace mod_pdfprotect\output;

use context_module;
use moodle_url;

defined("MOODLE_INTERNAL") || die();

/**
 * Output Mobile for mod_pdfprotect.
 *
 * @package mod_pdfprotect
 * @copyright 2025 Eduardo Kraus
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class mobile {

    /**
     * Render the activity inside the Moodle App.
     *
     * @param array $args
     * @return array
     * @throws \coding_exception
     * @throws \core\exception\moodle_exception
     * @throws \dml_exception
     * @throws \required_capability_exception
     */
    public static function mobile_course_view($args) {
        global $DB, $OUTPUT;

        $cmid = (int)($args["cmid"] ?? 0);
        $cm = get_coursemodule_from_id("pdfprotect", $cmid, 0, false, MUST_EXIST);

        $context = context_module::instance($cm->id);
        require_capability("mod/pdfprotect:view", $context);

        $pdfprotect = $DB->get_record(
            "pdfprotect",
            ["id" => $cm->instance],
            "id, course, name, intro, introformat",
            MUST_EXIST
        );

        $data = [
            "cmid" => $cm->id,
            "name" => format_string($pdfprotect->name, true, ["context" => $context]),
            "description" => format_module_intro("pdfprotect", $pdfprotect, $cm->id, false),
            "viewurl" => (new moodle_url("/mod/pdfprotect/view.php", [
                "id" => $cm->id,
            ]))->out(false),
        ];

        return [
            "templates" => [[
                "id" => "main",
                "html" => $OUTPUT->render_from_template("mod_pdfprotect/mobile", $data),
            ]],
            "javascript" => "",
            "otherdata" => "",
            "files" => [],
        ];
    }
}