from __future__ import annotations

import csv
from pathlib import Path

from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

from ml.classifier import build_classifier, save_classifier
from ml.embedder import build_vectorizer, save_vectorizer


ATS_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATASET_PATH = ATS_ROOT / "data" / "sample_resumes" / "labeled_resumes.csv"
DEFAULT_VECTORIZER_PATH = ATS_ROOT / "models" / "vectorizer.pkl"
DEFAULT_CLASSIFIER_PATH = ATS_ROOT / "models" / "classifier.pkl"


def load_dataset(dataset_path: str | Path) -> tuple[list[str], list[str]]:
    dataset_path = Path(dataset_path)
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset file not found: {dataset_path}")

    texts: list[str] = []
    labels: list[str] = []

    with dataset_path.open("r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)
        required_columns = {"text", "category"}
        if not required_columns.issubset(set(reader.fieldnames or [])):
            raise ValueError("Dataset must contain columns: text, category")

        for row in reader:
            text = str(row.get("text", "")).strip()
            category = str(row.get("category", "")).strip()
            if not text or not category:
                continue
            texts.append(text)
            labels.append(category)

    if len(texts) < 6:
        raise ValueError("Dataset has too few valid rows to train a robust classifier.")

    return texts, labels


def train_and_save_models(
    dataset_path: str | Path = DEFAULT_DATASET_PATH,
    vectorizer_path: str | Path = DEFAULT_VECTORIZER_PATH,
    classifier_path: str | Path = DEFAULT_CLASSIFIER_PATH,
) -> dict:
    texts, labels = load_dataset(dataset_path)
    class_count = len(set(labels))
    total_samples = len(texts)

    suggested_test_count = max(class_count, int(round(total_samples * 0.2)))
    if suggested_test_count >= total_samples:
        suggested_test_count = class_count
    test_size = suggested_test_count / total_samples

    x_train, x_test, y_train, y_test = train_test_split(
        texts,
        labels,
        test_size=test_size,
        random_state=42,
        stratify=labels,
    )

    vectorizer = build_vectorizer()
    x_train_vectors = vectorizer.fit_transform(x_train)
    x_test_vectors = vectorizer.transform(x_test)

    classifier = build_classifier()
    classifier.fit(x_train_vectors, y_train)

    y_pred = classifier.predict(x_test_vectors)
    accuracy = accuracy_score(y_test, y_pred)

    save_vectorizer(vectorizer, vectorizer_path)
    save_classifier(classifier, classifier_path)

    return {
        "dataset_path": str(Path(dataset_path)),
        "samples_total": len(texts),
        "classes": sorted(set(labels)),
        "test_size": round(test_size, 4),
        "test_accuracy": round(float(accuracy), 4),
        "vectorizer_path": str(Path(vectorizer_path)),
        "classifier_path": str(Path(classifier_path)),
    }


if __name__ == "__main__":
    report = train_and_save_models()
    print(report)
