# Contributing to VOCH Platform

Thank you for your interest in contributing to VOCH (Voice of Change)! We welcome contributions from developers, designers, and community members who share our vision of creating a next-generation social media platform for civic engagement.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive experience for everyone. We expect all contributors to:

- Be respectful and considerate
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling, insulting, or derogatory remarks
- Publishing others' private information
- Any conduct that could be considered unprofessional

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**Good bug reports include:**
- Clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues.

**Good enhancement suggestions include:**
- Clear use case and benefits
- Detailed description of the proposed feature
- Mockups or examples (if applicable)
- Potential implementation approach

### Your First Code Contribution

Unsure where to start? Look for issues tagged with:
- `good first issue` - Suitable for beginners
- `help wanted` - Issues that need attention
- `documentation` - Improve our docs

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- Docker Desktop
- Git
- VS Code (recommended)

### Setup Steps

1. **Fork the repository**
```bash
# Click "Fork" button on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/voice-bharat.git
cd voice-bharat
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your local configuration
```

4. **Start Docker services**
```bash
npm run docker:up
```

5. **Run database migrations**
```bash
npm run prisma:migrate
npm run db:seed
```

6. **Start development servers**
```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Coding Standards

### General Principles

- Write clean, readable, and maintainable code
- Follow DRY (Don't Repeat Yourself)
- Keep functions small and focused
- Use meaningful variable and function names
- Comment complex logic, not obvious code

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type unless absolutely necessary
- Use enums for constants

### Frontend (Next.js)

- Use functional components with hooks
- Follow React best practices
- Implement proper error boundaries
- Optimize for performance (memoization, lazy loading)
- Use Tailwind CSS for styling

### Backend (NestJS)

- Follow NestJS architecture patterns
- Use dependency injection
- Implement proper validation with DTOs
- Write comprehensive error handling
- Use Prisma for database operations

### Testing

- Write unit tests for business logic
- Write integration tests for API endpoints
- Aim for >80% code coverage
- Run tests before submitting PR

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- path/to/test.spec.ts
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes
- `perf`: Performance improvements

### Examples

```bash
feat(auth): add Google OAuth integration

fix(api): resolve pagination issue in posts endpoint

docs(readme): update installation instructions

test(poll): add unit tests for poll voting logic
```

## Pull Request Process

### Before Submitting

1. **Create a branch**
```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/bug-description
```

2. **Make your changes**
- Write clean, tested code
- Follow coding standards
- Update documentation if needed

3. **Test thoroughly**
```bash
npm run lint
npm run test
npm run build
```

4. **Commit your changes**
```bash
git add .
git commit -m "feat(scope): descriptive message"
```

5. **Push to your fork**
```bash
git push origin feat/your-feature-name
```

### Submitting PR

1. Go to the original repository
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill in the PR template:
   - Description of changes
   - Related issues
   - Screenshots (if UI changes)
   - Testing done

### PR Review Process

- Maintainers will review your PR
- Address any requested changes
- Keep PR scope focused and small
- Be responsive to feedback
- Once approved, maintainers will merge

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Commit messages follow convention
- [ ] PR description is clear and complete

## Issue Guidelines

### Creating Issues

**Bug Report Template**
```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Step one
2. Step two
3. ...

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Node: [e.g., 18.17.0]
```

**Feature Request Template**
```markdown
**Feature Description**
Clear description of the feature

**Use Case**
Why is this feature needed?

**Proposed Solution**
How could this be implemented?

**Alternatives Considered**
Other approaches considered
```

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `question` - Further information requested
- `wontfix` - Will not be worked on

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feat/*` - Feature branches
- `fix/*` - Bug fix branches
- `docs/*` - Documentation branches

### Release Process

1. Features merged to `develop`
2. Testing on `develop`
3. Create release branch from `develop`
4. Merge release to `main` with version tag
5. Deploy to production

## Questions?

Feel free to:
- Open a [discussion](https://github.com/anurag698/voice-bharat/discussions)
- Ask in our [community chat](https://discord.gg/voch)
- Email: dev@voch.com

## Recognition

Contributors will be:
- Listed in our CONTRIBUTORS.md file
- Mentioned in release notes
- Given credit in documentation

Thank you for contributing to VOCH! Together we're building a platform that empowers voices and drives change. 🗣️✨
