-- `color` was added directly against the database for the per-employee
-- color-coding feature (see CLAUDE.md: briefly tried, then explicitly
-- reverted — appointments stay plain ink everywhere, including under the
-- "All" filter). The app never wrote this column after the revert, but it
-- was left behind as NOT NULL, so every employee insert has been failing
-- with a not-null violation ever since.
alter table employees drop column if exists color;
