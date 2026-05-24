import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable,
    Table,
    TableStyle,
)
from reportlab.lib.enums import TA_CENTER


def generate_analysis_pdf(analysis_data: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    emerald = colors.HexColor("#10B981")
    dark = colors.HexColor("#111827")

    # Custom styles
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Heading1"],
        fontSize=22,
        fontName="Helvetica-Bold",
        textColor=dark,
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontSize=11,
        textColor=colors.HexColor("#6B7280"),
        spaceAfter=16,
    )
    section_style = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontSize=13,
        fontName="Helvetica-Bold",
        textColor=emerald,
        spaceBefore=16,
        spaceAfter=8,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=10,
        textColor=dark,
        spaceAfter=4,
        leading=14,
    )
    bullet_style = ParagraphStyle(
        "Bullet",
        parent=styles["Normal"],
        fontSize=10,
        textColor=dark,
        leftIndent=16,
        spaceAfter=3,
        leading=14,
    )

    story = []

    # Header
    story.append(Paragraph("ResumeVibe Analysis Report", title_style))
    story.append(
        Paragraph(
            f"File: {analysis_data.get('file_name', 'resume.pdf')} | "
            f"Words: {analysis_data.get('word_count', 0)}",
            subtitle_style,
        )
    )
    story.append(HRFlowable(width="100%", thickness=2, color=emerald))
    story.append(Spacer(1, 12))

    # Score Summary
    story.append(Paragraph("Score Summary", section_style))
    ats_score = analysis_data.get("ats_score", 0)
    quality = analysis_data.get("quality_label", "").upper()
    match_score = analysis_data.get("match_score")

    score_data = [
        ["Metric", "Score", "Rating"],
        ["ATS Score", str(ats_score), quality],
    ]
    if match_score:
        score_data.append(
            [
                "Job Match",
                f"{match_score}%",
                analysis_data.get("match_level", "").upper(),
            ]
        )

    score_table = Table(score_data, colWidths=[2.5 * inch, 1.5 * inch, 2 * inch])
    score_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), emerald),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.HexColor("#F9FAFB"), colors.white],
                ),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(score_table)
    story.append(Spacer(1, 8))

    # Sections Found
    section_stats = analysis_data.get("section_stats", {})
    sections_found = section_stats.get("sections_found", [])
    if sections_found:
        story.append(Paragraph("Sections Detected", section_style))
        story.append(
            Paragraph(", ".join(s.capitalize() for s in sections_found), body_style)
        )

    # Skills
    llm_skills = analysis_data.get("llm_skills", {})
    skills = llm_skills.get("skills", {})

    if skills.get("technical"):
        story.append(Paragraph("Technical Skills", section_style))
        story.append(Paragraph(", ".join(skills["technical"]), body_style))

    if skills.get("tools"):
        story.append(Paragraph("Tools & Platforms", section_style))
        story.append(Paragraph(", ".join(skills["tools"]), body_style))

    # ATS Feedback
    llm_feedback = analysis_data.get("llm_feedback", {})
    ats_feedback = llm_feedback.get("ats_feedback", {})

    if ats_feedback.get("strengths"):
        story.append(Paragraph("Strengths", section_style))
        for s in ats_feedback["strengths"]:
            story.append(Paragraph(f"• {s}", bullet_style))

    if ats_feedback.get("weaknesses"):
        story.append(Paragraph("Areas for Improvement", section_style))
        for w in ats_feedback["weaknesses"]:
            story.append(Paragraph(f"• {w}", bullet_style))

    if ats_feedback.get("overall_assessment"):
        story.append(Paragraph("Overall Assessment", section_style))
        story.append(Paragraph(ats_feedback["overall_assessment"], body_style))

    # Improvement Suggestions
    suggestions = llm_skills.get("improvement_suggestions", [])
    if suggestions:
        story.append(Paragraph("Improvement Suggestions", section_style))
        for i, s in enumerate(suggestions, 1):
            story.append(Paragraph(f"{i}. {s}", bullet_style))

    # Rewrite Summary
    rewrite = llm_feedback.get("rewrite_suggestions", {})
    if rewrite.get("summary"):
        story.append(Paragraph("Suggested Summary Rewrite", section_style))
        story.append(Paragraph(rewrite["summary"], body_style))

    # Keywords to Add
    keywords = ats_feedback.get("keyword_suggestions", [])
    if keywords:
        story.append(Paragraph("Keywords to Add", section_style))
        story.append(Paragraph(", ".join(keywords), body_style))

    # Footer
    story.append(Spacer(1, 20))
    story.append(
        HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB"))
    )
    story.append(Spacer(1, 6))
    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontSize=8,
        textColor=colors.HexColor("#9CA3AF"),
        alignment=TA_CENTER,
    )
    story.append(
        Paragraph("Generated by ResumeVibe — AI-Powered Resume Platform", footer_style)
    )

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
