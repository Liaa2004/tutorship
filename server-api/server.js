const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
 const pdf = require('pdf-parse');
 const { PDFDocument } = require('pdf-lib');


const app = express();
const PORT = 4000;

// Configuration
const SECRET_KEY = "8465e63580a25fc0d86af7cd67e380fdbe2392693fb4c67c3ffe38d1c8493049"; // Use a strong secret key

// Middleware
app.use(cors());
app.use(express.json());

// Ensure necessary folders exist
const publicDir = path.join(__dirname, "public");
const scholarshipDir = path.join(publicDir, "scholarship-pdfs");
const activityDir = path.join(publicDir, "activity-uploads");
const dbFile = "db.json";
const internalsDir = path.join(publicDir, "internals-pdfs");

if (!fs.existsSync(internalsDir)) fs.mkdirSync(internalsDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(scholarshipDir)) fs.mkdirSync(scholarshipDir, { recursive: true });
if (!fs.existsSync(activityDir)) fs.mkdirSync(activityDir, { recursive: true });

// Serve uploaded files statically
app.use("/scholarship-pdfs", express.static(scholarshipDir));
app.use("/activity-uploads", express.static(activityDir));
app.use("/internals-pdfs", express.static(internalsDir));


// Database helper functions
const readDB = () => {
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({ 
      classes: [], 
      students: [], 
      tutors: [], 
      scholarships: [], 
      activityPoints: [] 
    }, null, 2));
  }
  return JSON.parse(fs.readFileSync(dbFile, "utf-8"));
};

const writeDB = (data) => fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));

//PDF EXTRACTION
const parseExamEligibilityPDF = (pdfText) => {
  const subjects = {
    "MCN301": "Disaster Management",
    "CST301": "Formal Languages and Automata Theory",
    "CST303": "Computer Networks",
    "CST305": "System Software",
    "CST307": "Microprocessors and Microcontrollers",
    "CST309": "Management of Software Systems",
    "CSL331": "System Software and Microprocessors Lab",
    "CSL333": "Database Management Systems Lab",
    "CST395": "Neural Networks and Deep Learning"
  };

  const subjectCodes = Object.keys(subjects);
  const lines = pdfText.split('\n');
  const students = [];
  let currentStudent = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect student line
    const studentMatch = line.match(/^([A-Z]{2,}\d{2}[A-Z]{2}\d{3})\s+([A-Z][A-Za-z\s]+)/);
    if (studentMatch) {
      if (currentStudent) students.push(currentStudent);

      currentStudent = {
        registerNo: studentMatch[1],
        name: studentMatch[2].trim().replace(/\s+/g, ' '),
        subjects: {}
      };

      // Initialize all subjects
      subjectCodes.forEach(code => {
        currentStudent.subjects[code] = {
          name: subjects[code],
          A: null,
          I: null,
          E: null
        };
      });

      if (line.includes('|')) {
        // Process all three lines (A, I, E) together to maintain column positions
        const aLine = line;
        const iLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
        const eLine = i + 2 < lines.length ? lines[i + 2].trim() : '';

        // Split each line into columns
        const aColumns = aLine.split('|').slice(1);
        const iColumns = iLine.includes('|') ? iLine.split('|').slice(1) : [];
        const eColumns = eLine.includes('|') ? eLine.split('|').slice(1) : [];

        // Process each subject column
        for (let colIndex = 0; colIndex < subjectCodes.length; colIndex++) {
          const subjectCode = subjectCodes[colIndex];
          
          // Process A value
          if (colIndex < aColumns.length) {
            const aMatch = aColumns[colIndex].trim().match(/A:\s*([\d.]+|NA)/);
            if (aMatch) {
              currentStudent.subjects[subjectCode].A = aMatch[1] === "NA" ? null : aMatch[1];
            }
          }
          
          // Process I value
          if (colIndex < iColumns.length) {
            const iMatch = iColumns[colIndex].trim().match(/I:\s*([\d.]+|NA)/);
            if (iMatch) {
              currentStudent.subjects[subjectCode].I = iMatch[1] === "NA" ? null : iMatch[1];
            }
          }
          
          // Process E value
          if (colIndex < eColumns.length) {
            const eMatch = eColumns[colIndex].trim().match(/E:\s*(Yes|No|NA)/);
            if (eMatch) {
              currentStudent.subjects[subjectCode].E = eMatch[1] === "NA" ? null : eMatch[1];
            }
          }
        }

        i += 2; // Skip next 2 lines
      }
      continue;
    }

    // Handle line-by-line format
    if (currentStudent && !line.includes('|')) {
      const valueMatch = line.match(/^([A-Z]):\s*([\d.]+|Yes|No|NA)/);
      if (valueMatch) {
        const [_, type, value] = valueMatch;
        const subjectCode = subjectCodes.find(code => 
          currentStudent.subjects[code][type] === null
        );
        if (subjectCode) {
          currentStudent.subjects[subjectCode][type] = value === "NA" ? null : value;
        }
      }
    }
  }

  if (currentStudent) students.push(currentStudent);

  return {
    metadata: {
      university: "APJ Abdul Kalam Technological University",
      reportTitle: "Student Exam Eligibility Report",
      generationDate: lines.find(l => l.includes('Generated on'))?.trim() || ""
    },
    subjects: subjectCodes.map(code => ({ code, name: subjects[code] })),
    students
  };
};

