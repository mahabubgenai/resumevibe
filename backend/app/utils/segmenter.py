import re
from typing import Dict


SECTION_HEADERS = {
    "contact": [
        "contact",
        "personal information",
        "personal details",
        "contact information",
        "contact details",
    ],
    "summary": [
        "summary",
        "objective",
        "profile",
        "about me",
        "professional summary",
        "career objective",
        "personal statement",
        "overview",
    ],
    "experience": [
        "experience",
        "work experience",
        "employment history",
        "work history",
        "professional experience",
        "career history",
        "internship",
        "internships",
        "job experience",
        "relevant experience",
    ],
    "education": [
        "education",
        "academic background",
        "qualifications",
        "academic qualifications",
        "educational background",
        "academic history",
        "studies",
    ],
    "skills": [
        "skills",
        "technical skills",
        "core competencies",
        "technologies",
        "tools",
        "technical expertise",
        "key skills",
        "areas of expertise",
        "expertise",
        "technical proficiencies",
        "competencies",
    ],
    "projects": [
        "projects",
        "personal projects",
        "portfolio",
        "key projects",
        "academic projects",
        "side projects",
        "notable projects",
    ],
    "certifications": [
        "certifications",
        "certificates",
        "training",
        "achievements",
        "certifications & training",
        "professional certifications",
        "courses",
        "licenses",
        "awards",
        "honors",
    ],
    "languages": [
        "languages",
        "language proficiency",
        "spoken languages",
    ],
    "interests": [
        "interests",
        "hobbies",
        "activities",
        "extracurricular",
        "volunteer",
    ],
}


# সব possible header patterns (ALL CAPS, Title Case, lowercase)
def _build_pattern(keywords):
    escaped = [re.escape(k) for k in keywords]
    return r"(?:" + "|".join(escaped) + r")"


class ResumeSectionSegmenter:
    def segment(self, text: str) -> Dict[str, str]:
        # Method 1: Line-by-line (clean structured PDF)
        result = self._segment_by_lines(text)
        if len(result) >= 3:
            return result

        # Method 2: Regex split (single-block / unstructured)
        result = self._segment_by_regex(text)
        if len(result) >= 2:
            return result

        # Method 3: Fallback — সব text একটাই section
        return {"other": text}

    # ── Method 1 ─────────────────────────────────────────
    def _segment_by_lines(self, text: str) -> Dict[str, str]:
        lines = text.split("\n")
        sections = {key: "" for key in SECTION_HEADERS}
        sections["other"] = ""
        current = "other"

        for line in lines:
            stripped = line.strip()
            detected = self._detect_header(stripped)
            if detected:
                current = detected
            else:
                sections[current] += stripped + "\n"

        return {k: v.strip() for k, v in sections.items() if v.strip()}

    def _detect_header(self, line: str) -> str | None:
        if not line or len(line) > 80:
            return None

        line_lower = line.lower().strip(":-_• \t")

        for section, keywords in SECTION_HEADERS.items():
            for kw in keywords:
                # Exact match বা line শুধু এই keyword নিয়ে গঠিত
                if (
                    line_lower == kw
                    or line_lower.startswith(kw + " ")
                    or line_lower.endswith(" " + kw)
                ):
                    return section
                # ALL CAPS header (e.g. "PROFESSIONAL EXPERIENCE")
                if line.isupper() and kw in line_lower:
                    return section

        return None

    # ── Method 2 ─────────────────────────────────────────
    def _segment_by_regex(self, text: str) -> Dict[str, str]:
        """Single-block unstructured text এর জন্য।"""

        # সব section headers এর একটা master pattern
        all_keywords = []
        for keywords in SECTION_HEADERS.values():
            all_keywords.extend(keywords)

        # Section boundary pattern
        boundary = (
            r"(?:^|\n)[ \t]*("
            + "|".join(
                re.escape(k) for k in sorted(all_keywords, key=len, reverse=True)
            )
            + r")[ \t]*(?:\n|:)"
        )

        splits = re.split(boundary, text, flags=re.IGNORECASE | re.MULTILINE)

        if len(splits) <= 1:
            return {}

        sections = {}
        # splits = [before_first, header1, content1, header2, content2, ...]
        i = 1
        while i < len(splits) - 1:
            header = splits[i].strip().lower()
            content = splits[i + 1].strip() if i + 1 < len(splits) else ""

            section_key = self._match_section(header)
            if section_key and content:
                # একই section আবার আসলে append করো
                if section_key in sections:
                    sections[section_key] += "\n" + content
                else:
                    sections[section_key] = content
            i += 2

        return sections

    def _match_section(self, header: str) -> str | None:
        header = header.lower().strip()
        for section, keywords in SECTION_HEADERS.items():
            for kw in keywords:
                if kw in header:
                    return section
        return None

    # ── Stats ─────────────────────────────────────────────
    def get_section_stats(self, sections: Dict) -> Dict:
        return {
            "total_sections": len(sections),
            "sections_found": list(sections.keys()),
            "has_experience": "experience" in sections,
            "has_education": "education" in sections,
            "has_skills": "skills" in sections,
            "has_projects": "projects" in sections,
        }
