-- Create attendance_logs table
CREATE TABLE attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    timetable_id UUID REFERENCES timetables(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    day_idx SMALLINT NOT NULL,
    period_idx SMALLINT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own attendance"
    ON attendance_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attendance"
    ON attendance_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance"
    ON attendance_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attendance"
    ON attendance_logs FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster querying
CREATE INDEX idx_attendance_logs_user_date ON attendance_logs(user_id, date);
CREATE INDEX idx_attendance_logs_timetable ON attendance_logs(timetable_id);

-- Optional: Unique constraint to prevent multiple records for the same class on the same day
CREATE UNIQUE INDEX idx_unique_attendance ON attendance_logs(user_id, timetable_id, date, period_idx);
