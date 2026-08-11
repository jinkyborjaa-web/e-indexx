const Attendance = require('../models/attendance');

const getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subjectId } = req.query;

        const attendance = await Attendance.getByStudentId(studentId, subjectId);
        
        res.json({
            success: true,
            attendance
        });
    } catch (error) {
        console.error('Error getting student attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting student attendance'
        });
    }
};

const getSubjects = async (req, res) => {
    try {
        const subjects = await Attendance.getSubjects();
        
        res.json({
            success: true,
            subjects
        });
    } catch (error) {
        console.error('Error getting subjects:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting subjects'
        });
    }
};

const createAttendance = async (req, res) => {
    try {
        const { student_id, subject_id, date, time } = req.body;

        if (!student_id || !subject_id) {
            return res.status(400).json({
                success: false,
                message: 'Student ID and Subject ID are required'
            });
        }

        let dateTime = null;
        if (date || time) {
            if (!date || !time) {
                return res.status(400).json({
                    success: false,
                    message: 'Both date and time are required when setting attendance time'
                });
            }

            dateTime = `${date} ${time}`;
            if (isNaN(new Date(dateTime).getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date or time format'
                });
            }
        }

        const attendanceId = await Attendance.create({
            student_id,
            subject_id,
            date_time: dateTime
        });

        res.status(201).json({
            success: true,
            message: 'Attendance recorded successfully',
            attendanceId
        });
    } catch (error) {
        console.error('Error creating attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating attendance record'
        });
    }
};

const deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Attendance.delete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }

        res.json({
            success: true,
            message: 'Attendance record deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting attendance record'
        });
    }
};

module.exports = {
    getStudentAttendance,
    getSubjects,
    createAttendance,
    deleteAttendance
}; 