// JWT Authentication Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "Unauthorized access" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Login Route
app.post("/login", (req, res) => {
  const { username, password, role } = req.body;
  console.log(username, password, role);

  const token = jwt.sign({ username, role }, SECRET_KEY, { expiresIn: "1h" });
  
  console.log("Sending response:", { success: true, token, role });
  return res.json({ success: true, token, role });
});

// Multer Storage Configurations
const scholarshipStorage = multer.diskStorage({
  destination: scholarshipDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const activityStorage = multer.diskStorage({
  destination: activityDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const internalsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const classDir = path.join(internalsDir, req.params.id);
    fs.mkdirSync(classDir, { recursive: true });
    cb(null, classDir);
  },
  filename: (req, file, cb) => {
    cb(null, `semester-${req.query.semester}.pdf`);
  }
});

const uploadInternals = multer({ storage: internalsStorage });
const uploadScholarship = multer({ storage: scholarshipStorage });
const uploadActivity = multer({ storage: activityStorage });

// File Upload Endpoints
app.post("/upload", uploadScholarship.single("proof"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "File is required" });

    const fileUrl = `/scholarship-pdfs/${req.file.filename}`;
    return res.status(200).json({ success: true, filePath: fileUrl, filename: req.file.filename });
  } catch (error) {
    console.error("Upload error", error);
    return res.status(500).json({ success: false, message: "Failed to upload file", error: error.message });
  }
});

app.post("/upload-activity", uploadActivity.single("proof"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "File is required" });

    const fileUrl = `/activity-uploads/${req.file.filename}`;
    return res.status(200).json({ success: true, filePath: fileUrl, filename: req.file.filename });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ success: false, message: "Failed to upload file", error: error.message });
  }
});

