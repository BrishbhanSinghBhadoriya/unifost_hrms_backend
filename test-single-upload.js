// Test script for single document upload API
// This demonstrates how to use the new one-by-one document upload endpoint

const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/upload';
const EMPLOYEE_ID = 'your-employee-id-here';
const AUTH_TOKEN = 'your-auth-token-here';

// Test function for single document upload
async function testSingleDocumentUpload() {
    try {
        // Create form data
        const form = new FormData();
        
        // Add the image file with the correct field name
        // Field names should match one of these:
        // - adharImage
        // - panImage
        // - experienceLetterImage
        // - MarksheetImage_10
        // - MarksheetImage_12
        // - MarksheetImage_Graduation
        // - MarksheetImage_PostGraduationImage
        
        form.append('adharImage', fs.createReadStream('path/to/your/image.jpg'));
        
        // Make the API call
        const response = await axios.post(
            `${API_BASE_URL}/document/single/${EMPLOYEE_ID}`,
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Bearer ${AUTH_TOKEN}`
                }
            }
        );
        
        console.log('Upload successful:', response.data);
        
    } catch (error) {
        console.error('Upload failed:', error.response?.data || error.message);
    }
}

// Example usage for different document types
async function uploadAllDocuments() {
    const documents = [
        { field: 'adharImage', file: 'adhar.jpg' },
        { field: 'panImage', file: 'pan.jpg' },
        { field: 'experienceLetterImage', file: 'experience.jpg' },
        { field: 'MarksheetImage_10', file: 'marksheet_10.jpg' },
        { field: 'MarksheetImage_12', file: 'marksheet_12.jpg' },
        { field: 'MarksheetImage_Graduation', file: 'graduation.jpg' },
        { field: 'MarksheetImage_PostGraduationImage', file: 'postgrad.jpg' }
    ];
    
    for (const doc of documents) {
        try {
            const form = new FormData();
            form.append(doc.field, fs.createReadStream(doc.file));
            
            const response = await axios.post(
                `${API_BASE_URL}/document/single/${EMPLOYEE_ID}`,
                form,
                {
                    headers: {
                        ...form.getHeaders(),
                        'Authorization': `Bearer ${AUTH_TOKEN}`
                    }
                }
            );
            
            console.log(`${doc.field} uploaded successfully:`, response.data.message);
            
        } catch (error) {
            console.error(`Failed to upload ${doc.field}:`, error.response?.data || error.message);
        }
    }
}

// Run the test
if (require.main === module) {
    console.log('Testing single document upload API...');
    console.log('Make sure to update EMPLOYEE_ID and AUTH_TOKEN before running');
    console.log('Usage: node test-single-upload.js');
    
    // Uncomment the line below to run the test
    // testSingleDocumentUpload();
}

module.exports = { testSingleDocumentUpload, uploadAllDocuments };


