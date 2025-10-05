// CSV to PDF Generator - Browser Version (Updated to match Node.js version)
class PDFGenerator {
    constructor() {
        this.contacts = [];
        this.apiUrl = '';
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('fetchDataBtn').addEventListener('click', () => this.fetchData());
        document.getElementById('demoDataBtn').addEventListener('click', () => this.loadDemoData());
        document.getElementById('generatePdfsBtn').addEventListener('click', () => this.generateAllPDFs());
        document.getElementById('generateSpecificBtn').addEventListener('click', () => this.showSpecificContactSection());
        document.getElementById('downloadSpecificBtn').addEventListener('click', () => this.showSpecificContactSection());
        document.getElementById('generateSelectedBtn').addEventListener('click', () => this.generateSelectedPDF());
    }

    async fetchData() {
        const apiUrl = document.getElementById('apiUrl').value.trim();
        
        if (!apiUrl) {
            this.showStatus('Please enter a valid API URL', 'error');
            return;
        }

        this.apiUrl = apiUrl;
        this.showStatus('Fetching data from API...', 'loading');
        
        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Handle different response formats from n8n
            if (Array.isArray(data)) {
                this.contacts = data;
            } else if (data.data && Array.isArray(data.data)) {
                this.contacts = data.data;
            } else if (data.contacts && Array.isArray(data.contacts)) {
                this.contacts = data.contacts;
            } else {
                throw new Error('Unexpected data format from API');
            }

            this.showStatus(`Successfully fetched ${this.contacts.length} contacts`, 'success');
            this.displayDataPreview();
            
        } catch (error) {
            console.error('Error fetching data:', error);
            this.showStatus(`Error fetching data: ${error.message}`, 'error');
        }
    }

    async loadDemoData() {
        this.showStatus('Loading demo data...', 'loading');
        
        try {
            const response = await fetch('./demo-data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.contacts = await response.json();
            this.showStatus(`Successfully loaded ${this.contacts.length} demo contacts`, 'success');
            this.displayDataPreview();
            
        } catch (error) {
            console.error('Error loading demo data:', error);
            this.showStatus(`Error loading demo data: ${error.message}`, 'error');
        }
    }

    displayDataPreview() {
        const preview = document.getElementById('dataPreview');
        const contactList = document.getElementById('contactList');
        const contactSelect = document.getElementById('contactSelect');
        
        preview.classList.remove('hidden');
        
        // Populate contact list for preview
        contactList.innerHTML = this.contacts.slice(0, 5).map(contact => {
            const fullName = this.getField(contact, 'Full Name', 'fullName', 'name');
            const title = this.getField(contact, 'Person Title', 'title', 'position');
            const company = this.getField(contact, 'Company Name', 'company', 'companyName');
            
            const initials = fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
            
            return `
                <div class="contact-item">
                    <div class="contact-avatar">${initials}</div>
                    <div class="contact-info">
                        <h4>${fullName || 'Unknown'}</h4>
                        <p>${title || 'No title'}${company ? ` at ${company}` : ''}</p>
                    </div>
                </div>
            `;
        }).join('');
        
        if (this.contacts.length > 5) {
            contactList.innerHTML += `<div class="contact-item"><p>... and ${this.contacts.length - 5} more contacts</p></div>`;
        }
        
        // Populate contact select dropdown
        contactSelect.innerHTML = '<option value="">Choose a contact...</option>' + 
            this.contacts.map((contact, index) => {
                const fullName = this.getField(contact, 'Full Name', 'fullName', 'name');
                const title = this.getField(contact, 'Person Title', 'title', 'position');
                return `<option value="${index}">${fullName || 'Unknown'} - ${title || 'No title'}</option>`;
            }).join('');
    }

    async generateAllPDFs() {
        if (this.contacts.length === 0) {
            this.showGenerationStatus('No contacts to process', 'error');
            return;
        }

        // Check if libraries are loaded
        if (!window.jspdf || !window.html2canvas) {
            this.showGenerationStatus('PDF libraries not loaded. Please refresh the page.', 'error');
            return;
        }

        this.showGenerationStatus('Starting PDF generation...', 'loading');
        
        let processedCount = 0;
        const totalCount = this.contacts.length;
        
        try {
            for (let i = 0; i < this.contacts.length; i++) {
                const contact = this.contacts[i];
                const fullName = this.getField(contact, 'Full Name', 'fullName', 'name');
                
                if (!fullName) {
                    this.showGenerationStatus(`Skipping contact ${i + 1} - No name provided`, 'error');
                    continue;
                }
                
                try {
                    this.showGenerationStatus(`Generating PDF for ${fullName} (${i + 1}/${totalCount})...`, 'loading');
                    await this.generatePDF(contact);
                    processedCount++;
                    
                    const progress = (processedCount / totalCount) * 100;
                    this.updateProgress(progress);
                    this.showGenerationStatus(`Generated PDF for ${fullName} (${processedCount}/${totalCount})`, 'success');
                    
                } catch (error) {
                    console.error(`Error generating PDF for ${fullName}:`, error);
                    this.showGenerationStatus(`Error generating PDF for ${fullName}: ${error.message}`, 'error');
                }
            }
            
            this.showGenerationStatus(`PDF generation complete! Generated ${processedCount} PDFs`, 'success');
        } catch (error) {
            console.error('Batch generation error:', error);
            this.showGenerationStatus(`Batch generation failed: ${error.message}`, 'error');
        }
    }

    async generatePDF(contact) {
        try {
            const { jsPDF } = window.jspdf;
            if (!jsPDF) {
                throw new Error('jsPDF library not loaded');
            }

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Generate HTML content for the contact
            const htmlContent = this.generateHTML(contact);
            
            // Create a temporary div to render the HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.top = '0';
            tempDiv.style.width = '210mm'; // A4 width
            tempDiv.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif';
            document.body.appendChild(tempDiv);

            // Wait for images and fonts to load
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Convert HTML to canvas using html2canvas
            let canvas;
            try {
                canvas = await html2canvas(tempDiv, {
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    width: 794,
                    height: tempDiv.scrollHeight
                });
            } catch (error) {
                console.error('html2canvas error:', error);
                throw new Error('Failed to convert HTML to canvas: ' + error.message);
            }

            // Add canvas to PDF
            const imgData = canvas.toDataURL('image/png', 0.95);
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;

            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Generate filename and download
            const fullName = this.getField(contact, 'Full Name', 'fullName', 'name');
            const filename = `${fullName.replace(/\s+/g, '_')}_Profile.pdf`;
            
            pdf.save(filename);
            
            // Clean up
            if (document.body.contains(tempDiv)) {
                document.body.removeChild(tempDiv);
            }
            
        } catch (error) {
            console.error('PDF generation error:', error);
            throw new Error(`PDF generation failed: ${error.message}`);
        }
    }

    generateHTML(contact) {
        // Extract data using the new CSV schema mapping (matching Node.js version)
        const fullName = this.getField(contact, 'Full Name', 'fullName', 'name');
        const nameParts = fullName ? fullName.split(' ') : ['', ''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const data = {
            // Personal Information - New CSV Schema Mapping
            fullName: this.getField(contact, 'Full Name', 'fullName', 'name'),
            contactPhotoUrl: this.getField(contact, 'Contact Photo URL', 'contactPhotoUrl', 'photoUrl'),
            title: this.getField(contact, 'Person Title', 'title', 'position'),
            personState: this.getField(contact, 'Person State', 'personState'),
            personCountry: this.getField(contact, 'Person Country', 'personCountry'),
            summary: this.getField(contact, 'Summary About The Person', 'summary', 'linkedinAbout'),
            headline: this.getField(contact, 'Person Headline', 'headline', 'linkedinHeadline'),
            education: this.getField(contact, 'Education', 'education'),
            currentExperience: this.getField(contact, 'Current Experience', 'currentExperience'),
            experience2: this.getField(contact, 'Experience 2', 'experience2'),
            experience3: this.getField(contact, 'Experience 3', 'experience3'),
            experience4: this.getField(contact, 'Experience 4', 'experience4'),
            lastPostPerson1: this.getField(contact, 'Last Post For Person', 'lastPostPerson1'),
            lastPostPerson2: this.getField(contact, 'Last Post For Person 2', 'lastPostPerson2'),
            lastPostPerson3: this.getField(contact, 'Last Post For Person 3', 'lastPostPerson3'),
            personContactEmail: this.getField(contact, 'Person Contact Email', 'email', 'contactEmail'),
            contactPhone: this.getField(contact, 'Contact Phone', 'mobile', 'contactPhone'),
            contactSecondPhone: this.getField(contact, 'Contact Second Phone', 'secondPhone', 'contactSecondPhone'),
            contactLinkedIn: this.getField(contact, 'Contact LinkedIn', 'linkedinUrl', 'contactLinkedIn'),
            
            // Company Information - New CSV Schema Mapping
            companyName: this.getField(contact, 'Company Name', 'company', 'companyName'),
            companyLogoUrl: this.getField(contact, 'Company Logo URL', 'companyLogoUrl'),
            companyWebsite: this.getField(contact, 'Company Website', 'companyWebsite'),
            companyTagline: this.getField(contact, 'Company Tagline', 'companyTagline', 'companyHeadline'),
            companyAbout: this.getField(contact, 'Company About', 'companyAbout'),
            companyIndustry: this.getField(contact, 'Company Industry', 'industry', 'companyIndustry'),
            companyWebsiteBrief: this.getField(contact, 'Company information Brief', 'companyWebsiteBrief', 'websiteBrief'),
            companyPartners: this.getField(contact, 'Company Partners', 'companyPartners', 'partners'),
            companyLastEvents: this.getField(contact, 'Company Last Events', 'companyLastEvents', 'lastEvents'),
            companyLastPost1: this.getField(contact, 'Company Last Post', 'companyLastPost1', 'lastPostCompany'),
            companyLastPost2: this.getField(contact, 'Company Last Post 2', 'companyLastPost2'),
            companyLastPost3: this.getField(contact, 'Company Last Post 3', 'companyLastPost3'),
            contactCorporatePhone: this.getField(contact, 'Contact Corporate Phone', 'corporatePhone', 'contactCorporatePhone'),
            companyAddress: this.getField(contact, 'Company Address', 'address', 'companyAddress'),
            companyCity: this.getField(contact, 'Company City', 'city', 'companyCity'),
            companyState: this.getField(contact, 'Company State', 'state', 'companyState'),
            companyCountry: this.getField(contact, 'Company Country', 'country', 'companyCountry'),
            
            // Helper fields
            firstName: firstName,
            lastName: lastName
        };
        
        const initials = `${data.firstName.charAt(0)}${data.lastName.charAt(0)}`.toUpperCase();
        
        // Determine total pages based on content
        let totalPages = 1; // Start with personal profile
        
        // Check if company info exists to add company pages
        const hasCompanyInfo = data.companyName || data.companyWebsite || data.companyTagline || data.companyWebsiteBrief || 
                             data.companyAbout || data.companyIndustry || data.companyAddress || 
                             data.companyCity || data.companyLastPost1 || data.companyPartners || data.companyLastEvents;
        
        if (hasCompanyInfo) {
            totalPages += 1; // At least one company page
        }
        
        // Return the complete HTML template with company pages
        return this.getHTMLTemplate(data, initials, totalPages);
    }

    getHTMLTemplate(data, initials, totalPages) {
        // Determine if company info exists
        const hasCompanyInfo = data.companyName || data.companyWebsite || data.companyTagline || data.companyWebsiteBrief || 
                             data.companyAbout || data.companyIndustry || data.companyAddress || 
                             data.companyCity || data.companyLastPost1 || data.companyPartners || data.companyLastEvents;
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.fullName} - Professional Profile</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background: #ffffff;
      color: #1a202c;
      line-height: 1.6;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      background: white;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      position: relative;
    }
    
    .page:last-child {
      page-break-after: avoid;
    }
    
    @media print {
      .page {
        page-break-after: always;
        page-break-inside: avoid;
      }
      .page:last-child {
        page-break-after: avoid;
      }
    }
    
    /* ID Card Page */
    .id-card-page {
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      position: relative;
      overflow: hidden;
    }
    
    .id-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 32px;
      padding: 60px;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.2);
      max-width: 600px;
      width: 100%;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .id-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    }
    
    .id-photo {
      width: 200px;
      height: 200px;
      border-radius: 50%;
      object-fit: cover;
      margin: 0 auto 40px auto;
      border: 8px solid #ffffff;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      display: block;
    }
    
    .id-name {
      font-size: 48px;
      font-weight: 900;
      color: #1a202c;
      margin-bottom: 20px;
      letter-spacing: -1px;
    }
    
    .id-current-role {
      font-size: 24px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 30px;
    }
    
    .id-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 40px;
    }
    
    .id-info-item {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 24px;
      border-radius: 16px;
      border-left: 6px solid #667eea;
    }
    
    .id-info-label {
      font-size: 14px;
      font-weight: 700;
      color: #667eea;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    
    .id-info-value {
      font-size: 18px;
      font-weight: 600;
      color: #1a202c;
      line-height: 1.5;
    }
    
    /* Company Card */
    .company-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 24px;
      padding: 24px;
      box-shadow: 0 12px 40px rgba(102, 126, 234, 0.15);
      border: 1px solid rgba(102, 126, 234, 0.2);
      position: relative;
      overflow: hidden;
      margin-bottom: 16px;
    }
    
    .company-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    }
    
    .company-header {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 16px;
    }
    
    .company-logo {
      width: 80px;
      height: 80px;
      border-radius: 16px;
      object-fit: contain;
      background: #ffffff;
      padding: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      flex-shrink: 0;
    }
    
    .company-logo-placeholder {
      width: 80px;
      height: 80px;
      border-radius: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 900;
      color: white;
      flex-shrink: 0;
    }
    
    .company-name-large {
      font-size: 32px;
      font-weight: 900;
      color: #1a202c;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    
    .company-tagline-large {
      font-size: 16px;
      color: #64748b;
      font-weight: 600;
      line-height: 1.5;
    }
    
    /* Content Area */
    .content-area {
      padding: 32px;
      overflow: visible;
    }
    
    .section {
      margin-bottom: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
      background: #ffffff;
      border-radius: 12px;
      padding: 24px;
      border: 1px solid #e2e8f0;
      position: relative;
      overflow: visible;
    }
    
    @media print {
      .section {
        page-break-inside: avoid;
        break-inside: avoid;
        orphans: 3;
        widows: 3;
      }
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      position: relative;
    }
    
    .section-icon {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 6px 18px rgba(102, 126, 234, 0.35);
      flex-shrink: 0;
    }
    
    .section-title {
      font-size: 22px;
      font-weight: 800;
      color: #1e293b;
      letter-spacing: -0.5px;
      position: relative;
      padding-bottom: 4px;
    }
    
    .section-title::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 40px;
      height: 3px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      border-radius: 2px;
    }
    
    .field-group {
      margin-bottom: 12px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      position: relative;
      overflow: visible;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    @media print {
      .field-group {
        page-break-inside: avoid;
        break-inside: avoid;
        orphans: 2;
        widows: 2;
      }
    }
    
    .field-label {
      font-size: 12px;
      font-weight: 700;
      color: #667eea;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .field-value {
      font-size: 15px;
      color: #1e293b;
      font-weight: 600;
      line-height: 1.6;
      word-break: break-word;
    }
    
    .field-value.long-text {
      font-size: 14px;
      line-height: 1.7;
      color: #475569;
    }
    
    .experience-grid {
      display: grid;
      gap: 12px;
    }
    
    .experience-item {
      background: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      border-left: 4px solid #667eea;
      position: relative;
      overflow: visible;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .experience-item.current {
      border-left-color: #10b981;
      background: #f0fdf4;
    }
    
    @media print {
      .experience-item {
        page-break-inside: avoid;
        break-inside: avoid;
        orphans: 2;
        widows: 2;
      }
    }
    
    .experience-title {
      font-size: 14px;
      font-weight: 700;
      color: #667eea;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .experience-item.current .experience-title {
      color: #10b981;
    }
    
    .current-badge {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-left: 8px;
    }
    
    .posts-grid {
      display: grid;
      gap: 12px;
      margin-top: 12px;
    }
    
    .post-item {
      background: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      border-left: 4px solid #667eea;
      position: relative;
      overflow: visible;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    @media print {
      .post-item {
        page-break-inside: avoid;
        break-inside: avoid;
        orphans: 2;
        widows: 2;
      }
    }
    
    .post-item::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 100px;
      height: 100px;
      background: radial-gradient(circle, rgba(102, 126, 234, 0.05) 0%, transparent 70%);
      border-radius: 50%;
    }
    
    .post-content {
      font-size: 14px;
      color: #475569;
      line-height: 1.7;
      position: relative;
      z-index: 1;
      font-style: italic;
    }
    
    .bullet-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .bullet-list li {
      position: relative;
      padding-left: 20px;
      margin-bottom: 8px;
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
    }
    
    .bullet-list li::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
      font-size: 16px;
    }
    
    .page-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 12px 32px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      text-align: center;
      color: white;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.4px;
    }
  </style>
