## Production Resume Classifier (BERT)

This module contains a production-grade resume classification pipeline with:

- strict dataset validation
- fixed taxonomy mapping
- stratified 70/15/15 split without leakage
- BERT (`bert-base-uncased`) training with early stopping
- automatic improvement workflow (cleaning, hard-example mining, augmentation, tuning)
- test-set metrics + error analysis
- FastAPI inference endpoint

### Training

From repository root:

```bash
python ml_service/train_resume_classifier.py --dataset ml_service/data/production_resume_dataset.csv --output-dir ml_service/model
```

Optional override for weak-label gate:

```bash
python ml_service/train_resume_classifier.py --dataset ml_service/data/production_resume_dataset.csv --output-dir ml_service/model --allow-weak-labels
```

### Artifacts

Saved to `ml_service/model/`:

- model weights + config
- tokenizer files
- `metrics.json`
- `predictions.csv`
- `validation_report.json`

### Inference API

```bash
uvicorn ml_service.resume_classifier_api:app --host 0.0.0.0 --port 8010
```

Endpoint:

- `POST /predict`
  - body: `{ "resume_text": "..." }`
  - response: predicted role, confidence, class probabilities
