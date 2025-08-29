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
 * Define all the backup steps that will be used by the backup_pdfprotect_activity_task
 *
 * @package   mod_pdfprotect
 * @copyright 2025 Eduardo Kraus {@link https://eduardokraus.com}
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Define the complete pdfprotect structure for backup, with file and id annotations
 */
class backup_pdfprotect_activity_structure_step extends backup_activity_structure_step {

    /**
     * Function define_structure
     *
     * @return mixed
     */
    protected function define_structure() {
        // Define each element separated.
        $pdfprotect = new backup_nested_element("pdfprotect", ["id"],
            ["name", "intro", "introformat", "display", "revision", "timemodified"]);

        // Define sources.
        $pdfprotect->set_source_table("pdfprotect", ["id" => backup::VAR_ACTIVITYID]);

        // Define file annotations.
        $pdfprotect->annotate_files("mod_pdfprotect", "intro", null); // This file areas haven't itemid.
        $pdfprotect->annotate_files("mod_pdfprotect", "content", null); // This file areas haven't itemid.

        // Return the root element (pdfprotect), wrapped into standard activity structure.
        return $this->prepare_activity_structure($pdfprotect);
    }
}
