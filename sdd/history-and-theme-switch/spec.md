# Specification: History and Theme Switch

## Domain: GET /items

### Requirements
| ID | Description | Strength |
|---|---|---|
| HS-REQ-101 | Server MUST expose `GET /items` endpoint. | MUST |
| HS-REQ-102 | MUST scan `uploads/` for `*-meta.json` files. | MUST |
| HS-REQ-103 | MUST filter out expired uploads (`expiryTime <= Date.now()`). | MUST |
| HS-REQ-104 | MUST read full text snippet file if type is `text`. | MUST |
| HS-REQ-105 | MUST return top 10 active items sorted descending by `uploadTime`. | MUST |

### Scenarios
```gherkin
Scenario: Retrieve active history list
  Given active uploads exist in "uploads/"
  When the client sends GET to "/items"
  Then response status MUST be 200
  And response MUST contain <=10 active items sorted descending with full snippet texts

Scenario: Empty uploads directory
  Given "uploads/" is empty
  When the client sends GET to "/items"
  Then response status MUST be 200 and body MUST be []
```

## Domain: clipboard-history

### Requirements
| ID | Description | Strength |
|---|---|---|
| HS-REQ-201 | Client MUST fetch history on load and poll every 5s. | MUST |
| HS-REQ-202 | Client MUST preserve snippet card expansion state on refresh. | MUST |
| HS-REQ-203 | Cards MUST have a "Copy" button to copy contents. | MUST |
| HS-REQ-204 | Client MUST render a graceful message if history is empty. | MUST |

### Scenarios
```gherkin
Scenario: Refresh preserves expansion
  Given card "clip-123" is expanded
  When 5s polling triggers a history refresh
  Then the card "clip-123" MUST remain expanded

Scenario: Copy snippet text
  Given a snippet card is rendered
  When the user clicks "Copy"
  Then the text MUST be copied to the clipboard

Scenario: Empty history list
  Given server returns []
  When the history list renders
  Then it MUST show "No shared items yet"
```

## Domain: theme-persistence

### Requirements
| ID | Description | Strength |
|---|---|---|
| HS-REQ-301 | Header MUST have a light/dark toggle switch. | MUST |
| HS-REQ-302 | Default theme MUST be light (warm sand palette). | MUST |
| HS-REQ-303 | Toggle MUST apply `.dark-mode` class and save to `localStorage`. | MUST |
| HS-REQ-304 | Client MUST read and apply stored theme from `localStorage` on load. | MUST |

### Scenarios
```gherkin
Scenario: Toggle theme to dark mode
  Given page is in light mode
  When the user clicks theme toggle
  Then body MUST have ".dark-mode" and "localStorage" MUST store "dark"

Scenario: Apply theme on load
  Given "localStorage" stores "dark"
  When user loads the page
  Then page MUST render in dark mode immediately
```

## Domain: mascot-and-layout

### Requirements
| ID | Description | Strength |
|---|---|---|
| HS-REQ-401 | Layout MUST fit viewport without horizontal scroll. | MUST |
| HS-REQ-402 | Mascot SVG MUST scale down on mobile via media queries. | MUST |
| HS-REQ-403 | Elements MUST use `max-width: 100%` and `box-sizing: border-box`. | MUST |

### Scenarios
```gherkin
Scenario: Mobile responsiveness
  Given viewport width is 375px
  When page renders
  Then no horizontal scroll MUST occur and mascot SVG MUST scale down
```
