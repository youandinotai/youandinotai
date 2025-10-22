# Replit.md

## Overview

This project is a modern dating application, uandinotai.com, designed with a full-stack TypeScript architecture. It aims to provide a platform for user connections through a swipe-based matching system and unlimited chat for matched users. Key capabilities include premium features for accessing unblurred explicit content and contact information, and an integrated branded merchandise store. The business vision is to offer a comprehensive dating experience with robust features and a clear path to monetization through subscriptions and merchandise sales.

## User Preferences

Preferred communication style: Simple, everyday language.
Self-hosting preference: User wants complete control over infrastructure and prefers self-hosted deployment over managed platform hosting.

## System Architecture

The application employs a monorepo structure, separating client, server, and shared code, built with a full-stack TypeScript architecture.

**Core Technologies & Decisions:**
- **Frontend**: React with TypeScript, using Vite for build processes.
- **Backend**: Express.js with TypeScript running on Node.js.
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations.
- **Authentication**: Replit Auth integration with session-based authentication.
- **UI/UX**: Tailwind CSS for styling with shadcn/ui component library, focusing on a modern, clean design with glassmorphism elements and a consistent monochrome branding with a unique logo.
- **Payment Processing**: Square payment integration handles premium subscriptions with production-ready security features including idempotency protection and webhook verification.
- **Routing**: `wouter` for client-side routing.
- **State Management**: TanStack Query for server state management.
- **Form Handling**: React Hook Form with Zod validation.
- **Database Schema**: Core entities include Users, Profiles, Likes, Matches, Messages, Products, and Sessions. Enhanced with location fields (latitude, longitude, searchRadius) for location-based search functionality.
- **File Storage**: Local file storage system using multer for photo uploads with proper validation and security.
- **Location Services**: Haversine formula-based distance calculation for location-based user search with customizable radius controls.
- **Data Flow**: Features user authentication via Replit Auth, profile discovery with location-based search, automatic match creation, unlimited real-time messaging, content protection (blurring for free users), premium feature access, and photo upload functionality.
- **Deployment Strategy**: Complete Docker-based self-hosting infrastructure with PostgreSQL, Redis, Nginx, automated backups, SSL certificates, and monitoring. Supports both Replit hosting and self-hosted infrastructure with full control over server configuration, monitoring, and scalability.
- **Feature Specifications**: Includes exact feature parity with the Feeld dating app, incorporating advanced identity systems, ping functionality, paired profiles, group chats, incognito mode, and location-based search capabilities.
- **Interactive Elements**: Features an interactive AI mascot based on the company logo for contextual user interactions and an animated 9-step onboarding tutorial led by the mascot.

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL connection pooling.
- **drizzle-orm**: Type-safe database operations.
- **square**: Square payment SDK for payment processing (v43.1.1).
- **@radix-ui/**\*: Accessible UI component primitives.
- **@tanstack/react-query**: Server state management.
- **Vite**: Frontend build tool and development server.
- **TypeScript**: Language for type safety across the stack.
- **Tailwind CSS**: Utility-first CSS framework.
- **drizzle-kit**: Database migration management.

## Deployment Infrastructure

Comprehensive deployment options supporting both cloud and self-hosted environments:

### Replit Hosting (Recommended for Quick Start)
- **Free Tier**: Available with .replit.app subdomain
- **Autoscale Deployment**: Automatic scaling based on traffic
- **Built-in SSL**: Automatic HTTPS certificates
- **Custom Domains**: Available with paid plans
- **Zero Configuration**: One-click deployment

### Self-Hosted Infrastructure
Complete self-hosting solution with enterprise-grade capabilities:
- **Deployment Scripts**: Automated scripts in `deployment/` directory for Ubuntu/Debian servers
- **Docker Setup**: Full Docker Compose configuration for containerized deployment
- **Web Server**: Nginx with SSL (Let's Encrypt), security headers, and rate limiting
- **DNS Automation**: Cloudflare API integration for automated DNS setup
- **Security**: Fail2ban, UFW firewall, SSL certificates, and security hardening
- **Monitoring**: Health checks, log rotation, and performance monitoring
- **Backup System**: Automated PostgreSQL backups with retention policies
- **Documentation**: Complete guides in `deployment/` directory:
  - `DOMAIN-DEPLOY-README.md` - DNS and domain configuration
  - `PRODUCTION-DEPLOYMENT-GUIDE.md` - Complete deployment walkthrough
  - `SQUARE_MIGRATION.md` - Payment integration guide
  - `cloudflare-dns-setup.ps1` - Automated DNS configuration
  - `deploy-production.sh` - Linux deployment automation

### Payment System (Square Integration)
- **Production Ready**: Real payment processing with Square v43.1.1 SDK
- **Security Features**:
  - Client-generated transaction IDs for idempotency
  - Webhook signature verification with raw body parsing
  - SessionStorage-based deduplication
  - Environment-aware configuration (sandbox/production)
- **Implementation**: One-time weekly payments ($9.99)
- **Future Ready**: Can upgrade to Square Subscriptions API for automatic recurring billing