const Student = require('../models/student');

exports.findByRFID = async (req, res) => {
    try {
        const student = await Student.findByRFID(req.params.rfidTag);
        if (student) {
            res.json({ success: true, student });
        } else {
            res.status(404).json({ success: false, message: 'Student not found' });
        }
    } catch (error) {
        console.error('Error in findByRFID:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.getAll();
        
        res.json({ success: true, students });
    } catch (error) {
        console.error('Error in getAllStudents:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getStudentById = async (req, res) => {
    try {
        const student = await Student.getById(req.params.id);
        if (student) {
            res.json({ success: true, student });
        } else {
            res.status(404).json({ success: false, message: 'Student not found' });
        }
    } catch (error) {
        console.error('Error in getStudentById:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getStudentRecords = async (req, res) => {
    try {
        const studentId = req.params.id;
        const category = req.query.category;
        const subject = req.query.subject;
        
        const records = await Student.getRecords(studentId, category, subject);
        
        res.json({
            success: true,
            records: records
        });
    } catch (error) {
        console.error('Error getting student records:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get student records'
        });
    }
};

exports.createStudent = async (req, res) => {
    try {
        const { student_id, name, rfid_tag, course, year, section } = req.body;
        
        // Basic validation
        if (!student_id || !name || !rfid_tag || !course || !year || !section) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        // Validate student_id format (00-0000)
        const studentIdPattern = /^\d{2}-\d{4}$/;
        if (!studentIdPattern.test(student_id)) {
            return res.status(400).json({
                success: false,
                message: 'Student ID must be in the format 00-0000'
            });
        }

        // Type validation
        const yearNum = parseInt(year);
        if (isNaN(yearNum) || yearNum < 1 || yearNum > 5) {
            return res.status(400).json({
                success: false,
                message: 'Year must be a number between 1 and 5'
            });
        }

        // Create student with validated data
        const insertId = await Student.create({
            student_id: student_id.trim(),
            name: name.trim(),
            rfid_tag: rfid_tag.trim(),
            course: course.trim(),
            year: yearNum,
            section: section.trim()
        });

        res.status(201).json({ 
            success: true, 
            message: 'Student created successfully',
            studentId: Number(insertId) // Convert BigInt to Number
        });
    } catch (error) {
        console.error('Error in createStudent:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ 
                success: false, 
                message: error.message.includes('student_id') ? 'Student ID already exists' : 'RFID tag already exists'
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Server error' 
            });
        }
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const { student_id, name, rfid_tag, course, year, section } = req.body;
        const studentId = req.params.id;

        // Basic validation
        if (!student_id || !name || !rfid_tag || !course || !year || !section) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        // Validate student_id format (00-0000)
        const studentIdPattern = /^\d{2}-\d{4}$/;
        if (!studentIdPattern.test(student_id)) {
            return res.status(400).json({
                success: false,
                message: 'Student ID must be in the format 00-0000'
            });
        }

        const success = await Student.update(studentId, {
            student_id,
            name,
            rfid_tag,
            course,
            year,
            section
        });

        if (success) {
            res.json({ 
                success: true, 
                message: 'Student updated successfully' 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Student not found' 
            });
        }
    } catch (error) {
        console.error('Error in updateStudent:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ 
                success: false, 
                message: error.message.includes('student_id') ? 'Student ID already exists' : 'RFID tag already exists'
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Server error' 
            });
        }
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const success = await Student.delete(req.params.id);
        if (success) {
            res.json({ 
                success: true, 
                message: 'Student deleted successfully' 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Student not found' 
            });
        }
    } catch (error) {
        console.error('Error in deleteStudent:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
}; 