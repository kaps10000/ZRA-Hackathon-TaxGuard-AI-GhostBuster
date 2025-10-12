const http = require('http');
const fs = require('fs');
const path = require('path');

// Create a simple test image file (1x1 PNG)
const testImageBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
);

const testImagePath = '/tmp/test_photo.png';
fs.writeFileSync(testImagePath, testImageBuffer);

console.log('✅ Test image created:', testImagePath);

// Create multipart form data manually
const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const delimiter = `\r\n--${boundary}\r\n`;
const closeDelimiter = `\r\n--${boundary}--`;

const fileData = fs.readFileSync(testImagePath);

const multipartBody = Buffer.concat([
    Buffer.from(delimiter),
    Buffer.from('Content-Disposition: form-data; name="files"; filename="test_photo.png"\r\n'),
    Buffer.from('Content-Type: image/png\r\n\r\n'),
    fileData,
    Buffer.from(delimiter),
    Buffer.from('Content-Disposition: form-data; name="type"\r\n\r\n'),
    Buffer.from('photo'),
    Buffer.from(closeDelimiter)
]);

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/uploads',
    method: 'POST',
    headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': multipartBody.length
    }
};

console.log('🚀 Testing upload API...');

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\n📊 Response Status:', res.statusCode);
        console.log('📄 Response Body:');
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));

            if (json.success) {
                console.log('\n✅ Upload test PASSED!');
                console.log('📁 Uploaded files:', json.files.length);
                json.files.forEach(file => {
                    console.log(`   - ${file.filename} (${file.size} bytes)`);
                });
            } else {
                console.log('\n❌ Upload test FAILED!');
                console.log('Error:', json.error);
            }
        } catch (e) {
            console.log(data);
            console.log('\n❌ Invalid JSON response');
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
});

req.write(multipartBody);
req.end();

// Test 2: Test the API endpoint list
setTimeout(() => {
    console.log('\n\n🔍 Testing API endpoint discovery...');
    http.get('http://localhost:3001/', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const json = JSON.parse(data);
            if (json.endpoints['POST /api/uploads']) {
                console.log('✅ Upload endpoint is registered in API docs');
                console.log('   ', json.endpoints['POST /api/uploads']);
            } else {
                console.log('⚠️  Upload endpoint not found in API docs');
            }
        });
    });
}, 2000);
