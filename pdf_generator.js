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
  // Extract first and last name from Full Name
  const fullName = getField(user, 'Full Name');
  const nameParts = fullName ? fullName.split(' ') : ['', ''];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  // Parse experiences from the Experiences field
  const experiences = getField(user, 'Experiences');
  const experienceList = experiences ? experiences.split(' | ') : [];
  
  const data = {
    // Personal Information - New CSV Schema Mapping
    fullName: getField(user, 'Full Name'),
    contactPhotoUrl: getField(user, 'Contact Photo URL'),
    title: getField(user, 'Person Title'),
    personState: getField(user, 'Person State'),
    personCountry: getField(user, 'Person Country'),
    summary: getField(user, 'Summary About The Person'),
    headline: getField(user, 'Person Headline'),
    education: getField(user, 'Education'),
    currentExperience: getField(user, 'Current Experience'),
    experience2: getField(user, 'Experience 2'),
    experience3: getField(user, 'Experience 3'),
    experience4: getField(user, 'Experience 4'),
    lastPostPerson1: getField(user, 'Last Post For Person'),
    lastPostPerson2: getField(user, 'Last Post For Person 2'),
    lastPostPerson3: getField(user, 'Last Post For Person 3'),
    personContactEmail: getField(user, 'Person Contact Email'),
    contactPhone: getField(user, 'Contact Phone'),
    contactSecondPhone: getField(user, 'Contact Second Phone'),
    contactLinkedIn: getField(user, 'Contact LinkedIn'),
    
    // Company Information - New CSV Schema Mapping
    companyName: getField(user, 'Company Name'),
    companyLogoUrl: getField(user, 'Company Logo URL'),
    companyWebsite: getField(user, 'Company Website'),
    companyTagline: getField(user, 'Company Tagline'),
    companyAbout: getField(user, 'Company About'),
    companyIndustry: getField(user, 'Company Industry'),
    companyWebsiteBrief: getField(user, 'Company information Brief'),
    companyPartners: getField(user, 'Company Partners'),
    companyLastEvents: getField(user, 'Company Last Events'),
    companyLastPost1: getField(user, 'Company Last Post'),
    companyLastPost2: getField(user, 'Company Last Post 2'),
    companyLastPost3: getField(user, 'Company Last Post 3'),
    contactCorporatePhone: getField(user, 'Contact Corporate Phone'),
    companyAddress: getField(user, 'Company Address'),
    companyCity: getField(user, 'Company City'),
    companyState: getField(user, 'Company State'),
    companyCountry: getField(user, 'Company Country'),
    
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
                         data.companyCity || data.companyLastPosts || data.partners || data.lastEvents;
  
  if (hasCompanyInfo) {
    totalPages += 1; // At least one company page
  }
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.fullName} - Professional Profile</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: #ffffff;
      color: #1a202c;
      line-height: 1.7;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      -webkit-user-select: text;
      -moz-user-select: text;
      -ms-user-select: text;
      user-select: text;
    }
    
    * {
      -webkit-user-select: text;
      -moz-user-select: text;
      -ms-user-select: text;
      user-select: text;
    }
    
    /* Ensure all text is copyable */
    .id-card, .company-card, .section, .field-group, .field-value, .field-label, 
    .hero-name, .hero-title, .hero-location, .current-role, .experience-title,
    .company-name-large, .company-tagline-large, .id-name, .id-current-role,
    .id-info-value, .id-info-label {
      -webkit-user-select: text;
      -moz-user-select: text;
      -ms-user-select: text;
      user-select: text;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%);
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      position: relative;
      overflow: visible;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
      border-radius: 8px;
    }
    
    .page:last-child {
      page-break-after: avoid;
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
      background: white;
      border: 3px solid #e2e8f0;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      flex-shrink: 0;
    }
    
    .company-info {
      flex: 1;
    }
    
    .company-name-large {
      font-size: 28px;
      font-weight: 800;
      color: #1a202c;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .company-tagline-large {
      font-size: 18px;
      font-weight: 600;
      color: #4a5568;
      line-height: 1.4;
    }
    
    /* Page 1: Personal Profile */
    .page-1 {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e0 100%);
    }
    
    /* Comprehensive Section Styles */
    .section {
      margin-bottom: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%);
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.12);
      border: 1px solid rgba(102, 126, 234, 0.2);
      position: relative;
      overflow: visible;
    }
    
    .section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 16px;
      position: relative;
    }
    
    .section-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
      flex-shrink: 0;
      color: white;
    }
    
    .section-title {
      font-size: 32px;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.8px;
      position: relative;
      padding-bottom: 8px;
    }
    
    .section-title::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 80px;
      height: 4px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      border-radius: 3px;
    }
    
    .field-group {
      margin-bottom: 12px;
      padding: 16px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 12px;
      border-left: 4px solid #667eea;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.08);
    }
    
    .field-label {
      font-size: 18px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .field-value {
      font-size: 18px;
      color: #1a202c;
      line-height: 1.8;
      word-break: break-word;
      font-weight: 500;
    }
    
    .field-value.long-text {
      font-size: 17px;
      line-height: 1.9;
      padding: 20px;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-radius: 12px;
      border-left: 4px solid #667eea;
    }
    
    a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    .field-group {
      background: white;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 16px;
      box-shadow: 0 2px 10px rgba(37, 99, 235, 0.08);
      border-left: 4px solid #2563eb;
    }
    
    .field-label {
      font-size: 12px;
      text-transform: uppercase;
      color: #2563eb;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .field-value {
      font-size: 15px;
      color: #1e293b;
      font-weight: 500;
      line-height: 1.7;
      word-break: break-word;
      text-align: justify;
      hyphens: auto;
    }
    
    .field-value.long-text {
      font-size: 14px;
      line-height: 1.8;
      text-align: left;
      margin-bottom: 12px;
      padding: 8px 0;
      border-left: 3px solid #e2e8f0;
      padding-left: 12px;
      background: #f8fafc;
      border-radius: 4px;
      font-weight: 400;
    }
    
    .company-logo {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      object-fit: contain;
      background: white;
      border: 2px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .company-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
      padding: 16px;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-radius: 12px;
      border-left: 4px solid #2563eb;
    }
    
    .company-info {
      flex: 1;
    }
    
    .company-name-large {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 4px 0;
    }
    
    .company-tagline-large {
      font-size: 16px;
      color: #64748b;
      margin: 0;
    }
    
    .experience-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 16px;
    }
    
    .experience-item {
      padding: 20px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 12px;
      border-left: 4px solid #667eea;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.08);
    }
    
    .experience-title {
      font-weight: 700;
      font-size: 18px;
      color: #1e293b;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .posts-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin-top: 12px;
    }
    
    .post-item {
      padding: 20px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 12px;
      border-left: 4px solid #667eea;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.08);
      font-size: 16px;
      line-height: 1.8;
    }
    
    .bullet-list {
      margin: 0;
      padding-left: 24px;
    }
    
    .bullet-list li {
      margin-bottom: 12px;
      font-size: 16px;
      color: #1e293b;
      line-height: 1.7;
    }
    
    .hero-section {
      display: flex;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      color: white;
      padding: 60px;
      border-radius: 32px;
      margin-bottom: 48px;
      gap: 48px;
      box-shadow: 0 25px 50px rgba(102, 126, 234, 0.4);
      position: relative;
      overflow: hidden;
    }
    
    .hero-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
      opacity: 0.3;
    }
    
    .hero-photo {
      flex-shrink: 0;
      width: 160px;
      height: 160px;
      border-radius: 50%;
      border: 8px solid rgba(255, 255, 255, 0.3);
      object-fit: cover;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
      position: relative;
      z-index: 1;
    }
    
    .hero-content {
      flex: 1;
      position: relative;
      z-index: 1;
    }
    
    .hero-name {
      font-size: 56px;
      font-weight: 900;
      margin: 0 0 20px 0;
      text-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      letter-spacing: -1.2px;
    }
    
    .hero-title {
      font-size: 28px;
      font-weight: 700;
      opacity: 0.95;
      margin: 0 0 16px 0;
      letter-spacing: -0.4px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .hero-location {
      font-size: 20px;
      opacity: 0.85;
      margin: 0 0 20px 0;
      font-weight: 600;
    }
    
    .current-role {
      background: rgba(255, 255, 255, 0.2);
      padding: 16px 28px;
      border-radius: 50px;
      font-size: 20px;
      font-weight: 700;
      margin-top: 20px;
      display: inline-block;
      backdrop-filter: blur(10px);
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .content-area {
      padding: 32px;
      overflow: visible;
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
    
    /* Gradient Background Bar - Professional Blue Theme */
    .hero::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 140px;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
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
      overflow: visible;
    }
    
    .section {
      margin-bottom: 28px;
      page-break-inside: avoid;
      break-inside: avoid;
      overflow: hidden;
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
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 
        0 6px 18px rgba(37, 99, 235, 0.35),
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
      background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%);
      border-radius: 2px;
    }
    
    /* Professional Summary */
    .summary-box {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-left: 4px solid #2563eb;
      padding: 18px 22px;
      border-radius: 12px;
      margin-bottom: 12px;
      box-shadow: 
        0 4px 14px rgba(37, 99, 235, 0.12),
        0 0 0 1px rgba(37, 99, 235, 0.08);
      position: relative;
      overflow: hidden;
    }
    
    .summary-box::before {
      content: '"';
      position: absolute;
      top: -20px;
      left: 10px;
      font-size: 80px;
      color: rgba(37, 99, 235, 0.06);
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
      border: 2px solid #dbeafe;
      border-radius: 12px;
      padding: 16px 20px;
      position: relative;
      box-shadow: 0 2px 10px rgba(37, 99, 235, 0.06);
      transition: all 0.3s;
    }
    
    .experience-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
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
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: white;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-left: 10px;
      box-shadow: 0 2px 8px rgba(5, 150, 105, 0.25);
    }
    
    /* Contact Grid with Cards */
    .contact-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }
    
    .contact-card {
      background: white;
      border: 2px solid #dbeafe;
      border-radius: 12px;
      padding: 16px 18px;
      transition: all 0.3s;
      box-shadow: 0 2px 10px rgba(37, 99, 235, 0.06);
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
      background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    .contact-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #2563eb;
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
      border-left: 4px solid #059669;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 
        0 4px 14px rgba(5, 150, 105, 0.12),
        0 0 0 1px rgba(5, 150, 105, 0.08);
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
      border-left: 4px solid #d97706;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 
        0 4px 14px rgba(217, 119, 6, 0.15),
        0 0 0 1px rgba(217, 119, 6, 0.08);
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
      color: #92400e;
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
      border-bottom: 4px solid #2563eb;
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
        linear-gradient(30deg, rgba(37, 99, 235, 0.08) 12%, transparent 12.5%, transparent 87%, rgba(37, 99, 235, 0.08) 87.5%, rgba(37, 99, 235, 0.08)),
        linear-gradient(150deg, rgba(37, 99, 235, 0.08) 12%, transparent 12.5%, transparent 87%, rgba(37, 99, 235, 0.08) 87.5%, rgba(37, 99, 235, 0.08));
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
      color: #2563eb;
    }
    
    .company-info-section {
      flex: 1;
    }
    
    .company-badge {
      display: inline-block;
      background: rgba(37, 99, 235, 0.25);
      backdrop-filter: blur(8px);
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      margin-bottom: 12px;
      border: 1.5px solid rgba(37, 99, 235, 0.4);
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
      overflow: visible;
    }
    
    .info-card {
      background: white;
      border-radius: 14px;
      padding: 24px 28px;
      margin-bottom: 20px;
      box-shadow: 
        0 6px 24px rgba(0,0,0,0.06),
        0 0 0 1px rgba(0,0,0,0.02);
      border-left: 4px solid #2563eb;
      position: relative;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .info-card::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 150px;
      height: 150px;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.04) 0%, transparent 70%);
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
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
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
      border: 2px solid #d97706;
      border-radius: 12px;
      padding: 20px 24px;
      box-shadow: 0 4px 14px rgba(217, 119, 6, 0.15);
      position: relative;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
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
      background: #d97706;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(217, 119, 6, 0.25);
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
      color: #92400e;
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
      break-inside: avoid;
    }
    
    .stat-card {
      background: white;
      border: 2px solid #dbeafe;
      border-radius: 10px;
      padding: 16px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(37, 99, 235, 0.08);
    }
    
    .stat-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }
    
    .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #2563eb;
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
      background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%);
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
      .section, .info-card, .location-card, .stats-grid, .experience-timeline, .contact-grid, .posts-grid {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .hero, .company-hero {
        page-break-after: avoid;
        break-after: avoid;
      }
      .content, .company-content {
        overflow: visible;
      }
    }
  </style>
