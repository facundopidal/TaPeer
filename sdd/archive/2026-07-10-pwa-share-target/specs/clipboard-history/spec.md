# Specification: Clipboard History Delta

## Domain: clipboard-history

### ADDED Requirements
| ID | Description | Strength |
|---|---|---|
| HS-REQ-205 | Snippet cards MUST render detected URLs as secure clickable hyperlinks using `safe-linkification`. | MUST |
| HS-REQ-206 | Hyperlink class `.jungle-link` MUST use themed green: `#2e7d32` (light) and `#4caf50` (dark). | MUST |

### Scenarios
#### Scenario: Render Clickable Links in Snippet
- GIVEN snippet `Visit https://tapeer.local` in history
- WHEN clipboard-history renders
- THEN `https://tapeer.local` is rendered as `.jungle-link` with active theme green

#### Scenario: Theme Change Updates Link Color
- GIVEN light mode with a `.jungle-link` card (color `#2e7d32`)
- WHEN user toggles dark mode
- THEN link color changes to `#4caf50`
