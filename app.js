/**
 * CSV to PDF Generator - Enhanced Professional Version
 * A sophisticated browser-based solution for generating professional PDF profiles
 * from CSV data or API endpoints
 */

class PDFGenerator {
  constructor() {
      this.contacts = [];
      this.apiUrl = '';
      this.isGenerating = false;
      this.generationQueue = [];
      this.initializeEventListeners();
      this.initializeTheme();
  }

  /**
   * Initialize all event listeners for UI interactions
   */
  initializeEventListeners() {
      const eventBindings = {
          'fetchDataBtn': () => this.fetchData(),
          'demoDataBtn': () => this.loadDemoData(),
          'generatePdfsBtn': () => this.generateAllPDFs(),
          'generateSpecificBtn': () => this.showSpecificContactSection(),
          'downloadSpecificBtn': () => this.showSpecificContactSection(),
          'generateSelectedBtn': () => this.generateSelectedPDF()
      };

      Object.entries(eventBindings).forEach(([elementId, handler]) => {
          const element = document.getElementById(elementId);
          if (element) {
              element.addEventListener('click', handler);
          }
      });
  }

  /**
   * Initialize theme and visual enhancements
   */
  initializeTheme() {
      // Add smooth scroll behavior
      document.documentElement.style.scrollBehavior = 'smooth';
      
      // Check for dark mode preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.body.classList.add('dark-mode');
      }
  }

  /**
   * Fetch data from API endpoint
   * Handles various response formats including arrays and nested objects
   */
  async fetchData() {
      const apiUrl = document.getElementById('apiUrl').value.trim();
      
      if (!apiUrl) {
          this.showStatus('Please enter a valid API URL', 'error');
          return;
      }

      if (!this.isValidUrl(apiUrl)) {
          this.showStatus('Please enter a valid URL format', 'error');
          return;
      }

      this.apiUrl = apiUrl;
      this.showStatus('Fetching data from API...', 'loading');
      
      try {
          const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json',
              },
              timeout: 30000
          });

          if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const data = await response.json();
          this.contacts = this.parseResponseData(data);

          if (this.contacts.length === 0) {
              throw new Error('No contacts found in the response');
          }

          this.showStatus(`Successfully fetched ${this.contacts.length} contact${this.contacts.length > 1 ? 's' : ''}`, 'success');
          this.displayDataPreview();
          
      } catch (error) {
          console.error('Error fetching data:', error);
          this.showStatus(`Error fetching data: ${error.message}`, 'error');
      }
  }

  /**
   * Parse different API response formats
   * @param {Object|Array} data - Response data from API
   * @returns {Array} Parsed contacts array
   */
  parseResponseData(data) {
      if (Array.isArray(data)) {
          return data;
      }
      
      const possibleKeys = ['data', 'contacts', 'results', 'items'];
      for (const key of possibleKeys) {
          if (data[key] && Array.isArray(data[key])) {
              return data[key];
          }
      }
      
      throw new Error('Unexpected data format from API');
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid URL
   */
  isValidUrl(url) {
      try {
          new URL(url);
          return true;
      } catch {
          return false;
      }
  }

  /**
   * Load demo data from local JSON file
   */
  async loadDemoData() {
      this.showStatus('Loading demo data...', 'loading');
      
      try {
          const response = await fetch('./demo-data.json');
          if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          this.contacts = await response.json();
          
          if (!Array.isArray(this.contacts) || this.contacts.length === 0) {
              throw new Error('Invalid demo data format');
          }
          
          this.showStatus(`Successfully loaded ${this.contacts.length} demo contact${this.contacts.length > 1 ? 's' : ''}`, 'success');
          this.displayDataPreview();
          
      } catch (error) {
          console.error('Error loading demo data:', error);
          this.showStatus(`Error loading demo data: ${error.message}`, 'error');
      }
  }

  /**
   * Display preview of loaded contacts
   * Shows first 5 contacts and populates dropdown selector
   */
  displayDataPreview() {
      const preview = document.getElementById('dataPreview');
      const contactList = document.getElementById('contactList');
      const contactSelect = document.getElementById('contactSelect');
      
      if (!preview || !contactList || !contactSelect) {
          console.error('Preview elements not found');
          return;
      }
      
      preview.classList.remove('hidden');
      
      // Generate preview list
      const previewItems = this.contacts.slice(0, 5).map(contact => 
          this.generateContactPreviewItem(contact)
      ).join('');
      
      contactList.innerHTML = previewItems;
      
      // Add remaining count indicator
      if (this.contacts.length > 5) {
          contactList.innerHTML += `
              <div class="contact-item remaining-count">
                  <div class="contact-info">
                      <p class="count-text">... and ${this.contacts.length - 5} more contact${this.contacts.length - 5 > 1 ? 's' : ''}</p>
                  </div>
              </div>
          `;
      }
      
      // Populate dropdown selector
      this.populateContactSelector(contactSelect);
  }

  /**
   * Generate HTML for contact preview item
   * @param {Object} contact - Contact data
   * @returns {string} HTML string
   */
  generateContactPreviewItem(contact) {
      const fullName = this.getField(contact, 'Full Name', 'fullName', 'name') || 'Unknown Contact';
      const title = this.getField(contact, 'Person Title', 'title', 'position') || 'No title';
      const company = this.getField(contact, 'Company Name', 'company', 'companyName');
      const initials = this.generateInitials(fullName);
      
      return `
          <div class="contact-item">
              <div class="contact-avatar" title="${fullName}">${initials}</div>
              <div class="contact-info">
                  <h4 class="contact-name">${this.escapeHtml(fullName)}</h4>
                  <p class="contact-details">
                      ${this.escapeHtml(title)}${company ? ` at ${this.escapeHtml(company)}` : ''}
                  </p>
              </div>
          </div>
      `;
  }

  /**
   * Generate initials from full name
   * @param {string} fullName - Full name
   * @returns {string} Initials (max 2 characters)
   */
  generateInitials(fullName) {
      if (!fullName || fullName === 'Unknown Contact') return '?';
      
      const parts = fullName.trim().split(' ').filter(Boolean);
      if (parts.length === 0) return '?';
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
      
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Populate contact selector dropdown
   * @param {HTMLElement} selectElement - Select element
   */
  populateContactSelector(selectElement) {
      const options = ['<option value="">Choose a contact...</option>'];
      
      this.contacts.forEach((contact, index) => {
          const fullName = this.getField(contact, 'Full Name', 'fullName', 'name') || 'Unknown Contact';
          const title = this.getField(contact, 'Person Title', 'title', 'position') || 'No title';
          
          options.push(`
              <option value="${index}">
                  ${this.escapeHtml(fullName)} - ${this.escapeHtml(title)}
              </option>
          `);
      });
      
      selectElement.innerHTML = options.join('');
  }

  /**
   * Generate PDFs for all contacts
   * Processes contacts sequentially with progress updates
   */
  async generateAllPDFs() {
      if (this.contacts.length === 0) {
          this.showGenerationStatus('No contacts to process', 'error');
          return;
      }

      if (!this.checkLibrariesLoaded()) {
          this.showGenerationStatus('PDF libraries not loaded. Please refresh the page.', 'error');
          return;
      }

      if (this.isGenerating) {
          this.showGenerationStatus('Generation already in progress', 'warning');
          return;
      }

      this.isGenerating = true;
      this.showGenerationStatus('Starting PDF generation...', 'loading');
      
      const results = {
          total: this.contacts.length,
          processed: 0,
          successful: 0,
          failed: 0,
          errors: []
      };
      
      try {
          for (let i = 0; i < this.contacts.length; i++) {
              const contact = this.contacts[i];
              const fullName = this.getField(contact, 'Full Name', 'fullName', 'name');
              
              if (!fullName) {
                  results.failed++;
                  results.errors.push(`Contact ${i + 1}: No name provided`);
                  continue;
              }
              
              try {
                  this.showGenerationStatus(
                      `Generating PDF for ${fullName} (${i + 1}/${results.total})...`, 
                      'loading'
                  );
                  
                  await this.generatePDF(contact);
                  results.successful++;
                  results.processed++;
                  
                  const progress = (results.processed / results.total) * 100;
                  this.updateProgress(progress);
                  
                  // Small delay between generations to prevent browser freezing
                  await this.delay(500);
                  
              } catch (error) {
                  console.error(`Error generating PDF for ${fullName}:`, error);
                  results.failed++;
                  results.processed++;
                  results.errors.push(`${fullName}: ${error.message}`);
              }
          }
          
          // Display final summary
          const summaryMessage = `
              PDF generation complete! 
              Successful: ${results.successful}/${results.total}
              ${results.failed > 0 ? `Failed: ${results.failed}` : ''}
          `;
          
          this.showGenerationStatus(summaryMessage, results.failed > 0 ? 'warning' : 'success');
          
          // Log errors if any
          if (results.errors.length > 0) {
              console.warn('Generation errors:', results.errors);
          }
          
      } catch (error) {
          console.error('Batch generation error:', error);
          this.showGenerationStatus(`Batch generation failed: ${error.message}`, 'error');
      } finally {
          this.isGenerating = false;
      }
  }

  /**
   * Generate PDF for a single contact
   * @param {Object} contact - Contact data
   */
  async generatePDF(contact) {
      if (!this.checkLibrariesLoaded()) {
          throw new Error('jsPDF or html2canvas library not loaded');
      }

      try {
          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4',
              compress: true
          });

          // Generate HTML content
          const htmlContent = this.generateHTML(contact);
          
          // Create temporary container
          const tempDiv = this.createTempContainer(htmlContent);
          document.body.appendChild(tempDiv);

          // Wait for content to render
          await this.delay(2000);

          // Convert to canvas
          const canvas = await this.htmlToCanvas(tempDiv);

          // Add canvas to PDF with pagination
          this.addCanvasToPDF(pdf, canvas);

          // Generate filename and save
          const filename = this.generateFilename(contact);
          pdf.save(filename);
          
          // Cleanup
          this.removeTempContainer(tempDiv);
          
      } catch (error) {
          console.error('PDF generation error:', error);
          throw new Error(`PDF generation failed: ${error.message}`);
      }
  }

  /**
   * Check if required libraries are loaded
   * @returns {boolean} True if all libraries loaded
   */
  checkLibrariesLoaded() {
      return !!(window.jspdf && window.html2canvas);
  }

  /**
   * Create temporary container for PDF rendering
   * @param {string} htmlContent - HTML content to render
   * @returns {HTMLElement} Temporary container element
   */
  createTempContainer(htmlContent) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.cssText = `
          position: absolute;
          left: -9999px;
          top: 0;
          width: 210mm;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          background: white;
      `;
      tempDiv.className = 'pdf-render-container';
      return tempDiv;
  }

  /**
   * Remove temporary container
   * @param {HTMLElement} container - Container to remove
   */
  removeTempContainer(container) {
      if (container && document.body.contains(container)) {
          document.body.removeChild(container);
      }
  }

  /**
   * Convert HTML to canvas using html2canvas
   * @param {HTMLElement} element - Element to convert
   * @returns {Promise<HTMLCanvasElement>} Canvas element
   */
  async htmlToCanvas(element) {
      try {
          return await html2canvas(element, {
              scale: 2,
              useCORS: true,
              allowTaint: false,
              backgroundColor: '#ffffff',
              logging: false,
              width: 794,
              height: element.scrollHeight,
              windowWidth: 794,
              imageTimeout: 15000
          });
      } catch (error) {
          throw new Error(`Failed to convert HTML to canvas: ${error.message}`);
      }
  }

  /**
   * Add canvas to PDF with automatic pagination
   * @param {jsPDF} pdf - PDF document
   * @param {HTMLCanvasElement} canvas - Canvas to add
   */
  addCanvasToPDF(pdf, canvas) {
      const imgData = canvas.toDataURL('image/png', 0.95);
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
      }
  }

  /**
   * Generate filename for PDF
   * @param {Object} contact - Contact data
   * @returns {string} Sanitized filename
   */
  generateFilename(contact) {
      const fullName = this.getField(contact, 'Full Name', 'fullName', 'name') || 'Unknown';
      const sanitized = fullName
          .replace(/[^a-z0-9]/gi, '_')
          .replace(/_{2,}/g, '_')
          .toLowerCase();
      const timestamp = new Date().getTime();
      return `${sanitized}_profile_${timestamp}.pdf`;
  }

  /**
   * Generate complete HTML for contact profile
   * @param {Object} contact - Contact data
   * @returns {string} Complete HTML document
   */
  generateHTML(contact) {
      const data = this.extractContactData(contact);
      const initials = this.generateInitials(data.fullName);
      const totalPages = this.calculateTotalPages(data);
      
      return this.getHTMLTemplate(data, initials, totalPages);
  }

  /**
   * Extract and normalize contact data
   * @param {Object} contact - Raw contact data
   * @returns {Object} Normalized contact data
   */
  extractContactData(contact) {
      const fullName = this.getField(contact, 'Full Name', 'fullName', 'name');
      const nameParts = fullName ? fullName.split(' ') : ['', ''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      return {
          // Personal Information
          fullName: fullName || 'Unknown',
          firstName,
          lastName,
          contactPhotoUrl: this.getField(contact, 'Contact Photo URL', 'contactPhotoUrl', 'photoUrl'),
          title: this.getField(contact, 'Person Title', 'title', 'position'),
          personState: this.getField(contact, 'Person State', 'personState'),
          personCountry: this.getField(contact, 'Person Country', 'personCountry'),
          summary: this.getField(contact, 'Summary About The Person', 'summary', 'linkedinAbout'),
          headline: this.getField(contact, 'Person Headline', 'headline', 'linkedinHeadline'),
          education: this.getField(contact, 'Education', 'education'),
          
          // Experience
          currentExperience: this.getField(contact, 'Current Experience', 'currentExperience'),
          experience2: this.getField(contact, 'Experience 2', 'experience2'),
          experience3: this.getField(contact, 'Experience 3', 'experience3'),
          experience4: this.getField(contact, 'Experience 4', 'experience4'),
          
          // Posts
          lastPostPerson1: this.getField(contact, 'Last Post For Person', 'lastPostPerson1'),
          lastPostPerson2: this.getField(contact, 'Last Post For Person 2', 'lastPostPerson2'),
          lastPostPerson3: this.getField(contact, 'Last Post For Person 3', 'lastPostPerson3'),
          
          // Contact Info
          personContactEmail: this.getField(contact, 'Person Contact Email', 'email', 'contactEmail'),
          contactPhone: this.getField(contact, 'Contact Phone', 'mobile', 'contactPhone'),
          contactSecondPhone: this.getField(contact, 'Contact Second Phone', 'secondPhone', 'contactSecondPhone'),
          contactLinkedIn: this.getField(contact, 'Contact LinkedIn', 'linkedinUrl', 'contactLinkedIn'),
          
          // Company Information
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
          companyCountry: this.getField(contact, 'Company Country', 'country', 'companyCountry')
      };
  }

  /**
   * Calculate total pages based on available content
   * @param {Object} data - Contact data
   * @returns {number} Total number of pages
   */
  calculateTotalPages(data) {
      let pages = 1; // ID card page
      
      // Check for company information
      const hasCompanyInfo = this.hasValue(
          data.companyName, data.companyWebsite, data.companyTagline, 
          data.companyWebsiteBrief, data.companyAbout, data.companyIndustry,
          data.companyAddress, data.companyCity, data.companyLastPost1,
          data.companyPartners, data.companyLastEvents
      );
      
      if (hasCompanyInfo) {
          pages += 1;
      }
      
      return pages;
  }

  /**
   * Check if any value exists and is not empty/N/A
   * @param {...string} values - Values to check
   * @returns {boolean} True if at least one valid value exists
   */
  hasValue(...values) {
      return values.some(val => 
          val && val !== 'N/A' && val.toString().trim() !== ''
      );
  }

  /**
   * Get field value with fallback keys
   * @param {Object} contact - Contact object
   * @param {...string} keys - Possible keys to check
   * @returns {string} Field value or empty string
   */
  getField(contact, ...keys) {
      for (const key of keys) {
          const value = contact[key];
          if (value && value !== 'N/A' && value.toString().trim() !== '') {
              return value.toString();
          }
      }
      return '';
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
  }

  /**
   * Utility delay function
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Show status message
   * @param {string} message - Status message
   * @param {string} type - Status type (success, error, warning, loading)
   */
  showStatus(message, type) {
      const status = document.getElementById('status');
      if (!status) return;
      
      status.textContent = message;
      status.className = `status ${type}`;
      status.classList.remove('hidden');
      
      // Auto-hide success messages after 5 seconds
      if (type === 'success') {
          setTimeout(() => {
              status.classList.add('hidden');
          }, 5000);
      }
  }

  /**
   * Show generation status message
   * @param {string} message - Status message
   * @param {string} type - Status type
   */
  showGenerationStatus(message, type) {
      const status = document.getElementById('generationStatus');
      if (!status) return;
      
      status.textContent = message;
      status.className = `status ${type}`;
      status.classList.remove('hidden');
  }

  /**
   * Update progress bar
   * @param {number} percentage - Progress percentage (0-100)
   */
  updateProgress(percentage) {
      const progressFill = document.getElementById('progressFill');
      if (!progressFill) return;
      
      progressFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
      progressFill.setAttribute('aria-valuenow', percentage);
  }

  /**
   * Show specific contact selection section
   */
  showSpecificContactSection() {
      const section = document.getElementById('specificContactSection');
      if (!section) return;
      
      section.classList.remove('hidden');
      section.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /**
   * Generate PDF for selected contact
   */
  async generateSelectedPDF() {
      const contactSelect = document.getElementById('contactSelect');
      if (!contactSelect) return;
      
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
      
      if (!this.checkLibrariesLoaded()) {
          this.showGenerationStatus('PDF libraries not loaded. Please refresh the page.', 'error');
          return;
      }
      
      this.showGenerationStatus(`Generating PDF for ${fullName}...`, 'loading');
      
      try {
          await this.generatePDF(contact);
          this.showGenerationStatus(`Successfully generated PDF for ${fullName}`, 'success');
      } catch (error) {
          console.error(`Error generating PDF for ${fullName}:`, error);
          this.showGenerationStatus(`Error: ${error.message}`, 'error');
      }
  }

  /**
   * Get complete HTML template
   * @param {Object} data - Contact data
   * @param {string} initials - Contact initials
   * @param {number} totalPages - Total number of pages
   * @returns {string} Complete HTML template
   */
  getHTMLTemplate(data, initials, totalPages) {
      const hasCompanyInfo = this.hasValue(
          data.companyName, data.companyWebsite, data.companyTagline,
          data.companyWebsiteBrief, data.companyAbout, data.companyIndustry,
          data.companyAddress, data.companyCity, data.companyLastPost1,
          data.companyPartners, data.companyLastEvents
      );
      
      return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${data.fullName} - Professional Profile</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  ${this.getEnhancedStyles()}
</style>
</head>
<body>
${this.getIDCardPage(data, initials)}
${this.getProfilePage(data, totalPages)}
${hasCompanyInfo ? this.getCompanyPage(data, totalPages) : ''}
</body>
</html>
      `;
  }

  /**
   * Get enhanced CSS styles
   * @returns {string} CSS styles
   */
  getEnhancedStyles() {
      return `
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
    -webkit-user-select: text !important;
    user-select: text !important;
  }
  
  * {
    -webkit-user-select: text !important;
    user-select: text !important;
  }
  
  .page {
    width: 210mm;
    min-height: 297mm;
    background: #ffffff;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    page-break-after: always;
    position: relative;
    overflow: visible;
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
  
  /* ID Card Styles */
  .id-card-page {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    position: relative;
    overflow: hidden;
  }
  
  .id-card-page::before {
    content: '';
    position: absolute;
    width: 150%;
    height: 150%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    animation: pulse 15s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.1); opacity: 0.3; }
  }
  
  .id-card {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 32px;
    padding: 60px;
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255,255,255,0.1);
    max-width: 600px;
    width: 100%;
    text-align: center;
    position: relative;
    overflow: hidden;
    z-index: 1;
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
  
  .id-card::after {
    content: '';
    position: absolute;
    bottom: -50%;
    right: -50%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(102, 126, 234, 0.08) 0%, transparent 70%);
    border-radius: 50%;
  }
  
  .id-photo {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    object-fit: cover;
    margin: 0 auto 40px auto;
    border: 8px solid #ffffff;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(102, 126, 234, 0.1);
    display: block;
    position: relative;
    z-index: 2;
  }
  
  .id-name {
    font-size: 48px;
    font-weight: 900;
    color: #1a202c;
    margin-bottom: 20px;
    letter-spacing: -1px;
    position: relative;
    z-index: 2;
  }
  
  .id-current-role {
    font-size: 24px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 30px;
    position: relative;
    z-index: 2;
  }
  
  .id-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-top: 40px;
    position: relative;
    z-index: 2;
  }
  
  .id-info-item {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: 24px;
    border-radius: 16px;
    border-left: 6px solid #667eea;
    transition: transform 0.3s ease;
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
    padding: 32px;
    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.15);
    border: 1px solid rgba(102, 126, 234, 0.2);
    position: relative;
    overflow: hidden;
    margin-bottom: 24px;
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
    margin-bottom: 20px;
    page-break-inside: avoid;
    break-inside: avoid;
    background: #ffffff;
    border-radius: 16px;
    padding: 28px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
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
    margin-bottom: 20px;
    position: relative;
  }
  
  .section-icon {
    width: 42px;
    height: 42px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    box-shadow: 0 6px 18px rgba(102, 126, 234, 0.35);
    flex-shrink: 0;
  }
  
  .section-title {
    font-size: 24px;
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
    width: 50px;
    height: 4px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    border-radius: 2px;
  }
  
  .field-group {
    margin-bottom: 16px;
    padding: 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 12px;
    border-left: 5px solid #667eea;
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
    letter-spacing: 1.2px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .field-value {
    font-size: 15px;
    color: #1e293b;
    font-weight: 600;
    line-height: 1.7;
    word-break: break-word;
  }
  
  .field-value.long-text {
    font-size: 14px;
    line-height: 1.8;
    color: #475569;
    font-weight: 500;
  }
  
  .experience-grid {
    display: grid;
    gap: 16px;
  }
  
  .experience-item {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 12px;
    padding: 20px;
    border-left: 5px solid #667eea;
    position: relative;
    overflow: visible;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  .experience-item.current {
    border-left-color: #10b981;
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
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
    letter-spacing: 0.8px;
    margin-bottom: 10px;
  }
  
  .experience-item.current .experience-title {
    color: #10b981;
  }
  
  .posts-grid {
    display: grid;
    gap: 16px;
    margin-top: 12px;
  }
  
  .post-item {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 12px;
    padding: 24px;
    border-left: 5px solid #667eea;
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
    content: '"';
    position: absolute;
    top: 12px;
    right: 20px;
    font-size: 72px;
    font-weight: 900;
    color: rgba(102, 126, 234, 0.08);
    font-family: Georgia, serif;
    line-height: 1;
  }
  
  .post-content {
    font-size: 14px;
    color: #475569;
    line-height: 1.8;
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
    padding-left: 24px;
    margin-bottom: 10px;
    font-size: 14px;
    color: #475569;
    line-height: 1.7;
  }
  
  .bullet-list li::before {
    content: '●';
    position: absolute;
    left: 0;
    color: #667eea;
    font-weight: bold;
    font-size: 18px;
  }
  
  .page-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px 32px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    text-align: center;
    color: white;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
      `;
  }

  /**
   * Get ID card page HTML
   */
  getIDCardPage(data, initials) {
      return `
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
      ${this.hasValue(data.personState, data.personCountry) ? `
      <div class="id-info-item">
        <div class="id-info-label">Location</div>
        <div class="id-info-value">${[data.personState, data.personCountry].filter(Boolean).join(', ')}</div>
      </div>
      ` : ''}
      
      ${this.hasValue(data.education) ? `
      <div class="id-info-item">
        <div class="id-info-label">Education</div>
        <div class="id-info-value">${data.education}</div>
      </div>
      ` : ''}
      
      ${this.hasValue(data.title) ? `
      <div class="id-info-item">
        <div class="id-info-label">Title</div>
        <div class="id-info-value">${data.title}</div>
      </div>
      ` : ''}
    </div>
  </div>
</div>
      `;
  }

  /**
   * Get profile page HTML
   */
  getProfilePage(data, totalPages) {
      return `
<div class="page">
  <div class="content-area">
    
    ${this.hasValue(data.summary, data.headline, data.education) ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">👤</div>
        <h2 class="section-title">Personal Information</h2>
      </div>
      
      ${this.hasValue(data.summary) ? `
      <div class="field-group">
        <div class="field-label">📝 Summary</div>
        <div class="field-value long-text">${data.summary}</div>
      </div>
      ` : ''}
      
      ${this.hasValue(data.headline) ? `
      <div class="field-group">
        <div class="field-label">💡 Headline</div>
        <div class="field-value">${data.headline}</div>
      </div>
      ` : ''}
      
      ${this.hasValue(data.education) ? `
      <div class="field-group">
        <div class="field-label">🎓 Education</div>
        <div class="field-value">${data.education}</div>
      </div>
      ` : ''}
    </div>
    ` : ''}
    
    ${this.hasValue(data.currentExperience, data.experience2, data.experience3, data.experience4) ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">💼</div>
        <h2 class="section-title">Professional Experience</h2>
      </div>
      <div class="experience-grid">
        ${this.hasValue(data.currentExperience) ? `
        <div class="experience-item current">
          <div class="experience-title">Current Experience</div>
          <div class="field-value">${data.currentExperience}</div>
        </div>
        ` : ''}
        ${this.hasValue(data.experience2) ? `
        <div class="experience-item">
          <div class="experience-title">Experience 2</div>
          <div class="field-value">${data.experience2}</div>
        </div>
        ` : ''}
        ${this.hasValue(data.experience3) ? `
        <div class="experience-item">
          <div class="experience-title">Experience 3</div>
          <div class="field-value">${data.experience3}</div>
        </div>
        ` : ''}
        ${this.hasValue(data.experience4) ? `
        <div class="experience-item">
          <div class="experience-title">Experience 4</div>
          <div class="field-value">${data.experience4}</div>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}
    
    ${this.hasValue(data.lastPostPerson1, data.lastPostPerson2, data.lastPostPerson3) ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📝</div>
        <h2 class="section-title">Last Posts</h2>
      </div>
      <div class="posts-grid">
        ${this.hasValue(data.lastPostPerson1) ? `
        <div class="post-item">
          <div class="field-label">📝 Post 1</div>
          <div class="field-value long-text post-content">${data.lastPostPerson1}</div>
        </div>
        ` : ''}
        ${this.hasValue(data.lastPostPerson2) ? `
        <div class="post-item">
          <div class="field-label">📝 Post 2</div>
          <div class="field-value long-text post-content">${data.lastPostPerson2}</div>
        </div>
        ` : ''}
        ${this.hasValue(data.lastPostPerson3) ? `
        <div class="post-item">
          <div class="field-label">📝 Post 3</div>
          <div class="field-value long-text post-content">${data.lastPostPerson3}</div>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}
    
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📧</div>
        <h2 class="section-title">Contact Information</h2>
      </div>
      
      ${this.hasValue(data.personContactEmail) ? `
      <div class="field-group">
        <div class="field-label">📧 Email Address</div>
        <div class="field-value">${data.personContactEmail}</div>
      </div>
      ` : ''}
      
      ${this.hasValue(data.contactPhone) ? `
      <div class="field-group">
        <div class="field-label">📱 Primary Phone</div>
        <div class="field-value">${data.contactPhone}</div>
      </div>
      ` : ''}
      
      ${this.hasValue(data.contactSecondPhone) ? `
      <div class="field-group">
        <div class="field-label">☎️ Secondary Phone</div>
        <div class="field-value">${data.contactSecondPhone}</div>
      </div>
      ` : ''}
      
      ${this.hasValue(data.contactLinkedIn) ? `
      <div class="field-group">
        <div class="field-label">🔗 LinkedIn Profile</div>
        <div class="field-value">${data.contactLinkedIn}</div>
      </div>
      ` : ''}
    </div>
    
  </div>
</div>
      `;
  }

  /**
   * Get company page HTML
   */
  getCompanyPage(data, totalPages) {
      return `
<div class="page">
  <div class="content-area">
    
    ${this.hasValue(data.companyName, data.companyLogoUrl) ? `
    <div class="company-card">
      <div class="company-header">
        ${this.hasValue(data.companyLogoUrl) ? `
          <img src="${data.companyLogoUrl}" alt="${data.companyName}" class="company-logo" />
        ` : this.hasValue(data.companyName) ? `
          <div class="company-logo-placeholder">${data.companyName.charAt(0).toUpperCase()}</div>
        ` : ''}
        <div class="company-info">
          ${this.hasValue(data.companyName) ? `<div class="company-name-large">${data.companyName}</div>` : ''}
          ${this.hasValue(data.companyTagline) ? `<div class="company-tagline-large">${data.companyTagline}</div>` : ''}
        </div>
      </div>
    </div>
    ` : ''}
    
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🏢</div>
        <h2 class="section-title">Company Information</h2>
      </div>
      
      ${this.hasValue(data.companyWebsite) ? `
      <div class="field-group">
        <div class="field-label">🌐 Website</div>
        <div class="field-value">${data.companyWebsite}</div>
      </div>
      ` : ''}
      
      ${this.hasValue(data.companyTagline) ? `
      <div class="field-group">
        <div class="field-label">💬 Tagline</div>
        <div class="field-value">${data.companyTagline}</div>
      </div>
      ` : ''}
      
      ${this.hasValue(data.companyAbout) ? `
      <div class="field-group">
        <div class="field-label">📋 About</div>
        <div class="field-value long-text">${data.companyAbout}</div>
      </div>
      ` : ''}
      
      ${this.hasValue(data.companyWebsiteBrief) ? `
      <div class="field-group">
        <div class="field-label">📄 Company Brief</div>
        <div class="field-value long-text">${data.companyWebsiteBrief}</div>
      </div>
      ` : ''}
      
      ${this.hasValue(data.contactCorporatePhone) ? `
      <div class="field-group">
        <div class="field-label">📞 Corporate Phone</div>
        <div class="field-value">${data.contactCorporatePhone}</div>
      </div>
      ` : ''}
      
      ${this.hasValue(data.companyIndustry) ? `
      <div class="field-group">
        <div class="field-label">🏭 Industry</div>
        <div class="field-value">${data.companyIndustry}</div>
      </div>
      ` : ''}
    </div>
    
    ${this.hasValue(data.companyPartners) ? `
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
    
    ${this.hasValue(data.companyLastEvents) ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📅</div>
        <h2 class="section-title">Last Events</h2>
      </div>
      <div class="field-group">
        <div class="field-label">📅 Recent Events</div>
        <div class="field-value long-text">${data.companyLastEvents}</div>
      </div>
    </div>
    ` : ''}
    
    ${this.hasValue(data.companyAddress) ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📍</div>
        <h2 class="section-title">Company Location</h2>
      </div>
      <div class="field-group">
        <div class="field-label">🏠 Address</div>
        <div class="field-value">${data.companyAddress}</div>
      </div>
    </div>
    ` : ''}
    
    ${this.hasValue(data.companyLastPost1, data.companyLastPost2, data.companyLastPost3) ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">💬</div>
        <h2 class="section-title">Company Posts</h2>
      </div>
      <div class="posts-grid">
        ${this.hasValue(data.companyLastPost1) ? `
        <div class="post-item">
          <div class="field-label">💬 Company Post 1</div>
          <div class="field-value long-text post-content">${data.companyLastPost1}</div>
        </div>
        ` : ''}
        ${this.hasValue(data.companyLastPost2) ? `
        <div class="post-item">
          <div class="field-label">💬 Company Post 2</div>
          <div class="field-value long-text post-content">${data.companyLastPost2}</div>
        </div>
        ` : ''}
        ${this.hasValue(data.companyLastPost3) ? `
        <div class="post-item">
          <div class="field-label">💬 Company Post 3</div>
          <div class="field-value long-text post-content">${data.companyLastPost3}</div>
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
      `;
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PDFGenerator();
  console.log('PDF Generator initialized successfully');
});