</head>
<body>
  <!-- ID Card Page -->
  <div class="page id-card-page">
    <div class="id-card">
      ${data.contactPhotoUrl ? 
        `<img src="${data.contactPhotoUrl}" alt="${data.fullName}" class="id-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` :
        ''
      }
      ${!data.contactPhotoUrl ? 
        `<div class="id-photo" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 48px; font-weight: 900; color: white;">${initials}</div>` :
        ''
      }
      
      <h1 class="id-name">${data.fullName}</h1>
      
      ${data.title ? `<div class="id-current-role">${data.title}</div>` : ''}
      
      <div class="id-info-grid">
        ${(data.personState && data.personState !== 'N/A' && data.personState.trim() !== '') || (data.personCountry && data.personCountry !== 'N/A' && data.personCountry.trim() !== '') ? `
        <div class="id-info-item">
          <div class="id-info-label">Location</div>
          <div class="id-info-value">${[data.personState, data.personCountry].filter(Boolean).join(', ')}</div>
        </div>
        ` : ''}
        
        ${data.education && data.education !== 'N/A' && data.education.trim() !== '' ? `
        <div class="id-info-item">
          <div class="id-info-label">Education</div>
          <div class="id-info-value">${data.education}</div>
        </div>
        ` : ''}
        
        ${data.title && data.title !== 'N/A' && data.title.trim() !== '' ? `
        <div class="id-info-item">
          <div class="id-info-label">Title</div>
          <div class="id-info-value">${data.title}</div>
        </div>
        ` : ''}
      </div>
    </div>
  </div>
  
  <!-- DETAILED PROFILE PAGES -->
  <div class="page">
    <div class="content-area">
      
      <!-- Personal Information Section -->
      ${(data.summary && data.summary !== 'N/A' && data.summary.trim() !== '') || (data.headline && data.headline !== 'N/A' && data.headline.trim() !== '') || (data.education && data.education !== 'N/A' && data.education.trim() !== '') ? `
      <div class="section">
        <div class="section-header">
          <div class="section-icon">👤</div>
          <h2 class="section-title">Personal Information</h2>
        </div>
        
        ${data.summary && data.summary !== 'N/A' && data.summary.trim() !== '' ? `
        <div class="field-group">
          <div class="field-label">📝 Summary</div>
          <div class="field-value long-text">${data.summary}</div>
        </div>
        ` : ''}
        
        ${data.headline && data.headline !== 'N/A' && data.headline.trim() !== '' ? `
        <div class="field-group">
          <div class="field-label">💡 Headline</div>
          <div class="field-value">${data.headline}</div>
        </div>
        ` : ''}
        
        ${data.education && data.education !== 'N/A' && data.education.trim() !== '' ? `
        <div class="field-group">
          <div class="field-label">🎓 Education</div>
          <div class="field-value">${data.education}</div>
        </div>
        ` : ''}
      </div>
      ` : ''}
      
      <!-- Experiences Section -->
      ${(data.currentExperience && data.currentExperience !== 'N/A' && data.currentExperience.trim() !== '') || (data.experience2 && data.experience2 !== 'N/A' && data.experience2.trim() !== '') || (data.experience3 && data.experience3 !== 'N/A' && data.experience3.trim() !== '') || (data.experience4 && data.experience4 !== 'N/A' && data.experience4.trim() !== '') ? `
      <div class="section">
        <div class="section-header">
          <div class="section-icon">💼</div>
          <h2 class="section-title">Professional Experience</h2>
        </div>
        <div class="experience-grid">
          ${data.currentExperience && data.currentExperience !== 'N/A' && data.currentExperience.trim() !== '' ? `
          <div class="experience-item current">
            <div class="experience-title">Current Experience</div>
            <div class="field-value">${data.currentExperience}</div>
          </div>
          ` : ''}
          ${data.experience2 && data.experience2 !== 'N/A' && data.experience2.trim() !== '' ? `
          <div class="experience-item">
            <div class="experience-title">Experience 2</div>
            <div class="field-value">${data.experience2}</div>
          </div>
          ` : ''}
          ${data.experience3 && data.experience3 !== 'N/A' && data.experience3.trim() !== '' ? `
          <div class="experience-item">
            <div class="experience-title">Experience 3</div>
            <div class="field-value">${data.experience3}</div>
          </div>
          ` : ''}
          ${data.experience4 && data.experience4 !== 'N/A' && data.experience4.trim() !== '' ? `
          <div class="experience-item">
            <div class="experience-title">Experience 4</div>
            <div class="field-value">${data.experience4}</div>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}
      
      <!-- Last Posts Section -->
      ${(data.lastPostPerson1 && data.lastPostPerson1 !== 'N/A' && data.lastPostPerson1.trim() !== '') || (data.lastPostPerson2 && data.lastPostPerson2 !== 'N/A' && data.lastPostPerson2.trim() !== '') || (data.lastPostPerson3 && data.lastPostPerson3 !== 'N/A' && data.lastPostPerson3.trim() !== '') ? `
      <div class="section">
        <div class="section-header">
          <div class="section-icon">📝</div>
          <h2 class="section-title">Last Posts (Person)</h2>
        </div>
        <div class="posts-grid">
          ${data.lastPostPerson1 && data.lastPostPerson1 !== 'N/A' && data.lastPostPerson1.trim() !== '' ? `
          <div class="post-item">
            <div class="field-label">📝 Post 1</div>
            <div class="field-value">${data.lastPostPerson1}</div>
          </div>
          ` : ''}
          ${data.lastPostPerson2 && data.lastPostPerson2 !== 'N/A' && data.lastPostPerson2.trim() !== '' ? `
          <div class="post-item">
            <div class="field-label">📝 Post 2</div>
            <div class="field-value">${data.lastPostPerson2}</div>
          </div>
          ` : ''}
          ${data.lastPostPerson3 && data.lastPostPerson3 !== 'N/A' && data.lastPostPerson3.trim() !== '' ? `
          <div class="post-item">
            <div class="field-label">📝 Post 3</div>
            <div class="field-value">${data.lastPostPerson3}</div>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}
      
      <!-- Contact Information Section -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon">📧</div>
          <h2 class="section-title">Contact Information</h2>
        </div>
        
        ${data.personContactEmail && data.personContactEmail !== 'N/A' && data.personContactEmail.trim() !== '' ? `
        <div class="field-group">
          <div class="field-label">📧 Person Contact Email</div>
          <div class="field-value">${data.personContactEmail}</div>
        </div>
        ` : ''}
        
        ${data.contactPhone && data.contactPhone !== 'N/A' && data.contactPhone.trim() !== '' ? `
        <div class="field-group">
          <div class="field-label">📱 Contact Phone</div>
          <div class="field-value">${data.contactPhone}</div>
        </div>
        ` : ''}
        
        ${data.contactSecondPhone && data.contactSecondPhone !== 'N/A' && data.contactSecondPhone.trim() !== '' ? `
        <div class="field-group">
          <div class="field-label">☎️ Contact Second Phone</div>
          <div class="field-value">${data.contactSecondPhone}</div>
        </div>
        ` : ''}
        
        ${data.contactLinkedIn && data.contactLinkedIn !== 'N/A' && data.contactLinkedIn.trim() !== '' ? `
        <div class="field-group">
          <div class="field-label">🔗 Contact LinkedIn</div>
          <div class="field-value">${data.contactLinkedIn}</div>
        </div>
        ` : ''}
        
      </div>
      
    </div>
  </div>
  
  <!-- COMPANY INFORMATION SECTION -->
  ${hasCompanyInfo ? `
  <div class="page">
    <div class="content-area">
      <!-- Company Card -->
      ${(data.companyName && data.companyName !== 'N/A' && data.companyName.trim() !== '') || (data.companyLogoUrl && data.companyLogoUrl !== 'N/A' && data.companyLogoUrl.trim() !== '') ? `
      <div class="company-card">
        <div class="company-header">
          ${data.companyLogoUrl && data.companyLogoUrl !== 'N/A' && data.companyLogoUrl.trim() !== '' ? `
            <img src="${data.companyLogoUrl}" alt="${data.companyName}" class="company-logo" />
          ` : ''}
          <div class="company-info">
            ${data.companyName ? `<div class="company-name-large">${data.companyName}</div>` : ''}
            ${data.companyTagline ? `<div class="company-tagline-large">${data.companyTagline}</div>` : ''}
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Company Information Section -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon">🏢</div>
          <h2 class="section-title">Company Information</h2>
        </div>
        
        ${data.companyWebsite && data.companyWebsite !== 'N/A' && data.companyWebsite.trim() !== '' ? `
        <div class="field-group">
          <div class="field-label">🌐 Company Website</div>
          <div class="field-value">${data.companyWebsite}</div>
        </div>
        ` : ''}
        
        ${data.companyTagline && data.companyTagline !== 'N/A' && data.companyTagline.trim() !== '' ? `
        <div class="field-group">
          <div class="field-label">💬 Company Tagline</div>
          <div class="field-value">${data.companyTagline}</div>
        </div>
        ` : ''}
        
        ${data.companyAbout && data.companyAbout !== 'N/A' && data.companyAbout.trim() !== '' ? `
        <div class="field-group">
          <div class="field-label">📋 Company About</div>
          <div class="field-value long-text">${data.companyAbout}</div>
        </div>
        ` : ''}
        
        ${data.companyWebsiteBrief && data.companyWebsiteBrief !== 'N/A' && data.companyWebsiteBrief.trim() !== '' ? `
        <div class="field-group">
          <div class="field-label">📄 Company Information Brief</div>
          <div class="field-value long-text">${data.companyWebsiteBrief}</div>
        </div>
        ` : ''}
        
        ${data.contactCorporatePhone && data.contactCorporatePhone !== 'N/A' && data.contactCorporatePhone.trim() !== '' ? `
        <div class="field-group">
          <div class="field-label">📞 Contact Corporate Phone</div>
          <div class="field-value">${data.contactCorporatePhone}</div>
        </div>
        ` : ''}
        
        ${data.companyIndustry && data.companyIndustry !== 'N/A' && data.companyIndustry.trim() !== '' ? `
        <div class="field-group">
          <div class="field-label">🏭 Company Industry</div>
          <div class="field-value">${data.companyIndustry}</div>
        </div>
        ` : ''}
        
      </div>
      
      <!-- Partners Section -->
      ${data.companyPartners && data.companyPartners !== 'N/A' && data.companyPartners.trim() !== '' ? `
      <div class="section">
        <div class="section-header">
          <div class="section-icon">🤝</div>
          <h2 class="section-title">Partners</h2>
        </div>
        <div class="field-group">
          <div class="field-label">🤝 Company Partners</div>
          <ul class="bullet-list">
            ${data.companyPartners.split(';').map(partner => `<li>${partner.trim()}</li>`).join('')}
          </ul>
        </div>
      </div>
      ` : ''}
      
      <!-- Last Events Section -->
      ${data.companyLastEvents && data.companyLastEvents !== 'N/A' && data.companyLastEvents.trim() !== '' ? `
      <div class="section">
        <div class="section-header">
          <div class="section-icon">📅</div>
          <h2 class="section-title">Last Events</h2>
        </div>
        <div class="field-group">
          <div class="field-label">📅 Company Last Events</div>
          <div class="field-value long-text">${data.companyLastEvents}</div>
        </div>
      </div>
      ` : ''}
      
      <!-- Company Location Section -->
      ${data.companyAddress && data.companyAddress !== 'N/A' && data.companyAddress.trim() !== '' ? `
      <div class="section">
        <div class="section-header">
          <div class="section-icon">📍</div>
          <h2 class="section-title">Company Location</h2>
        </div>
        
        <div class="field-group">
          <div class="field-label">🏠 Company Address</div>
          <div class="field-value">${data.companyAddress}</div>
        </div>
      </div>
      ` : ''}
      
      <!-- Company Last Posts Section -->
      ${(data.companyLastPost1 && data.companyLastPost1 !== 'N/A' && data.companyLastPost1.trim() !== '') || (data.companyLastPost2 && data.companyLastPost2 !== 'N/A' && data.companyLastPost2.trim() !== '') || (data.companyLastPost3 && data.companyLastPost3 !== 'N/A' && data.companyLastPost3.trim() !== '') ? `
      <div class="section">
        <div class="section-header">
          <div class="section-icon">💬</div>
          <h2 class="section-title">Company Last Posts</h2>
        </div>
        <div class="posts-grid">
          ${data.companyLastPost1 && data.companyLastPost1 !== 'N/A' && data.companyLastPost1.trim() !== '' ? `
          <div class="post-item">
            <div class="field-label">💬 Company Post 1</div>
            <div class="field-value long-text">${data.companyLastPost1}</div>
          </div>
          ` : ''}
          ${data.companyLastPost2 && data.companyLastPost2 !== 'N/A' && data.companyLastPost2.trim() !== '' ? `
          <div class="post-item">
            <div class="field-label">💬 Company Post 2</div>
            <div class="field-value long-text">${data.companyLastPost2}</div>
          </div>
          ` : ''}
          ${data.companyLastPost3 && data.companyLastPost3 !== 'N/A' && data.companyLastPost3.trim() !== '' ? `
          <div class="post-item">
            <div class="field-label">💬 Company Post 3</div>
            <div class="field-value long-text">${data.companyLastPost3}</div>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}
      
    </div>
    
    <div class="page-footer">
      ${data.fullName} • Company Profile • Page ${totalPages} of ${totalPages}
    </div>
  </div>
  ` : ''}
</body>
</html>
        `;
    }

    getField(contact, ...keys) {
        for (const key of keys) {
            if (contact[key]) return contact[key];
        }
        return '';
    }

    showStatus(message, type) {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status ${type}`;
        status.classList.remove('hidden');
    }

    showGenerationStatus(message, type) {
        const status = document.getElementById('generationStatus');
        status.textContent = message;
        status.className = `status ${type}`;
        status.classList.remove('hidden');
    }

    updateProgress(percentage) {
        const progressFill = document.getElementById('progressFill');
        progressFill.style.width = `${percentage}%`;
    }

    showSpecificContactSection() {
        const section = document.getElementById('specificContactSection');
        section.classList.remove('hidden');
        section.scrollIntoView({ behavior: 'smooth' });
    }

    async generateSelectedPDF() {
        const contactSelect = document.getElementById('contactSelect');
        const selectedIndex = contactSelect.value;
        
        if (!selectedIndex || selectedIndex === '') {
            this.showGenerationStatus('Please select a contact first', 'error');
            return;
        }
        
        const contact = this.contacts[parseInt(selectedIndex)];
        const fullName = this.getField(contact, 'Full Name', 'fullName', 'name');
        
        if (!fullName) {
            this.showGenerationStatus('Selected contact has no name', 'error');
            return;
        }
        
        // Check if libraries are loaded
        if (!window.jspdf || !window.html2canvas) {
            this.showGenerationStatus('PDF libraries not loaded. Please refresh the page.', 'error');
            return;
        }
        
        this.showGenerationStatus(`Generating PDF for ${fullName}...`, 'loading');
        
        try {
            await this.generatePDF(contact);
            this.showGenerationStatus(`Successfully generated PDF for ${fullName}`, 'success');
        } catch (error) {
            console.error(`Error generating PDF for ${fullName}:`, error);
            this.showGenerationStatus(`Error generating PDF for ${fullName}: ${error.message}`, 'error');
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PDFGenerator();
});
