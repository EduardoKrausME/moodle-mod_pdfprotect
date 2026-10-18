// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle. If not, see <http://www.gnu.org/licenses/>.

/**
 * Dismiss the optional Super Flipbook notice without submitting the Moodle activity form.
 *
 * @module mod_pdfprotect/superflipbook_banner
 * @copyright 2026 Eduardo Kraus {@link https://eduardokraus.com}
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(["jquery"], function($) {
    "use strict";

    /**
     * Set up permanent user-level dismissal.
     */
    const init = function() {
        const banner = document.querySelector("[data-pdfprotect-superflipbook-banner]");
        if (!banner) {
            return;
        }

        const button = banner.querySelector("[data-pdfprotect-superflipbook-dismiss]");
        const error = banner.querySelector("[data-pdfprotect-superflipbook-error]");
        if (!button) {
            return;
        }

        button.addEventListener("click", function() {
            if (button.disabled) {
                return;
            }
            button.disabled = true;
            if (error) {
                error.hidden = true;
            }

            const body = new URLSearchParams();
            body.set("sesskey", M.cfg.sesskey);

            fetch(banner.getAttribute("data-dismiss-url"), {
                method: "POST",
                credentials: "same-origin",
                headers: {"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"},
                body: body.toString()
            }).then(function(response) {
                if (!response.ok) {
                    throw new Error("Could not dismiss the Super Flipbook banner.");
                }
                return response.json();
            }).then(function(result) {
                if (!result.success) {
                    throw new Error("Super Flipbook banner dismissal was not saved.");
                }
                banner.remove();
            }).catch(function() {
                button.disabled = false;
                if (error) {
                    error.hidden = false;
                }
            });
        });
    };

    return {init: init};
});