</head>
<body>
  <!-- ID CARD PAGE -->
  <div class="page id-card-page">
    <div class="id-card">
      ${data.contactPhotoUrl && data.contactPhotoUrl !== 'N/A' && data.contactPhotoUrl.trim() !== '' ? `
        <img src="${data.contactPhotoUrl}" alt="${data.fullName}" class="id-photo" />
      ` : `
        <div class="id-photo" style="background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; font-size: 72px; font-weight: bold; color: white;">
          ${data.fullName ? data.fullName.split(' ').map(n => n[0]).join('') : '??'}
        </div>
      `}
      <h1 class="id-name">${data.fullName || 'N/A'}</h1>
      ${data.currentExperience && data.currentExperience !== 'N/A' && data.currentExperience.trim() !== '' ? `
        <div class="id-current-role">${data.currentExperience}</div>
      ` : ''}
      
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
  <div class="page page-1">
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
  <div class="page page-company">
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
  </div>
</body>
</html>
  `;
};



// Generate a single profile PDF with all fields
const generateProfilePDF = async (data) => {
  console.log('🚀 Generating comprehensive profile PDF...\n');
  
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
  
  try {
    const html = generateHTML(data);
    const page = await browser.newPage();
    
    await page.setDefaultTimeout(30000);
    
    await page.setContent(html, { 
      waitUntil: 'networkidle0', 
      timeout: 15000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.pdf({
      ...CONFIG.pdfOptions,
      path: path.join(CONFIG.outputDir, 'profile.pdf'),
      timeout: 20000,
      preferCSSPageSize: false
    });
    
    await page.close();
    console.log(`   ✓ Success - Comprehensive profile with all fields generated`);
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  } finally {
    await browser.close();
  }
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
    const fullName = getField(user, 'Full Name');
    
    // Check if Full Name is empty
    if (!fullName) {
      skippedCount++;
      console.log(`⏭️  [${i + 1}/${contacts.length}] Skipping - Full Name is empty`);
      continue;
    }
    
    // Use Full Name for filename
    const filename = `${fullName}_Profile.pdf`.replace(/\s+/g, '_').replace(/_+/g, '_');
    
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
    
    // Generate comprehensive profile PDF for first contact
    if (contacts.length > 0) {
      const firstContact = contacts[0];
      const data = {
        // Personal Information - New CSV Schema Mapping
        fullName: getField(firstContact, 'Full Name'),
        contactPhotoUrl: getField(firstContact, 'Contact Photo URL'),
        title: getField(firstContact, 'Person Title'),
        personState: getField(firstContact, 'Person State'),
        personCountry: getField(firstContact, 'Person Country'),
        summary: getField(firstContact, 'Summary About The Person'),
        headline: getField(firstContact, 'Person Headline'),
        education: getField(firstContact, 'Education'),
        currentExperience: getField(firstContact, 'Current Experience'),
        experience2: getField(firstContact, 'Experience 2'),
        experience3: getField(firstContact, 'Experience 3'),
        experience4: getField(firstContact, 'Experience 4'),
        lastPostPerson1: getField(firstContact, 'Last Post For Person'),
        lastPostPerson2: getField(firstContact, 'Last Post For Person 2'),
        lastPostPerson3: getField(firstContact, 'Last Post For Person 3'),
        personContactEmail: getField(firstContact, 'Person Contact Email'),
        contactPhone: getField(firstContact, 'Contact Phone'),
        contactSecondPhone: getField(firstContact, 'Contact Second Phone'),
        contactLinkedIn: getField(firstContact, 'Contact LinkedIn'),
        
        // Company Information - New CSV Schema Mapping
        companyName: getField(firstContact, 'Company Name'),
        companyLogoUrl: getField(firstContact, 'Company Logo URL'),
        companyWebsite: getField(firstContact, 'Company Website'),
        companyTagline: getField(firstContact, 'Company Tagline'),
        companyAbout: getField(firstContact, 'Company About'),
        companyIndustry: getField(firstContact, 'Company Industry'),
        companyWebsiteBrief: getField(firstContact, 'Company information Brief'),
        companyPartners: getField(firstContact, 'Company Partners'),
        companyLastEvents: getField(firstContact, 'Company Last Events'),
        companyLastPost1: getField(firstContact, 'Company Last Post'),
        companyLastPost2: getField(firstContact, 'Company Last Post 2'),
        companyLastPost3: getField(firstContact, 'Company Last Post 3'),
        contactCorporatePhone: getField(firstContact, 'Contact Corporate Phone'),
        companyAddress: getField(firstContact, 'Company Address'),
        companyCity: getField(firstContact, 'Company City'),
        companyState: getField(firstContact, 'Company State'),
        companyCountry: getField(firstContact, 'Company Country'),
        
        // Helper fields
        firstName: getField(firstContact, 'Full Name').split(' ')[0] || '',
        lastName: getField(firstContact, 'Full Name').split(' ').slice(1).join(' ') || ''
      };
      
      await generateProfilePDF(data);
    }
    
    // Also generate individual PDFs for all contacts
    await generatePDFs(contacts);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
})();

