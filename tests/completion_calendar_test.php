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
 * Regression tests for expected-completion calendar events.
 *
 * @package   mod_pdfprotect
 * @copyright 2026 Eduardo Kraus {@link https://eduardokraus.com}
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_pdfprotect;

// phpcs:ignore moodle.Files.MoodleInternal.MoodleInternalGlobalState -- Moodle checks this guarded entry point.
defined("MOODLE_INTERNAL") || die();

/**
 * Verifies calendar events throughout the PDF Protect activity lifecycle.
 *
 * @covers \pdfprotect_add_instance
 * @covers \pdfprotect_update_instance
 * @covers \pdfprotect_delete_instance
 * @covers \mod_pdfprotect_core_calendar_provide_event_action
 *
 * @package   mod_pdfprotect
 * @copyright 2026 Eduardo Kraus {@link https://eduardokraus.com}
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class completion_calendar_test extends \advanced_testcase {
    /**
     * Loads activity callbacks after Moodle initialises its global configuration.
     *
     * @return void
     */
    protected function setUp(): void {
        global $CFG;

        parent::setUp();
        require_once($CFG->dirroot . "/mod/pdfprotect/lib.php");
    }

    /**
     * Moodle discovers Timeline action callbacks by their full component name.
     */
    public function test_timeline_callback_uses_full_component_name(): void {
        $this->assertTrue(function_exists("mod_pdfprotect_core_calendar_provide_event_action"));
    }

    /**
     * No expected date must not create a completion calendar event.
     */
    public function test_no_calendar_event_without_expected_date(): void {
        global $CFG, $DB;

        $this->resetAfterTest();
        $CFG->enablecompletion = 1;
        $this->setAdminUser();

        $course = $this->getDataGenerator()->create_course(["enablecompletion" => 1]);
        $activity = $this->getDataGenerator()->create_module("pdfprotect", [
            "course" => $course->id,
            "files" => 0,
            "completion" => COMPLETION_TRACKING_MANUAL,
        ]);

        $this->assertFalse($DB->record_exists("event", $this->event_conditions($activity->id)));
    }

    /**
     * Creating, changing, clearing and deleting a date synchronises the event.
     */
    public function test_expected_completion_event_lifecycle(): void {
        global $CFG, $DB;

        $this->resetAfterTest();
        $CFG->enablecompletion = 1;
        $this->setAdminUser();

        $course = $this->getDataGenerator()->create_course(["enablecompletion" => 1]);
        $firstdate = time() + DAYSECS;
        $seconddate = $firstdate + DAYSECS;
        $activity = $this->getDataGenerator()->create_module("pdfprotect", [
            "course" => $course->id,
            "files" => 0,
            "completion" => COMPLETION_TRACKING_MANUAL,
            "completionexpected" => $firstdate,
        ]);
        $conditions = $this->event_conditions($activity->id);
        $event = $DB->get_record("event", $conditions, "*", MUST_EXIST);
        $this->assertEquals($firstdate, $event->timestart);

        $record = $DB->get_record("pdfprotect", ["id" => $activity->id], "*", MUST_EXIST);
        $record->instance = $activity->id;
        $record->coursemodule = $activity->cmid;
        $record->files = 0;
        $record->completionexpected = $seconddate;
        pdfprotect_update_instance($record, null);

        $event = $DB->get_record("event", $conditions, "*", MUST_EXIST);
        $this->assertEquals($seconddate, $event->timestart);
        $this->assertEquals(1, $DB->count_records("event", $conditions));

        $record->completionexpected = 0;
        pdfprotect_update_instance($record, null);
        $this->assertFalse($DB->record_exists("event", $conditions));

        $record->completionexpected = $firstdate;
        pdfprotect_update_instance($record, null);
        $this->assertEquals(1, $DB->count_records("event", $conditions));

        $this->assertTrue(pdfprotect_delete_instance($activity->id));
        $this->assertFalse($DB->record_exists("event", $conditions));
        $this->assertFalse($DB->record_exists("pdfprotect", ["id" => $activity->id]));
    }

    /**
     * The identifying fields used by Moodle's completion calendar API.
     *
     * @param int $instanceid PDF Protect instance ID.
     * @return array
     */
    private function event_conditions(int $instanceid): array {
        return [
            "modulename" => "pdfprotect",
            "instance" => $instanceid,
            "eventtype" => \core_completion\api::COMPLETION_EVENT_TYPE_DATE_COMPLETION_EXPECTED,
        ];
    }
}
