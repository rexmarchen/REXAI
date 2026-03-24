"""Stratified data splitting with explicit leakage checks."""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd
from sklearn.model_selection import train_test_split


@dataclass
class DatasetSplits:
    train: pd.DataFrame
    val: pd.DataFrame
    test: pd.DataFrame


def _assert_no_leakage(train_df: pd.DataFrame, val_df: pd.DataFrame, test_df: pd.DataFrame) -> None:
    train_hashes = set(train_df["text_hash"])
    val_hashes = set(val_df["text_hash"])
    test_hashes = set(test_df["text_hash"])

    if train_hashes.intersection(val_hashes):
        raise RuntimeError("Data leakage detected between train and validation splits.")
    if train_hashes.intersection(test_hashes):
        raise RuntimeError("Data leakage detected between train and test splits.")
    if val_hashes.intersection(test_hashes):
        raise RuntimeError("Data leakage detected between validation and test splits.")


def stratified_split(df: pd.DataFrame, random_state: int = 42) -> DatasetSplits:
    """Split dataframe into 70/15/15 stratified train/val/test sets."""
    train_val_df, test_df = train_test_split(
        df,
        test_size=0.15,
        random_state=random_state,
        stratify=df["target_role"],
    )

    # 0.17647 of remaining 85% gives 15% of original set.
    train_df, val_df = train_test_split(
        train_val_df,
        test_size=0.17647058823529413,
        random_state=random_state,
        stratify=train_val_df["target_role"],
    )

    train_df = train_df.reset_index(drop=True)
    val_df = val_df.reset_index(drop=True)
    test_df = test_df.reset_index(drop=True)
    _assert_no_leakage(train_df, val_df, test_df)
    return DatasetSplits(train=train_df, val=val_df, test=test_df)

