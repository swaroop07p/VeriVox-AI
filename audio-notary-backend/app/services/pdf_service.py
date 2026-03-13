import matplotlib
matplotlib.use('Agg') 
import matplotlib.pyplot as plt
import numpy as np
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from datetime import datetime, timedelta

def generate_pdf_report(analysis_data):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()

    # Header
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], alignment=1, fontSize=24, spaceAfter=20, textColor=colors.darkblue)
    elements.append(Paragraph("DIGITAL AUDIO NOTARY AUDIT", title_style))
    
    # -----------Time converted to IST----------------
    filename = analysis_data.get('filename', 'Unknown')
    timestamp = analysis_data.get('timestamp', None)

    if timestamp:
        try:
            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))

            ist_time = timestamp + timedelta(hours=5, minutes=30)
            formatted_time = ist_time.strftime("%d %b %Y, %I:%M:%S %p")
        except:
            formatted_time = str(timestamp)
    else:
        formatted_time = "Unknown"

    elements.append(Paragraph(f"File: {filename}", styles['Normal']))
    elements.append(Paragraph(f"Date: {formatted_time}", styles['Normal']))
    elements.append(Spacer(1, 20))

    # --- VERDICT LOGIC ---
    verdict = analysis_data.get("verdict", "Unknown")
    
    # --- BUG FIX FOR OLD HISTORY REPORTS ---
    fake_prob = analysis_data.get("confidence_score", 0) 
    human_prob = 100 - fake_prob
    
    if verdict == "Real Human" and fake_prob > human_prob:
        fake_prob = 100 - analysis_data.get("confidence_score", 0)
        human_prob = analysis_data.get("confidence_score", 0)
    elif verdict == "AI/Synthetic" and human_prob > fake_prob:
        fake_prob = 100 - analysis_data.get("confidence_score", 0)
        human_prob = analysis_data.get("confidence_score", 0)
    
    if verdict == "AI/Synthetic":
        verdict_color = "#FF0000"
    else:
        verdict_color = "#008000"

    elements.append(Paragraph(f"VERDICT: {verdict.upper()}", ParagraphStyle('Verdict', parent=styles['Heading2'], alignment=1, fontSize=18, textColor=colors.HexColor(verdict_color))))
    
    summary = f"Analysis detects a <b>{fake_prob:.2f}% probability of AI Synthesis</b> and <b>{human_prob:.2f}% probability of Human Origin</b>."
    elements.append(Paragraph(summary, styles['Normal']))
    elements.append(Spacer(1, 20))

    # --- GRAPH 1: PROBABILITY BAR CHART ---
    try:
        fig = plt.figure(figsize=(6, 2))
        categories = ['AI Probability', 'Human Probability']
        values = [fake_prob, human_prob] 
        colors_list = ['#d9534f', '#5cb85c'] # Muted Red/Green for PDF
        
        bars = plt.barh(categories, values, color=colors_list)
        plt.xlim(0, 100)
        
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
    
    # --- GRAPH 2: NEW LINE CHART (HACKATHON FEATURE) ---
    try:
        fig2, ax2 = plt.subplots(figsize=(7, 3.5))
        feature_names = ['Pitch Jitter', 'Cepstral Peak', 'Entropy', 'Silence']
        
        # Z-Score translation logic mimicking the frontend exactly
        def get_pdf_risk_score(val, mean, std):
            if val is None: return 50
            z = abs(val - mean) / (std + 1e-6)
            risk = (z / 2.5) * 100
            micro_variance = (val * 137) % 8
            return min(max(5, risk + micro_variance), 95)
            
        risks = [
            get_pdf_risk_score(features.get('jitter', 0.012), 0.012, 0.007),
            get_pdf_risk_score(features.get('cepstral_peak', 15.5), 15.5, 4.5),
            get_pdf_risk_score(features.get('spectral_entropy', 4.5), 4.5, 1.6),
            get_pdf_risk_score(features.get('silence_ratio', 0.14), 0.14, 0.11)
        ]
        
        # Plot the dynamic line
        ax2.plot(feature_names, risks, color='#0078D7', marker='o', linewidth=2.5, markersize=8, markerfacecolor='#D13438', markeredgecolor='white', markeredgewidth=1.5)
        ax2.set_ylim(0, 100)
        ax2.axhline(50, color='gray', linestyle='--', alpha=0.5)
        
        # Fill under the line for aesthetics
        ax2.fill_between(feature_names, risks, 0, color='#0078D7', alpha=0.1)
        
        ax2.set_ylabel('Synthetic Risk (%)', fontweight='bold')
        ax2.set_title('Acoustic Feature Anomaly Profile', fontweight='bold', pad=15)
        ax2.grid(True, axis='y', linestyle='--', alpha=0.5)
        
        # Clean up borders for the PDF
        ax2.spines['top'].set_visible(False)
        ax2.spines['right'].set_visible(False)
        
        plt.tight_layout()
        img_buffer2 = BytesIO()
        plt.savefig(img_buffer2, format='png', dpi=150)
        img_buffer2.seek(0)
        plt.close(fig2)
        
        elements.append(Spacer(1, 25))
        elements.append(Image(img_buffer2, width=450, height=225))
    except Exception as e:
        elements.append(Spacer(1, 10))
        elements.append(Paragraph(f"[Anomaly Graph Generation Failed]", styles['Normal']))
    # ----------------------------------------------------

    elements.append(Spacer(1, 40))
    elements.append(Paragraph("Audio Forensic Toolkit - Digital Estimate", ParagraphStyle('Footer', fontSize=8, textColor=colors.grey)))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer