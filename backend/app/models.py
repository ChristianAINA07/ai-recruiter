from sqlalchemy import Column, Integer, String, Text, Float
from .database import Base

class Candidate(Base):
    """
    Modèle représentant la table des candidats dans la base de données.
    Contient les informations extraites du CV et le score attribué.
    """
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    skills = Column(Text, nullable=True)  # Liste des compétences extraites
    score = Column(Float, default=0.0)    # Score attribué par l'algorithme
    cv_text = Column(Text, nullable=True) # Texte brut extrait du fichier PDF

