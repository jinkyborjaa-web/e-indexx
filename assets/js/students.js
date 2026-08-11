import {
    clearValidation,
    createStudent,
    deleteStudent,
    getAllStudents,
    getFormData,
    resetForm,
    showToast,
    updateStudent
} from './api.js';

let currentStudentId = null;
let allStudents = []; // Store all students for filtering

// Load and display students
export async function loadStudents() {
    try {
        const response = await getAllStudents();
        if (response.success) {
            allStudents = response.students; // Store all students
            renderStudentsTable(allStudents);
            updateFilterOptions(); // Update filter dropdowns
        } else {
            showToast('Failed to load students', 'error');
        }
    } catch (error) {
        showToast('Error loading students', 'error');
    }
}

function updateFilterOptions() {
    // Get unique courses and sections
    const courses = [...new Set(allStudents.map(student => student.course))].sort();
    const sections = [...new Set(allStudents.map(student => student.section))].sort();

    // Update course filter
    const courseFilter = document.getElementById('courseFilter');
    courseFilter.innerHTML = '<option value="">All Courses</option>' +
        courses.map(course => `<option value="${course}">${course}</option>`).join('');

    // Update section filter
    const sectionFilter = document.getElementById('sectionFilter');
    sectionFilter.innerHTML = '<option value="">All Sections</option>' +
        sections.map(section => `<option value="${section}">${section}</option>`).join('');
}

function filterStudents() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const courseFilter = document.getElementById('courseFilter').value;
    const yearFilter = document.getElementById('yearFilter').value;
    const sectionFilter = document.getElementById('sectionFilter').value;

    const filteredStudents = allStudents.filter(student => {
        const matchesSearch = Object.values(student).some(value => 
            String(value).toLowerCase().includes(searchTerm)
        );
        const matchesCourse = !courseFilter || student.course === courseFilter;
        const matchesYear = !yearFilter || student.year === parseInt(yearFilter);
        const matchesSection = !sectionFilter || student.section === sectionFilter;

        return matchesSearch && matchesCourse && matchesYear && matchesSection;
    });

    renderStudentsTable(filteredStudents);
}

