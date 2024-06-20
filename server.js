const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const app = express();

const upload = multer();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files
app.use(express.static('public'));

// Load subject limits
const limitsFilePath = 'subject-limits.json';
let subjectLimits = JSON.parse(fs.readFileSync(limitsFilePath, 'utf-8'));

// Handle form submission
app.post('/submit', upload.none(), (req, res) => {
    const data = req.body;
    const filePath = 'data.xlsx';

    // Ensure data.subjects is always an array
    const subjects = Array.isArray(data.subjects) ? data.subjects : [data.subjects];

    // Check if any subject limit is exceeded
    const exceededSubjects = subjects.filter(subject => {
        return subjectLimits[data.branch][subject].count >= subjectLimits[data.branch][subject].limit;
    });

    if (exceededSubjects.length > 0) {
        return res.status(400).send(`Subject limit exceeded for: ${exceededSubjects.join(', ')}`);
    }

    // Update subject counts
    subjects.forEach(subject => {
        subjectLimits[data.branch][subject].count += 1;
    });

    // Save updated limits
    fs.writeFileSync(limitsFilePath, JSON.stringify(subjectLimits, null, 2), 'utf-8');

    let workbook;
    if (fs.existsSync(filePath)) {
        workbook = xlsx.readFile(filePath);
    } else {
        workbook = xlsx.utils.book_new();
        workbook.SheetNames.push("Sheet1");
        workbook.Sheets["Sheet1"] = xlsx.utils.aoa_to_sheet([
            ["Name", "Student ID", "Email", "Branch", "Subjects"]
        ]);
    }

    const worksheet = workbook.Sheets["Sheet1"];
    const row = [
        data.name,
        data["student-id"],
        data.email,
        data.branch,
        subjects.join(', ')
    ];

    const range = xlsx.utils.decode_range(worksheet['!ref']);
    const rowIndex = range.e.r + 1;

    xlsx.utils.sheet_add_aoa(worksheet, [row], { origin: -1 });

    xlsx.writeFile(workbook, filePath);

    res.send('Form submitted successfully');
});

// Start the server
const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
