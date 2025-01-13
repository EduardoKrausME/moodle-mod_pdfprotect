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
 * Index file.
 *
 * @package   mod_pdfprotect
 * @copyright 2025 Eduardo kraus (http://eduardokraus.com)
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_pdfprotect\output;

/**
 * Class mobile
 *
 * @package mod_pdfprotect\output
 */
class mobile {
    /**
     * Function mobile_course_view
     *
     * @param $args
     *
     * @return array
     * @throws \coding_exception
     */
    public static function mobile_course_view($args) {
        global $OUTPUT, $USER, $_COOKIE;

        $data = [
            "cmid" => $args["cmid"],
            "session" => optional_param("wstoken", "", PARAM_TEXT),
            "user_id" => $USER->id,
        ];

        return [
            "templates" => [
                [
                    "id" => "main",
                    "html" => $OUTPUT->render_from_template("mod_pdfprotect/mobile_view_page", $data),
                ],
            ],
            "javascript" => file_get_contents(__DIR__ . "/mobile.js"),
            "otherdata" => "",
            "files" => [],
        ];
    }
}
