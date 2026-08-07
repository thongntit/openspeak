# Production Learning-Flow Smoke Test

Use this checklist after each production promotion that can affect the learner
experience. It records evidence for the release; a green CI run or API health
check alone is not a substitute for the signed-in browser checks below.

## Prerequisites

- Record the production commit or release identifier and deployment time.
- Use a non-production test account that has at least one due card and can
  access Library.
- Have a supported browser/device available at a 375 CSS-pixel-wide viewport.
- For offline checks, use browser network controls or a device network toggle;
  never disable production infrastructure to run this smoke test.

## Release checks

| Check | Required environment | Expected outcome | Evidence to record |
| --- | --- | --- | --- |
| CI and public API health | GitHub Actions and production API | Required checks pass and the health endpoint succeeds. This confirms deployable code and API availability only. | Run/PR URL, API health result, and deployed commit. |
| Signed-out protection | Real production browser, signed out | Opening Today, Review, Library, or Profile sends the visitor to the normal sign-in entry state without an empty or broken app shell. | Browser and result. |
| Signed-in learning loop | Real signed-in production browser | Today loads the due queue; start Review; reveal and rate one card; refresh; the returned Today/Review state is coherent and does not duplicate the accepted rating. | Test-account state before/after and result. |
| Library | Real signed-in production browser | Library loads, a deck can be opened, and navigation back to Today remains usable. | Result and any failed route. |
| 375 px reachability | Real signed-in browser/device at 375 px, light theme | Today, Review, Library, and Profile are legible; the bottom tab bar does not cover a critical action; Review has no horizontal overflow and has reachable answer, rating, and exit controls. | Browser/device, viewport, and result. |
| Dark theme | Same real signed-in browser/device | Toggle dark mode and repeat the four-screen navigation check. Text, error/status copy, and controls remain readable and reachable. | Result and screenshots when a defect is found. |
| PWA install and branding | Supported install-capable browser/device | The production manifest and installed app identify **Gramio**; install succeeds; reopening from the installed icon reaches the expected signed-in or signed-out entry state. | Browser/device, install result, and launch result. |
| Offline and backend-down recovery | Real signed-in browser with controlled offline/network failure | Today explains the connection problem and Retry recovers after connectivity returns. Review offers Retry or Back to Today; retry does not create duplicate/unintended ratings or discard retryable pending-review recovery. | Failure method, each recovery result, and any follow-up issue. |

## Evidence boundaries

- CI, unit tests, build output, and public health checks provide automated or
  API-level evidence. They cannot prove authenticated layout, installability,
  browser persistence, or touch reachability.
- The Signed-out, Signed-in learning loop, Library, 375 px, Dark theme, PWA,
  and Offline rows require a real browser/device observation. Do not mark them
  passed from source inspection alone.
- A failed row blocks this smoke test. Create a focused issue for the defect,
  link it from the release comment, and keep the relevant QA issue open until
  the failing scenario is rechecked.

## Release comment template

Post the completed result on [issue #32](https://github.com/thongntit/gramio/issues/32):

```md
Production smoke test — <commit or release> — <local date/time>

- CI/API health: PASS | FAIL — <links/results>
- Signed-out protection: PASS | FAIL — <browser>
- Signed-in learning loop: PASS | FAIL — <browser and result>
- Library: PASS | FAIL — <browser and result>
- 375 px light: PASS | FAIL — <device/browser>
- 375 px dark: PASS | FAIL — <device/browser>
- PWA install/reopen: PASS | FAIL — <device/browser>
- Offline/backend-down recovery: PASS | FAIL — <method and result>

Follow-up issues: <links or none>
```

Only close a related QA issue when its required row has a recorded PASS result.
