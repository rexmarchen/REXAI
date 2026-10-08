"""
Layout-aware PDF extraction.

Naive extraction (PyPDF2, pdf-parse, plain pdfplumber .extract_text()) reads
text in the order it was written into the PDF's content stream, which is
NOT necessarily the order a human reads it in. Two-column resumes are the
classic failure case: the extractor reads across both columns line-by-line
instead of down one column then the other, interleaving unrelated words -
this is very likely the actual cause of garbled name/phone output.

This module fixes that by extracting words with their (x, y) coordinates
and re-sorting them into reading order, and separately pulls embedded
hyperlink annotations - which is the RELIABLE way to get LinkedIn/GitHub
URLs, since many resume templates put them behind an icon with no visible
URL text at all (regex on visible text would simply miss these).
"""
from __future__ import annotations
from dataclasses import dataclass, field
import pdfplumber


@dataclass
class PdfExtractionResult:
    full_text: str
    first_page_text: str  # contact info is almost always here - useful for a focused LLM pass
    hyperlinks: list[str] = field(default_factory=list)


def _sort_words_reading_order(words: list[dict], column_gap_threshold: float = 50.0) -> list[dict]:
    """
    Groups words into columns by x-position, then sorts within each column
    top-to-bottom, then concatenates columns left-to-right. This is what
    correctly separates a two-column resume instead of interleaving them.
    A single-column resume just becomes one "column" and behaves like
    normal top-to-bottom reading order.
    """
    if not words:
        return []

    xs = sorted(w["x0"] for w in words)
    # Find gaps in the x-distribution large enough to be a column boundary.
    column_breaks = [xs[0]]
    for prev, curr in zip(xs, xs[1:]):
        if curr - prev > column_gap_threshold:
            column_breaks.append(curr)

    def column_index(word: dict) -> int:
        for i in range(len(column_breaks) - 1, -1, -1):
            if word["x0"] >= column_breaks[i]:
                return i
        return 0

    columns: dict[int, list[dict]] = {}
    for w in words:
        columns.setdefault(column_index(w), []).append(w)

    ordered: list[dict] = []
    for idx in sorted(columns.keys()):
        col_words = sorted(columns[idx], key=lambda w: (round(w["top"], 1), w["x0"]))
        ordered.extend(col_words)

    return ordered


def extract_pdf(pdf_path: str) -> PdfExtractionResult:
    all_text_parts: list[str] = []
    first_page_text = ""
    hyperlinks: list[str] = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            words = page.extract_words(use_text_flow=False, keep_blank_chars=False)
            ordered = _sort_words_reading_order(words)

            # Rebuild lines from reading-order words, grouping by rounded
            # top-coordinate so words on the same visual line stay together.
            lines: dict[float, list[str]] = {}
            for w in ordered:
                key = round(w["top"], 0)
                lines.setdefault(key, []).append(w["text"])
            page_text = "\n".join(" ".join(lines[k]) for k in sorted(lines.keys()))

            all_text_parts.append(page_text)
            if page_num == 0:
                first_page_text = page_text

            # Embedded hyperlink annotations - this is how you reliably get
            # LinkedIn/GitHub/portfolio URLs that are behind icons with no
            # visible text, which plain text regex would never catch.
            for link in page.hyperlinks:
                uri = link.get("uri")
                if uri:
                    hyperlinks.append(uri)

    return PdfExtractionResult(
        full_text="\n\n".join(all_text_parts),
        first_page_text=first_page_text,
        hyperlinks=hyperlinks,
    )
