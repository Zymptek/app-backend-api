# 🚀 Deployment Guide

This guide explains how to set up automated deployment to Vercel using GitHub Actions.

## 📋 Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository** - Your code should be in a GitHub repository
3. **Vercel Project** - Create a project in Vercel dashboard

## 🔧 Setup Instructions

### 1. Get Vercel Deploy Hooks

Your Vercel deploy hooks are already configured:

- **Development**: `https://api.vercel.com/v1/integrations/deploy/prj_re9pMsgKE3xxiD11YYNcplSYnAQH/BjA9LeveAP`
- **Production**: `https://api.vercel.com/v1/integrations/deploy/prj_re9pMsgKE3xxiD11YYNcplSYnAQH/JRaS83RZSw`

### 2. Configure GitHub Secrets

Add the following secret to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the secret:
   - **Name**: `VERCEL_TOKEN`
   - **Value**: Your Vercel API token (get from Vercel dashboard → Settings → Tokens)

### 3. Branch Strategy

The deployment is configured as follows:

- **`develop` branch** → Deploys to Vercel Development environment
- **`main` branch** → Deploys to Vercel Production environment

## 🔄 Deployment Flow

### Development Deployment

```bash
# Push to develop branch
git checkout develop
git add .
git commit -m "feat: new feature"
git push origin develop
```

**What happens:**
1. GitHub Actions runs tests
2. If tests pass, triggers Vercel development deployment
3. App deploys to development environment
4. Swagger docs available at: `https://your-dev-app.vercel.app/api/v1/docs`

### Production Deployment

```bash
# Push to main branch
git checkout main
git merge develop
git push origin main
```

**What happens:**
1. GitHub Actions runs tests
2. If tests pass, triggers Vercel production deployment
3. App deploys to production environment
4. Swagger docs available at: `https://your-prod-app.vercel.app/api/v1/docs`

## 📊 GitHub Actions Workflow

The workflow includes:

1. **Testing Phase**:
   - Runs on Node.js 18.x and 20.x
   - Linting, type checking, formatting checks
   - Unit tests for all environments (dev, staging, prod)
   - E2E tests

2. **Build Phase**:
   - Builds the application
   - Uploads build artifacts

3. **Deploy Phase**:
   - **Development**: Triggers on `develop` branch push
   - **Production**: Triggers on `main` branch push

## 🌍 Environment Configuration

### Development Environment
- **Branch**: `develop`
- **Vercel Hook**: Development hook
- **Environment**: Uses `.env.vercel` (Swagger enabled)
- **URL**: `https://your-dev-app.vercel.app`

### Production Environment
- **Branch**: `main`
- **Vercel Hook**: Production hook
- **Environment**: Uses `.env.vercel` (Swagger enabled)
- **URL**: `https://your-prod-app.vercel.app`

## 🔍 Monitoring Deployments

### GitHub Actions
- Go to your repository → **Actions** tab
- View deployment status and logs
- Check test results and build artifacts

### Vercel Dashboard
- Go to [vercel.com/dashboard](https://vercel.com/dashboard)
- View deployment history
- Monitor performance and logs
- Check environment variables

## 🛠️ Manual Deployment

If you need to deploy manually:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview (development)
vercel

# Deploy to production
vercel --prod
```

## 🔧 Troubleshooting

### Common Issues

1. **Deployment fails**:
   - Check GitHub Actions logs
   - Verify VERCEL_TOKEN secret is set
   - Ensure all tests pass

2. **Swagger docs not showing**:
   - Check if Vercel environment variables are set
   - Verify `SWAGGER_ENABLED=true` in Vercel dashboard

3. **Build fails**:
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check TypeScript compilation errors

### Debug Commands

```bash
# Test locally with production environment
NODE_ENV=production VERCEL=1 npm run start:prod

# Test build for Vercel
npm run vercel:build

# Check environment variables
vercel env ls
```

## 📚 API Documentation

Once deployed, your API documentation will be available at:

- **Development**: `https://your-dev-app.vercel.app/api/v1/docs`
- **Production**: `https://your-prod-app.vercel.app/api/v1/docs`

## 🔒 Security Notes

- Vercel deploy hooks are public URLs - keep them secure
- Use environment variables for sensitive data
- Never commit API keys or secrets to the repository
- Use GitHub Secrets for sensitive configuration

---

**Happy Deploying! 🚀**
