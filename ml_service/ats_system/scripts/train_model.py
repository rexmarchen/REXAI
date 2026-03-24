from pathlib import Path
import sys

ATS_ROOT = Path(__file__).resolve().parents[1]
if str(ATS_ROOT) not in sys.path:
    sys.path.insert(0, str(ATS_ROOT))

from ml.train import train_and_save_models


if __name__ == "__main__":
    report = train_and_save_models(
        dataset_path=ATS_ROOT / "data" / "sample_resumes" / "labeled_resumes.csv",
        vectorizer_path=ATS_ROOT / "models" / "vectorizer.pkl",
        classifier_path=ATS_ROOT / "models" / "classifier.pkl",
    )
    print("Training complete:")
    for key, value in report.items():
        print(f"- {key}: {value}")
