# 🔱 Śrī Kālabhairava Sahasranāma Website

A beautiful, responsive website showcasing the 1000 sacred names of Lord Kālabhairava in both English and Hindi with detailed elaborations.

## ✨ Features

- **Bilingual Support**: Toggle between English (🇬🇧) and Hindi (🇮🇳)
- **Real-time Search**: Search across all names and meanings
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark Theme**: Blood red text on midnight black with divine gold accents
- **Sacred Background**: Transparent Maa Adya Kali deity image
- **Expandable Elaborations**: Detailed explanations for each name
- **Keyboard Shortcuts**: 
  - Press `/` to focus search
  - Press `ESC` to clear search

## 🚀 Modern Tech Stack

### Core Technologies
- **Pure Vanilla JavaScript** (ES6+) - No framework dependencies
- **Modern CSS3** with CSS Grid and Flexbox
- **HTML5** with semantic markup
- **Google Fonts** - Custom spiritual typography

### Why This Stack?

1. **Zero Build Process** - No npm, webpack, or bundlers needed
2. **Fast Loading** - Minimal dependencies, only fonts from CDN
3. **Easy Deployment** - Deploy anywhere that serves static files
4. **SEO Friendly** - Semantic HTML with proper meta tags
5. **Mobile First** - Responsive design with progressive enhancement
6. **Accessibility** - Keyboard navigation and semantic structure

## 📱 Mobile Optimization

- Touch-friendly buttons and controls
- Optimized font sizes for readability
- Adaptive grid layout (single column on mobile)
- Reduced animations on smaller screens
- Landscape mode support
- Fast tap response with proper touch targets (minimum 44px)

## 🌐 Deployment Options

### Option 1: GitHub Pages (FREE)
```bash
# Push to GitHub, then enable GitHub Pages in repo settings
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/kalabhairava-sahasranama.git
git push -u origin main
```
Then go to Settings → Pages → Source: main branch → /site folder

### Option 2: Netlify (FREE)
1. Drag and drop the `site` folder to [netlify.com/drop](https://app.netlify.com/drop)
2. Or connect your GitHub repo for auto-deployment
3. Custom domain support included

### Option 3: Vercel (FREE)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd site
vercel
```

### Option 4: Cloudflare Pages (FREE)
1. Connect your GitHub repository
2. Build settings: None needed (static site)
3. Build output directory: `site`

### Option 5: Traditional Web Hosting
Just upload the entire `site` folder to your web host via FTP/SFTP.

## 🛠️ Local Development

```bash
# Python 3
cd site
python -m http.server 8080

# Node.js
cd site
npx serve

# PHP
cd site
php -S localhost:8080
```

Visit: http://localhost:8080

## 🔢 Version Management

The website automatically increments its version number on each git commit. The version is stored in `version.txt` and displayed in the footer.

### Setup Auto-Increment Hook

**Windows (PowerShell):**
```powershell
.\setup_version_hook.ps1
```

**Linux/Mac/Git Bash:**
```bash
chmod +x setup_version_hook.sh
./setup_version_hook.sh
```

### Manual Version Increment

If you need to increment the version manually:

**Windows (PowerShell):**
```powershell
.\increment_version.ps1
```

**Linux/Mac/Git Bash:**
```bash
chmod +x increment_version.sh
./increment_version.sh
```

### How It Works

- The git pre-commit hook automatically increments the version before each commit
- Version format: `vX.Y` (e.g., v1.11 → v1.12) or `vX.Y.Z` (e.g., v1.11.0 → v1.11.1)
- The version is injected into `index.html` using `inject_version.py` during build
- The footer displays the current version dynamically

## 📁 File Structure

```
site/
├── index.html                    # Main HTML file
├── styles.css                    # All styles (CSS3 with custom properties)
├── app.js                        # Main application logic
├── sahasranama_meanings.json     # Data file (1000 names)
├── MaaAdyaKali_5.webp           # Background deity image (WebP preferred)
└── README.md                     # This file
```

## 🎨 Customization

### Colors
Edit CSS variables in `styles.css`:
```css
:root {
  --blood-red: #8B0000;
  --crimson: #DC143C;
  --deep-black: #0a0a0a;
  --divine-gold: #DAA520;
}
```

### Fonts
Update Google Fonts link in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Your+Font" rel="stylesheet">
```

### Data
Modify `sahasranama_meanings.json` with your own content structure.

## 🔧 Performance Optimizations

- **Lazy Loading**: Names load in batches (30 per page)
- **CSS Grid**: Efficient layout without JavaScript
- **Minimal JS**: ~200 lines of vanilla JavaScript
- **No Dependencies**: No React, Vue, or jQuery needed
- **Font Preloading**: Critical fonts loaded first
- **Image Optimization**: Background image with optimal opacity

## 📊 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ⚠️ IE11 not supported (uses modern CSS features)

## 🙏 Credits

**Website developed by:** Kaliputra Ashish

**Dedicated to:** Shri Praveen Radhakrishnan and Khyapa Parampara

**Data Source:** Traditional Kālabhairava Sahasranāma texts with English and Hindi translations

## 📄 License

This is a devotional website for spiritual purposes. Feel free to use and share with proper attribution.

---

## ॐ Om Shri Gurubhyo Namaha • Jai Kālabhairava • Jai Mā Ādya Mahākālī 🔱
