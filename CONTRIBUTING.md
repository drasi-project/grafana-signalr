# Contributing to Drasi SignalR Data Source Plugin

Thank you for your interest in contributing! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 8.x or later  
- Git
- Docker (for testing environment)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<GitHub username>/grafana-signalr.git
   cd grafana-signalr
   ```

3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/drasi-project/grafana-signalr.git
   ```

### Development Setup

## 🔧 Development

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Docker (for testing environment)

### Setup

```bash
# Install dependencies
npm install

# Start development mode (with hot reload)
npm run dev

# Run tests
npm test

# Run type checking
npm run typecheck

# Lint code
npm run lint
```

### Testing

```bash
# Unit tests
npm run test:ci

# End-to-end tests
npm run e2e

# Start test environment
docker-compose up --build
```

### Building

```bash
# Production build
npm run build

# Sign plugin (requires GRAFANA_ACCESS_POLICY_TOKEN)
npm run sign
```


## 📝 Making Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-authentication-support`
- `fix/connection-timeout-issue`
- `docs/update-installation-guide`

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Check TypeScript types
npm run typecheck
```

### Commit Messages

Follow conventional commit format:
```
type(scope): description

feat(query): add support for custom filters
fix(ui): resolve error message display issue
docs(readme): update installation instructions
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Maintenance tasks

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:ci

# End-to-end tests
npm run e2e

# Type checking
npm run typecheck
```

### Writing Tests

- Add unit tests for new functionality
- Update existing tests when modifying behavior
- Include integration tests for complex features
- Test error scenarios and edge cases

### Test Structure

```typescript
// Example test structure
describe('DataSource', () => {
  describe('query method', () => {
    it('should handle valid query', () => {
      // Test implementation
    });

    it('should handle invalid query', () => {
      // Test error scenarios
    });
  });
});
```

## 📚 Documentation

### Required Documentation

- Update README.md for new features
- Add inline code comments for complex logic
- Update CHANGELOG.md
- Create/update API documentation

### Documentation Style

- Use clear, concise language
- Include code examples
- Add screenshots for UI changes
- Keep documentation up-to-date with code changes

## 🔄 Pull Request Process

### Before Submitting

1. **Sync with upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**:
   ```bash
   npm run lint
   npm run typecheck
   npm run test:ci
   npm run build
   ```

3. **Test manually**:
   - Test in development environment
   - Verify functionality works as expected
   - Check error handling

### PR Requirements

- [ ] Clear description of changes
- [ ] Tests pass locally
- [ ] Code is linted and formatted
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated
- [ ] No breaking changes (or clearly documented)

### PR Template

Fill out the pull request template completely:
- Describe what you changed and why
- Link to related issues
- Include screenshots for UI changes
- List any breaking changes

## 🐛 Reporting Issues

### Bug Reports

Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, Grafana version)
- Console logs/error messages
- Screenshots if applicable

### Feature Requests

Include:
- Problem you're trying to solve
- Proposed solution
- Use cases and examples
- Alternatives considered

## 🏷️ Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)

### Release Steps

1. Update version in `package.json` and `src/plugin.json`
2. Update `CHANGELOG.md` with release notes
3. Create Git tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
4. Push tag: `git push upstream --tags`
5. GitHub Actions will handle the rest

## 🤝 Code of Conduct

### Our Standards

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Assume good intentions

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Public or private harassment
- Publishing private information

## 📞 Getting Help

### Community Support

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and community chat
- **Discord**: Real-time community support
- **Documentation**: Comprehensive guides and API reference

### Maintainer Contact

For security issues or maintainer-specific questions:
- Email: security@drasi.io
- Tag maintainers in GitHub issues

## 🎯 Development Guidelines

### Plugin Architecture

```
src/
├── components/          # React components
│   ├── ConfigEditor.tsx # Data source configuration
│   └── QueryEditor.tsx  # Query configuration
├── datasource.ts        # Main data source logic
├── module.ts           # Plugin module definition
└── types.ts            # TypeScript type definitions
```

### Adding New Features

1. **Design first**: Consider impact on existing functionality
2. **Type safety**: Add proper TypeScript types
3. **Error handling**: Handle all error scenarios gracefully
4. **Testing**: Add comprehensive tests
5. **Documentation**: Update relevant documentation

### Performance Considerations

- Minimize bundle size
- Optimize re-renders in React components
- Handle large data sets efficiently
- Use proper cleanup for subscriptions

### Security Guidelines

- Never expose sensitive data in logs
- Validate all user inputs
- Use secure communication protocols
- Follow Grafana security best practices

## 📋 Checklist for Contributors

Before submitting your contribution:

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated
- [ ] No sensitive data is committed
- [ ] Branch is up-to-date with main
- [ ] PR template is filled out completely

Thank you for contributing to the Drasi SignalR Data Source Plugin! 🎉