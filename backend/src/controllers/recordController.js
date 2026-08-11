const Record = require('../models/record');

exports.getStudentRecords = async (req, res) => {
    try {
        // Extract query parameters for filtering
        const filters = {
            subject: req.query.subject,
            type: req.query.type,
            category: req.query.category
        };
        
        console.log('Received filter request:', filters);
        
        // Pass filters to the model
        const records = await Record.getByStudentId(req.params.studentId, filters);
        
        res.json({ success: true, records });
    } catch (error) {
        console.error('Error in getStudentRecords:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getRecord = async (req, res) => {
    try {
        const record = await Record.getById(req.params.id);
        if (record) {
            res.json({ success: true, record });
        } else {
            res.status(404).json({ success: false, message: 'Record not found' });
        }
    } catch (error) {
        console.error('Error in getRecord:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createRecord = async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const recordType = req.body.record_type || 'academic';
        
        // Handle academic records
        if (recordType === 'academic') {
            const { subject, category, record_number, items, score } = req.body;
            
            // Basic validation
            if (!subject || !category || !record_number || !items || score === undefined) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'All fields are required for academic records' 
                });
            }

            // Type validation
            const recordNum = parseInt(record_number);
            const itemsNum = parseInt(items);
            const scoreNum = parseFloat(score);

            if (isNaN(recordNum) || recordNum < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Record number must be a positive integer'
                });
            }

            if (isNaN(itemsNum) || itemsNum < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Items must be a positive integer'
                });
            }

            if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > itemsNum) {
                return res.status(400).json({
                    success: false,
                    message: `Score must be between 0 and ${itemsNum}`
                });
            }

            const insertId = await Record.create({
                student_id: studentId,
                subject,
                category,
                record_number: recordNum,
                items: itemsNum,
                score: scoreNum,
                record_type: recordType
            });

            res.status(201).json({ 
                success: true, 
                message: 'Academic record created successfully',
                recordId: insertId
            });
        } 
        // Handle attendance records
        else if (recordType === 'attendance') {
            const { subject, date, time } = req.body;
            
            // Basic validation
            if (!subject || !date || !time) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Subject, date, and time are required for attendance records' 
                });
            }
            
            // Combine date and time into a datetime object
            const dateTime = new Date(`${date}T${time}`);
            if (isNaN(dateTime.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date or time format'
                });
            }
            
            const insertId = await Record.createAttendance({
                student_id: studentId,
                subject,
                date,
                time,
                record_type: recordType
            });
            
            res.status(201).json({
                success: true,
                message: 'Attendance record created successfully',
                recordId: insertId
            });
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'Invalid record type'
            });
        }
    } catch (error) {
        console.error('Error in createRecord:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ 
                success: false, 
                message: 'Record already exists' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Server error' 
            });
        }
    }
};

exports.updateRecord = async (req, res) => {
    try {
        const recordId = req.params.id;
        const studentId = req.params.studentId;
        const recordType = req.body.record_type || 'academic';
        
        let success = false;
        
        // Handle academic records
        if (recordType === 'academic') {
            const { subject, category, record_number, items, score } = req.body;

            // Basic validation
            if (!subject || !category || !record_number || !items || score === undefined) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'All fields are required for academic records' 
                });
            }

            // Type validation
            const recordNum = parseInt(record_number);
            const itemsNum = parseInt(items);
            const scoreNum = parseFloat(score);

            if (isNaN(recordNum) || recordNum < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Record number must be a positive integer'
                });
            }

            if (isNaN(itemsNum) || itemsNum < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Items must be a positive integer'
                });
            }

            if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > itemsNum) {
                return res.status(400).json({
                    success: false,
                    message: `Score must be between 0 and ${itemsNum}`
                });
            }

            success = await Record.update(recordId, {
                student_id: studentId,
                subject,
                category,
                record_number: recordNum,
                items: itemsNum,
                score: scoreNum,
                record_type: recordType
            });
        } 
        // Handle attendance records
        else if (recordType === 'attendance') {
            const { subject, date, time } = req.body;
            
            // Basic validation
            if (!subject || !date || !time) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Subject, date, and time are required for attendance records' 
                });
            }
            
            // Validate date and time format
            const dateTime = new Date(`${date}T${time}`);
            if (isNaN(dateTime.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date or time format'
                });
            }
            
            success = await Record.update(recordId, {
                student_id: studentId,
                subject,
                date,
                time,
                record_type: recordType
            });
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'Invalid record type'
            });
        }

        if (success) {
            res.json({ 
                success: true, 
                message: 'Record updated successfully' 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Record not found' 
            });
        }
    } catch (error) {
        console.error('Error in updateRecord:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ 
                success: false, 
                message: 'Record already exists' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Server error' 
            });
        }
    }
};

exports.deleteRecord = async (req, res) => {
    try {
        const success = await Record.delete(req.params.id);
        if (success) {
            res.json({ 
                success: true, 
                message: 'Record deleted successfully' 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Record not found' 
            });
        }
    } catch (error) {
        console.error('Error in deleteRecord:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
}; 