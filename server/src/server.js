const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "AI Interview Platform API is running",
    });
});

app.get("/api/project-info", (req, res) => {
    res.json({
        success: true,
        message: "Project information API running",
        data: {
            "name": "AI Interview Platform",
            "version": "1.0.0",
            "stack": ["React", "Node.js", "Express", "MongoDB"]
        }
    });
});

const PORT = process.env.PORT || 5001;

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });