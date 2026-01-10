# SEO Content Studio

Professional SEO content generation studio powered by AI (Groq Llama 3.3 70B)

## 🎨 Features

- **AI-Powered Content Generation**: Generate SEO-optimized articles with Groq AI
- **SEO Scoring**: Real-time SEO score calculation with detailed checklist
- **Competitor Analysis**: Analyze competitor content structure and keywords
- **Modern UI**: Clean, minimal design inspired by Apify
- **Türkçe Support**: Full Turkish language support for content generation
- **Database**: JSON file-based storage (no native dependencies)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
# http://localhost:3000
```

**✅ Windows Compatible**: No need for Visual Studio Build Tools!

## 📦 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Font**: Inter (Google Fonts)
- **AI**: Groq API (Llama 3.3 70B Versatile)
- **Database**: JSON file-based (data/seo-studio.json)
- **Icons**: Lucide React

## 🔑 Environment Variables

Create a `.env.local` file:

```env
GROQ_API_KEY=your_groq_api_key
ADMIN_PASSWORD=123
SITE_NAME="SEO Studio"
SITE_URL=http://localhost:3000
AUTHOR_NAME="Content Writer"
```

## 📁 Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── dashboard/      # Main dashboard
│   ├── create/         # Content creation (main feature)
│   ├── contents/       # Content list & management
│   ├── analyze/        # Competitor analysis
│   └── api/            # API routes
├── components/
│   ├── ui/             # Reusable UI components
│   ├── layout/         # Layout components (Navbar, Container)
│   ├── seo/            # SEO-specific components
│   └── content/        # Content-related components
├── lib/
│   ├── ai/             # Groq AI integration
│   ├── db/             # JSON file-based database
│   ├── seo/            # SEO utilities
│   └── utils/          # Helper functions
└── types/              # TypeScript type definitions
```

## 💾 Database

Content is stored in `data/seo-studio.json`. The file is automatically created on first run.
```

## 🎯 Main Features

### 1. Content Generation
- AI-powered SEO content creation
- Customizable word count, tone, and content type
- Real-time SEO scoring
- Meta tags and schema markup generation

### 2. SEO Optimization
- Keyword density analysis
- Heading hierarchy check
- Meta description optimization
- LSI keywords integration
- Featured snippet suggestions

### 3. Content Management
- List all contents with filtering
- Edit and delete contents
- Track SEO scores
- Manage drafts and published content

### 4. Competitor Analysis
- Analyze competitor URLs
- Extract keywords and structure
- Compare heading hierarchies
- Generate insights

## 🎨 Design System

### Colors
- Primary: #FF6B00 (Orange)
- Background: #FFFFFF
- Text: #111827
- Border: #E5E7EB

### Typography
- Font: Inter
- Heading 1: 32px, bold
- Heading 2: 24px, semibold
- Body: 15px, regular

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a PR.
