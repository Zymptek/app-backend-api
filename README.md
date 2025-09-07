# Zymptek Backend API

A robust NestJS backend API built with TypeScript, featuring comprehensive testing, code quality tools, and CI/CD pipeline.

## 🚀 Features

- **NestJS Framework** - Scalable Node.js server-side applications
- **TypeScript** - Type-safe development
- **Swagger Documentation** - Interactive API documentation
- **Comprehensive Testing** - Unit tests, E2E tests with Jest
- **Code Quality** - ESLint, Prettier, Husky pre-commit hooks
- **CI/CD Pipeline** - GitHub Actions for automated testing and deployment
- **Docker Support** - Containerized application
- **Security** - Helmet, CORS, validation pipes
- **Environment Configuration** - Flexible environment management
- **Prisma ORM** - Type-safe database access with PostgreSQL
- **Database Migrations** - Version-controlled database schema changes

## 📋 Prerequisites

- Node.js (v18.x or v20.x)
- npm or yarn
- PostgreSQL database
- Docker (optional)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   # Copy the appropriate environment file
   cp .env.development .env
   # Or for staging: cp .env.staging .env
   # Or for production: cp .env.production .env
   ```

4. **Environment setup**
   ```bash
   # Copy the appropriate environment file
   cp .env.development .env
   # Or for staging: cp .env.staging .env
   # Or for production: cp .env.production .env
   ```

5. **Database setup**
   ```bash
   # Generate Prisma client
   npm run prisma:generate:dev

   # Create and apply initial migration
   npm run prisma:migrate:dev -- --name init
   ```

6. **Start the application**
   ```bash
   # Development
   npm run start:dev

   # Staging
   npm run start:staging

   # Production
   npm run build:prod
   npm run start:prod
   ```

## 🗄️ Database Management

### **Safe Migration Workflow**

**Making Schema Changes:**
```bash
# 1. Edit prisma/schema.prisma
# Add/modify/remove models, fields, indexes, constraints

# 2. Create migration with descriptive name
npm run prisma:migrate:dev -- --name add_user_profile_table

# 3. Review generated SQL (optional but recommended)
cat prisma/migrations/[timestamp]_add_user_profile_table/migration.sql

# 4. Test your changes
npm run start:dev
npm test
```

**Deploying Changes:**
```bash
# To Staging
npm run prisma:migrate:staging

# To Production
npm run prisma:migrate:prod
```

### **Breaking Changes (DROP, ALTER, etc.)**
```bash
# 1. Create migration with --create-only flag
npm run prisma:migrate:dev -- --create-only --name breaking_change

# 2. Review the SQL file carefully
cat prisma/migrations/[timestamp]_breaking_change/migration.sql

# 3. Modify SQL if needed (add data migration, etc.)
# 4. Apply migration
npm run prisma:migrate:dev

# 5. Test thoroughly
npm run start:dev
npm test
```

### **Common Commands**
```bash
# View database
npm run prisma:studio:dev

# Check migration status
npx prisma migrate status

# Reset development database
npm run prisma:migrate:dev -- --reset
```

### **⚠️ Critical Rules**
1. **ALWAYS use migrations** - Never use `db push` in any environment
2. **ALWAYS test migrations on staging first** - Never go directly to production
3. **ALWAYS review generated SQL** - Check for breaking changes
4. **ALWAYS backup production database** before major migrations
5. **NEVER delete migration files** from `prisma/migrations/` folder

## 🧪 Testing

The project includes comprehensive testing setup:

- **Unit Tests** - Test individual components and services
- **E2E Tests** - Test complete user workflows
- **Coverage Reports** - Track test coverage
- **CI/CD Integration** - Automated testing on every commit

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e
```

## 📖 API Documentation

Once the application is running, you can access:

- **API Base URL**: `http://localhost:3000/api/v1`
- **Swagger Documentation**: `http://localhost:3000/api/v1/docs`

## 🌍 Environment Configuration

The application supports three environments with specific configurations:

### Development Environment
- **File**: `.env.development`
- **Features**: Swagger docs enabled, debug logging, lenient rate limiting
- **CORS**: Localhost origins allowed
- **Usage**: `npm run start:dev`

### Staging Environment  
- **File**: `.env.staging`
- **Features**: Swagger docs enabled, info logging, moderate rate limiting
- **CORS**: Staging domain origins
- **Usage**: `npm run start:staging`

### Production Environment
- **File**: `.env.production`
- **Features**: Swagger docs disabled, warn logging, strict rate limiting
- **CORS**: Production domain origins only
- **Usage**: `npm run start:prod`


### Environment Variables

Each environment file contains:

- `NODE_ENV` - Application environment
- `PORT` - Server port (default: 3000)
- `API_PREFIX` - API route prefix (default: api/v1)
- `CORS_ORIGIN` - Allowed origins for CORS
- `LOG_LEVEL` - Logging level (debug/info/warn)
- `SWAGGER_ENABLED` - Enable/disable API documentation
- Database configuration (when needed)
- JWT secrets (when implementing authentication)
- External API keys




## 🏗️ Project Structure

```
src/
├── app.controller.ts      # Main application controller
├── app.module.ts          # Root application module
├── app.service.ts         # Main application service
├── main.ts               # Application entry point
└── prisma/               # Prisma ORM integration
    ├── prisma.service.ts # Prisma service for database operations
    └── prisma.module.ts  # Prisma module for dependency injection

prisma/
├── schema.prisma         # Database schema definition
└── migrations/           # Database migration files

test/
└── app.e2e-spec.ts       # End-to-end tests

.github/
└── workflows/
    └── ci.yml            # GitHub Actions CI/CD pipeline

.env.development          # Development environment variables
.env.staging             # Staging environment variables  
.env.production          # Production environment variables
```

## 🔒 Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing configuration
- **Validation Pipes** - Input validation and sanitization
- **Compression** - Response compression
- **Environment Variables** - Secure configuration management

## 📝 Code Quality

- **ESLint** - Code linting with TypeScript support
- **Prettier** - Code formatting
- **Husky** - Git hooks for pre-commit checks
- **Lint-staged** - Run linters on staged files
- **Commitizen** - Conventional commit messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Run linting (`npm run lint`)
6. Commit your changes (`npm run commit`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📄 License

This project is licensed under the UNLICENSED License.

## 🆘 Support

For support and questions, please open an issue in the repository.

---

**Happy Coding! 🎉**
