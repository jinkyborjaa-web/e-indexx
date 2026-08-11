import { loadAttendanceRecords } from './attendance.js';
import { initializeRecords, loadRecords } from './records.js';
import { showToast } from './utils.js';

function getApiBaseUrl() {
    const configuredUrl = window.__API_URL__ || window.API_URL;
    if (configuredUrl) {
        return configuredUrl;
    }

    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
        return 'http://localhost:3000/api';
    }

    return '/api';
}

const API_BASE_URL = getApiBaseUrl();

let currentStudentId = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Get student ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentStudentId = urlParams.get('id');

    if (!currentStudentId) {
        showToast('Student ID not found', 'error');
        return;
    }

    // Load student details
    await loadStudentDetails();

    // Initialize records
    initializeRecords(currentStudentId);

    // Add event listeners
    const recordTypeSelect = document.getElementById('recordTypeSelect');
    const subjectSelect = document.getElementById('subjectSelect');
    const categoryFilter = document.getElementById('categoryFilter');

    recordTypeSelect?.addEventListener('change', (e) => {
        const recordType = e.target.value;
        const academicHeaders = document.getElementById('academicHeaders');
        const attendanceHeaders = document.getElementById('attendanceHeaders');

        if (recordType === 'academic') {
            academicHeaders.style.display = '';
            attendanceHeaders.style.display = 'none';
            categoryFilter.style.display = '';
            loadRecords(currentStudentId);
        } else {
            academicHeaders.style.display = 'none';
            attendanceHeaders.style.display = '';
            categoryFilter.style.display = 'none';
            loadAttendanceRecords(currentStudentId);
        }
    });

    subjectSelect?.addEventListener('change', (e) => {
        const subjectId = e.target.value;
        if (recordTypeSelect.value === 'attendance') {
            loadAttendanceRecords(currentStudentId, subjectId === 'all' ? null : subjectId);
        }
    });

    categoryFilter?.addEventListener('change', (e) => {
        const category = e.target.value;
        if (recordTypeSelect.value === 'academic') {
            loadRecords(currentStudentId, category);
        }
    });
});

// Load student details
async function loadStudentDetails() {
    try {
        console.log('Fetching student details for ID:', currentStudentId);
        const response = await fetch(`${API_BASE_URL}/students/${currentStudentId}`);
        console.log('Student details response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const student = await response.json();
        console.log('Received student data:', student);
        
        if (!student.success) {
            throw new Error(student.message || 'Failed to load student details');
        }
        
        renderStudentDetails(student.student);
    } catch (error) {
        console.error('Error loading student details:', error);
        showToast('Error loading student details', 'error');
    }
}

// Render student details
function renderStudentDetails(student) {
    const studentInfo = document.getElementById('studentInfo');
    if (!studentInfo) return;

    studentInfo.innerHTML = `
        <div class="info-item">
            <span class="info-label">Student ID:</span>
            <span class="info-value">${student.student_id}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Name:</span>
            <span class="info-value">${student.name}</span>
        </div>
        <div class="info-item">
            <span class="info-label">RFID Tag:</span>
            <span class="info-value">${student.rfid_tag}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Course:</span>
            <span class="info-value">${student.course}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Year & Section:</span>
            <span class="info-value">${student.year} - ${student.section}</span>
        </div>
    `;
} 