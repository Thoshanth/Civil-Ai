import os
from fpdf import FPDF
from PIL import Image, ImageDraw, ImageFont

def generate_geotech_report(filepath):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    
    content = """
    GEOTECHNICAL INVESTIGATION REPORT
    Project: Sunrise Residential Complex
    Date: May 16, 2026
    
    1. INTRODUCTION
    This report presents the geotechnical data for the proposed building site.
    
    2. BOREHOLE LOG (BH-1)
    Depth 0.0m to 1.5m: Silty Clay (CI), N = 12. Description: Brown firm silty clay.
    Depth 1.5m to 4.0m: Sandy Silt (SM), N = 24. Description: Yellowish dense sandy silt.
    Depth 4.0m to 8.0m: Weathered Rock, N > 50. Description: Highly weathered granite.
    
    3. GROUNDWATER
    Water table encountered at 3.5m depth during investigation.
    
    4. BEARING CAPACITY
    Calculated Safe Bearing Capacity (SBC) for shallow foundation: 250 kPa at 2.0m depth.
    Pile capacity (300mm dia bored pile): 450 kN at 8.0m depth.
    
    5. RECOMMENDATIONS
    Based on the soil profile, isolated spread footings are recommended at 2.0m depth.
    
    6. RISKS
    Risk of liquefaction in the upper sandy silt layer during seismic events.
    
    7. IS CODES
    Analysis done as per IS 1892 and IS 6403.
    """
    for line in content.split("\n"):
        pdf.cell(200, 10, txt=line, ln=1, align='L')
    pdf.output(filepath)

def generate_tender_document(filepath):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    
    content = """
    NOTICE INVITING TENDER (NIT)
    Project Name: Construction of Highway Bridge over River X
    Estimated Tender Value: INR 45,00,000
    
    1. SCOPE OF WORK
    The scope includes foundation, sub-structure, and superstructure works for a 100m long bridge.
    
    2. KEY DATES
    Bid Submission Deadline: 2026-06-15
    Technical Bid Opening: 2026-06-16
    Financial Bid Opening: 2026-06-25
    
    3. ELIGIBILITY CRITERIA
    - The bidder must have completed at least one similar project worth INR 30,00,000. (CRITICAL)
    - Average annual turnover of INR 20,00,000 in the last 3 years.
    
    4. RISK CLAUSES
    - Liquidated damages of 0.5% per week for delays, up to a maximum of 5%.
    - Force majeure applies only to natural disasters.
    
    5. COMPLIANCE CHECKLIST
    - Submission of EMD
    - Valid GST Registration
    - Valid EPF/ESIC Registration
    """
    for line in content.split("\n"):
        pdf.cell(200, 10, txt=line, ln=1, align='L')
    pdf.output(filepath)

def generate_boq_document(filepath):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    
    content = """
    BILL OF QUANTITIES (BOQ)
    Project: Office Renovation
    
    Summary: Total estimated cost for interior works.
    
    Item No | Description | Unit | Qty | Rate (INR) | Amount (INR)
    -------------------------------------------------------------------
    1.0 | Demolition of existing brick walls | cum | 15.5 | 500 | 7750
    2.0 | Providing and laying vitrified tiles | sqm | 120 | 1200 | 144000
    3.0 | Supply and apply plastic emulsion paint | sqm | 350 | 150 | 52500
    4.0 | False ceiling works with gypsum board | sqm | 100 | 850 | 85000
    
    Total Amount: INR 289,250
    
    Notes:
    Rates are inclusive of all taxes except GST.
    """
    for line in content.split("\n"):
        pdf.cell(200, 10, txt=line, ln=1, align='L')
    pdf.output(filepath)

def generate_site_photo(filepath):
    img = Image.new('RGB', (800, 600), color = (200, 200, 200))
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()
        
    d.text((50, 50), "SIMULATED SITE PHOTO", fill=(0,0,0), font=font)
    d.text((50, 100), "OBSERVATIONS:", fill=(0,0,0), font=font)
    d.text((50, 140), "- Heavy machinery (excavator) parked near trench", fill=(255,0,0), font=font)
    d.text((50, 180), "- Workers visible without hard hats", fill=(255,0,0), font=font)
    d.text((50, 220), "- Stack of steel rebars on the ground", fill=(0,0,0), font=font)
    d.text((50, 260), "- Concrete pouring in progress", fill=(0,0,0), font=font)
    
    img.save(filepath)

if __name__ == "__main__":
    docs_dir = r"c:\Users\mthos\OneDrive\Desktop\CivilAi\test-documents"
    os.makedirs(docs_dir, exist_ok=True)
    
    generate_geotech_report(os.path.join(docs_dir, "sample_geotech_report.pdf"))
    generate_tender_document(os.path.join(docs_dir, "sample_tender.pdf"))
    generate_boq_document(os.path.join(docs_dir, "sample_boq.pdf"))
    generate_site_photo(os.path.join(docs_dir, "sample_site_photo.jpg"))
    
    print(f"Test documents generated successfully in: {docs_dir}")