// Internal Upload Endpoint
app.post("/classes/:id/internals/upload", uploadInternals.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = `/internals-pdfs/${req.params.id}/${req.file.filename}`;
    const filePath = path.join(internalsDir, req.params.id, req.file.filename);
    
    // Extract data from PDF
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    const extractedData = parseExamEligibilityPDF(data.text);
    
    // Update database
    const db = readDB();
    const classIndex = db.classes.findIndex(c => c.id === req.params.id);
    
    if (classIndex !== -1) {
      db.classes[classIndex].internals = db.classes[classIndex].internals || [];
      
      const internalData = {
        semester: req.query.semester,
        fileUrl,
        extractedData,
        uploadDate: new Date().toISOString()
      };
      
      db.classes[classIndex].internals.push(internalData);
      writeDB(db);
      
      res.json({ 
        success: true,
        fileUrl,
        data: internalData 
      });
    } else {
      res.status(404).json({ error: "Class not found" });
    }
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Secure File Download Endpoint
app.get("/download/:fileName", verifyToken, (req, res) => {
  try {
    const filePath = path.join(__dirname, "public/scholarship-pdfs", req.params.fileName);
    console.log("Serving file:", filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.setHeader("Content-Disposition", `attachment; filename=${req.params.fileName}`);
    res.setHeader("Content-Type", "application/pdf");

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/save-activity", (req, res) => {
  try {
    const { studentId, studentName, classId, activityType, level, proofUrl } = req.body;

    if (!studentId || !activityType || !proofUrl || !classId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const db = readDB();

    // Calculate max points
    const activityPointsMap = {
      Internship: { I: 10, II: 20, III: 30, IV: 40, V: 50 },
      NSS: { I: 5, II: 10, III: 15, IV: 20, V: 25 },
      NCC: { I: 7, II: 14, III: 21, IV: 28, V: 35 },
      "Technical Event": { I: 8, II: 16, III: 24, IV: 32, V: 40 },
      Sports: { I: 6, II: 12, III: 18, IV: 24, V: 30 }
    };

    const maxPoints = activityPointsMap[activityType]?.[level] || 0;
    const activityId = `act-${Date.now()}`;

    // Create new activity
    const newActivity = {
      id: activityId,
      studentId,
      studentName,
      classId,
      activityType,
      level: level || "I",
      maxPoints,
      proofUrl,
      pointsAwarded: 0,
      status: "Pending",
      date: new Date().toISOString()
    };

    // Add to activityPoints
    db.activityPoints.push(newActivity);

    // Find the class and student
    const classData = db.classes.find(c => c.id === classId);
    if (classData) {
      const student = classData.students.find(s => s.id === studentId);
      if (student) {
        // Add to student's requests - use the same ID as the activity
        student.requests = student.requests || [];
        student.requests.push({
          id: activityId, // Use the same ID as the activity
          category: "certificate",
          status: "Pending",
          fileName: proofUrl.split('/').pop(),
          date: newActivity.date,
          activityType,
          level,
          maxPoints,
          awardedPoints: 0,
          proofUrl
        });
      }
    }

    writeDB(db);

    res.json({ 
      message: "Activity saved successfully", 
      activity: newActivity 
    });
  } catch (error) {
    console.error("Error saving activity:", error);
    res.status(500).json({ message: "Failed to save activity", error: error.message });
  }
});

// Update Endpoints..Updating activity point status
app.put("/activity-points/:activityId", (req, res) => {
  try {
    const { activityId } = req.params;
    const { status, pointsAwarded, ...rest } = req.body;

    // Validate the request data
    if (!status || (status === "Approved" && (isNaN(pointsAwarded) || pointsAwarded < 0))) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    const db = readDB();
    const activityIndex = db.activityPoints.findIndex(a => a.id === activityId);

    // Check if the activity exists
    if (activityIndex === -1) {
      return res.status(404).json({ message: "Activity not found" });
    }

    // Validate points awarded
    if (status === "Approved" && pointsAwarded > db.activityPoints[activityIndex].maxPoints) {
      return res.status(400).json({ 
        message: `Points cannot exceed ${db.activityPoints[activityIndex].maxPoints}`,
        maxPoints: db.activityPoints[activityIndex].maxPoints
      });
    }

    // Create the updated activity object
    const updatedActivity = {
      ...db.activityPoints[activityIndex],
      ...rest,
      status,
      pointsAwarded: status === "Approved" ? Number(pointsAwarded) : 0,
      decisionDate: new Date().toISOString()
    };

    // Update the activity in the database
    db.activityPoints[activityIndex] = updatedActivity;

    // Update the corresponding request in the student's requests
    const studentId = updatedActivity.studentId;
    const classData = db.classes.find(c => c.id === updatedActivity.classId);

    if (classData) {
      const student = classData.students.find(s => s.id === studentId);
      if (student) {
        const request = student.requests.find(req => req.id === activityId); // Use activityId to find the request
        if (request) {
          request.status = status; // Update the status in requests
          if (status === "Approved" && pointsAwarded) {
            request.awardedPoints = pointsAwarded; // Update awarded points if approved
          }
        }
      }
    }

    // Write the updated data back to the database
    writeDB(db);

    // Send a success response
    res.status(200).json({ 
      message: "Activity updated successfully",
      activity: updatedActivity
    });
  } catch (error) {
    console.error("Error updating activity:", error);
    res.status(500).json({ message: "Failed to update activity" });
  }
});

// Update application status
app.put("/classes/:classId", (req, res) => {
  const { classId } = req.params;
  const { appId, status } = req.body; // Expecting appId and status in the request body

  const data = readDB(); // Read the latest data from db.json

  const classData = data.classes.find(c => c.id === classId);
  if (!classData) {
    return res.status(404).json({ success: false, message: "Class not found" });
  }

  const application = classData.scholarshipApplications.find(app => app.id === appId);
  if (!application) {
    return res.status(404).json({ success: false, message: "Application not found" });
  }

  // Update the status in scholarshipApplications
  application.status = status; // Update the status

  // Find the student who submitted the application
  const student = classData.students.find(s => s.id === application.studentId);
  if (student) {
    const request = student.requests.find(req => req.id === appId);
    if (request) {
      request.status = status; // Update the status in requests
    }
  }

  // Write the updated data back to db.json
  try {
    writeDB(data);
    return res.status(200).json({ success: true, message: "Application status updated successfully" });
  } catch (error) {
    console.error("Error writing to db.json:", error);
    return res.status(500).json({ success: false, message: "Failed to update database", error: error.message });
  }
});

app.delete('/classes/:id/internals', (req, res) => {
  const classId = req.params.id; // Get class ID from the URL
  const semester = req.query.semester; // Get semester from query parameters

  // Read the current database
  const db = readDB();

  // Find the class by ID
  const classData = db.classes.find(c => c.id === classId);
  if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
  }

  // Find the index of the internal record for the specified semester
  const internalIndex = classData.internals.findIndex(internal => internal.semester === semester);
  if (internalIndex === -1) {
      return res.status(404).json({ message: 'Internal record not found for this semester' });
  }

  // Remove the internal record
  classData.internals.splice(internalIndex, 1);

  // Write the updated data back to the database
  writeDB(db);

  return res.status(200).json({ message: 'Internal record deleted successfully' });
});

// Start Server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));