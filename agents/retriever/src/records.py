"""Synthetic, already-anonymized patient record chunks for the demo.

In production these chunks live in Firestore with Vertex AI embeddings; here we
ship a small in-memory corpus so Agent 2 (Retrieval/RAG) is fully demonstrable
without external services. Each chunk carries the citation metadata the UI
renders as proof.
"""

CHUNKS = [
    {
        "id": "chunk_01", "patient_id": "anon_7a3f",
        "doc_title": "Discharge Summary", "source": "Apollo Hospital", "page": 2,
        "date": "2024-03-14",
        "text": "Patient diagnosed with Type 2 Diabetes Mellitus in March 2024. Started on Metformin 500mg twice daily. Advised lifestyle modification and regular HbA1c monitoring.",
    },
    {
        "id": "chunk_02", "patient_id": "anon_7a3f",
        "doc_title": "Lab Report", "source": "SRL Diagnostics", "page": 1,
        "date": "2024-09-10",
        "text": "HbA1c trend: 8.1% (Mar 2024), 7.2% (Sep 2024), 6.9% (Mar 2025). Fasting glucose 118 mg/dL. Diabetes currently well-controlled on Metformin.",
    },
    {
        "id": "chunk_03", "patient_id": "anon_7a3f",
        "doc_title": "Obstetric Notes", "source": "Cloudnine Hospital", "page": 1,
        "date": "2026-01-20",
        "text": "Current pregnancy: 28 weeks gestation, G2P1. Previous delivery 2022 was an uncomplicated full-term vaginal delivery. No history of gestational hypertension.",
    },
    {
        "id": "chunk_04", "patient_id": "anon_7a3f",
        "doc_title": "Prescription", "source": "Dr. [REDACTED]", "page": 1,
        "date": "2026-01-15",
        "text": "Gestational diabetes screening positive. Continue Metformin 500mg BID. Added Iron and Folic Acid supplements. Calcium 500mg once daily.",
    },
    {
        "id": "chunk_05", "patient_id": "anon_7a3f",
        "doc_title": "Allergy Record", "source": "Apollo Hospital", "page": 3,
        "date": "2023-11-02",
        "text": "Known drug allergy: Penicillin (rash, documented 2021). Food allergy: peanuts and shellfish. No known reactions to local anaesthetics.",
    },
    {
        "id": "chunk_06", "patient_id": "anon_7a3f",
        "doc_title": "Lab Report", "source": "SRL Diagnostics", "page": 2,
        "date": "2026-02-05",
        "text": "Blood pressure readings over 6 months: 118/76, 122/80, 120/78 mmHg. Haemoglobin 10.8 g/dL (mild anaemia of pregnancy). TSH within normal limits.",
    },
]
