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
 * Permanently dismiss the Super Flipbook promotion for the signed-in user.
 *
 * @package   mod_pdfprotect
 * @copyright 2026 Eduardo Kraus {@link https://eduardokraus.com}
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define("AJAX_SCRIPT", true);

require_once(__DIR__ . "/../../config.php");

require_login();

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    exit;
}

require_sesskey();

set_user_preference(\mod_pdfprotect\superflipbook_banner::PREFERENCE_HIDDEN, 1);

header("Content-Type: application/json; charset=utf-8");
echo json_encode(["success" => true]);
