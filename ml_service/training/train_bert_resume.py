from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from datasets import Dataset
from sklearn.metrics import accuracy_score, classification_report, f1_score, recall_score
from sklearn.model_selection import train_test_split
from transformers import (
    BertForSequenceClassification,
    BertTokenizer,
    EarlyStoppingCallback,
    Trainer,
    TrainingArguments,
)


LABEL_MAP = {
    "Software Engineer": 0,
    "Data Scientist": 1,
    "Web Developer": 2,
    "DevOps Engineer": 3,
}

ID_TO_LABEL = {value: key for key, value in LABEL_MAP.items()}


def parse_args() -> argparse.Namespace:
    current_dir = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Train BERT resume role classifier.")
    parser.add_argument("--dataset", type=Path, default=current_dir.parent / "data" / "datasets" / "resume_dataset.csv")
    parser.add_argument("--output-dir", type=Path, default=current_dir.parent / "model")
    parser.add_argument("--max-length", type=int, default=256)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--epochs", type=int, default=4)
    parser.add_argument("--learning-rate", type=float, default=2e-5)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def validate_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    required_cols = ["resume_id", "resume_text", "target_role", "years_experience", "seniority"]
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    if df[required_cols].isna().any().any():
        raise ValueError("Dataset contains null values in required columns.")

    df = df.copy()
    df["target_role"] = df["target_role"].astype(str).str.strip()
    allowed = set(LABEL_MAP.keys())
    unknown = sorted(set(df["target_role"].unique()) - allowed)
    if unknown:
        raise ValueError(f"Unknown labels found: {unknown}")

    df["label"] = df["target_role"].map(LABEL_MAP)
    return df


def to_hf_dataset(df: pd.DataFrame, tokenizer: BertTokenizer, max_length: int) -> Dataset:
    dataset = Dataset.from_pandas(df, preserve_index=False)

    def tokenize(batch: dict) -> dict:
        return tokenizer(
            batch["resume_text"],
            truncation=True,
            padding="max_length",
            max_length=max_length,
        )

    dataset = dataset.map(tokenize, batched=True)
    dataset = dataset.remove_columns(["resume_id", "resume_text", "target_role", "years_experience", "seniority"])
    dataset.set_format(type="torch", columns=["input_ids", "attention_mask", "label"])
    return dataset


def compute_metrics(eval_pred) -> dict[str, float]:
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=1)
    accuracy = accuracy_score(labels, predictions)
    macro_f1 = f1_score(labels, predictions, average="macro", zero_division=0)
    per_class_recall = recall_score(labels, predictions, average=None, labels=[0, 1, 2, 3], zero_division=0)
    return {
        "accuracy": float(accuracy),
        "macro_f1": float(macro_f1),
        "recall_software_engineer": float(per_class_recall[0]),
        "recall_data_scientist": float(per_class_recall[1]),
        "recall_web_developer": float(per_class_recall[2]),
        "recall_devops_engineer": float(per_class_recall[3]),
    }


def main() -> int:
    args = parse_args()
    torch.manual_seed(args.seed)
    np.random.seed(args.seed)

    df = pd.read_csv(args.dataset)
    df = validate_dataframe(df)

    train_df, temp_df = train_test_split(
        df,
        test_size=0.30,
        random_state=args.seed,
        stratify=df["label"],
    )
    val_df, test_df = train_test_split(
        temp_df,
        test_size=0.50,
        random_state=args.seed,
        stratify=temp_df["label"],
    )

    tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
    train_dataset = to_hf_dataset(train_df, tokenizer, args.max_length)
    val_dataset = to_hf_dataset(val_df, tokenizer, args.max_length)
    test_dataset = to_hf_dataset(test_df, tokenizer, args.max_length)

    model = BertForSequenceClassification.from_pretrained("bert-base-uncased", num_labels=4)

    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    training_args = TrainingArguments(
        output_dir=str(output_dir),
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="eval_macro_f1",
        greater_is_better=True,
        learning_rate=args.learning_rate,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        num_train_epochs=args.epochs,
        weight_decay=0.01,
        logging_dir=str(output_dir / "logs"),
        logging_steps=50,
        save_total_limit=2,
        report_to=[],
        seed=args.seed,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],
    )

    trainer.train()

    test_pred = trainer.predict(test_dataset)
    test_logits = test_pred.predictions
    test_labels = test_pred.label_ids
    test_preds = np.argmax(test_logits, axis=1)

    test_accuracy = accuracy_score(test_labels, test_preds)
    test_macro_f1 = f1_score(test_labels, test_preds, average="macro", zero_division=0)
    test_per_class_recall = recall_score(
        test_labels,
        test_preds,
        average=None,
        labels=[0, 1, 2, 3],
        zero_division=0,
    )
    report = classification_report(
        test_labels,
        test_preds,
        target_names=[ID_TO_LABEL[i] for i in range(4)],
        output_dict=True,
        zero_division=0,
    )

    metrics = {
        "test_accuracy": float(test_accuracy),
        "test_macro_f1": float(test_macro_f1),
        "test_per_class_recall": {
            ID_TO_LABEL[i]: float(value) for i, value in enumerate(test_per_class_recall)
        },
        "classification_report": report,
        "split_sizes": {
            "train": int(len(train_df)),
            "validation": int(len(val_df)),
            "test": int(len(test_df)),
        },
        "train_config": {
            "model": "bert-base-uncased",
            "max_length": int(args.max_length),
            "batch_size": int(args.batch_size),
            "epochs": int(args.epochs),
            "learning_rate": float(args.learning_rate),
            "seed": int(args.seed),
            "device": "cuda" if torch.cuda.is_available() else "cpu",
        },
    }

    predictions_df = pd.DataFrame(
        {
            "resume_id": test_df["resume_id"].values,
            "target_role": [ID_TO_LABEL[int(x)] for x in test_labels],
            "predicted_role": [ID_TO_LABEL[int(x)] for x in test_preds],
            "confidence": np.max(torch.softmax(torch.tensor(test_logits), dim=1).numpy(), axis=1),
        }
    )
    predictions_df.to_csv(output_dir / "predictions.csv", index=False)

    trainer.save_model(str(output_dir))
    tokenizer.save_pretrained(str(output_dir))
    (output_dir / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    print(json.dumps(metrics, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
