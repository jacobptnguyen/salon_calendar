-- An appointment can be saved as just a note, with no time yet — see
-- src/components/calendar/DayCell.jsx. A time is read off the line when
-- there's one to find, but isn't required to save.
alter table appointments alter column appointment_time drop not null;
