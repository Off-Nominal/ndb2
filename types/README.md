The package is currently in beta.

# NDB2 API Types

This package provides endpoint, entities, and other response types for the private [NDB2 API](https://github.com/Off-Nominal/ndb2) version 2 and later. You probably don't need this package but feel free to look around if you're super curious and bored.

## Installation

`npm install @offnominal/ndb2-api-types`

## Usage

API Versions will be appended to the import string. Currently only `v2` is planned.

```ts
import API from "@offnominal/ndb2-api-types/v2";
```

### Subtypes

The following types are available namespaced under your import value.

- Endpoints - Specific responses from each endpoint
- Entities - Data only types, which are wrapped in response objects for Endpoints
- Utils - Response Wrapper types
- Errors - Error Code enum for different error values you may receive

- Note, `Errors` is an enum, and therefore a value. This means you must import your types as a value and not a type.