function renderStudentsTable(students) {
    const tbody = document.querySelector('#studentsTable tbody');
    tbody.innerHTML = '';
    
    if (students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No students found</td>
            </tr>
        `;
        return;
    }

    students.forEach(student => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${student.student_id}</td>
            <td>${student.name}</td>
            <td>${student.course}</td>
            <td>${student.year}</td>
            <td>${student.section}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-light" onclick="editStudent(${student.id})" title="Edit Student">
                        <img src="assets/icons/edit.svg" alt="Edit" width="16" height="16">
                    </button>
                    <button class="btn btn-sm btn-light" onclick="showDeleteConfirmation(${student.id}, '${student.name}')" title="Delete Student">
                        <img src="assets/icons/delete.svg" alt="Delete" width="16" height="16">
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Add/Edit student
export async function handleSaveStudent() {
    const formData = getFormData('addStudentForm');

    // Validate form
    if (!validateStudentForm(formData)) return;

    try {
        const data = {
            ...formData,
            year: parseInt(formData.year)
        };

        let response;
        if (currentStudentId) {
            response = await updateStudent(currentStudentId, data);
        } else {
            response = await createStudent(data);
        }

        if (response.success) {
            const modal = document.getElementById('addStudentModal');
            modal.classList.remove('active');
            resetForm('addStudentForm');
            await loadStudents();
            showToast(currentStudentId ? 'Student updated successfully' : 'Student added successfully');
            currentStudentId = null;
        } else {
            showToast(response.message, 'error');
        }
    } catch (error) {
        showToast('Error saving student', 'error');
    }
}

function validateStudentForm(data) {
    let isValid = true;
    const form = document.getElementById('addStudentForm');
    clearValidation(form);

    if (!data.student_id?.trim()) {
        setInvalid('student_id', 'Student ID is required');
        isValid = false;
    } else if (!/^\d{2}-\d{4}$/.test(data.student_id)) {
        setInvalid('student_id', 'Student ID must be in format 00-0000');
        isValid = false;
    }

    if (!data.name?.trim()) {
        setInvalid('name', 'Name is required');
        isValid = false;
    }

    if (!data.rfid_tag?.trim()) {
        setInvalid('rfid_tag', 'RFID tag is required');
        isValid = false;
    }

    if (!data.course?.trim()) {
        setInvalid('course', 'Course is required');
        isValid = false;
    }

    const year = parseInt(data.year);
    if (isNaN(year) || year < 1 || year > 5) {
        setInvalid('year', 'Year must be between 1 and 5');
        isValid = false;
    }

    if (!data.section?.trim()) {
        setInvalid('section', 'Section is required');
        isValid = false;
    }

    return isValid;
}

function setInvalid(fieldName, message) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    field.classList.add('is-invalid');
    field.nextElementSibling.textContent = message;
}

// Edit student
export async function editStudent(id) {
    try {
        currentStudentId = id;
        
        // Fetch complete student data from API
        const configuredUrl = window.__API_URL__ || window.API_URL;
        const baseUrl = configuredUrl || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === ''
            ? 'http://localhost:3000/api'
            : '/api');
        const response = await fetch(`${baseUrl}/students/${id}`);
        const data = await response.json();
        
        if (!data.success) {
            showToast('Failed to load student data', 'error');
            return;
        }

        const student = data.student;
        const form = document.getElementById('addStudentForm');
        
        // Fill form with complete student data
        form.student_id.value = student.student_id;
        form.name.value = student.name;
        form.rfid_tag.value = student.rfid_tag;
        form.course.value = student.course;
        form.year.value = student.year;
        form.section.value = student.section;

        // Update modal title and button
        const modalTitle = document.querySelector('#addStudentModal h5');
        const saveButton = document.getElementById('saveStudentBtn');
        
        if (modalTitle) modalTitle.textContent = 'Edit Student';
        if (saveButton) saveButton.textContent = 'Update Student';

        // Show modal
        const modal = document.getElementById('addStudentModal');
        modal.classList.add('active');
    } catch (error) {
        console.error('Error loading student data:', error);
        showToast('Error loading student data', 'error');
    }
}

// Delete student
export function showDeleteConfirmation(id, name) {
    const confirmationHtml = `
        <div class="modal" id="deleteConfirmationModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Delete Student</h5>
                    <button type="button" class="btn btn-light" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to delete <strong>${name}</strong>?</p>
                    <p class="text-danger">This action cannot be undone.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button type="button" class="btn btn-danger" onclick="confirmDelete(${id})">Delete Student</button>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('deleteConfirmationModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add new modal to the document
    document.body.insertAdjacentHTML('beforeend', confirmationHtml);

    // Show the modal
    const modal = document.getElementById('deleteConfirmationModal');
    modal.classList.add('active');
}

export async function confirmDelete(id) {
    try {
        const response = await deleteStudent(id);
        if (response.success) {
            const modal = document.getElementById('deleteConfirmationModal');
            modal.remove();
            await loadStudents();
            showToast('Student deleted successfully');
        } else {
            showToast(response.message, 'error');
        }
    } catch (error) {
        showToast('Error deleting student', 'error');
    }
}

// Reset form when modal is closed
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    const addStudentModal = document.getElementById('addStudentModal');
    console.log('Add Student Modal:', addStudentModal);

    // Add click event listener for Add New Student button
    const addStudentBtn = document.getElementById('addStudentBtn');
    console.log('Add Student Button:', addStudentBtn);
    
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', () => {
            console.log('Add Student button clicked');
            addStudentModal.classList.add('active');
            resetForm('addStudentForm');
            currentStudentId = null;
            const modalTitle = document.querySelector('#addStudentModal h5');
            const saveButton = document.getElementById('saveStudentBtn');
            if (modalTitle) modalTitle.textContent = 'Add New Student';
            if (saveButton) saveButton.textContent = 'Save Student';
        });
    }

    // Add click event listener for modal backdrop
    addStudentModal?.addEventListener('click', (e) => {
        console.log('Modal clicked:', e.target);
        if (e.target === addStudentModal) {
            console.log('Backdrop clicked, closing modal');
            closeModal(addStudentModal);
        }
    });

    // Add click event listener for cancel button
    const cancelBtn = document.getElementById('cancelBtn');
    console.log('Cancel Button:', cancelBtn);
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            console.log('Cancel button clicked');
            closeModal(addStudentModal);
        });
    }

    // Add click event listener for close button
    const closeModalBtn = document.getElementById('closeModalBtn');
    console.log('Close Button:', closeModalBtn);
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            console.log('Close button clicked');
            closeModal(addStudentModal);
        });
    }

    // Add filter event listeners
    document.getElementById('searchInput')?.addEventListener('input', filterStudents);
    document.getElementById('courseFilter')?.addEventListener('change', filterStudents);
    document.getElementById('yearFilter')?.addEventListener('change', filterStudents);
    document.getElementById('sectionFilter')?.addEventListener('change', filterStudents);
});

// Helper function to close modal and reset form
function closeModal(modal) {
    modal.classList.remove('active');
    resetForm('addStudentForm');
    currentStudentId = null;
    const modalTitle = document.querySelector('#addStudentModal h5');
    const saveButton = document.getElementById('saveStudentBtn');
    if (modalTitle) modalTitle.textContent = 'Add New Student';
    if (saveButton) saveButton.textContent = 'Save Student';
}

// Make functions globally available
window.editStudent = editStudent;
window.showDeleteConfirmation = showDeleteConfirmation;
window.confirmDelete = confirmDelete;
