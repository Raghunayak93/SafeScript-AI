import { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [allergies, setAllergies] = useState("");
  const [language, setLanguage] = useState("English");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Supported Languages
  const languages = ["English", "Hindi", "Telugu", "Tamil", "Kannada", "Malayalam", "Marathi", "Bengali"];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a prescription first!");
    
    setLoading(true);
    setAnalysis(""); 
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("details", allergies);
    formData.append("language", language);

    try {
      const res = await axios.post("http://127.0.0.1:8000/analyze", formData);
      setAnalysis(res.data.analysis);
    } catch (error) {
      console.error(error);
      setAnalysis("**Error:** Could not connect to the server. Is the Backend running?");
    }
    setLoading(false);
  };

  // Smart Text-to-Speech Logic
  const speakReport = () => {
    if (!analysis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = analysis.replace(/[*#_`]/g, ''); // Clean markdown symbols
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Set Voice based on Language
    switch (language) {
      case "Hindi":
        utterance.lang = 'hi-IN';
        break;
      case "Telugu":
        utterance.lang = 'te-IN';
        break;
      case "Tamil":
        utterance.lang = 'ta-IN';
        break;
      case "Kannada":
        utterance.lang = 'kn-IN';
        break;
      case "Malayalam":
        utterance.lang = 'ml-IN';
        break;
      case "Marathi":
        utterance.lang = 'mr-IN';
        break;
      case "Bengali":
        utterance.lang = 'bn-IN';
        break;
      default:
        utterance.lang = 'en-IN'; // Default to Indian English
    }

    utterance.rate = 0.9; 
    utterance.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <h1 className="header-title">🏥 Safe-Script AI</h1>
      <p className="header-subtitle">Advanced Prescription Error Detection System</p>

      {/* Safety Disclaimer */}
      <div className="warning-box">
        <span className="warning-icon">⚠️</span>
        <div>
          <strong>IMPORTANT DISCLAIMER:</strong> This tool is for <strong>informational purposes only</strong>. 
          It uses AI to assist in reading prescriptions but may make errors. 
          Always verify details with a <strong>licensed pharmacist or doctor</strong>.
        </div>
      </div>

      {/* Language Selector */}
      <div className="input-group">
        <label className="input-label">Select Output Language:</label>
        <div className="select-wrapper">
          <select 
            className="language-select" 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Input */}
      <div className="input-group">
        <label className="input-label">Patient Allergies / History (Optional):</label>
        <input 
          type="text" 
          className="text-input"
          placeholder="e.g. Allergic to Penicillin, Diabetic, High BP" 
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
        />
      </div>

      {/* File Upload */}
      <div className="upload-box">
        <input 
          type="file" 
          id="file-upload" 
          onChange={handleFileChange} 
          accept="image/*" 
          style={{ display: 'none' }} 
        />
        <label htmlFor="file-upload" className="upload-label">
          {file ? "📂 Change File" : "📂 Click to Upload Prescription"}
        </label>
        
        {file && <div className="file-name">{file.name}</div>}
        {preview && <img src={preview} alt="Preview" className="preview-image" />}
      </div>

      {/* Action Button */}
      <button onClick={handleUpload} disabled={loading} className="analyze-btn">
        {loading ? `⏳ Analyzing in ${language}...` : "🔍 Analyze Prescription"}
      </button>

      {/* Results Section */}
      {analysis && (
        <div className="result-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #bbf7d0', paddingBottom: '10px' }}>
            <h3 className="result-title" style={{ border: 'none', margin: 0 }}>📋 Medical Analysis Report</h3>
            
            {/* Speak Button */}
            <button onClick={speakReport} className="speak-btn">
              {isSpeaking ? "🛑 Stop Audio" : "🔊 Read Aloud"}
            </button>
          </div>

          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {analysis}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;