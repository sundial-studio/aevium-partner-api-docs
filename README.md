# Aevium Partner API Examples

The code samples in this repository demonstrate Aevium's Partner API. They
are intended to document the API and provide example code. The code in this
repository will not be versioned or maintained and, as such, is not intended
for use as an external module.

## Executing Examples

Some example files can be executed as scripts.
[Node](https://nodejs.org/en/download) is a prerequisite.
Begin by installing dependencies:

```bash
$ npm install
```

To compile and run:

```bash
$ npx tsc && node build/examples/subscribe-link.js
```

## Environment Variables

Contact your Aevium representative for appropriate environment variables to
use during development. Create a file named `.env` in the root of
the repository for environment variables to be detected automatically.
See `.env.example` for guidance.
