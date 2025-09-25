const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const JUDGE0_API = "https://ce.judge0.com/submissions/?base64_encoded=false&wait=true";

// API endpoint to run code
app.post("/run", async (req, res) => {
  try {
    const { source_code, language_id, expected_output } = req.body;

    if (!source_code || !language_id) {
      return res.status(400).json({ error: "source_code and language_id are required" });
    }

    // Send to Judge0
    const response = await axios.post(JUDGE0_API, {
      source_code,
      language_id,
      expected_output
    });

    const result = response.data;

    let isCorrect = null;
    if (expected_output) {
      isCorrect = result.stdout && result.stdout.trim() === expected_output.trim();
    }

    res.json({
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      status: result.status,
      isCorrect
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("✅ Judge0 site running at http://localhost:3000");
});
