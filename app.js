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
          'generatePdfsBtn': () => this.generateAllHTMLs(),
          'generateSpecificBtn': () => this.showSpecificContactSection(),
          'downloadSpecificBtn': () => this.showSpecificContactSection(),
          'generateSelectedBtn': () => this.generateSelectedHTML(),
          'triggerWorkflowBtn': () => this.triggerWorkflow()
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
   * Trigger n8n workflow via webhook
   */
  async triggerWorkflow() {
      const webhookUrl = document.getElementById('workflowWebhook').value.trim();
      const statusElement = document.getElementById('workflowStatus');
      
      if (!webhookUrl) {
          this.showWorkflowStatus('Please enter a valid webhook URL', 'error');
          return;
      }

      if (!this.isValidUrl(webhookUrl)) {
          this.showWorkflowStatus('Please enter a valid URL format', 'error');
          return;
      }

      this.showWorkflowStatus('Triggering n8n workflow...', 'loading');
      
      try {
          // Try GET request first (most n8n webhooks work with GET)
          let response;
          let method = 'GET';
          
          try {
              // Attempt GET request with query parameters
              const urlWithParams = new URL(webhookUrl);
              urlWithParams.searchParams.append('triggered_at', new Date().toISOString());
              urlWithParams.searchParams.append('source', 'html_generator_app');
              
              response = await fetch(urlWithParams.toString(), {
                  method: 'GET',
                  mode: 'no-cors', // This allows the request to go through despite CORS
                  cache: 'no-cache'
              });
              
              console.log('Workflow triggered with GET request');
              
          } catch (getError) {
              console.log('GET request failed, trying POST with no-cors mode');
              
              // If GET fails, try POST with no-cors mode
              method = 'POST';
              response = await fetch(webhookUrl, {
                  method: 'POST',
                  mode: 'no-cors', // This allows the request to go through despite CORS
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                      triggered_at: new Date().toISOString(),
                      source: 'html_generator_app'
                  })
              });
          }

          // With no-cors mode, we can't read the response, but the request was sent
          // If we get here without error, the request was successful
          console.log('Workflow trigger request sent successfully');
          
          this.showWorkflowStatus('✓ Workflow triggered successfully! Section will hide temporarily.', 'success');
          
          // Hide the section after 3 seconds
          setTimeout(() => {
              const workflowSection = document.getElementById('workflowTriggerSection');
              if (workflowSection) {
                  workflowSection.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                  workflowSection.style.opacity = '0';
                  workflowSection.style.transform = 'translateY(-20px)';
                  
                  setTimeout(() => {
                      workflowSection.style.display = 'none';
                  }, 500);
              }
          }, 1000);
          
      } catch (error) {
          console.error('Error triggering workflow:', error);
          this.showWorkflowStatus(`Error: ${error.message}. The workflow may still have been triggered. Check your n8n logs.`, 'error');
          
          // Even on error, we might have triggered the workflow
          // Give option to mark as triggered anyway
          setTimeout(() => {
              this.showWorkflowStatus(
                  'If your workflow was triggered successfully (check n8n logs), click "Execute Workflow" again to hide this section.',
                  'warning'
              );
          }, 5000);
      }
  }

  /**
   * Show workflow status message
   * @param {string} message - Status message
   * @param {string} type - Status type (success, error, warning, loading)
   */
  showWorkflowStatus(message, type) {
      const status = document.getElementById('workflowStatus');
      if (!status) return;
      
      status.textContent = message;
      status.className = `status ${type}`;
      status.classList.remove('hidden');
      
      // Auto-hide success/error messages after 5 seconds
      if (type === 'error') {
          setTimeout(() => {
              status.classList.add('hidden');
          }, 5000);
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
   * Generate HTML files for all contacts
   * Processes contacts sequentially with progress updates
   */
  async generateAllHTMLs() {
      if (this.contacts.length === 0) {
          this.showGenerationStatus('No contacts to process', 'error');
          return;
      }
      if (this.isGenerating) {
          this.showGenerationStatus('Generation already in progress', 'warning');
          return;
      }

      this.isGenerating = true;
      this.showGenerationStatus('Starting HTML generation...', 'loading');
      
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
                      `Generating HTML for ${fullName} (${i + 1}/${results.total})...`, 
                      'loading'
                  );

                  await this.generateAndDownloadHTML(contact);
                  results.successful++;
                  results.processed++;
                  
                  const progress = (results.processed / results.total) * 100;
                  this.updateProgress(progress);
                  
                  // Small delay between generations to prevent browser freezing
                  await this.delay(500);
                  
              } catch (error) {
                  console.error(`Error generating HTML for ${fullName}:`, error);
                  results.failed++;
                  results.processed++;
                  results.errors.push(`${fullName}: ${error.message}`);
              }
          }
          
          // Display final summary
          const summaryMessage = `
              HTML generation complete! 
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
   * Generate and download HTML for a single contact
   * @param {Object} contact - Contact data
   */
  async generateAndDownloadHTML(contact) {
      const htmlContent = this.generateHTML(contact);
      const filename = this.generateHTMLFilename(contact);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
  generateHTMLFilename(contact) {
      const fullName = this.getField(contact, 'Full Name', 'fullName', 'name') || 'Unknown';
      const sanitized = fullName
          .replace(/[^a-z0-9]/gi, '_')
          .replace(/_{2,}/g, '_')
          .toLowerCase();
      const timestamp = new Date().getTime();
      return `${sanitized}_profile_${timestamp}.html`;
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
   * Generate HTML for selected contact
   */
  async generateSelectedHTML() {
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
      this.showGenerationStatus(`Generating HTML for ${fullName}...`, 'loading');
      
      try {
          await this.generateAndDownloadHTML(contact);
          this.showGenerationStatus(`Successfully generated HTML for ${fullName}`, 'success');
      } catch (error) {
          console.error(`Error generating HTML for ${fullName}:`, error);
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
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>${data.fullName} - Portfolio Profile</title>

	<!-- Google Fonts -->
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">

	<style>
		:root {
			--bg: #f7f8fc;
			--card: #ffffff;
			--text: #0f172a;
			--muted: #64748b;
			--primary: #6366f1;
			--primary-600: #4f46e5;
			--accent: #a78bfa;
			--blue: #60a5fa;
			--ring: rgba(99, 102, 241, 0.35);
			--border: #e5e7eb;
			--shadow: 0 10px 30px rgba(2, 6, 23, 0.08), 0 2px 8px rgba(2, 6, 23, 0.04);
			--radius-lg: 16px;
			--radius-md: 14px;
			--radius-sm: 12px;
			--space: 22px;
			--space-lg: 28px;
			--space-xl: 44px;
			--maxw: 1100px;
		}

		* { box-sizing: border-box; }

		html, body {
			margin: 0;
			padding: 0;
		}

		body {
			font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji, "Poppins", sans-serif;
			color: var(--text);
			background:
				radial-gradient(1200px 700px at 10% -10%, rgba(99,102,241,0.12), rgba(99,102,241,0) 40%),
				radial-gradient(900px 600px at 110% 10%, rgba(96,165,250,0.12), rgba(96,165,250,0) 40%),
				radial-gradient(900px 700px at -10% 100%, rgba(167,139,250,0.12), rgba(167,139,250,0) 40%),
				var(--bg);
			line-height: 1.55;
		}

		a { color: var(--primary-600); text-decoration: none; }
		a:hover { text-decoration: underline; }

		.container {
			max-width: var(--maxw);
			margin: 0 auto;
			padding: 28px 20px 64px;
		}

		/* Hero Card */
		.hero {
			position: relative;
			background: linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0.95));
			backdrop-filter: saturate(180%) blur(10px);
			border: 1px solid var(--border);
			border-radius: 24px;
			padding: 48px;
			box-shadow: var(--shadow);
			overflow: hidden;
			margin-bottom: 40px;
		}
		.hero:before {
			content: "";
			position: absolute;
			inset: -1px;
			border-radius: 22px;
			background:
				radial-gradient(800px 240px at 50% -10%, rgba(99, 102, 241, 0.15), transparent 40%),
				radial-gradient(600px 240px at 10% 20%, rgba(96, 165, 250, 0.12), transparent 50%),
				radial-gradient(700px 240px at 90% 30%, rgba(167, 139, 250, 0.12), transparent 45%);
			pointer-events: none;
			z-index: 0;
		}
		.hero-inner {
			position: relative;
			z-index: 1;
			display: grid;
			grid-template-columns: 180px 1fr;
			gap: 32px;
			align-items: center;
		}
		@media (max-width: 640px) {
			.hero-inner {
				grid-template-columns: 1fr;
				text-align: center;
				gap: 20px;
			}
		}
		.avatar {
			width: 180px;
			height: 180px;
			border-radius: 24px;
			overflow: hidden;
			border: 1px solid var(--border);
			box-shadow: 0 12px 30px rgba(2, 6, 23, 0.15);
			background: linear-gradient(135deg, #6366f1, #8b5cf6);
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 72px;
			font-weight: 900;
			color: white;
		}
		.avatar img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			display: block;
		}
		.hero-meta h1 {
			font-family: Poppins, Inter, sans-serif;
			font-weight: 800;
			letter-spacing: -0.5px;
			margin: 0 0 10px 0;
			font-size: clamp(32px, 5vw, 48px);
		}
		.hero-meta .role {
			color: var(--muted);
			font-weight: 600;
			margin-bottom: 16px;
			font-size: 18px;
		}
		.hero-actions {
			display: flex;
			gap: 10px;
			flex-wrap: wrap;
			margin-top: 4px;
		}
		.pill {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 6px 10px;
			border-radius: 999px;
			background: #f3f6ff;
			color: #27357a;
			border: 1px solid #e6eaff;
			font-weight: 600;
			font-size: 12px;
		}

		/* Section heading */
		.section-title {
			display: flex;
			align-items: center;
			gap: 14px;
			margin: 32px 0 20px;
			font-family: Poppins, Inter, sans-serif;
			font-weight: 800;
			letter-spacing: -0.3px;
			font-size: 28px;
			color: var(--text);
		}
		.section-title .bar {
			width: 32px;
			height: 10px;
			border-radius: 8px;
			background: linear-gradient(90deg, var(--primary), var(--accent), var(--blue));
			box-shadow: 0 8px 20px rgba(79, 70, 229, 0.4);
			animation: pulse-bar 2s ease-in-out infinite;
		}
		@keyframes pulse-bar {
			0%, 100% { transform: scaleX(1); opacity: 1; }
			50% { transform: scaleX(1.1); opacity: 0.8; }
		}

		/* Card grid */
		.grid {
			display: grid;
			grid-template-columns: 1fr;
			gap: 18px;
		}

		.card {
			background: var(--card);
			border: 1px solid var(--border);
			border-radius: var(--radius-lg);
			padding: var(--space-lg);
			box-shadow: var(--shadow);
			transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease;
			will-change: transform;
			position: relative;
			overflow: hidden;
		}
		.card::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 3px;
			background: linear-gradient(90deg, var(--primary), var(--accent), var(--blue));
			opacity: 0;
			transition: opacity .3s ease;
		}
		.card:hover {
			transform: translateY(-6px);
			box-shadow: 0 20px 50px rgba(99, 102, 241, 0.18), 0 8px 20px rgba(99, 102, 241, 0.08);
			border-color: rgba(99, 102, 241, 0.3);
		}
		.card:hover::before {
			opacity: 1;
		}

		.card .card-headline {
			display: flex;
			align-items: center;
			gap: 12px;
			margin: 0 0 20px 0;
			font-weight: 800;
			font-size: 20px;
			font-family: Poppins, Inter, sans-serif;
			color: var(--text);
			padding-bottom: 12px;
			border-bottom: 2px solid #f1f5f9;
		}
		.card .card-headline .icon {
			width: 24px;
			height: 24px;
			color: var(--primary-600);
			flex: 0 0 24px;
			font-size: 24px;
			filter: drop-shadow(0 2px 4px rgba(99, 102, 241, 0.2));
		}

		/* Content styling inside cards */
		.card :where(h1, h2, h3, h4) { margin: 14px 0 8px; font-weight: 700; }
		.card :where(h1, h2) { font-size: 18px; }
		.card :where(h3, h4) { font-size: 16px; }
		.card p { margin: 8px 0; color: var(--text); }
		.card .muted, .card small, .card .subtle { color: var(--muted); }

		.card ul, .card ol {
			margin: 10px 0 10px 20px;
			padding: 0;
		}
		.card li { margin: 6px 0; }

		.card a {
			color: var(--primary-600);
			font-weight: 600;
			text-decoration: none;
			border-bottom: 1px dashed rgba(79,70,229,0.35);
			transition: color .2s ease, border-color .2s ease, background .2s ease;
			border-radius: 6px;
			padding: 2px 4px;
		}
		.card a:hover {
			color: #1f2a63;
			background: rgba(79,70,229,0.06);
			border-color: transparent;
			text-decoration: none;
		}

		/* Key-value rows */
		.kv {
			display: grid;
			grid-template-columns: 180px 1fr;
			gap: 6px 14px;
			margin-top: 20px;
		}
		@media (max-width: 640px) {
			.kv { grid-template-columns: 1fr; }
		}
		.kv .k { color: var(--muted); font-weight: 600; font-size: 14px; }
		.kv .v { color: var(--text); font-size: 14px; word-break: break-word; }

		/* Experience blocks */
		.experience-grid {
			display: grid;
			gap: 14px;
			margin-top: 16px;
		}
		.xp {
			padding: 18px;
			border-radius: 14px;
			background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
			border-left: 5px solid var(--primary);
			font-size: 14px;
			line-height: 1.7;
			box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08);
			transition: transform .3s ease, box-shadow .3s ease, border-left-width .3s ease;
			position: relative;
			overflow: hidden;
		}
		.xp::after {
			content: '';
			position: absolute;
			right: 10px;
			top: 10px;
			width: 40px;
			height: 40px;
			background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
			border-radius: 50%;
		}
		.xp:hover {
			transform: translateX(4px);
			box-shadow: 0 8px 20px rgba(99, 102, 241, 0.15);
			border-left-width: 8px;
		}
		.xp.current {
			border-left-color: #10b981;
			background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
			box-shadow: 0 4px 12px rgba(16, 185, 129, 0.12);
		}
		.xp.current::after {
			background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
		}
		.xp.current:hover {
			box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2);
		}
		.xp-label {
			font-size: 12px;
			font-weight: 800;
			color: var(--primary);
			text-transform: uppercase;
			letter-spacing: 1px;
			margin-bottom: 8px;
			display: flex;
			align-items: center;
			gap: 6px;
		}
		.xp-label::before {
			content: '💼';
			font-size: 14px;
		}
		.xp.current .xp-label { color: #10b981; }
		.xp.current .xp-label::before { content: '⭐'; }

		/* Posts */
		.posts-grid {
			display: grid;
			gap: 14px;
			margin-top: 16px;
		}
		.post {
			padding: 18px;
			border-radius: 14px;
			background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
			border-left: 5px solid #10b981;
			font-size: 14px;
			line-height: 1.7;
			font-style: italic;
			color: #065f46;
			box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
			transition: transform .3s ease, box-shadow .3s ease;
			position: relative;
			overflow: hidden;
		}
		.post::before {
			content: '💬';
			position: absolute;
			top: 12px;
			right: 12px;
			font-size: 28px;
			opacity: 0.15;
		}
		.post:hover {
			transform: translateX(4px);
			box-shadow: 0 8px 20px rgba(16, 185, 129, 0.18);
		}
		.post-label {
			font-size: 11px;
			font-weight: 800;
			color: #10b981;
			text-transform: uppercase;
			letter-spacing: 1px;
			margin-bottom: 8px;
			display: block;
			font-style: normal;
		}

		/* Company section */
		.company-header {
			display: flex;
			align-items: center;
			gap: 18px;
			padding: 22px;
			border-radius: 16px;
			background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
			border: 1px solid var(--border);
			margin-bottom: 20px;
			box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08);
			transition: transform .3s ease, box-shadow .3s ease;
		}
		.company-header:hover {
			transform: translateY(-2px);
			box-shadow: 0 8px 20px rgba(99, 102, 241, 0.12);
		}
		.company-logo-box {
			width: 70px;
			height: 70px;
			border-radius: 12px;
			background: white;
			display: flex;
			align-items: center;
			justify-content: center;
			overflow: hidden;
			border: 1px solid var(--border);
			flex-shrink: 0;
		}
		.company-logo-box img {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}
		.company-logo-placeholder {
			font-weight: 900;
			color: var(--primary);
			font-size: 28px;
		}
		.company-name {
			font-size: 22px;
			font-weight: 800;
			color: var(--text);
			margin-bottom: 4px;
		}
		.company-tagline {
			font-size: 13px;
			color: var(--muted);
		}

		.list {
			list-style: none;
			padding: 0;
			margin: 8px 0;
		}
		.list li {
			position: relative;
			padding-left: 20px;
			margin-bottom: 6px;
			font-size: 14px;
			color: #475569;
			line-height: 1.6;
		}
		.list li::before {
			content: '';
			position: absolute;
			left: 0;
			top: 8px;
			width: 6px;
			height: 6px;
			border-radius: 50%;
			background: linear-gradient(135deg, var(--primary), var(--accent));
			box-shadow: 0 0 0 2px rgba(99,102,241,0.2);
		}

		/* About Section */
		.about-section {
			padding: 20px;
			border-radius: 14px;
			background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
			border-left: 5px solid #0ea5e9;
			margin-top: 16px;
			box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
			transition: transform .3s ease, box-shadow .3s ease;
		}
		.about-section:hover {
			transform: translateY(-2px);
			box-shadow: 0 8px 20px rgba(14, 165, 233, 0.15);
		}
		.about-section strong {
			font-size: 16px;
			font-weight: 800;
			color: #0c4a6e;
			display: flex;
			align-items: center;
			gap: 8px;
			margin-bottom: 12px;
			font-family: Poppins, Inter, sans-serif;
		}
		.about-section strong::before {
			content: 'ℹ️';
			font-size: 20px;
		}
		.about-section p {
			font-size: 15px;
			line-height: 1.8;
			color: #164e63;
			margin: 0;
		}

		/* Recent Events */
		.events-section {
			padding: 20px;
			border-radius: 14px;
			background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
			border-left: 5px solid #10b981;
			margin-top: 16px;
			box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
			transition: transform .3s ease, box-shadow .3s ease;
			position: relative;
			overflow: hidden;
		}
		.events-section::after {
			content: '📅';
			position: absolute;
			top: 15px;
			right: 15px;
			font-size: 32px;
			opacity: 0.2;
		}
		.events-section:hover {
			transform: translateY(-2px);
			box-shadow: 0 8px 20px rgba(16, 185, 129, 0.18);
		}
		.events-section strong {
			font-size: 16px;
			font-weight: 800;
			color: #065f46;
			display: flex;
			align-items: center;
			gap: 8px;
			margin-bottom: 12px;
			font-family: Poppins, Inter, sans-serif;
		}
		.events-section strong::before {
			content: '🎯';
			font-size: 20px;
		}
		.events-section p {
			font-size: 15px;
			line-height: 1.8;
			color: #065f46;
			margin: 0;
			font-weight: 600;
		}

		/* Brief Section */
		.brief-section {
			padding: 18px;
			border-radius: 14px;
			background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
			border-left: 5px solid #a855f7;
			margin-top: 16px;
			box-shadow: 0 4px 12px rgba(168, 85, 247, 0.1);
			transition: transform .3s ease, box-shadow .3s ease;
		}
		.brief-section:hover {
			transform: translateY(-2px);
			box-shadow: 0 8px 20px rgba(168, 85, 247, 0.15);
		}
		.brief-section strong {
			font-size: 15px;
			font-weight: 800;
			color: #6b21a8;
			display: block;
			margin-bottom: 10px;
			font-family: Poppins, Inter, sans-serif;
		}
		.brief-section p {
			font-size: 14px;
			line-height: 1.7;
			color: #581c87;
			margin: 0;
		}

		/* Footer */
		.footer {
			margin-top: 28px;
			display: flex;
			justify-content: center;
			color: var(--muted);
			font-size: 13px;
		}
	</style>
</head>
<body>
	<div class="container">
		<!-- HERO -->
		<section class="hero">
			<div class="hero-inner">
				<div class="avatar">
					${data.contactPhotoUrl ? `<img src="${data.contactPhotoUrl}" alt="${data.fullName}" onerror="this.parentElement.textContent='${initials}'">` : `${initials}`}
				</div>
				<div class="hero-meta">
					<h1>${data.fullName}</h1>
					${this.hasValue(data.title, data.companyName) ? `
					<div class="role" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-start;">
						${this.hasValue(data.title) ? `<span style="color: var(--muted);">${data.title}</span>` : ''}
						${this.hasValue(data.title, data.companyName) ? `<span style="color: var(--muted);">•</span>` : ''}
						${this.hasValue(data.companyName) ? `<span style="color: #10b981; font-weight: 700;">🏢 ${data.companyName}</span>` : ''}
					</div>
					` : ''}
					<div class="hero-actions">
						${this.hasValue(data.personState, data.personCountry) ? `<span class="pill">📍 ${[data.personState, data.personCountry].filter(Boolean).join(', ')}</span>` : ''}
						${this.hasValue(data.education) ? `<span class="pill">🎓 ${data.education}</span>` : ''}
					</div>
				</div>
			</div>
		</section>

		<!-- USER INFORMATION SECTION -->
		<div class="section-title"><span class="bar"></span><span>Lead Information</span></div>

		<div class="grid">
			<section class="card">
				<div class="card-headline">
					<span class="icon">👤</span>
					Lead Profile
				</div>

				${this.hasValue(data.summary) ? `
				<div class="about-section">
					<strong>Professional Summary</strong>
					<p>${data.summary}</p>
				</div>
				` : ''}
				
				${this.hasValue(data.headline) ? `
				<div class="brief-section">
					<strong>Professional Headline</strong>
					<p>${data.headline}</p>
				</div>
				` : ''}

				<div class="kv">
					${this.hasValue(data.personContactEmail) ? `<div class="k">Email</div><div class="v"><a href="mailto:${data.personContactEmail}">${data.personContactEmail}</a></div>` : ''}
					${this.hasValue(data.contactPhone) ? `<div class="k">Phone</div><div class="v"><a href="tel:${data.contactPhone}">${data.contactPhone}</a></div>` : ''}
					${this.hasValue(data.contactSecondPhone) ? `<div class="k">Second Phone</div><div class="v"><a href="tel:${data.contactSecondPhone}">${data.contactSecondPhone}</a></div>` : ''}
					${this.hasValue(data.contactLinkedIn) ? `<div class="k">LinkedIn</div><div class="v"><a href="${data.contactLinkedIn}" target="_blank" rel="noopener">View Profile</a></div>` : ''}
				</div>

				${this.hasValue(data.currentExperience, data.experience2, data.experience3, data.experience4) ? `
				<div class="experience-grid">
					${this.hasValue(data.currentExperience) ? `<div class="xp current"><div class="xp-label">Current Job</div>${data.currentExperience}</div>` : ''}
					${this.hasValue(data.experience2) ? `<div class="xp"><div class="xp-label">Previous Job</div>${data.experience2}</div>` : ''}
					${this.hasValue(data.experience3) ? `<div class="xp"><div class="xp-label">Previous Job</div>${data.experience3}</div>` : ''}
					${this.hasValue(data.experience4) ? `<div class="xp"><div class="xp-label">Previous Job</div>${data.experience4}</div>` : ''}
				</div>
				` : ''}

				${this.hasValue(data.lastPostPerson1, data.lastPostPerson2, data.lastPostPerson3) ? `
				<div style="margin-top:20px;">
					<strong style="font-size:16px;color:var(--text);font-family:Poppins,Inter,sans-serif;display:block;margin-bottom:4px;">LinkedIn Posts</strong>
					<div class="posts-grid">
						${this.hasValue(data.lastPostPerson1) ? `<div class="post"><span class="post-label">📌 LinkedIn Post #1</span>${data.lastPostPerson1}</div>` : ''}
						${this.hasValue(data.lastPostPerson2) ? `<div class="post"><span class="post-label">📌 LinkedIn Post #2</span>${data.lastPostPerson2}</div>` : ''}
						${this.hasValue(data.lastPostPerson3) ? `<div class="post"><span class="post-label">📌 LinkedIn Post #3</span>${data.lastPostPerson3}</div>` : ''}
					</div>
				</div>
				` : ''}
			</section>
		</div>

		<!-- COMPANY INFORMATION SECTION -->
		${hasCompanyInfo ? `
		<div class="section-title" style="margin-top:40px;"><span class="bar"></span><span>Company Information</span></div>

		<div class="grid">
			<section class="card">
				<div class="card-headline">
					<span class="icon">🏢</span>
					Company Details
				</div>

				${(this.hasValue(data.companyName) || this.hasValue(data.companyLogoUrl) || this.hasValue(data.companyTagline)) ? `
				<div class="company-header">
					<div class="company-logo-box">
						${this.hasValue(data.companyLogoUrl) ? `<img src="${data.companyLogoUrl}" alt="${data.companyName}">` : `<span class="company-logo-placeholder">${(data.companyName||'?').charAt(0).toUpperCase()}</span>`}
					</div>
					<div>
						${this.hasValue(data.companyName) ? `<div class="company-name">${data.companyName}</div>` : ''}
						${this.hasValue(data.companyTagline) ? `<div class="company-tagline">${data.companyTagline}</div>` : ''}
					</div>
				</div>
				` : ''}

				<div class="kv">
					${this.hasValue(data.companyWebsite) ? `<div class="k">Website</div><div class="v"><a href="${data.companyWebsite}" target="_blank" rel="noopener">${data.companyWebsite}</a></div>` : ''}
					${this.hasValue(data.companyIndustry) ? `<div class="k">Industry</div><div class="v">${data.companyIndustry}</div>` : ''}
					${this.hasValue(data.contactCorporatePhone) ? `<div class="k">Phone</div><div class="v">${data.contactCorporatePhone}</div>` : ''}
					${this.hasValue(data.companyAddress) ? `<div class="k">Address</div><div class="v">${data.companyAddress}</div>` : ''}
					${this.hasValue(data.companyCity) ? `<div class="k">City</div><div class="v">${data.companyCity}</div>` : ''}
					${this.hasValue(data.companyState) ? `<div class="k">State</div><div class="v">${data.companyState}</div>` : ''}
					${this.hasValue(data.companyCountry) ? `<div class="k">Country</div><div class="v">${data.companyCountry}</div>` : ''}
				</div>

				${this.hasValue(data.companyAbout) ? `
				<div class="about-section">
					<strong>About the Company</strong>
					<p>${data.companyAbout}</p>
				</div>
				` : ''}
				${this.hasValue(data.companyWebsiteBrief) ? `
				<div class="brief-section">
					<strong>Company Brief</strong>
					<p>${data.companyWebsiteBrief}</p>
				</div>
				` : ''}

				${this.hasValue(data.companyPartners) ? `
				<div class="events-section">
					<strong>Partners</strong>
					<ul class="list">
						${data.companyPartners.split(';').map(p => `<li>${p.trim()}</li>`).join('')}
					</ul>
				</div>
				` : ''}

				${this.hasValue(data.companyLastEvents) ? `
				<div class="events-section">
					<strong>Recent Events</strong>
					<ul class="list">
						${data.companyLastEvents.split(';').map(event => `<li>${event.trim()}</li>`).join('')}
					</ul>
				</div>
				` : ''}

				${this.hasValue(data.companyLastPost1, data.companyLastPost2, data.companyLastPost3) ? `
				<div style="margin-top:20px;">
					<strong style="font-size:16px;color:var(--text);font-family:Poppins,Inter,sans-serif;display:block;margin-bottom:4px;">Company LinkedIn Posts</strong>
					<div class="posts-grid">
						${this.hasValue(data.companyLastPost1) ? `<div class="post"><span class="post-label">🏢 Company LinkedIn Post #1</span>${data.companyLastPost1}</div>` : ''}
						${this.hasValue(data.companyLastPost2) ? `<div class="post"><span class="post-label">🏢 Company LinkedIn Post #2</span>${data.companyLastPost2}</div>` : ''}
						${this.hasValue(data.companyLastPost3) ? `<div class="post"><span class="post-label">🏢 Company LinkedIn Post #3</span>${data.companyLastPost3}</div>` : ''}
					</div>
				</div>
				` : ''}
			</section>
		</div>
		` : ''}

		<div class="footer">Build With Kawkab AI</div>
	</div>
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
