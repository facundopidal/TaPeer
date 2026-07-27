# Specification: Safe Linkification

## Domain: safe-linkification

### Requirements
| ID | Description | Strength |
|---|---|---|
| LNK-REQ-101 | Linkification MUST only allow `http://` and `https://` schemes. | MUST |
| LNK-REQ-102 | Parser MUST escape HTML entities to prevent XSS before tokenizing and rendering URLs. | MUST |
| LNK-REQ-103 | Matched URLs MUST render as anchor tags with `.jungle-link`, `target="_blank"`, and `rel="noopener noreferrer"`. | MUST |
| LNK-REQ-104 | Trailing punctuation (like `.`, `,`, `!`, `?`, `)`) MUST be stripped from matched URLs before generating links. | MUST |

### Scenarios
#### Scenario: Safe Linkification Output
- GIVEN text `Go to http://test.com/a. and click!`
- WHEN safe-linkification runs
- THEN output is `Go to <a class="jungle-link" href="http://test.com/a" target="_blank" rel="noopener noreferrer">http://test.com/a</a>. and click!`

#### Scenario: XSS Mitigation
- GIVEN text `<script>alert(1)</script> https://safe.com`
- WHEN safe-linkification runs
- THEN HTML tags are escaped and only `https://safe.com` is a link
