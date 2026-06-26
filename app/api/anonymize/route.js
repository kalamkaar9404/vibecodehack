import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { text, redactionLevel = 'strict' } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Demo mode: return simulated anonymization
      return NextResponse.json(simulateAnonymization(text));
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a medical document PII anonymization agent. Analyze the following medical document text and identify ALL Personally Identifiable Information (PII).

For each PII entity found, return:
- text: the exact PII text
- type: one of PERSON_NAME, PHONE_NUMBER, AADHAAR, EMAIL, ADDRESS, DATE_OF_BIRTH, MEDICAL_ID, HOSPITAL_NAME, DOCTOR_NAME
- confidence: 0.0 to 1.0
- redacted_as: the replacement text (e.g., [REDACTED_NAME_1])

Redaction level: ${redactionLevel}
- strict: redact ALL PII including hospital/doctor names
- moderate: keep hospital and doctor names, redact personal identifiers

Return ONLY valid JSON in this format:
{
  "entities": [...],
  "anonymized_text": "the full text with all PII replaced",
  "summary": "brief summary of what was anonymized"
}

DOCUMENT TEXT:
${text}`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await response.json();
    const result = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');

    return NextResponse.json({
      success: true,
      ...result,
      piiCount: result.entities?.length || 0,
      confidence: result.entities?.length > 0
        ? (result.entities.reduce((sum, e) => sum + e.confidence, 0) / result.entities.length * 100).toFixed(1)
        : 100
    });

  } catch (error) {
    console.error('Anonymization error:', error);
    return NextResponse.json({ error: 'Anonymization failed', details: error.message }, { status: 500 });
  }
}

function simulateAnonymization(text) {
  const piiPatterns = [
    { regex: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, type: 'PERSON_NAME', prefix: 'REDACTED_NAME' },
    { regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, type: 'AADHAAR', prefix: 'REDACTED_AADHAAR' },
    { regex: /\b\d{10}\b/g, type: 'PHONE_NUMBER', prefix: 'REDACTED_PHONE' },
    { regex: /\b[\w.]+@[\w.]+\b/g, type: 'EMAIL', prefix: 'REDACTED_EMAIL' },
  ];

  let anonymizedText = text;
  const entities = [];
  let counter = {};

  for (const pattern of piiPatterns) {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      counter[pattern.type] = (counter[pattern.type] || 0) + 1;
      const redactedAs = `[${pattern.prefix}_${counter[pattern.type]}]`;
      entities.push({
        text: match[0],
        type: pattern.type,
        confidence: 0.92 + Math.random() * 0.07,
        redacted_as: redactedAs
      });
      anonymizedText = anonymizedText.replace(match[0], redactedAs);
    }
  }

  return {
    success: true,
    entities,
    anonymized_text: anonymizedText,
    piiCount: entities.length,
    confidence: entities.length > 0
      ? (entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length * 100).toFixed(1)
      : '100.0',
    summary: `Found and redacted ${entities.length} PII entities across ${Object.keys(counter).length} categories.`
  };
}
