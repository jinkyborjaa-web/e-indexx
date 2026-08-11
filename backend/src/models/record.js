const { pool } = require('../config/database');

class Record {
    static async getByStudentId(studentId, filters = {}) {
        let conn;
        try {
            conn = await pool.getConnection();
            
            // Start building the query
            let query = 'SELECT * FROM records WHERE student_id = ?';
            const queryParams = [studentId];
            
            // Add subject filter if provided
            if (filters.subject) {
                query += ' AND subject = ?';
                queryParams.push(filters.subject);
            }
            
            // Add category filter if provided
            if (filters.category) {
                query += ' AND category = ?';
                queryParams.push(filters.category);
            }
            
            // Add ordering
            query += ' ORDER BY date_time DESC';
            
            console.log('Executing query:', query, 'with params:', queryParams);
            
            const [rows] = await conn.query(query, queryParams);
            
            // Convert BigInt to Number
            return rows.map(row => ({
                ...row,
                id: Number(row.id),
                student_id: Number(row.student_id)
            }));
        } catch (error) {
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    static async getById(id) {
        let conn;
        try {
            conn = await pool.getConnection();
            const [rows] = await conn.query(
                'SELECT * FROM records WHERE id = ?',
                [id]
            );
            const record = rows[0];
            if (record) {
                // Convert BigInt to Number
                record.id = Number(record.id);
                record.student_id = Number(record.student_id);
            }
            return record;
        } catch (error) {
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    static async create(recordData) {
        let conn;
        try {
            conn = await pool.getConnection();
            const [result] = await conn.query(
                'INSERT INTO records (student_id, subject, category, record_number, items, score, date_time) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                [
                    recordData.student_id, 
                    recordData.subject,
                    recordData.category, 
                    recordData.record_number, 
                    recordData.items, 
                    recordData.score
                ]
            );
            // Convert BigInt to Number
            return Number(result.insertId);
        } catch (error) {
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    static async createAttendance(recordData) {
        let conn;
        try {
            conn = await pool.getConnection();
            const dateTime = `${recordData.date} ${recordData.time}`;
            
            const [result] = await conn.query(
                'INSERT INTO records (student_id, subject, date_time) VALUES (?, ?, ?)',
                [
                    recordData.student_id,
                    recordData.subject,
                    dateTime
                ]
            );
            // Convert BigInt to Number
            return Number(result.insertId);
        } catch (error) {
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    static async update(id, recordData) {
        let conn;
        try {
            conn = await pool.getConnection();
            
            // Handle update based on record type
            if (recordData.record_type === 'attendance') {
                const dateTime = `${recordData.date} ${recordData.time}`;
                
                const [result] = await conn.query(
                    'UPDATE records SET student_id = ?, subject = ?, date_time = ? WHERE id = ?',
                    [
                        recordData.student_id,
                        recordData.subject,
                        dateTime,
                        id
                    ]
                );
                return result.affectedRows > 0;
            }
            else {
                // Default to academic record update
                const [result] = await conn.query(
                    'UPDATE records SET student_id = ?, subject = ?, category = ?, record_number = ?, items = ?, score = ?, date_time = NOW() WHERE id = ?',
                    [
                        recordData.student_id, 
                        recordData.subject,
                        recordData.category, 
                        recordData.record_number, 
                        recordData.items, 
                        recordData.score,
                        id
                    ]
                );
                return result.affectedRows > 0;
            }
        } catch (error) {
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    static async delete(id) {
        let conn;
        try {
            conn = await pool.getConnection();
            const [result] = await conn.query(
                'DELETE FROM records WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }
}

module.exports = Record; 