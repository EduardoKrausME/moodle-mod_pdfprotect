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
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Test data generator for PDF Protect activities.
 *
 * @package   mod_pdfprotect
 * @copyright 2026 Eduardo Kraus {@link https://eduardokraus.com}
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// phpcs:ignore moodle.Files.MoodleInternal.MoodleInternalGlobalState -- Guard this Moodle test generator.
defined("MOODLE_INTERNAL") || die();

/**
 * Creates PDF Protect modules using the standard Moodle module generator.
 */
class mod_pdfprotect_generator extends testing_module_generator {
    /**
     * Creates a PDF Protect instance for automated tests.
     *
     * Callers can pass a draft file item ID in files to exercise uploads;
     * tests that only need a module may omit it.
     *
     * @param array|stdClass|null $record Activity data, including course.
     * @param array|null $options Course module options.
     * @return stdClass Created instance with its cmid.
     */
    public function create_instance($record = null, ?array $options = null) {
        $record = (object) (array) $record;

        if (!isset($record->files)) {
            $record->files = 0;
        }

        if (!isset($record->display)) {
            $record->display = 0;
        }

        if (!isset($record->revision)) {
            $record->revision = 1;
        }

        return parent::create_instance($record, $options);
    }
}
