# Coding Standards

This document outlines the coding standards and best practices for the Zymptek Backend API project.

## General Principles

- **Consistency**: Follow established patterns throughout the codebase
- **Readability**: Write code that is self-documenting and easy to understand
- **Maintainability**: Structure code for long-term maintenance and scalability
- **Performance**: Optimize for efficiency without premature optimization

## Project Structure

### Directory Organization
```
src/
├── app.controller.ts          # Main application controller
├── app.module.ts              # Root module
├── app.service.ts             # Main application service
├── main.ts                    # Application entry point
└── [feature]/                 # Feature-specific modules
    ├── [feature].controller.ts
    ├── [feature].service.ts
    ├── [feature].module.ts
    └── [feature].spec.ts
```

### File Naming Conventions
- **Controllers**: `*.controller.ts`
- **Services**: `*.service.ts`
- **Modules**: `*.module.ts`
- **Tests**: `*.spec.ts` (unit tests), `*.e2e-spec.ts` (integration tests)
- **Interfaces**: `*.interface.ts`
- **DTOs**: `*.dto.ts`
- **Entities**: `*.entity.ts`

## TypeScript Standards

### Code Style
- Use **strict mode** TypeScript configuration
- Prefer `interface` over `type` for object shapes
- Use explicit return types for public methods
- Avoid `any` type - use `unknown` or proper typing instead

### Naming Conventions
- **Classes**: PascalCase (`UserService`, `AuthController`)
- **Methods/Functions**: camelCase (`getUserById`, `validateToken`)
- **Variables**: camelCase (`userId`, `isAuthenticated`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Private members**: Prefix with underscore (`_privateMethod`)

### Example:
```typescript
export class UserService {
  private readonly _maxRetryAttempts = 3;
  
  async getUserById(userId: string): Promise<User | null> {
    // Implementation
  }
}
```

## NestJS Best Practices

### Controllers
- Keep controllers thin - delegate business logic to services
- Use proper HTTP status codes
- Implement proper error handling
- Use DTOs for request/response validation

```typescript
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getUser(@Param('id') id: string): Promise<UserDto> {
    return this.userService.findById(id);
  }
}
```

### Services
- Implement business logic
- Use dependency injection properly
- Handle errors appropriately
- Return meaningful data types

### Modules
- Organize features into modules
- Export only necessary components
- Use proper imports and exports

## Database Standards

### Prisma Schema
- Use descriptive table and column names
- Include proper indexes for performance
- Use appropriate data types
- Add comments for complex fields

### Migrations
- Use descriptive migration names
- Test migrations on development data
- Include rollback procedures when possible

## Testing Standards

### Unit Tests
- Test one function/method at a time
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Aim for high code coverage on critical paths

### Integration Tests
- Test complete workflows
- Use test database
- Clean up test data after tests

### Example Test Structure:
```typescript
describe('UserService', () => {
  let service: UserService;
  let mockRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    // Setup
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = '123';
      const expectedUser = { id: userId, name: 'John' };
      mockRepository.findById.mockResolvedValue(expectedUser);

      // Act
      const result = await service.getUserById(userId);

      // Assert
      expect(result).toEqual(expectedUser);
    });
  });
});
```

## Error Handling

### Exception Types
- Use NestJS built-in exceptions (`BadRequestException`, `NotFoundException`, etc.)
- Create custom exceptions for business logic errors
- Provide meaningful error messages

### Error Response Format:
```typescript
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users"
}
```

## Environment Configuration

### Environment Variables
- Use separate configurations for dev, staging, and production
- Validate environment variables at startup
- Use descriptive variable names
- Document all required environment variables

### Configuration Structure:
```typescript
export interface AppConfig {
  port: number;
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
}
```

## Security Standards

### Authentication & Authorization
- Use JWT tokens for authentication
- Implement proper role-based access control
- Validate all input data
- Use HTTPS in production

### Data Protection
- Sanitize user inputs
- Use parameterized queries
- Implement rate limiting
- Log security events

## Performance Guidelines

### Database
- Use proper indexing
- Avoid N+1 queries
- Implement pagination for large datasets
- Use connection pooling

### API
- Implement caching where appropriate
- Use compression
- Optimize response payloads
- Monitor performance metrics

## Documentation Standards

### Code Comments
- Write self-documenting code
- Add comments for complex business logic
- Document public APIs
- Keep comments up-to-date

### API Documentation
- Use OpenAPI/Swagger decorators
- Document all endpoints
- Include example requests/responses
- Document error scenarios

## Git Standards

### Commit Messages
- Use concise, descriptive commit messages
- Follow conventional commit format when applicable
- Reference issue numbers when relevant

### Branch Naming
- Use descriptive branch names
- Prefix with feature type (`feature/`, `bugfix/`, `hotfix/`)
- Use kebab-case for multi-word names

### Pull Requests
- Keep PR descriptions concise
- Include system diagrams for complex changes
- Reference related issues
- Ensure all tests pass

## Code Review Guidelines

### Review Checklist
- [ ] Code follows established patterns
- [ ] Tests are included and meaningful
- [ ] Error handling is appropriate
- [ ] Performance considerations addressed
- [ ] Security best practices followed
- [ ] Documentation updated if needed

### Review Process
- All code must be reviewed before merging
- Address all review comments
- Use constructive feedback
- Focus on code quality and maintainability

## Tools and Linting

### ESLint Configuration
- Follow NestJS recommended ESLint rules
- Use Prettier for code formatting
- Configure IDE to format on save

### Pre-commit Hooks
- Run linting and formatting checks
- Execute unit tests
- Check for security vulnerabilities

## Deployment Standards

### Environment Setup
- Use environment-specific configurations
- Implement proper logging
- Monitor application health
- Use proper error tracking

### Deployment Process
- Deploy to staging before production
- Use blue-green deployment when possible
- Implement proper rollback procedures
- Monitor deployment metrics

---

## Quick Reference

### Common Patterns

**Service Method:**
```typescript
async methodName(param: Type): Promise<ReturnType> {
  try {
    // Implementation
    return result;
  } catch (error) {
    throw new InternalServerErrorException('Error message');
  }
}
```

**Controller Endpoint:**
```typescript
@Post()
@HttpCode(HttpStatus.CREATED)
async create(@Body() dto: CreateDto): Promise<ResponseDto> {
  return this.service.create(dto);
}
```

**Module Structure:**
```typescript
@Module({
  imports: [/* dependencies */],
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService],
})
export class FeatureModule {}
```

Remember: These standards are living documents. Update them as the project evolves and new patterns emerge.
