# Recoverable App Entry

## Goal

Allow a user to reach the authenticated Gramio application when the backend is
temporarily unavailable. The Today screen must own the actionable failure
state, including retry, instead of a startup health check replacing the whole
application with a technical connection error.

## Current Problem

`AppLoader` performs a global `/api/health` request before rendering routes.
When the request fails, it displays the server message in a full-screen error
state. This prevents the user from reaching Today, whose learning-data loading
already has a friendly, retryable unavailable state.

## Design

Remove the blocking `AppLoader` wrapper from the application root. Render the
existing app tree immediately: Clerk provider when configured, router, shell,
and page routes. Today continues to load the authoritative queue and renders
its existing status-specific error state when the backend cannot be reached.

`AppLoader` is deleted because it duplicates availability handling and has no
other responsibility. The existing offline indicator remains mounted and
continues to provide non-blocking connectivity feedback.

## Error Handling

- A failed Today request renders user-facing unavailable copy and a Retry
  action, without exposing a raw fetch error.
- A successful retry replaces the error state with the Today queue.
- Routing and authentication continue to work even if the health endpoint is
  unavailable.

## Testing

Add a focused root-render regression test that makes the health endpoint fail
and verifies the application still reaches Today’s retryable unavailable UI.
The test must fail while the global loader exists. Existing Today tests retain
coverage for the retry behavior itself.

## Scope

This change does not introduce offline learning, cache server data, alter API
contracts, or change Clerk configuration. It only removes the global startup
gate that conflicts with the product entry requirement in issue #28.
