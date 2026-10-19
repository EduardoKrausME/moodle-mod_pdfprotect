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
 * Tests for the optional Super Flipbook promotion in the activity form.
 *
 * @package   mod_pdfprotect
 * @copyright 2026 Eduardo Kraus {@link https://eduardokraus.com}
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_pdfprotect;

// phpcs:ignore moodle.Files.MoodleInternal.MoodleInternalGlobalState -- Moodle checks this guarded entry point.
defined("MOODLE_INTERNAL") || die();

/**
 * Super Flipbook promotion visibility and permanent dismissal.
 *
 * @covers \mod_pdfprotect\superflipbook_banner
 */
final class superflipbook_banner_test extends \advanced_testcase {
    /**
     * The notice can be permanently dismissed by the editing user.
     */
    public function test_banner_visibility_and_permanent_dismissal(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        unset_config("version", "mod_superflipbook");
        unset_user_preference(superflipbook_banner::PREFERENCE_HIDDEN);

        $this->assertTrue(superflipbook_banner::should_show());

        set_user_preference(superflipbook_banner::PREFERENCE_HIDDEN, "1");
        $this->assertFalse(superflipbook_banner::should_show());

        // Dismissal is persistent across new checks and is not browser-local state.
        $this->assertFalse(superflipbook_banner::should_show());
    }

    /**
     * Installed Super Flipbook instances must not see the recommendation.
     */
    public function test_installed_plugin_suppresses_banner(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        unset_user_preference(superflipbook_banner::PREFERENCE_HIDDEN);
        set_config("version", 2026101800, "mod_superflipbook");

        $this->assertFalse(superflipbook_banner::should_show());
    }

    /**
     * Hiding the promotion does not affect another Moodle user.
     */
    public function test_dismissal_is_per_user(): void {
        $this->resetAfterTest();
        unset_config("version", "mod_superflipbook");

        $first = $this->getDataGenerator()->create_user();
        $second = $this->getDataGenerator()->create_user();

        $this->setUser($first);
        set_user_preference(superflipbook_banner::PREFERENCE_HIDDEN, "1");
        $this->assertFalse(superflipbook_banner::should_show());

        $this->setUser($second);
        unset_user_preference(superflipbook_banner::PREFERENCE_HIDDEN);
        $this->assertTrue(superflipbook_banner::should_show());
    }
}
