# Overview

This is an MSME (Micro, Small, and Medium Enterprises) Passport MVP application - a digital business passport platform that allows businesses to create profiles and generate QR-enabled digital business cards. The application serves as a prototype for helping ASEAN region businesses establish their digital identity and connect with potential partners.

The platform enables businesses to sign up, complete their business profiles, and unlock a digital passport that can be shared via QR codes. The design incorporates ASEAN-inspired color themes (blue, yellow, green, red) and focuses on a clean, minimal user experience.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**React Single Page Application**: Built with React 18 using TypeScript, featuring a component-based architecture with client-side routing via Wouter. The application uses a modern build pipeline with Vite for fast development and optimized production builds.

**UI Framework**: Implements Shadcn/UI components built on top of Radix UI primitives, providing a consistent design system with Tailwind CSS for styling. The design system includes custom ASEAN-themed color variables and responsive layouts optimized for both desktop and mobile devices.

**State Management**: Uses TanStack Query (React Query) for server state management, caching, and data synchronization. Local authentication state is managed through a singleton AuthManager class with localStorage persistence.

**Routing Strategy**: Implements client-side routing with protected routes that redirect unauthenticated users to the login page. The route structure includes login, signup, dashboard, profile form, and passport pages.

## Backend Architecture

**Express.js API Server**: RESTful API built with Express.js using TypeScript and ES modules. The server implements middleware for request logging, JSON parsing, and error handling.

**Storage Layer**: Currently uses an in-memory storage implementation (MemStorage) that maintains data in Map objects. This provides a simple development storage solution that can be easily replaced with a database implementation.

**API Design**: Follows REST conventions with clear separation between authentication routes (/api/auth) and profile management routes (/api/profile). All endpoints return consistent JSON responses with proper HTTP status codes.

**Development Workflow**: Integrated with Vite in development mode for hot module replacement and seamless full-stack development experience.

## Data Architecture

**Database Schema**: Defined using Drizzle ORM with PostgreSQL as the target database. The schema includes users table for authentication and business_profiles table for company information, with proper foreign key relationships.

**Data Validation**: Uses Zod schemas for runtime type validation and data parsing, ensuring type safety between frontend and backend. Schema definitions are shared between client and server through a common shared directory.

**Profile Completion System**: Implements a business profile completion workflow where users must fill required fields (address, category, phone, website, tagline) to unlock their digital passport.

## Authentication System

**Session Management**: Basic authentication flow with user credentials stored in memory during development. User sessions are maintained through localStorage on the client side.

**Protection Mechanism**: Route-level protection using a ProtectedRoute component that checks authentication status and redirects unauthorized users.

**User Flow**: Complete signup → login → dashboard → profile completion → passport unlock workflow.

## QR Code Integration

**External QR Generation**: Uses the QRCode.js library loaded dynamically from CDN to generate QR codes for business passports. QR codes link to shareable business profile URLs.

**Share Functionality**: Implements native Web Share API with clipboard fallback for sharing digital passport links across platforms.

# External Dependencies

## UI and Styling
- **Shadcn/UI**: Complete component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Radix UI**: Unstyled, accessible UI primitives for complex components
- **Lucide React**: Icon library for consistent iconography

## State Management and Data Fetching
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling with validation
- **Zod**: Schema validation and type safety

## Backend Infrastructure
- **Express.js**: Web application framework
- **Drizzle ORM**: Type-safe database toolkit for PostgreSQL
- **Neon Database**: Serverless PostgreSQL database service

## Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type-safe JavaScript development
- **ESBuild**: Fast JavaScript bundler for production builds

## Third-Party Services
- **QRCode.js**: External CDN library for QR code generation
- **Google Fonts**: Web font delivery (DM Sans, Geist Mono, Architects Daughter, Fira Code)
- **Replit Integration**: Development environment integration with error overlays and banners

## Authentication and Session Storage
- **LocalStorage**: Client-side session persistence
- **Connect-pg-simple**: PostgreSQL session store for future database integration