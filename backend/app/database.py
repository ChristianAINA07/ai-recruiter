from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# URL de connexion à la base de données PostgreSQL
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:votre_motdepass@localhost:5432/ai_recruiter_db"

# Création du moteur de liaison avec la base de données
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Configuration de la session locale pour exécuter des requêtes
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Classe de base pour la création des modèles ORM
Base = declarative_base()

# Fonction de dépendance pour obtenir une session de base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

