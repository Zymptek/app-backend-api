This repository uses Jest with TypeScript for unit tests.

The file test/coding-standards.spec.ts contains a Coding Standards document rather than executable tests.
To protect the document’s integrity and ensure it remains complete and consistent, we add content validation
tests in test/coding-standards.validation.spec.ts. These tests assert the presence of key sections, examples,
and formatting conventions described in the standards.

If you update the Coding Standards document, ensure the tests still pass or update the expectations accordingly.