const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');



// Configuration
const CONFIG = {
  outputDir: './generated_html',
  csvFile: 'test.csv',
  htmlDoctype: '<!DOCTYPE html>'
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
                         data.companyCity || data.companyLastPost1 || data.companyPartners || data.companyLastEvents;
  
  if (hasCompanyInfo) {
    totalPages += 1; // At least one company page
  }
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.fullName} - Portfolio</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background: #0b1020; color: #e5e7eb; font-size: 18px; }
  .hero { position: relative; width: 100%; min-height: 360px; background: radial-gradient(1400px 500px at 20% -20%, rgba(99,102,241,0.4), transparent 60%), radial-gradient(1000px 500px at 100% 10%, rgba(168,85,247,0.3), transparent 60%), linear-gradient(135deg, #080c18 0%, #0b1020 100%); display: flex; align-items: center; }
  .container { max-width: 1280px; margin: 0 auto; padding: 40px 40px; width: 100%; }
  .hero-card { display: grid; grid-template-columns: 180px 1fr; gap: 28px; align-items: center; background: rgba(11,16,32,0.75); border: 1px solid rgba(148,163,184,0.18); border-radius: 28px; padding: 28px; box-shadow: 0 30px 80px rgba(2,6,23,0.6), inset 0 1px 0 rgba(255,255,255,0.04); backdrop-filter: blur(10px); }
  .avatar { width: 180px; height: 180px; border-radius: 20px; overflow: hidden; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 64px; font-weight: 900; color: white; box-shadow: 0 25px 60px rgba(99,102,241,0.5); border: 5px solid rgba(255,255,255,0.08); }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .title { display: flex; flex-direction: column; gap: 10px; }
  .name { font-size: 44px; font-weight: 900; letter-spacing: -0.8px; color: #f8fafc; text-shadow: 0 3px 14px rgba(99,102,241,0.35); }
  .role { font-size: 20px; font-weight: 800; color: #c7d2fe; }
    .meta { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 6px; }
    .meta-chip { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 999px; background: rgba(99,102,241,0.08); color: #c7d2fe; border: 1px solid rgba(99,102,241,0.25); font-weight: 600; font-size: 12px; }
    .grid { display: grid; grid-template-columns: 1fr; gap: 28px; margin-top: 28px; }
  .section { background: linear-gradient(180deg, rgba(2,6,23,0.7) 0%, rgba(2,6,23,0.4) 100%); border: 1px solid rgba(148,163,184,0.16); border-radius: 24px; padding: 30px; box-shadow: 0 22px 60px rgba(2,6,23,0.6), inset 0 1px 0 rgba(255,255,255,0.04); }
  .section-header { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
  .badge { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; box-shadow: 0 16px 32px rgba(99,102,241,0.5); font-weight: 900; font-size: 20px; }
  .section-title { font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.4px; padding-bottom: 8px; box-shadow: inset 0 -3px 0 0 rgba(99,102,241,0.35); }
  .cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
  .card { background: rgba(15,23,42,0.7); border: 1px solid rgba(148,163,184,0.16); border-radius: 18px; padding: 20px; box-shadow: 0 14px 40px rgba(2,6,23,0.5); transition: transform .2s ease, box-shadow .2s ease; }
    .card:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(2,6,23,0.55); }
  .label { font-size: 12px; text-transform: uppercase; letter-spacing: 1.2px; color: #a5b4fc; font-weight: 900; margin-bottom: 10px; }
  .value { font-size: 18px; color: #eef2ff; font-weight: 700; line-height: 1.75; }
  .value.muted { color: #a3b2c7; font-weight: 600; }
  .stack { display: grid; gap: 16px; }
  .quote { position: relative; padding: 20px; border-radius: 16px; background: rgba(59,130,246,0.1); border-left: 4px solid #60a5fa; color: #dbeafe; font-style: italic; font-size: 18px; }
  .experience { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .xp { padding: 18px; border-radius: 14px; background: rgba(99,102,241,0.08); border-left: 4px solid #818cf8; color: #eef2ff; font-size: 18px; font-weight: 700; }
  .company-hero { display: flex; align-items: center; gap: 20px; padding: 20px; border-radius: 18px; background: linear-gradient(135deg, rgba(17,24,39,0.92) 0%, rgba(30,41,59,0.88) 100%); border: 1px solid rgba(148,163,184,0.16); box-shadow: 0 18px 55px rgba(2,6,23,0.6); }
  .company-logo { width: 96px; height: 96px; border-radius: 14px; background: white; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .company-logo img { width: 100%; height: 100%; object-fit: contain; }
  .company-name { font-size: 28px; font-weight: 900; color: #f8fafc; }
  .company-tag { font-size: 16px; color: #cbd5e1; }
    .list { display: grid; gap: 10px; }
    .list li { list-style: none; padding-left: 18px; position: relative; color: #e5e7eb; }
    .list li::before { content: ''; position: absolute; left: 0; top: 9px; width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 0 0 2px rgba(99,102,241,0.25); }
    @media (max-width: 1024px) { .cards { grid-template-columns: 1fr 1fr; } .experience { grid-template-columns: 1fr; } .hero-card { grid-template-columns: 1fr; } }
    @media (max-width: 640px) { .cards { grid-template-columns: 1fr; } .container { padding: 24px 16px; } }
  </style>
</head>
<body>
  <header class="hero">
    <div class="container">
      <div class="hero-card">
        <div class="avatar">
          ${data.contactPhotoUrl ? `<img src="${data.contactPhotoUrl}" alt="${data.fullName}">` : `${initials}`}
        </div>
        <div class="title">
          <div class="name">${data.fullName}</div>
          ${data.title ? `<div class="role">${data.title}</div>` : ''}
          <div class="meta">
            ${(data.personState || data.personCountry) ? `<span class="meta-chip">📍 ${[data.personState, data.personCountry].filter(Boolean).join(', ')}</span>` : ''}
            ${data.education ? `<span class="meta-chip">🎓 ${data.education}</span>` : ''}
          </div>
        </div>
      </div>
    </div>
  </header>

  <main class="container">
    <div class="grid">
      <section class="section">
        <div class="section-header">
          <div class="badge">👤</div>
          <h2 class="section-title">User Information</h2>
        </div>
        <div class="stack">
          ${data.summary ? `<div class="quote">${data.summary}</div>` : ''}
          <div class="cards">
            ${data.headline ? `<div class="card"><div class="label">Headline</div><div class="value">${data.headline}</div></div>` : ''}
            ${data.personContactEmail ? `<div class="card"><div class="label">Email</div><div class="value">${data.personContactEmail}</div></div>` : ''}
            ${data.contactPhone ? `<div class="card"><div class="label">Primary Phone</div><div class="value">${data.contactPhone}</div></div>` : ''}
            ${data.contactSecondPhone ? `<div class="card"><div class="label">Secondary Phone</div><div class="value">${data.contactSecondPhone}</div></div>` : ''}
            ${data.contactLinkedIn ? `<div class="card"><div class="label">LinkedIn</div><div class="value"><a href="${data.contactLinkedIn}" style="color:#a5b4fc;text-decoration:none;">${data.contactLinkedIn}</a></div></div>` : ''}
          </div>
          ${(data.currentExperience || data.experience2 || data.experience3 || data.experience4) ? `
          <div class="experience">
            ${data.currentExperience ? `<div class="xp"><span style="font-weight:800;color:#c7d2fe;">Current</span><br>${data.currentExperience}</div>` : ''}
            ${data.experience2 ? `<div class="xp">${data.experience2}</div>` : ''}
            ${data.experience3 ? `<div class="xp">${data.experience3}</div>` : ''}
            ${data.experience4 ? `<div class="xp">${data.experience4}</div>` : ''}
          </div>
          ` : ''}
          ${(data.lastPostPerson1 || data.lastPostPerson2 || data.lastPostPerson3) ? `
          <div class="cards" style="grid-template-columns:1fr;">
            ${data.lastPostPerson1 ? `<div class="card"><div class="label">Recent Post 1</div><div class="value muted">${data.lastPostPerson1}</div></div>` : ''}
            ${data.lastPostPerson2 ? `<div class="card"><div class="label">Recent Post 2</div><div class="value muted">${data.lastPostPerson2}</div></div>` : ''}
            ${data.lastPostPerson3 ? `<div class="card"><div class="label">Recent Post 3</div><div class="value muted">${data.lastPostPerson3}</div></div>` : ''}
          </div>
          ` : ''}
        </div>
      </section>

      ${hasCompanyInfo ? `
      <section class="section">
        <div class="section-header">
          <div class="badge">🏢</div>
          <h2 class="section-title">Company Information</h2>
        </div>
        <div class="stack">
          ${(data.companyName || data.companyLogoUrl || data.companyTagline) ? `
          <div class="company-hero">
            <div class="company-logo">
              ${data.companyLogoUrl ? `<img src="${data.companyLogoUrl}" alt="${data.companyName}">` : `<span style=\"font-weight:900;color:#6366f1;font-size:24px\">${(data.companyName||'?').charAt(0).toUpperCase()}</span>`}
            </div>
            <div>
              ${data.companyName ? `<div class="company-name">${data.companyName}</div>` : ''}
              ${data.companyTagline ? `<div class="company-tag">${data.companyTagline}</div>` : ''}
            </div>
          </div>
          ` : ''}
          <div class="cards">
            ${data.companyWebsite ? `<div class="card"><div class="label">Website</div><div class="value"><a href="${data.companyWebsite}" style="color:#a5b4fc;text-decoration:none;">${data.companyWebsite}</a></div></div>` : ''}
            ${data.contactCorporatePhone ? `<div class="card"><div class="label">Corporate Phone</div><div class="value">${data.contactCorporatePhone}</div></div>` : ''}
            ${data.companyIndustry ? `<div class="card"><div class="label">Industry</div><div class="value">${data.companyIndustry}</div></div>` : ''}
          </div>
          ${data.companyAbout ? `<div class="card"><div class="label">About</div><div class="value muted">${data.companyAbout}</div></div>` : ''}
          ${data.companyWebsiteBrief ? `<div class="card"><div class="label">Brief</div><div class="value muted">${data.companyWebsiteBrief}</div></div>` : ''}
          ${data.companyAddress ? `<div class="card"><div class="label">Address</div><div class="value">${data.companyAddress}</div></div>` : ''}
          ${data.companyPartners ? `<div class="card"><div class="label">Partners</div><ul class="list">${data.companyPartners.split(';').map(p => `<li>${p.trim()}</li>`).join('')}</ul></div>` : ''}
          ${(data.companyLastEvents) ? `<div class="card"><div class="label">Recent Events</div><div class="value muted">${data.companyLastEvents}</div></div>` : ''}
          ${(data.companyLastPost1 || data.companyLastPost2 || data.companyLastPost3) ? `
          <div class="cards" style="grid-template-columns:1fr;">
            ${data.companyLastPost1 ? `<div class="card"><div class="label">Company Post 1</div><div class="value muted">${data.companyLastPost1}</div></div>` : ''}
            ${data.companyLastPost2 ? `<div class="card"><div class="label">Company Post 2</div><div class="value muted">${data.companyLastPost2}</div></div>` : ''}
            ${data.companyLastPost3 ? `<div class="card"><div class="label">Company Post 3</div><div class="value muted">${data.companyLastPost3}</div></div>` : ''}
          </div>
          ` : ''}
        </div>
      </section>
      ` : ''}
    </div>
  </main>
</body>
</html>
  `;
};



// Generate a single profile HTML file with all fields
const generateProfileHTML = async (data) => {
  console.log('🚀 Generating comprehensive profile HTML...\n');
  try {
    const html = generateHTML(data);
    const filePath = path.join(CONFIG.outputDir, 'profile.html');
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`   ✓ Success - Comprehensive profile HTML generated`);
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }
};

// Generate HTML files for all contacts
const generateHTMLFiles = async (contacts) => {
  console.log('🚀 Starting HTML generation...\n');
  
  let skippedCount = 0;
  let processedCount = 0;
  
  for (let i = 0; i < contacts.length; i++) {
    const user = contacts[i];
    const fullName = getField(user, 'Full Name');
    
    if (!fullName) {
      skippedCount++;
      console.log(`⏭️  [${i + 1}/${contacts.length}] Skipping - Full Name is empty`);
      continue;
    }
    
    const filename = `${fullName}_Profile.html`.replace(/\s+/g, '_').replace(/_+/g, '_');
    console.log(`📝 [${i + 1}/${contacts.length}] Generating: ${filename}`);
    
    try {
      const html = generateHTML(user);
      fs.writeFileSync(path.join(CONFIG.outputDir, filename), html, 'utf8');
      processedCount++;
      console.log(`   ✓ Success - HTML profile saved`);
    } catch (error) {
      console.log(`   ✗ Error: ${error.message}`);
    }
  }
  
  console.log(`\n✅ HTML generation complete!`);
  console.log(`📁 Location: ${path.resolve(CONFIG.outputDir)}`);
  console.log(`📊 Summary: ${processedCount} HTML files generated, ${skippedCount} rows skipped`);
};



// Main execution
(async () => {
  try {
    setupOutputDir();
    const contacts = loadContacts();
    
    // Generate comprehensive profile HTML for first contact
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
      await generateProfileHTML(data);
    }
    
    // Also generate individual HTML files for all contacts
    await generateHTMLFiles(contacts);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
})();

