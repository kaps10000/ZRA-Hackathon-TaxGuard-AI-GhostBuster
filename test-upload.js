const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testFileUpload() {
  console.log('============================================');
  console.log('Testing File Upload Endpoint');
  console.log('============================================\n');

  try {
    // Create a test text file
    const testFilePath = path.join(__dirname, 'test-document.txt');
    fs.writeFileSync(testFilePath, 'This is a test document for WhistlePro file upload functionality.\n\nTest Date: ' + new Date().toISOString());

    console.log('✅ Test file created:', testFilePath);

    // Create form data
    const formData = new FormData();
    formData.append('files', fs.createReadStream(testFilePath));

    console.log('📤 Uploading file to http://localhost:4000/api/upload...\n');

    // Upload file
    const response = await axios.post('http://localhost:4000/api/upload', formData, {
      headers: formData.getHeaders()
    });

    if (response.data.success) {
      console.log('✅ Upload successful!');
      console.log('\nResponse Data:');
      console.log(JSON.stringify(response.data, null, 2));

      // Test retrieving the file
      if (response.data.data.files.length > 0) {
        const fileId = response.data.data.files[0].file_id;
        console.log(`\n📥 Testing file retrieval for ${fileId}...`);

        const getResponse = await axios.get(`http://localhost:4000/api/upload/${fileId}`);
        console.log('\nFile Metadata:');
        console.log(JSON.stringify(getResponse.data, null, 2));
      }
    }

    // Clean up test file
    fs.unlinkSync(testFilePath);
    console.log('\n🧹 Test file cleaned up');

  } catch (error) {
    console.error('\n❌ Upload failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }

  console.log('\n============================================');
}

testFileUpload();
