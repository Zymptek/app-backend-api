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

## 📋 Prerequisites

- Node.js (v18.x or v20.x)
- npm or yarn
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

4. **Start the application**
   ```bash
   # Development
   npm run start:dev

   # Staging
   npm run start:staging

   # Production
   npm run build:prod
   npm run start:prod
   ```

## 📚 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start` | Start the application |
| `npm run start:dev` | Start in development mode with hot reload |
| `npm run start:staging` | Start in staging mode |
| `npm run start:prod` | Start in production mode |
| `npm run start:debug` | Start in debug mode |
| `npm run build` | Build the application |
| `npm run build:dev` | Build for development environment |
| `npm run build:staging` | Build for staging environment |
| `npm run build:prod` | Build for production environment |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run lint` | Run ESLint and fix issues |
| `npm run lint:check` | Check for linting issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run type-check` | Run TypeScript type checking |
| `npm run commit` | Use commitizen for conventional commits |
| `npm run vercel:build` | Build for Vercel deployment |
| `npm run vercel:dev` | Start development server for Vercel |

## 🚀 Vercel Deployment

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # Deploy to preview (staging)
   vercel

   # Deploy to production
   vercel --prod
   ```

### Environment Variables in Vercel

Set up environment variables in your Vercel dashboard:

- **Development**: Set variables for development environment
- **Preview**: Set variables for staging environment  
- **Production**: Set variables for production environment

### Vercel Configuration

The project includes `vercel.json` configuration for optimal deployment:

- **Build Command**: `npm run vercel:build`
- **Output Directory**: `dist`
- **Runtime**: Node.js
- **Max Duration**: 30 seconds
- **Swagger Docs**: Enabled by default in Vercel deployments
- **Environment**: Automatically detects Vercel and loads `.env.vercel`

### Swagger Documentation in Vercel

Swagger documentation is automatically enabled in Vercel deployments and accessible at:
- **API Docs**: `https://your-app.vercel.app/api/v1/docs`

The app detects Vercel environment and enables Swagger regardless of the NODE_ENV setting.

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

### Vercel Environment
- **File**: `.env.vercel`
- **Features**: Swagger docs enabled, info logging, moderate rate limiting
- **CORS**: All origins allowed (for Vercel flexibility)
- **Usage**: Automatically used when deployed to Vercel

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

## 🚀 Deployment

### GitHub Actions

The project includes GitHub Actions workflow that:

- Runs on every push and pull request
- Tests on multiple Node.js versions (18.x, 20.x)
- Runs linting, type checking, and formatting checks
- Executes unit and E2E tests
- Builds the application
- Uploads coverage reports
- **Automatically deploys to Vercel**:
  - `develop` branch → Development environment
  - `main` branch → Production environment

### Automated Deployment Setup

1. **Add Vercel Token to GitHub Secrets**:
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Add secret: `VERCEL_TOKEN` with your Vercel API token

2. **Deploy Hooks Configured**:
   - **Development**: Automatically deploys when pushing to `develop` branch
   - **Production**: Automatically deploys when pushing to `main` branch

3. **View Deployments**:
   - Check GitHub Actions tab for deployment status
   - Monitor Vercel dashboard for deployment logs

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start in production**
   ```bash
   npm run start:prod
   ```

3. **Deploy to Vercel manually**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🏗️ Project Structure

```
src/
├── app.controller.ts      # Main application controller
├── app.module.ts          # Root application module
├── app.service.ts         # Main application service
└── main.ts               # Application entry point

test/
└── app.e2e-spec.ts       # End-to-end tests

.github/
└── workflows/
    └── ci.yml            # GitHub Actions CI/CD pipeline

Dockerfile                 # Docker configuration
docker-compose.yml        # Docker Compose configuration
.env.example              # Environment variables template
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
