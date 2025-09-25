const express = require('express');
const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const excelFilePath = path.join(__dirname, 'Registration_Form.xlsx');
const headers = ['SNO', 'TEAM NAME', 'NAME', 'Register No', 'DEPT', 'YEAR', 'SEC', 'PHONE NO'];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/register', (req, res) => {
    const { team, name, regNo, dept, year, sec, phone } = req.body;

    if (!team || !name || !regNo || !dept || !year || !sec || !phone) {
        return res.status(400).send('All fields are required.');
    }

    try {
        if (!fs.existsSync(excelFilePath)) {
            return res.status(500).send('Excel file does not exist. Please create it first.');
        }

        const workbook = xlsx.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Find the next empty row by checking column A (SNO)
        const range = xlsx.utils.decode_range(worksheet['!ref']);
        let nextRow = 5; // row index 6 (skip top 5 rows)

        while (worksheet[xlsx.utils.encode_cell({ r: nextRow, c: 0 })]) {
            nextRow++;
        }

        // Check duplicate (TEAM NAME + NAME)
        let duplicate = false;
        for (let r = 5; r < nextRow; r++) {
            const teamCell = worksheet[xlsx.utils.encode_cell({ r, c: 1 })];
            const nameCell = worksheet[xlsx.utils.encode_cell({ r, c: 2 })];
            if (teamCell && nameCell && teamCell.v === team && nameCell.v === name) {
                duplicate = true;
                break;
            }
        }

        if (duplicate) {
            return res.send('⚠️ This team and name is already registered!');
        }

        // Write new registration
        const newRow = {
            SNO: nextRow - 4, // auto SNO
            'TEAM NAME': team,
            NAME: name,
            'Register No': regNo,
            DEPT: dept,
            YEAR: year,
            SEC: sec,
            'PHONE NO': phone
        };

        headers.forEach((h, colIdx) => {
            const cellRef = xlsx.utils.encode_cell({ r: nextRow, c: colIdx });
            worksheet[cellRef] = { t: 's', v: newRow[h] };
        });

        // Update worksheet range
        worksheet['!ref'] = `A1:H${nextRow + 1}`;

        xlsx.writeFile(workbook, excelFilePath);

        res.send('✅ Registration added successfully!');
    } catch (err) {
        console.error(err);
        res.status(500).send('❌ Error saving registration.');
    }
});

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});