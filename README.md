# 🔬 Lab Site - AI-Powered Health Analysis Platform

A sophisticated health analysis platform built with Next.js that uses AI to analyze blood tests, genetic data, and gut health reports.

## 🏥 Features

- **Blood Test Analysis** - AI-powered insights for lab results with personalized recommendations
- **Genetic Analysis** - DNA analysis across cardiovascular, metabolism, and other health categories
- **Gut Health Analysis** - Intestinal/microbiome assessment from medical reports
- **Whoop Integration** - Fitness tracker data analysis and recovery metrics
- **PDF Processing** - Extract and analyze data from medical reports
- **Data Visualization** - Interactive charts for health metrics

## 🔐 Private Access

This site is password protected. Access requires an access code which is shared privately.

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import from GitHub: `evesallesleite-cell/lab-site`
4. Click "Deploy"

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
OPENAI_API_KEY=your_openai_api_key_here
AI_MODEL=gpt-4o-mini
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

- `pages/` - Next.js pages and API routes
- `components/` - React components
- `lib/` - Utility functions and AI modules
- `public/` - Static assets
- `styles/` - Global styles

## 🤝 Collaboration

This repository uses a collaborative development workflow:
1. Eve creates feature branches for improvements
2. Changes are reviewed before merging to main
3. Only approved changes are pushed to production

## 📄 License

Private - All rights reserved