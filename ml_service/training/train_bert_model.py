from transformers import BertTokenizer, BertForSequenceClassification, Trainer, TrainingArguments
from datasets import Dataset
import pandas as pd
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
DATASET_PATH = ROOT_DIR / "data" / "datasets" / "resume_dataset.csv"
MODEL_DIR = ROOT_DIR / "model"

# Load dataset
df = pd.read_csv(DATASET_PATH)

# Convert labels to numbers
label_map = {
    "Software Engineer": 0,
    "Data Scientist": 1,
    "Web Developer": 2,
    "DevOps Engineer": 3
}

df["label"] = df["target_role"].map(label_map)

# Convert to HuggingFace dataset
dataset = Dataset.from_pandas(df)

tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")

def tokenize(example):
    return tokenizer(
        example["resume_text"],
        truncation=True,
        padding="max_length",
        max_length=512
    )

dataset = dataset.map(tokenize, batched=True)

# Split
dataset = dataset.train_test_split(test_size=0.2)

# Model
model = BertForSequenceClassification.from_pretrained(
    "bert-base-uncased",
    num_labels=4
)

# Training config
training_args = TrainingArguments(
    output_dir=str(MODEL_DIR),
    eval_strategy="epoch",
    learning_rate=2e-5,
    per_device_train_batch_size=8,
    num_train_epochs=4,
    weight_decay=0.01,
    save_strategy="epoch",
    logging_dir=str(MODEL_DIR / "logs")
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"]
)

# TRAIN HERE 🔥
print("Starting model training...")
trainer.train()

# Save model
print("Saving model...")
model.save_pretrained(str(MODEL_DIR))
tokenizer.save_pretrained(str(MODEL_DIR))
print(f"Training complete! Model saved to {MODEL_DIR}")
