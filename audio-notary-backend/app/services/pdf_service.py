import matplotlib
matplotlib.use('Agg') 
import matplotlib.pyplot as plt
import numpy as np
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf_report(analysis_data):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()

    # Header
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], alignment=1, fontSize=24, spaceAfter=20, textColor=colors.darkblue)
    elements.append(Paragraph("DIGITAL AUDIO NOTARY AUDIT", title_style))
    
    filename = analysis_data.get('filename', 'Unknown')
    timestamp = analysis_data.get('timestamp', 'Unknown')
    elements.append(Paragraph(f"File: {filename}", styles['Normal']))
    elements.append(Paragraph(f"Date: {timestamp}", styles['Normal']))
    elements.append(Spacer(1, 20))

    # --- VERDICT LOGIC ---
    verdict = analysis_data.get("verdict", "Unknown")
    fake_prob = analysis_data.get("confidence_score", 0) # This is Fake %
    human_prob = 100 - fake_prob
    
    # Determine Colors
    if verdict == "AI/Synthetic":
        verdict_color = "#FF0000"
    else:
        verdict_color = "#008000"

    # Display Verdict
    verdict_style = ParagraphStyle('Verdict', parent=styles['Heading2'], alignment=1, fontSize=18, textColor=colors.HexColor(verdict_color))
    elements.append(Paragraph(f"VERDICT: {verdict.upper()}", verdict_style))
    
    # Text Summary
    summary = f"Analysis detects a <b>{fake_prob:.2f}% probability of AI Synthesis</b> and <b>{human_prob:.2f}% probability of Human Origin</b>."
    elements.append(Paragraph(summary, styles['Normal']))
    elements.append(Spacer(1, 20))

    # --- GRAPH LOGIC (FIXED) ---
    try:
        fig = plt.figure(figsize=(6, 2))
        
        # Map values directly: Top=Human, Bottom=AI
        categories = ['AI Probability', 'Human Probability']
        values = [fake_prob, human_prob] # [Red Value, Green Value]
        colors_list = ['red', 'green']
        
        bars = plt.barh(categories, values, color=colors_list)
        plt.xlim(0, 100)
        
        # Add value labels inside bars
        for bar, val in zip(bars, values):
            plt.text(5, bar.get_y() + bar.get_height()/2, f"{val:.1f}%", va='center', color='white', fontweight='bold')

        plt.tight_layout()
        img_buffer = BytesIO()
        plt.savefig(img_buffer, format='png')
        img_buffer.seek(0)
        plt.close(fig) 
        
        elements.append(Image(img_buffer, width=400, height=150))
    except Exception as e:
        elements.append(Paragraph("[Graph Generation Failed]", styles['Normal']))
    
    elements.append(Spacer(1, 20))

    # Forensic Details
    elements.append(Paragraph("Forensic Insights:", styles['Heading2']))
    for reason in analysis_data.get("reasons", []):
        elements.append(Paragraph(f"• {reason}", styles['BodyText']))
        elements.append(Spacer(1, 5))

    # Features Table
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("Biometric Data:", styles['Heading3']))
    features = analysis_data.get("features", {})
    data = [
        ["Metric", "Value", "Status"],
        ["Pitch Jitter", f"{features.get('jitter', 0):.5f}", "Analyzed"],
        ["Cepstral Peak", f"{features.get('cepstral_peak', 0):.2f}", "Analyzed"],
        ["Entropy", f"{features.get('spectral_entropy', 0):.3f}", "Analyzed"],
        ["Silence", f"{features.get('silence_ratio', 0):.3f}", "Analyzed"]
    ]
    t = Table(data, colWidths=[150, 100, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.grey),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 1, colors.black),
    ]))
    elements.append(t)
    
    elements.append(Spacer(1, 40))
    elements.append(Paragraph("Audio Forensic Toolkit - Digital Estimate", ParagraphStyle('Footer', fontSize=8, textColor=colors.grey)))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer