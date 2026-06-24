from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pypdf import PdfReader
import io
import re
import requests

from app.database import engine, Base, get_db
from app.models import Candidate

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Recruiter Assistant API - Version Globale")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_email(text: str) -> str:
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    match = re.search(email_pattern, text)
    return match.group(0) if match else "Non spécifié"

def analyze_cv_with_huggingface(cv_text: str):
    # TOKEN HUGGING FACE 
    HF_API_TOKEN = "VOTRE_TOKEN_HUGGING_FACE_ICI"
    
    API_URL = "https://huggingface.co"
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    
    prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
    Tu es un expert en recrutement. Ton rôle est d'analyser ce CV, quel que soit son domaine (Médecine, Informatique, Électronique, Finance, etc.).
    Extrais strictement ces 3 informations au format texte exact suivant, sans aucune autre phrase :
    DOMAINE: le domaine d'activité détecté
    COMPETENCES: compétence1, compétence2, compétence3, compétence4
    SCORE: la note numérique d'adéquation entre 10 et 100
    <|eot_id|><|start_header_id|>user<|end_header_id|>
    Voici le texte du CV :
    {cv_text}
    <|eot_id|><|start_header_id|>assistant<|end_header_id|>"""
    
    payload = {
        "inputs": prompt,
        "parameters": {"max_new_tokens": 120, "temperature": 0.1},
        "options": {"wait_for_model": True}
    }
    
    text_lower = cv_text.lower()
    tech_keywords = ["python", "javascript", "php", "java", "html", "css", "sql", "postgresql", "management", "gestion", "marketing", "vente", "électronique", "transistor", "oscillo"]
    nb_matches = sum(1 for kw in tech_keywords if kw in text_lower)
    
    fallback_score = min(45.0 + (nb_matches * 4.0), 95.0)
    if "master" in text_lower or "ingénieur" in text_lower:
        fallback_score = min(fallback_score + 5.0, 98.0)
        
    fallback_domain = "Généraliste"
    if any(x in text_lower for x in ["code", "informatique", "dev"]): fallback_domain = "Informatique"
    elif any(x in text_lower for x in ["compta", "gestion", "rh"]): fallback_domain = "Gestion & RH"
    elif any(x in text_lower for x in ["vente", "marketing"]): fallback_domain = "Commerce"
    elif any(x in text_lower for x in ["électronique", "signal", "mesure"]): fallback_domain = "Électronique"

    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=25)
        if response.status_code == 200:
            result = response.json()
            generated_text = result['generated_text'] if isinstance(result, list) else result.get('generated_text', '')
            response_text = generated_text.split("<|start_header_id|>assistant<|end_header_id|>")[-1].strip()
            
            domain_match = re.search(r"DOMAINE:\s*(.*)", response_text)
            skills_match = re.search(r"COMPETENCES:\s*(.*)", response_text)
            score_match = re.search(r"SCORE:\s*(\d+)", response_text)
            
            domain = domain_match.group(1).strip() if domain_match else fallback_domain
            skills = skills_match.group(1).strip() if skills_match else "Analyse effectuée"
            score = float(score_match.group(1).strip()) if score_match else fallback_score
            
            if score < 10: score = fallback_score
            return f"Secteur: {domain} | {skills}", score
        else:
            return f"Secteur: {fallback_domain} (Analyse Locale) | Compétences indexées", fallback_score
    except Exception:
        return f"Secteur: {fallback_domain} (Analyse Hors-ligne) | Compétences indexées", fallback_score

@app.get("/")
def read_root():
    return {"status": "success", "message": "L'API est prête."}

@app.get("/candidates")
def get_all_candidates(db: Session = Depends(get_db)):
    try:
        candidates = db.query(Candidate).order_by(Candidate.score.desc()).all()
        return {"status": "success", "count": len(candidates), "data": candidates}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/candidates/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """
    Route DELETE pour supprimer définitivement un candidat via son ID.
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidat introuvable.")
    try:
        db.delete(candidate)
        db.commit()
        return {"status": "success", "message": "Candidat supprimé avec succès."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-cv")
async def upload_cv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Le fichier doit être au format PDF.")
    try:
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        reader = PdfReader(pdf_file)
        raw_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text: raw_text += text + "\n"
        extracted_text = raw_text.encode('utf-8', errors='ignore').decode('utf-8')
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Fichier PDF illisible.")

        detected_email = extract_email(extracted_text)
        ai_skills, ai_score = analyze_cv_with_huggingface(extracted_text)
        
        if detected_email != "Non spécifié":
            existing_candidate = db.query(Candidate).filter(Candidate.email == detected_email).first()
        else:
            existing_candidate = db.query(Candidate).filter(Candidate.name == file.filename).first()
        
        if existing_candidate:
            existing_candidate.name = file.filename
            existing_candidate.cv_text = extracted_text
            existing_candidate.skills = ai_skills
            existing_candidate.score = ai_score
            if detected_email != "Non spécifié": existing_candidate.email = detected_email
            db.commit()
            db.refresh(existing_candidate)
            return {
                "status": "success",
                "message": "Données mises à jour.",
                "data": {"id": existing_candidate.id, "filename": existing_candidate.name, "detected_email": existing_candidate.email, "extracted_skills": existing_candidate.skills, "ai_score": existing_candidate.score}
            }
        else:
            final_email_record = detected_email
            if detected_email == "Non spécifié":
                final_email_record = f"non-specifie-{file.filename.lower().replace(' ', '-')}"
            new_candidate = Candidate(name=file.filename, email=final_email_record, cv_text=extracted_text, skills=ai_skills, score=ai_score)
            db.add(new_candidate)
            db.commit()
            db.refresh(new_candidate)
            return {
                "status": "success",
                "message": "Nouveau candidat enregistré.",
                "data": {"id": new_candidate.id, "filename": new_candidate.name, "detected_email": "Non spécifié", "extracted_skills": new_candidate.skills, "ai_score": new_candidate.score}
            }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
