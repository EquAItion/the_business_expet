import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8080;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Mock data
const experts = [
  {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    designation: "Senior Consultant",
    expertise: "Business Strategy",
    workExperience: "15",
    currentOrganization: "Global Consulting",
    location: "New York",
    areasOfHelp: "Strategic Planning",
    contact: {
      linkedin: "linkedin.com/in/johndoe",
      email: "john.doe@example.com"
    }
  }
];

// Get expert by ID endpoint
app.get('/api/experts/:id', (req, res) => {
  const expert = experts.find(e => e.id === req.params.id);
  if (expert) {
    res.json({ success: true, data: expert });
  } else {
    res.status(404).json({ 
      success: false, 
      message: `Expert with ID ${req.params.id} not found` 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});