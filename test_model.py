"""Run once to verify the resume-fit model loads and predicts."""

from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

MODEL_PATH = "./models/resume-fit-final"

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
model.eval()

resume = "Python developer with 5 years experience in Django, REST APIs, and PostgreSQL."
job = "Looking for a backend Python engineer with Django and API experience."

inputs = tokenizer(resume, job, return_tensors="pt", truncation=True, max_length=512)

with torch.no_grad():
    logits = model(**inputs).logits
    probs = torch.softmax(logits, dim=-1)[0]

labels = {0: "No Fit", 1: "Potential Fit", 2: "Good Fit"}
for i, p in enumerate(probs):
    print(f"{labels[i]}: {p:.4f}")

print("\nPrediction:", labels[probs.argmax().item()])
