import { initializeDirectAttendance } from './direct-attendance.js';
import { icons } from './icons.js';
import { handleSaveStudent, loadStudents } from './students.js';

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    const searchInput = document.getElementById('searchInput');
    const rfidInput = document.getElementById('rfidInput');
    const searchRfidBtn = document.getElementById('searchRfidBtn');
    const saveStudentBtn = document.getElementById('saveStudentBtn');
    const searchResult = document.getElementById('searchResult');
    const viewIndexBtn = document.getElementById('viewIndexBtn');

    // Focus on RFID input
    rfidInput?.focus();

    // Event Listeners
    searchInput?.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterStudents(searchTerm);
    });

    rfidInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleRFIDScan();
        }
    });

    searchRfidBtn?.addEventListener('click', handleRFIDScan);
    saveStudentBtn?.addEventListener('click', handleSaveStudent);
    viewIndexBtn?.addEventListener('click', () => {
        const studentId = viewIndexBtn.dataset.studentId;
        if (studentId) {
            window.location.href = `/student.html?id=${studentId}`;
        }
    });

    // Load initial data
    loadStudents();

    // Initialize icons
    if (document.getElementById('searchIcon')) {
        document.getElementById('searchIcon').innerHTML = icons.search;
    }
    if (document.getElementById('plusIcon')) {
        document.getElementById('plusIcon').innerHTML = icons.plus;
    }
    if (document.getElementById('searchRfidIcon')) {
        document.getElementById('searchRfidIcon').innerHTML = icons.search;
    }
    if (document.getElementById('arrowLeftIcon')) {
        document.getElementById('arrowLeftIcon').innerHTML = icons.arrowLeft;
    }

    // Initialize direct attendance
    initializeDirectAttendance();
});

function filterStudents(searchTerm) {
    const rows = document.querySelectorAll('#studentsTable tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

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

async function handleRFIDScan() {
    const rfidInput = document.getElementById('rfidInput');
    const rfidValue = rfidInput.value.trim();
    
    if (!rfidValue) return;

    try {
        const response = await fetch(`${API_BASE_URL}/students/rfid/${rfidValue}`);
        const data = await response.json();

        if (data.success) {
            const student = data.student;
            // Directly navigate to student index page
            window.location.href = `/student.html?id=${student.id}`;
        } else {
            showToast('Student not found', 'error');
        }
    } catch (error) {
        console.error('Error scanning RFID:', error);
        showToast('Error scanning RFID', 'error');
    }

    // Clear input
    rfidInput.value = '';
    rfidInput.focus();
}

