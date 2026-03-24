"""Resume text augmentation utilities."""

from __future__ import annotations

import random
import re
from dataclasses import dataclass

import pandas as pd


@dataclass
class AugmentationResult:
    augmented_df: pd.DataFrame
    generated_rows: int
    method: str


class ResumeParaphraser:
    """Paraphraser with optional transformer backend and deterministic fallback."""

    def __init__(
        self,
        model_name: str = "Vamsi/T5_Paraphrase_Paws",
        max_length: int = 256,
        local_files_only: bool = True,
        random_seed: int = 42,
    ) -> None:
        self.max_length = max_length
        self.local_files_only = local_files_only
        self.random = random.Random(random_seed)
        self._backend_name = "rule_based"
        self._generator = None

        try:
            from transformers import pipeline  # type: ignore

            self._generator = pipeline(
                "text2text-generation",
                model=model_name,
                tokenizer=model_name,
                device=-1,
                local_files_only=local_files_only,
            )
            self._backend_name = "transformer_paraphrase"
        except Exception:
            self._generator = None
            self._backend_name = "rule_based"

    @property
    def backend_name(self) -> str:
        return self._backend_name

    def _rule_based_paraphrase(self, text: str) -> str:
        value = re.sub(r"\s+", " ", str(text or "").strip())
        replacements = [
            ("Experienced in", "Hands-on with"),
            ("Worked on", "Delivered"),
            ("years of experience", "years in practice"),
            ("Developed", "Built"),
            ("Optimized", "Improved"),
        ]
        for old, new in replacements:
            value = re.sub(rf"\b{re.escape(old)}\b", new, value, flags=re.IGNORECASE)

        sentences = [segment.strip() for segment in re.split(r"(?<=[.!?])\s+", value) if segment.strip()]
        if len(sentences) > 1 and self.random.random() < 0.7:
            self.random.shuffle(sentences)
            value = " ".join(sentences)
        return value

    def paraphrase(self, text: str) -> str:
        if self._generator is None:
            return self._rule_based_paraphrase(text)

        prompt = f"paraphrase: {text}"
        try:
            outputs = self._generator(
                prompt,
                max_length=self.max_length,
                num_return_sequences=1,
                do_sample=True,
                top_k=60,
                top_p=0.95,
                temperature=0.8,
            )
            candidate = str(outputs[0]["generated_text"]).strip()
            return candidate if candidate else self._rule_based_paraphrase(text)
        except Exception:
            return self._rule_based_paraphrase(text)


def augment_dataframe(
    train_df: pd.DataFrame,
    *,
    paraphraser: ResumeParaphraser,
    max_multiplier: float = 2.0,
    target_indices: list[int] | None = None,
) -> AugmentationResult:
    """Generate paraphrased rows with cap: total size <= max_multiplier * original."""
    if max_multiplier <= 1.0:
        return AugmentationResult(augmented_df=train_df.copy(), generated_rows=0, method=paraphraser.backend_name)

    base_count = len(train_df)
    max_total = int(base_count * max_multiplier)
    max_new = max(0, max_total - base_count)
    if max_new == 0:
        return AugmentationResult(augmented_df=train_df.copy(), generated_rows=0, method=paraphraser.backend_name)

    if target_indices:
        source = train_df.iloc[target_indices].copy()
    else:
        source = train_df.copy()

    # Cap source to available augmentation budget.
    source = source.head(max_new).copy()
    generated_rows = []
    for _, row in source.iterrows():
        new_row = row.copy()
        new_text = paraphraser.paraphrase(str(row["resume_text"]))
        if not new_text or new_text == row["resume_text"]:
            continue
        new_row["resume_text"] = new_text
        new_row["resume_id"] = f"{row['resume_id']}_aug"
        generated_rows.append(new_row)

    if not generated_rows:
        return AugmentationResult(augmented_df=train_df.copy(), generated_rows=0, method=paraphraser.backend_name)

    augmented = pd.concat([train_df, pd.DataFrame(generated_rows)], ignore_index=True)
    augmented = augmented.head(max_total).reset_index(drop=True)
    return AugmentationResult(
        augmented_df=augmented,
        generated_rows=int(len(augmented) - len(train_df)),
        method=paraphraser.backend_name,
    )

