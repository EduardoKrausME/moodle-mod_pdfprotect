# Changelog

This file documents only the two latest published GitHub releases. Changes are attributed to the release tag that contains them, using the immediately preceding published release as the comparison baseline. Later changes on `master` are not included.

## 3.3.4 - 2026-10-19

### Added

- Added an administrator setting, `mod_pdfprotect/allowsearch`, to control PDF text search and visible result highlighting in the protected viewer. Search is disabled by default.
- Made the PDF.js text layer and find interface follow the administrator-controlled `data-allow-search` setting, including the minified viewer application. Viewer preferences cannot override the server-provided search setting.
- Added English and Brazilian Portuguese language strings for the PDF search setting and completed the Brazilian Portuguese language pack.
- Added an optional, dismissible Super Flipbook recommendation to the PDF Protect activity editing form. The recommendation is hidden when Super Flipbook is installed or the user has dismissed it; dismissal is stored in Moodle user preferences using a session-key-protected request.
- Added Moodle activity generator support and PHPUnit regression tests covering the completion calendar lifecycle, Timeline action registration and Super Flipbook recommendation behavior.

### Fixed

- Preserved the learner's manual activity completion choice by removing unconditional completion-state updates when opening PDF Protect or its HTML5 viewer. Opening the activity no longer automatically overrides a manually selected incomplete state.
- Synchronized expected completion calendar events when a PDF Protect activity is created, edited, cleared of its expected date or deleted.
- Added the correctly named Moodle calendar action callback so pending PDF Protect completion dates can appear in the Dashboard Timeline with an activity link when appropriate.
- Enabled visible PDF.js search match highlights when administrators explicitly allow PDF text search.

### Changed

- Documented the optional PDF search setting and its limitations in the README.
- Added concurrency configuration to the existing release workflow.
- Updated the root plugin release identifier to `3.3.4` and build number to `2026101900`.
- Made follow-up fixes for the test bootstrap, Moodle language strings and coding standards.

**Security note:** Enabling text search makes a browser text layer available for highlighting. Hiding selection or download controls is not a guarantee that a PDF's underlying text cannot be extracted; administrators should assess the trade-off before enabling search.

[Compare 3.3.3...3.3.4](https://github.com/EduardoKrausME/moodle-mod_pdfprotect/compare/3.3.3...3.3.4)

## 3.3.3 - 2026-10-15

### Changed

- Updated `pix/icon.png` and removed the old `pix/icon.svg` image.
- Updated the root plugin release identifier from `3.3.2` to `3.3.3` and build number from `2026101500` to `2026101501`.

No functional changes to the PDF viewer or activity behavior were identified between the published `3.3.2` and `3.3.3` tags.

[Compare 3.3.2...3.3.3](https://github.com/EduardoKrausME/moodle-mod_pdfprotect/compare/3.3.2...3.3.3)
