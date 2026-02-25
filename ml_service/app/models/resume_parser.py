from ..service.parser import extract_text


class ResumeParser:
    """Parse resume documents and extract text."""

    def extract(self, content: bytes, filename: str) -> str:
        return extract_text(content, filename)
