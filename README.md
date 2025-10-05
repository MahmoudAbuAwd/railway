# CSV to HTML Generator

A modern, professional HTML generation system that creates beautiful profile pages from CSV or API data. Works both as a Node.js command-line tool and as a browser-based web application.

## ✨ Features

- 🌐 **Dual Mode**: Browser-based web app + Node.js CLI tool
- 📊 **API Integration**: Fetches data from n8n webhook endpoints
- 📝 **Professional HTML**: Multi-section pages with modern design
- 🎨 **Beautiful UI**: Clean, gradient-based interface
- ⚡ **Fast Processing**: Optimized for batch generation
- 📱 **Responsive Design**: Works on all devices
- 🔒 **Privacy First**: No data stored, all processing client-side (web) or local (Node)

## 🚀 Quick Start

### Option 1: Web Application (Static Hosting)

1. **Fork this repository**
2. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Save and wait for deployment

3. **Access your app**: `https://YOUR_USERNAME.github.io/csv-to-html-generator/`

4. **Use the application**:
   - Enter your n8n webhook URL (or click "Demo Mode")
   - Click "Fetch Data" to load contacts
   - Click "Generate All HTML Files" or select specific contacts

### Option 2: Node.js CLI Tool

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Prepare your CSV file**: Place your data in `test.csv`

3. **Generate HTML files**:
   ```bash
   npm run generate
   ```
   or
   ```bash
   node pdf_generator.js
   ```

4. **Find HTML files**: Check the `generated_html/` folder

## 📋 CSV Data Format

Your CSV file should include the following columns:

### Personal Information
- `Full Name` - Person's full name
- `Contact Photo URL` - Profile image URL
- `Person Title` - Job title
- `Person State` - State/Province
- `Person Country` - Country
- `Summary About The Person` - Professional summary
- `Person Headline` - Professional headline
- `Education` - Educational background
- `Current Experience` - Current position
- `Experience 2-4` - Previous positions

### Contact Information
- `Person Contact Email` - Email address
- `Contact Phone` - Primary phone
- `Contact Second Phone` - Secondary phone
- `Contact LinkedIn` - LinkedIn profile URL

### Posts & Activity
- `Last Post For Person` (1-3) - Recent personal posts

### Company Information
- `Company Name` - Company name
- `Company Logo URL` - Company logo image URL
- `Company Website` - Company website URL
- `Company Tagline` - Company tagline
- `Company About` - Company description
- `Company Industry` - Industry sector
- `Company information Brief` - Detailed company information
- `Company Partners` - Business partners (semicolon-separated)
- `Company Last Events` - Recent company events
- `Company Last Post` (1-3) - Recent company posts
- `Contact Corporate Phone` - Corporate phone number
- `Company Address` - Full address

## 🎨 HTML Design Features

- **ID Card Page**: Beautiful cover with photo, name, and key info
- **Professional Sections**: Organized information with gradient accents
- **Modern Typography**: Inter font family with optimal hierarchy
- **Color Scheme**: Purple-blue gradient theme throughout
- **Smart Spacing**: Optimized layout with no wasted space
- **Copyable Text**: All content is selectable and copyable
- **Print-Friendly**: Styles include print considerations
- **Company Card**: Special design for company information

## 🔧 Configuration

### For Web Version

No configuration needed! Just use the web interface to:
- Enter API endpoints
- Load demo data
- Generate PDFs directly in browser

### For Node.js Version

Edit `pdf_generator.js` if you need to customize:
- PDF dimensions
- Font sizes
- Colors
- Layout spacing

## 📡 API Integration

The web version works with any API that returns JSON data with the fields listed above. Perfect for:

- **n8n workflows**: Create a webhook node that returns your CSV data as JSON
- **Custom APIs**: Any REST API endpoint that returns contact data
- **Demo Mode**: Built-in demo data for testing

### Example API Response Format:

```json
[
  {
    "Full Name": "John Doe",
    "Person Title": "Software Engineer",
    "Contact Photo URL": "https://example.com/photo.jpg",
    "Person State": "California",
    "Person Country": "USA",
    "Summary About The Person": "Experienced developer...",
    "Current Experience": "Senior Engineer at Tech Corp",
    "Person Contact Email": "john@example.com",
    "Company Name": "Tech Corp",
    "Company Logo URL": "https://example.com/logo.png",
    ...
  }
]
```

## 🏗️ Project Structure

```
├── index.html              # Web application interface
├── app.js                  # Browser PDF generator
├── pdf_generator.js        # Node.js PDF generator
├── demo-data.json          # Sample data for testing
├── test.csv                # CSV data file (for Node.js)
├── package.json            # Dependencies & scripts
├── generated_pdfs/         # Output folder (git-ignored)
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## 🛠️ Technical Details

### Technologies Used

**Frontend (Web App)**:
- Pure JavaScript (ES6+)
- Modern CSS with gradients and flexbox

**Backend (Node.js)**:
- PapaParse - CSV parsing
- Node.js File System API

### Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Any modern browser with ES6+ support

## 📝 Development

### Local Development (Web)

1. Clone the repository
2. Open `index.html` in a browser
3. Use a local server to avoid CORS issues:
   ```bash
   npx http-server .
   ```
4. Visit `http://localhost:8080`

### Local Development (Node.js)

1. Clone the repository
2. Install dependencies: `npm install`
3. Edit `test.csv` with your data
4. Run: `node pdf_generator.js`
5. Check `generated_html/` for output

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## 📄 License

MIT License - feel free to use and modify as needed.

## 🙏 Acknowledgments

- Design inspired by modern SaaS applications
- Built for n8n workflow automation
- Optimized for professional business use

---

**Made with ❤️ for automated profile generation**
