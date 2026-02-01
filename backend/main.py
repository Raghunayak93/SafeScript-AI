import os
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("No API Key found! Make sure .env file exists in backend folder.")

# 2. Configure Google Gemini AI
genai.configure(api_key=api_key)
# Using the stable free model
model = genai.GenerativeModel('gemini-flash-latest')

app = FastAPI()

# 3. Allow Frontend to communicate with Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Safe-Script AI Backend is Running!"}

@app.post("/analyze")
async def analyze_prescription(
    file: UploadFile = File(...), 
    details: str = Form(None),
    language: str = Form("English")
):
    try:
        # Read the uploaded image
        image_bytes = await file.read()
        
        # Prepare patient context
        patient_context = f"The patient has the following history/allergies: {details}" if details else "No specific patient history provided."

        # The Master Prompt
        prompt = f"""
        You are an expert pharmacist AI assistant. Analyze this prescription image carefully.
        
        **Patient Context:** {patient_context}
        **Target Output Language:** {language}

        **Your Tasks:**
        
        **1. 🆔 Patient & Doctor Details:**
        - Extract the **Patient Name**, **Age/Gender**, **Doctor's Name**, and **Date**.
        - Translate the labels (like "Age") to {language}, but keep names in English.
        - If text is unclear, write "Not clearly visible".
        
        **2. 💊 Medicine Analysis:**
        - List the **Drug Names** in **ENGLISH** (Standard Medical Names).
        - Translate the **Dosage & Instructions** (e.g., "Twice a day after food") into **{language}**.
        
        **3. 🛡️ SAFETY CHECK (Crucial):** - Compare the medicines against the **Patient Context** (Allergies/Conditions).
        - If there is a conflict (e.g., Patient is allergic to Penicillin), FLAG IT with "⚠️" and explain the risk in **{language}**.
        
        **MANDATORY DISCLAIMER:**
        Start your response with a warning in {language} that means: "⚠️ **AI GENERATED REPORT - VERIFY WITH DOCTOR**".
        End with a similar disclaimer in {language}.
        """
        
        # Send to Gemini
        response = model.generate_content([
            prompt,
            {"mime_type": "image/jpeg", "data": image_bytes}
        ])
        
        return {"analysis": response.text}

    except Exception as e:
        print(f"Error: {e}")
        return {"analysis": f"Server Error: {str(e)}"}