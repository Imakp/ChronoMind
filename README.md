# ChronoMind

> A year-based personal knowledge management system with intelligent cross-referencing through highlights and tags

ChronoMind is a modern web application designed to help you organize your thoughts, goals, and insights chronologically while maintaining powerful connections across time through a global tagging system. Built for individuals who value structured reflection and knowledge synthesis.

## 🧩 Description

ChronoMind transforms how you capture and connect your personal knowledge by organizing content into yearly containers with six specialized sections. Unlike traditional note-taking apps, ChronoMind emphasizes temporal organization while enabling cross-year discovery through its highlight-to-tag feature.

The application automatically creates daily log entries, tracks hierarchical goal progress, organizes reading notes, and provides dedicated spaces for lessons learned and creative ideas. Every piece of content can be highlighted and tagged, creating a web of connections that reveals patterns in your thinking across months and years.

## ⚙️ Features

### Year-Based Organization
- Create and manage separate yearly containers for your content
- Navigate seamlessly between different years
- Automatic initialization of all six sections when creating a new year

### Six Specialized Sections

**Daily Logs**
- Automatic creation of daily entries
- Chronological view of your daily thoughts and activities
- Rich text editing with full formatting support

**Quarterly Reflections**
- Four dedicated long-form editors (Q1, Q2, Q3, Q4)
- Perfect for deeper insights and periodic reviews
- Auto-save functionality to preserve your reflections

**Yearly Goals**
- Three-level hierarchy: Goals → Tasks → Sub-tasks
- Automatic percentage calculation that rolls up from sub-tasks
- Visual progress tracking at every level

**Book Notes**
- Three-tier organization: Genre → Book → Chapter
- Structured approach to capturing reading insights
- Expandable/collapsible navigation for easy browsing

**Lessons Learned**
- Card-based layout for discrete insights
- Quick capture of key learnings
- Chronologically organized for easy review

**Creative Dump**
- Unstructured space for spontaneous ideas
- No organizational overhead required
- Simple note collection with timestamps

### Global Tagging System
- Highlight any text in any section
- Assign multiple tags to highlighted content
- Tag Explorer view shows all content associated with specific tags
- Cross-year and cross-section content discovery
- Visual indicators for tagged content

### Rich Text Editing
- Powered by Tiptap editor
- Full formatting capabilities (bold, italic, lists, etc.)
- Text highlighting for tagging
- Auto-save across all sections

## 🚀 Installation & Setup

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL database (or Neon serverless PostgreSQL)
- npm or yarn package manager

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/chronomind"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Optional: OAuth providers
# GOOGLE_CLIENT_ID="your-google-client-id"
# GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Installation Steps

1. Clone the repository:
```bash
git clone https://github.com/Imakp/chronomind.git
cd chronomind
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Optional: Seed with sample data
npm run db:seed
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Build

```bash
npm run build
npm start
```

## 🧠 Usage

### Getting Started

1. **Sign Up/Sign In**: Create an account or sign in with your credentials
2. **Create Your First Year**: Click on the year selector and create a new year container
3. **Explore Sections**: Navigate through the six sections using the dashboard
4. **Start Writing**: Begin capturing content in any section with auto-save enabled

### Highlighting and Tagging

1. Select any text in any editor
2. A tagging menu will appear
3. Type tag names (comma-separated for multiple tags)
4. Press Enter to save
5. Tagged text will be visually highlighted

### Exploring Tags

1. Navigate to the Tags section
2. Browse all available tags
3. Click on any tag to see all associated content
4. View source information (year, section, date) for each highlight

### Managing Goals

1. Create a goal with a title
2. Add tasks under the goal
3. Add sub-tasks under each task
4. Check off sub-tasks as you complete them
5. Watch percentages automatically update up the hierarchy

### Organizing Book Notes

1. Create a genre (e.g., "Science Fiction", "Business")
2. Add books under the genre
3. Create chapters for each book
4. Write your notes in the chapter editor

## 🧰 Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Tiptap** - Rich text editor
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

### Backend
- **Next.js Server Actions** - Type-safe server operations
- **NextAuth.js v5** - Authentication
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **Neon** - Serverless PostgreSQL adapter
- **Zod** - Schema validation
- **bcryptjs** - Password hashing

### Development Tools
- **ESLint** - Code linting
- **tsx** - TypeScript execution
- **Prisma Studio** - Database GUI

## 🏗️ Project Structure

```
chronomind/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeding
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── auth/          # Authentication pages
│   │   ├── year/          # Year-specific pages
│   │   └── tags/          # Tag explorer pages
│   ├── components/
│   │   ├── editor/        # Rich text editor components
│   │   ├── navigation/    # Navigation components
│   │   ├── ui/            # Reusable UI components
│   │   └── [sections]/    # Section-specific components
│   ├── lib/
│   │   ├── actions.ts     # Server actions
│   │   └── db.ts          # Database utilities
│   ├── types/             # TypeScript type definitions
│   └── auth.ts            # NextAuth configuration
├── public/                # Static assets
└── .env                   # Environment variables
```

## 🧑‍💻 Contributing

Contributions are welcome! Here's how you can help:

### Reporting Issues

- Use the GitHub issue tracker
- Provide detailed reproduction steps
- Include screenshots for UI issues
- Specify your environment (OS, browser, Node version)

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes with clear commit messages
4. Write or update tests as needed
5. Ensure all tests pass: `npm test`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Open a pull request with a clear description

### Development Guidelines

- Follow the existing code style
- Write TypeScript with proper types
- Use Server Components by default, Client Components when needed
- Add comments for complex logic
- Update documentation for new features
- Ensure accessibility compliance

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📄 License

This project is private and proprietary. All rights reserved.

## 💬 Contact & Support

### Author
**ChronoMind Development Team**

### Getting Help
- **Issues**: [GitHub Issues](https://github.com/Imakp/chronomind/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Imakp/chronomind/discussions)

---

Built with ❤️ for Productivity
