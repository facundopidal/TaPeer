# Specification: Share Ingestion

## Domain: share-ingestion

### Requirements
| ID | Description | Strength |
|---|---|---|
| ING-REQ-101 | Client MUST detect `title`, `text`, or `url` query parameters on load. | MUST |
| ING-REQ-102 | Client MUST immediately call `history.replaceState` to clear query parameters and prevent duplicate shares. | MUST |
| ING-REQ-103 | Client MUST extract any HTTP/HTTPS URL from the shared text string (e.g. YouTube share format). | MUST |
| ING-REQ-104 | Client MUST POST only the extracted URL if found. If no URL is found, it MUST fallback to the full text string. | MUST |

### Scenarios
#### Scenario: Ingestion Extracts URL
- GIVEN load with URL parameter `text=Watch: https://youtu.be/abc`
- WHEN share-ingestion runs
- THEN query params are cleared via `replaceState`
- AND client POSTs `https://youtu.be/abc` to text endpoint

#### Scenario: Ingestion Text Fallback
- GIVEN load with URL parameter `text=Hello World`
- WHEN share-ingestion runs
- THEN query params are cleared
- AND client POSTs `Hello World` to text endpoint
