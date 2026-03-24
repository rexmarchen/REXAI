"""BERT training and evaluation utilities."""

from __future__ import annotations

import copy
import json
import random
from dataclasses import asdict, dataclass
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, recall_score

from .config import TrainingConfig


def _lazy_import_dl() -> dict[str, Any]:
    try:
        import torch
        from torch import nn
        from torch.utils.data import DataLoader, Dataset
        from transformers import (
            AutoConfig,
            AutoModelForSequenceClassification,
            AutoTokenizer,
            get_linear_schedule_with_warmup,
        )

        return {
            "torch": torch,
            "nn": nn,
            "DataLoader": DataLoader,
            "Dataset": Dataset,
            "AutoConfig": AutoConfig,
            "AutoModelForSequenceClassification": AutoModelForSequenceClassification,
            "AutoTokenizer": AutoTokenizer,
            "get_linear_schedule_with_warmup": get_linear_schedule_with_warmup,
        }
    except Exception as exc:
        raise RuntimeError(
            "BERT training requires torch + transformers. Install dependencies first "
            "(see ml_service/requirements.txt)."
        ) from exc


def set_global_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    modules = _lazy_import_dl()
    torch = modules["torch"]
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


@dataclass
class EvalResult:
    accuracy: float
    macro_f1: float
    per_class_recall: dict[str, float]
    confusion_matrix: list[list[int]]
    classification_report: dict[str, Any]
    predictions_df: pd.DataFrame


@dataclass
class TrainRunResult:
    model: Any
    tokenizer: Any
    history: list[dict[str, float]]
    val_result: EvalResult
    config_snapshot: dict[str, Any]


def _pick_device(device: str) -> str:
    modules = _lazy_import_dl()
    torch = modules["torch"]

    if device != "auto":
        return device
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def _compute_class_weights(
    train_df: pd.DataFrame,
    role_to_id: dict[str, int],
    use_class_weights: bool,
) -> np.ndarray | None:
    if not use_class_weights:
        return None

    counts = train_df["target_role"].value_counts()
    ratio = float(counts.max() / max(counts.min(), 1))
    if ratio <= 1.2:
        return None

    total = float(counts.sum())
    class_count = float(len(role_to_id))
    weights = np.ones(len(role_to_id), dtype=np.float32)
    for role, idx in role_to_id.items():
        count = float(counts.get(role, 1))
        weights[idx] = total / (class_count * count)
    return weights


def _build_dataset_class():
    modules = _lazy_import_dl()
    Dataset = modules["Dataset"]

    class ResumeDataset(Dataset):  # type: ignore[misc]
        def __init__(self, dataframe: pd.DataFrame, tokenizer: Any, role_to_id: dict[str, int], max_length: int) -> None:
            self.df = dataframe.reset_index(drop=True)
            self.tokenizer = tokenizer
            self.role_to_id = role_to_id
            self.max_length = max_length

        def __len__(self) -> int:
            return int(len(self.df))

        def __getitem__(self, index: int) -> dict[str, Any]:
            row = self.df.iloc[index]
            encoded = self.tokenizer(
                str(row["resume_text"]),
                truncation=True,
                padding="max_length",
                max_length=self.max_length,
                return_tensors="pt",
            )
            return {
                "input_ids": encoded["input_ids"].squeeze(0),
                "attention_mask": encoded["attention_mask"].squeeze(0),
                "labels": self.role_to_id[str(row["target_role"])],
                "resume_id": str(row["resume_id"]),
                "target_role": str(row["target_role"]),
                "resume_text": str(row["resume_text"]),
            }

    return ResumeDataset


def evaluate_model(
    *,
    model: Any,
    tokenizer: Any,
    dataframe: pd.DataFrame,
    role_to_id: dict[str, int],
    batch_size: int,
    max_length: int,
    device: str,
) -> EvalResult:
    device = _pick_device(device)
    modules = _lazy_import_dl()
    torch = modules["torch"]
    DataLoader = modules["DataLoader"]

    id_to_role = {index: role for role, index in role_to_id.items()}
    dataset_class = _build_dataset_class()
    dataset = dataset_class(dataframe, tokenizer, role_to_id, max_length)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=False)

    model.eval()
    all_true: list[int] = []
    all_pred: list[int] = []
    all_confidence: list[float] = []
    prediction_rows: list[dict[str, Any]] = []

    with torch.no_grad():
        for batch in loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=1)
            confidence, preds = probs.max(dim=1)

            labels_np = labels.detach().cpu().numpy()
            preds_np = preds.detach().cpu().numpy()
            conf_np = confidence.detach().cpu().numpy()

            all_true.extend(labels_np.tolist())
            all_pred.extend(preds_np.tolist())
            all_confidence.extend(conf_np.tolist())

            resume_ids = batch["resume_id"]
            target_roles = batch["target_role"]
            resume_texts = batch["resume_text"]
            for i in range(len(resume_ids)):
                prediction_rows.append(
                    {
                        "resume_id": str(resume_ids[i]),
                        "resume_text": str(resume_texts[i]),
                        "target_role": str(target_roles[i]),
                        "predicted_role": id_to_role[int(preds_np[i])],
                        "confidence": float(conf_np[i]),
                    }
                )

    accuracy = float(accuracy_score(all_true, all_pred))
    macro_f1 = float(f1_score(all_true, all_pred, average="macro", zero_division=0))
    recalls = recall_score(
        all_true,
        all_pred,
        labels=list(range(len(role_to_id))),
        average=None,
        zero_division=0,
    )
    per_class_recall = {id_to_role[idx]: float(value) for idx, value in enumerate(recalls)}
    conf = confusion_matrix(all_true, all_pred, labels=list(range(len(role_to_id))))
    report = classification_report(
        all_true,
        all_pred,
        labels=list(range(len(role_to_id))),
        target_names=[id_to_role[idx] for idx in range(len(role_to_id))],
        output_dict=True,
        zero_division=0,
    )

    pred_df = pd.DataFrame(prediction_rows)
    pred_df["correct"] = pred_df["target_role"] == pred_df["predicted_role"]
    return EvalResult(
        accuracy=accuracy,
        macro_f1=macro_f1,
        per_class_recall=per_class_recall,
        confusion_matrix=conf.astype(int).tolist(),
        classification_report=report,
        predictions_df=pred_df,
    )


