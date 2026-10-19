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
 * Optional Super Flipbook promotion in the PDF Protect activity form.
 *
 * @package   mod_pdfprotect
 * @copyright 2026 Eduardo Kraus {@link https://eduardokraus.com}
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_pdfprotect;

// phpcs:ignore moodle.Files.MoodleInternal.MoodleInternalGlobalState -- Moodle checks this guarded entry point.
defined("MOODLE_INTERNAL") || die();

/**
 * Determine whether the optional Super Flipbook promotion is relevant to the current user.
 */
final class superflipbook_banner {
    /** @var string User preference for permanently hiding the promotion. */
    public const PREFERENCE_HIDDEN = "mod_pdfprotect_superflipbook_banner_hidden";

    /**
     * Show only when Super Flipbook is absent and the user has not dismissed the promotion.
     *
     * The activity editor already checks the user's permission to modify the course.
     *
     * @return bool
     */
    public static function should_show(): bool {
        if (get_config("mod_superflipbook", "version") !== false) {
            return false;
        }

        return !get_user_preferences(self::PREFERENCE_HIDDEN, false);
    }
}
