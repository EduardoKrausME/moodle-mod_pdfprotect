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
 * Restore file.
 *
 * @package   mod_pdfprotect
 * @copyright 2025 Eduardo Kraus {@link https://eduardokraus.com}
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Class restore_pdfprotect_activity_structure_step
 */
class restore_pdfprotect_activity_structure_step extends restore_activity_structure_step {

    /**
     * Function define_structure
     *
     * @return mixed
     */
    protected function define_structure() {
        $paths = [];
        $paths[] = new restore_path_element("pdfprotect", "/activity/pdfprotect");

        // Return the paths wrapped into standard activity structure.
        return $this->prepare_activity_structure($paths);
    }

    /**
     * Function process_pdfprotect
     *
     * @param $data
     */
    protected function process_pdfprotect($data) {
        global $DB;

        $data = (object)$data;
        $data->course = $this->get_courseid();
        $data->timemodified = $this->apply_date_offset($data->timemodified);

        // Insert the pdfprotect record.
        $newitemid = $DB->insert_record("pdfprotect", $data);
        // Immediately after inserting "activity" record, call this.
        $this->apply_activity_instance($newitemid);
    }

    /**
     * Function after_execute
     *
     */
    protected function after_execute() {
        // Add choice related files, no need to match by itemname (just internally handled context).
        $this->add_related_files("mod_pdfprotect", "intro", null);
        $this->add_related_files("mod_pdfprotect", "content", null);
    }
}
