# Tests

Unit and integration tests for the pipeline.

## Structure

- `utils/` - Tests for utility functions
- `config/` - Tests for configuration loader
- `models/` - Tests for Zod schema validation
- `pipeline/` - Tests for pipeline stages
- `fixtures/` - Mock data and test fixtures

## Running Tests

```bash
npm run test
```

## Testing Strategy

- Configuration: Validate env parsing and defaults
- Models: Verify Zod schemas reject invalid data
- Utilities: Test error handling, retries, file I/O
- Pipeline: Integration tests with mock data
- Fixtures: Realistic test data matching production schemas

## TODO

- Add unit tests for utilities
- Add schema validation tests
- Add pipeline integration tests
- Add fixtures for all data types