def train_single_run(
    *,
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    role_to_id: dict[str, int],
    config: TrainingConfig,
    device: str,
) -> TrainRunResult:
    device = _pick_device(device)
    modules = _lazy_import_dl()
    torch = modules["torch"]
    nn = modules["nn"]
    DataLoader = modules["DataLoader"]
    AutoConfig = modules["AutoConfig"]
    AutoTokenizer = modules["AutoTokenizer"]
    AutoModelForSequenceClassification = modules["AutoModelForSequenceClassification"]
    get_linear_schedule_with_warmup = modules["get_linear_schedule_with_warmup"]

    set_global_seed(config.random_seed)
    dataset_class = _build_dataset_class()

    tokenizer = AutoTokenizer.from_pretrained(config.model_name)
    model_config = AutoConfig.from_pretrained(config.model_name)
    model_config.num_labels = len(role_to_id)
    model_config.hidden_dropout_prob = float(config.dropout)
    model_config.attention_probs_dropout_prob = float(config.dropout)
    model_config.classifier_dropout = float(config.dropout)
    model = AutoModelForSequenceClassification.from_pretrained(config.model_name, config=model_config)
    model.to(device)

    train_dataset = dataset_class(train_df, tokenizer, role_to_id, config.max_length)
    val_dataset = dataset_class(val_df, tokenizer, role_to_id, config.max_length)
    train_loader = DataLoader(
        train_dataset,
        batch_size=config.batch_size,
        shuffle=True,
        num_workers=config.num_workers,
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=config.batch_size,
        shuffle=False,
        num_workers=config.num_workers,
    )

    class_weights = _compute_class_weights(train_df, role_to_id, config.use_class_weights)
    if class_weights is not None:
        weight_tensor = torch.tensor(class_weights, dtype=torch.float32, device=device)
        criterion = nn.CrossEntropyLoss(weight=weight_tensor)
    else:
        criterion = nn.CrossEntropyLoss()

    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=config.learning_rate,
        weight_decay=config.weight_decay,
    )
    total_steps = max(1, len(train_loader) * config.epochs)
    warmup_steps = int(total_steps * config.warmup_ratio)
    scheduler = get_linear_schedule_with_warmup(
        optimizer=optimizer,
        num_warmup_steps=warmup_steps,
        num_training_steps=total_steps,
    )

    best_state = copy.deepcopy(model.state_dict())
    best_val_loss = float("inf")
    best_epoch = -1
    patience_counter = 0
    history: list[dict[str, float]] = []

    for epoch in range(config.epochs):
        model.train()
        train_loss_sum = 0.0

        for batch in train_loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            optimizer.zero_grad(set_to_none=True)
            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            logits = outputs.logits
            loss = criterion(logits, labels)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=config.gradient_clip_norm)
            optimizer.step()
            scheduler.step()

            train_loss_sum += float(loss.item())

        # Validation loss for early stopping.
        model.eval()
        val_loss_sum = 0.0
        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                labels = batch["labels"].to(device)
                outputs = model(input_ids=input_ids, attention_mask=attention_mask)
                val_loss = criterion(outputs.logits, labels)
                val_loss_sum += float(val_loss.item())

        avg_train_loss = train_loss_sum / max(1, len(train_loader))
        avg_val_loss = val_loss_sum / max(1, len(val_loader))
        history.append(
            {
                "epoch": float(epoch + 1),
                "train_loss": float(avg_train_loss),
                "val_loss": float(avg_val_loss),
            }
        )

        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            best_state = copy.deepcopy(model.state_dict())
            best_epoch = epoch + 1
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= config.patience:
                break

    model.load_state_dict(best_state)
    val_result = evaluate_model(
        model=model,
        tokenizer=tokenizer,
        dataframe=val_df,
        role_to_id=role_to_id,
        batch_size=config.batch_size,
        max_length=config.max_length,
        device=device,
    )

    config_snapshot = asdict(config)
    config_snapshot["device"] = device
    config_snapshot["best_epoch"] = best_epoch
    return TrainRunResult(
        model=model,
        tokenizer=tokenizer,
        history=history,
        val_result=val_result,
        config_snapshot=config_snapshot,
    )


def get_hard_example_indices(val_predictions: pd.DataFrame, top_k: int) -> list[int]:
    """Pick hardest validation examples for mining (wrong + high confidence)."""
    mistakes = val_predictions.loc[~val_predictions["correct"]].copy()
    if mistakes.empty:
        return []
    mistakes = mistakes.sort_values(by="confidence", ascending=False).head(top_k)
    return mistakes.index.tolist()


def save_training_history(history: list[dict[str, float]], output_path: str) -> None:
    with open(output_path, "w", encoding="utf-8") as handle:
        json.dump(history, handle, indent=2)
