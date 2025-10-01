const fs = require('fs');
const Papa = require('papaparse');
const puppeteer = require('puppeteer');
const path = require('path');



// Configuration
const CONFIG = {
  outputDir: './generated_pdfs',
  csvFile: 'test.csv',
  pdfOptions: {
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
  }
};



// Helper function to safely get field value
const getField = (user, ...keys) => {
  for (const key of keys) {
    if (user[key]) return user[key];
  }
  return '';
};



// Read and parse CSV
const loadContacts = () => {
  console.log('📖 Reading CSV file...');
  const csvData = fs.readFileSync(CONFIG.csvFile, 'utf8');
  const { data: contacts } = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true
  });
  console.log(`👥 Found ${contacts.length} contacts\n`);
  return contacts;
};



// Create output directory
const setupOutputDir = () => {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir);
  }
};



// Generate professional HTML template with dynamic pages
const generateHTML = (user) => {
  const data = {
    firstName: getField(user, 'First Name', 'first_name'),
    lastName: getField(user, 'Last Name', 'last_name'),
    title: getField(user, 'Title', 'title'),
    currentExperience: getField(user, 'current experience', 'Current Experience'),
    experience2: getField(user, 'experience 2'),
    experience3: getField(user, 'experience 3'),
    experience4: getField(user, 'experience 4'),
    company: getField(user, 'current experience', 'Current Experience')?.split(' - ')[0] || '',
    email: getField(user, 'person email', 'Email', 'email'),
    photoUrl: getField(user, 'person photo url', 'Person Photo URL', 'photo'),
    linkedinHeadline: getField(user, 'person linkedin headline', 'Person LinkedIn Headline'),
    linkedinAbout: getField(user, 'person linkedin about', 'Person LinkedIn About'),
    education: getField(user, 'His education'),
    linkedinUrl: getField(user, 'Person Linkedin Url'),
    companyHeadline: getField(user, 'company headline', 'Company Headline'),
    websiteBrief: getField(user, 'website brief', 'Website Brief'),
    companyAbout: getField(user, 'company about', 'Company About'),
    companyLogoUrl: getField(user, 'company logo url'),
    mobile: getField(user, 'Mobile Phone'),
    secondPhone: getField(user, 'Second Phone'),
    corporatePhone: getField(user, 'Corporate Phone'),
    industry: getField(user, 'Industry'),
    address: getField(user, 'Company Address'),
    city: getField(user, 'Company City'),
    state: getField(user, 'Company State', 'State', 'person State'),
    country: getField(user, 'Company Country', 'Country', 'person Country'),
    personState: getField(user, 'person State'),
    personCountry: getField(user, 'person Country'),
    lastPostCompany: getField(user, 'last post for company', 'Last Post for Company'),
    lastPostPerson: getField(user, 'last post for person', 'Last Post for Person')
  };
  
  const initials = `${data.firstName.charAt(0)}${data.lastName.charAt(0)}`.toUpperCase();
  
  // Determine total pages based on content
  let totalPages = 1; // Start with personal profile
  
  // Check if company info exists to add company pages
  const hasCompanyInfo = data.company || data.companyHeadline || data.websiteBrief || 
                         data.companyAbout || data.industry || data.address || 
                         data.city || data.lastPostCompany;
  
  if (hasCompanyInfo) {
    totalPages += 1; // At least one company page
  }
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.firstName} ${data.lastName} - Professional Profile</title>
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
    
    /* Page 1: Personal Profile */
    .page-1 {
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    }
    
    /* Modern Split Hero Section */
    .hero {
      background: white;
      padding: 0;
      position: relative;
      overflow: hidden;
      min-height: 200px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    /* Gradient Background Bar */
    .hero::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 140px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      z-index: 0;
    }
    
    /* Decorative Pattern Overlay */
    .hero::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 140px;
      background-image: 
        radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%);
      z-index: 1;
    }
    
    .hero-content {
      position: relative;
      z-index: 2;
      padding: 40px 45px 30px;
      display: flex;
      align-items: center;
      gap: 28px;
    }
    
    /* Profile Avatar with Shadow - Aligned */
    .profile-avatar {
      flex-shrink: 0;
      width: 140px;
      height: 140px;
      border-radius: 20px;
      background: white;
      border: 5px solid white;
      box-shadow: 
        0 20px 50px rgba(0,0,0,0.2),
        0 0 0 1px rgba(0,0,0,0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      font-weight: 800;
      color: #667eea;
      overflow: hidden;
      position: relative;
    }
    
    .profile-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    /* Info Card - Aligned with Avatar */
    .hero-info {
      flex: 1;
      background: white;
      padding: 24px 28px;
      border-radius: 16px;
      box-shadow: 
        0 10px 40px rgba(0,0,0,0.08),
        0 0 0 1px rgba(0,0,0,0.03);
      position: relative;
      min-height: 140px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .hero-info::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px 0 0 16px;
    }
    
    .hero-name {
      font-size: 34px;
      font-weight: 900;
      margin-bottom: 6px;
      letter-spacing: -0.8px;
      color: #1e293b;
      line-height: 1.1;
    }
    
    .hero-title {
      font-size: 17px;
      font-weight: 600;
      margin-bottom: 4px;
      color: #475569;
      letter-spacing: -0.2px;
    }
    
    .hero-meta {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-top: 12px;
      flex-wrap: wrap;
    }
    
    .hero-meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #64748b;
      font-weight: 500;
    }
    
    .hero-meta-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }
    
    .hero-divider {
      width: 1px;
      height: 20px;
      background: #e2e8f0;
    }
    
    /* Content Area */
    .content {
      padding: 32px 45px 60px;
      flex: 1;
      position: relative;
    }
    
    .section {
      margin-bottom: 28px;
      page-break-inside: avoid;
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
      box-shadow: 
        0 6px 18px rgba(102, 126, 234, 0.35),
        0 0 0 1px rgba(255,255,255,0.1) inset;
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
    
    /* Professional Summary */
    .summary-box {
      background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
      border-left: 4px solid #8b5cf6;
      padding: 18px 22px;
      border-radius: 12px;
      margin-bottom: 12px;
      box-shadow: 
        0 4px 14px rgba(139, 92, 246, 0.12),
        0 0 0 1px rgba(139, 92, 246, 0.08);
      position: relative;
      overflow: hidden;
    }
    
    .summary-box::before {
      content: '"';
      position: absolute;
      top: -20px;
      left: 10px;
      font-size: 80px;
      color: rgba(139, 92, 246, 0.06);
      font-weight: 900;
      line-height: 1;
    }
    
    .summary-text {
      font-size: 14.5px;
      line-height: 1.7;
      color: #4a5568;
      font-style: italic;
      position: relative;
      z-index: 1;
    }
    
    /* Experience Timeline */
    .experience-timeline {
      display: grid;
      gap: 14px;
    }
    
    .experience-item {
      background: white;
      border: 2px solid #e0e7ff;
      border-radius: 12px;
      padding: 16px 20px;
      position: relative;
      box-shadow: 0 2px 10px rgba(99, 102, 241, 0.06);
      transition: all 0.3s;
    }
    
    .experience-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px 0 0 12px;
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    .experience-text {
      font-size: 14.5px;
      color: #1e293b;
      font-weight: 600;
      line-height: 1.5;
    }
    
    .current-job-badge {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-left: 10px;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
    }
    
    /* Contact Grid with Cards */
    .contact-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }
    
    .contact-card {
      background: white;
      border: 2px solid #e0e7ff;
      border-radius: 12px;
      padding: 16px 18px;
      transition: all 0.3s;
      box-shadow: 0 2px 10px rgba(99, 102, 241, 0.06);
      position: relative;
      overflow: hidden;
    }
    
    .contact-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    .contact-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #667eea;
      font-weight: 800;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .contact-value {
      font-size: 14px;
      color: #1e293b;
      font-weight: 600;
      word-break: break-word;
      line-height: 1.4;
    }
    
    /* Recent Activity */
    .posts-grid {
      display: grid;
      gap: 12px;
    }
    
    .post-card {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-left: 4px solid #10b981;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 
        0 4px 14px rgba(16, 185, 129, 0.12),
        0 0 0 1px rgba(16, 185, 129, 0.08);
      position: relative;
    }
    
    .post-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #059669;
      font-weight: 800;
      margin-bottom: 8px;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .post-text {
      font-size: 14px;
      color: #065f46;
      line-height: 1.7;
      font-style: italic;
    }
    
    /* Education Card */
    .education-card {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-left: 4px solid #f59e0b;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 
        0 4px 14px rgba(245, 158, 11, 0.15),
        0 0 0 1px rgba(245, 158, 11, 0.08);
      position: relative;
      overflow: hidden;
    }
    
    .education-card::before {
      content: '🎓';
      position: absolute;
      bottom: -10px;
      right: -5px;
      font-size: 70px;
      opacity: 0.08;
    }
    
    .education-text {
      font-size: 14.5px;
      color: #78350f;
      font-weight: 600;
      line-height: 1.6;
      position: relative;
      z-index: 1;
    }
    
    /* Company Pages */
    .page-company {
      background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
    }
    
    .company-hero {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
      padding: 45px 45px;
      position: relative;
      overflow: hidden;
      border-bottom: 4px solid #667eea;
      min-height: 200px;
    }
    
    .company-hero::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        linear-gradient(30deg, rgba(102, 126, 234, 0.08) 12%, transparent 12.5%, transparent 87%, rgba(102, 126, 234, 0.08) 87.5%, rgba(102, 126, 234, 0.08)),
        linear-gradient(150deg, rgba(102, 126, 234, 0.08) 12%, transparent 12.5%, transparent 87%, rgba(102, 126, 234, 0.08) 87.5%, rgba(102, 126, 234, 0.08));
      background-size: 60px 100px;
      opacity: 0.3;
    }
    
    .company-hero-content {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 24px;
      color: white;
    }
    
    .company-logo {
      flex-shrink: 0;
      width: 120px;
      height: 120px;
      background: white;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    
    .company-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    
    .company-logo-placeholder {
      font-size: 42px;
      font-weight: 900;
      color: #667eea;
    }
    
    .company-info-section {
      flex: 1;
    }
    
    .company-badge {
      display: inline-block;
      background: rgba(102, 126, 234, 0.25);
      backdrop-filter: blur(8px);
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      margin-bottom: 12px;
      border: 1.5px solid rgba(102, 126, 234, 0.4);
    }
    
    .company-name {
      font-size: 40px;
      font-weight: 900;
      margin-bottom: 10px;
      letter-spacing: -1px;
      text-shadow: 0 3px 15px rgba(0,0,0,0.4);
      line-height: 1.1;
    }
    
    .company-tagline {
      font-size: 16px;
      opacity: 0.9;
      line-height: 1.6;
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    .company-industry {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.15);
      padding: 8px 18px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 8px;
      border: 1.5px solid rgba(255,255,255,0.2);
    }
    
    /* Company Content Section */
    .company-content {
      padding: 32px 45px 60px;
    }
    
    .info-card {
      background: white;
      border-radius: 14px;
      padding: 24px 28px;
      margin-bottom: 20px;
      box-shadow: 
        0 6px 24px rgba(0,0,0,0.06),
        0 0 0 1px rgba(0,0,0,0.02);
      border-left: 4px solid #667eea;
      position: relative;
      overflow: hidden;
      page-break-inside: avoid;
    }
    
    .info-card::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 150px;
      height: 150px;
      background: radial-gradient(circle, rgba(102, 126, 234, 0.04) 0%, transparent 70%);
      border-radius: 50%;
    }
    
    .info-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      position: relative;
    }
    
    .info-card-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 14px rgba(102, 126, 234, 0.3);
      flex-shrink: 0;
    }
    
    .info-card-title {
      font-size: 20px;
      font-weight: 800;
      color: #1e293b;
      letter-spacing: -0.3px;
    }
    
    .info-card-text {
      font-size: 14.5px;
      line-height: 1.75;
      color: #475569;
      position: relative;
      z-index: 1;
    }
    
    /* Location Card */
    .location-card {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 2px solid #f59e0b;
      border-radius: 12px;
      padding: 20px 24px;
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.15);
      position: relative;
      overflow: hidden;
      page-break-inside: avoid;
    }
    
    .location-card::before {
      content: '📍';
      position: absolute;
      bottom: -15px;
      right: -8px;
      font-size: 100px;
      opacity: 0.06;
    }
    
    .location-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    
    .location-icon {
      width: 32px;
      height: 32px;
      background: #f59e0b;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
      flex-shrink: 0;
    }
    
    .location-title {
      font-size: 15px;
      font-weight: 800;
      color: #92400e;
      letter-spacing: -0.2px;
    }
    
    .location-text {
      font-size: 14.5px;
      color: #78350f;
      font-weight: 600;
      line-height: 1.6;
      position: relative;
      z-index: 1;
    }
    
    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .stat-card {
      background: white;
      border: 2px solid #e0e7ff;
      border-radius: 10px;
      padding: 16px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(99, 102, 241, 0.08);
    }
    
    .stat-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }
    
    .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #667eea;
      font-weight: 700;
      letter-spacing: 0.8px;
      margin-bottom: 6px;
    }
    
    .stat-value {
      font-size: 14px;
      color: #1e293b;
      font-weight: 700;
      line-height: 1.3;
      word-break: break-word;
    }
    
    /* Footer */
    .page-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 12px 45px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      text-align: center;
      color: white;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.4px;
    }
    
    @media print {
      .page {
        page-break-after: always;
      }
      .section, .info-card, .location-card, .stats-grid {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <!-- PERSONAL PROFILE PAGE(S) -->
  <div class="page page-1">
    <div class="hero">
      <div class="hero-content">
        <div class="profile-avatar">
          ${data.photoUrl ? 
            `<img src="${data.photoUrl}" alt="${data.firstName} ${data.lastName}" onerror="this.parentElement.innerHTML='${initials}'">` :
            initials
          }
        </div>
        <div class="hero-info">
          <h1 class="hero-name">${data.firstName} ${data.lastName}</h1>
          ${data.title ? `<div class="hero-title">${data.title}</div>` : ''}
          <div class="hero-meta">
            ${data.company ? `
            <div class="hero-meta-item">
              <div class="hero-meta-icon">🏢</div>
              <span>${data.company}</span>
            </div>
            ` : ''}
            ${data.personState && data.personCountry ? `
            ${data.company ? `<div class="hero-divider"></div>` : ''}
            <div class="hero-meta-item">
              <div class="hero-meta-icon">📍</div>
              <span>${data.personState}, ${data.personCountry}</span>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
    
    <div class="content">
      ${(data.linkedinHeadline || data.linkedinAbout) ? `
      <div class="section">
        <div class="section-header">
          <div class="section-icon">💡</div>
          <h2 class="section-title">Professional Summary</h2>
        </div>
        ${data.linkedinHeadline ? `
          <div class="summary-box">
            <div class="summary-text">${data.linkedinHeadline}</div>
          </div>
        ` : ''}
        ${data.linkedinAbout ? `
          <div class="summary-box">
            <div class="summary-text">${data.linkedinAbout}</div>
          </div>
        ` : ''}
      </div>
      ` : ''}
      
      ${(data.currentExperience || data.experience2 || data.experience3 || data.experience4) ? `
      <div class="section">
        <div class="section-header">
          <div class="section-icon">💼</div>
          <h2 class="section-title">Professional Experience</h2>
        </div>
        <div class="experience-timeline">
          ${data.currentExperience ? `
          <div class="experience-item">
            <div class="experience-text">
              ${data.currentExperience}
              <span class="current-job-badge">Current Job</span>
            </div>
          </div>
          ` : ''}
          ${data.experience2 ? `
          <div class="experience-item">
            <div class="experience-text">${data.experience2}</div>
          </div>
          ` : ''}
          ${data.experience3 ? `
          <div class="experience-item">
            <div class="experience-text">${data.experience3}</div>
          </div>
          ` : ''}
          ${data.experience4 ? `
          <div class="experience-item">
            <div class="experience-text">${data.experience4}</div>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}
      
      ${data.education ? `
      <div class="section">
        <div class="section-header">
          <div class="section-icon">🎓</div>
          <h2 class="section-title">Education</h2>
        </div>
        <div class="education-card">
          <div class="education-text">${data.education}</div>
        </div>
      </div>
      ` : ''}
      
      ${(data.email || data.mobile || data.secondPhone || data.linkedinUrl) ? `
      <div class="section">
        <div class="section-header">
          <div class="section-icon">📞</div>
          <h2 class="section-title">Contact Information</h2>
        </div>
        <div class="contact-grid">
          ${data.email ? `
          <div class="contact-card">
            <div class="contact-label">📧 Email Address</div>
            <div class="contact-value">${data.email}</div>
          </div>
          ` : ''}
          ${data.mobile ? `
          <div class="contact-card">
            <div class="contact-label">📱 Mobile Phone</div>
            <div class="contact-value">${data.mobile}</div>
          </div>
          ` : ''}
          ${data.secondPhone ? `
          <div class="contact-card">
            <div class="contact-label">☎️ Second Phone</div>
            <div class="contact-value">${data.secondPhone}</div>
          </div>
          ` : ''}
          ${data.linkedinUrl ? `
          <div class="contact-card">
            <div class="contact-label">🔗 LinkedIn Profile</div>
            <div class="contact-value">${data.linkedinUrl}</div>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}
      
      ${(data.lastPostPerson) ? `
      <div class="section">
        <div class="section-header">
          <div class="section-icon">📝</div>
          <h2 class="section-title">Recent Activity</h2>
        </div>
        <div class="posts-grid">
          <div class="post-card">
            <div class="post-label">💬 Latest Personal Post</div>
            <div class="post-text">${data.lastPostPerson}</div>
          </div>
        </div>
      </div>
      ` : ''}
    </div>
    
    <div class="page-footer">
      ${data.firstName} ${data.lastName} • Personal Profile • Page 1 of ${totalPages}
    </div>
  </div>
  
  <!-- COMPANY PROFILE PAGE(S) -->
  ${hasCompanyInfo ? `
  <div class="page page-company">
    <div class="company-hero">
      <div class="company-hero-content">
        ${data.companyLogoUrl ? `
        <div class="company-logo">
          <img src="${data.companyLogoUrl}" alt="${data.company} Logo" onerror="this.parentElement.innerHTML='<div class=company-logo-placeholder>${data.company.charAt(0)}</div>'">
        </div>
        ` : (data.company ? `
        <div class="company-logo">
          <div class="company-logo-placeholder">${data.company.charAt(0)}</div>
        </div>
        ` : '')}
        <div class="company-info-section">
          <div class="company-badge">Company Profile</div>
          ${data.company ? `<h1 class="company-name">${data.company}</h1>` : ''}
          ${data.companyHeadline ? `<div class="company-tagline">${data.companyHeadline}</div>` : ''}
          ${data.websiteBrief ? `<div class="company-tagline">${data.websiteBrief}</div>` : ''}
          ${data.industry ? `<div class="company-industry"><span>🏭</span> ${data.industry}</div>` : ''}
        </div>
      </div>
    </div>
    
    <div class="company-content">
      ${data.companyAbout ? `
      <div class="info-card">
        <div class="info-card-header">
          <div class="info-card-icon">📋</div>
          <h3 class="info-card-title">About the Company</h3>
        </div>
        <div class="info-card-text">${data.companyAbout}</div>
      </div>
      ` : ''}
      
      ${(data.address || data.city || data.state || data.country) ? `
      <div class="location-card">
        <div class="location-header">
          <div class="location-icon">📍</div>
          <h3 class="location-title">Company Location</h3>
        </div>
        <div class="location-text">
          ${data.address ? `${data.address}<br>` : ''}
          ${data.city}${data.state ? `, ${data.state}` : ''}${data.country ? ` • ${data.country}` : ''}
        </div>
      </div>
      ` : ''}
      
      ${(data.email || data.corporatePhone || data.currentExperience) ? `
      <div class="stats-grid" style="margin-top: 20px;">
        ${data.email ? `
        <div class="stat-card">
          <div class="stat-icon">📧</div>
          <div class="stat-label">Contact Email</div>
          <div class="stat-value">${data.email}</div>
        </div>
        ` : ''}
        ${data.corporatePhone ? `
        <div class="stat-card">
          <div class="stat-icon">📞</div>
          <div class="stat-label">Phone</div>
          <div class="stat-value">${data.corporatePhone}</div>
        </div>
        ` : ''}
        ${data.currentExperience ? `
        <div class="stat-card">
          <div class="stat-icon">💼</div>
          <div class="stat-label">Primary Contact</div>
          <div class="stat-value">${data.firstName} ${data.lastName}</div>
        </div>
        ` : ''}
      </div>
      ` : ''}
      
      ${data.lastPostCompany ? `
      <div class="info-card" style="margin-top: 20px; border-left-color: #10b981;">
        <div class="info-card-header">
          <div class="info-card-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">💬</div>
          <h3 class="info-card-title">Latest Company Update</h3>
        </div>
        <div class="info-card-text" style="font-style: italic;">${data.lastPostCompany}</div>
      </div>
      ` : ''}
    </div>
    
    <div class="page-footer">
      ${data.firstName} ${data.lastName} • Company Profile • Page ${totalPages} of ${totalPages}
    </div>
  </div>
  ` : ''}
</body>
</html>
  `;
};



// Generate PDFs for all contacts
const generatePDFs = async (contacts) => {
  console.log('🚀 Starting PDF generation...\n');
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });
  
  let skippedCount = 0;
  let processedCount = 0;
  
  for (let i = 0; i < contacts.length; i++) {
    const user = contacts[i];
    const firstName = getField(user, 'First Name', 'first_name');
    const lastName = getField(user, 'Last Name', 'last_name');
    
    // Check if both First Name and Last Name are empty
    if (!firstName && !lastName) {
      skippedCount++;
      console.log(`⏭️  [${i + 1}/${contacts.length}] Skipping - Both First Name and Last Name are empty`);
      continue;
    }
    
    // Use fallback names if one is missing
    const displayFirstName = firstName || 'User';
    const displayLastName = lastName || '';
    const filename = `${displayFirstName}_${displayLastName}_Profile.pdf`.replace(/\s+/g, '_').replace(/_+/g, '_');
    
    console.log(`📄 [${i + 1}/${contacts.length}] Generating: ${filename}`);
    
    try {
      const html = generateHTML(user);
      const page = await browser.newPage();
      
      await page.setDefaultTimeout(30000);
      
      await page.setContent(html, { 
        waitUntil: 'networkidle0', 
        timeout: 15000 
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await page.pdf({
        ...CONFIG.pdfOptions,
        path: path.join(CONFIG.outputDir, filename),
        timeout: 20000,
        preferCSSPageSize: false
      });
      
      await page.close();
      processedCount++;
      console.log(`   ✓ Success - Multi-page profile with complete data`);
    } catch (error) {
      console.log(`   ✗ Error: ${error.message}`);
      
      try {
        const pages = await browser.pages();
        for (const p of pages) {
          if (p.url() === 'about:blank') {
            await p.close();
          }
        }
      } catch (closeError) {
        // Ignore
      }
    }
  }
  
  await browser.close();
  console.log(`\n✅ PDF generation complete!`);
  console.log(`📁 Location: ${path.resolve(CONFIG.outputDir)}`);
  console.log(`📊 Summary: ${processedCount} PDFs generated, ${skippedCount} rows skipped`);
};



// Main execution
(async () => {
  try {
    setupOutputDir();
    const contacts = loadContacts();
    await generatePDFs(contacts);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
})();
