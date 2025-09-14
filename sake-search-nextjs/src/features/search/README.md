# Search Feature - Migration Guide

- Data flow target: `features → services(SakeServiceV2) → repositories(ISakeRepository) → lib(ApiClient/Supabase)`
- Current usage: `useSearch` (legacy), `useSearchV2` (Service-based)

## TODO (non-breaking)

1. Wire `ServiceProvider` to optionally provide `SakeServiceV2` with `HttpSakeRepository`.
2. Switch `useSearchV2` to call `SakeServiceV2` (feature flag/env guard OK).
3. Remove direct `/api/search` fetch usage; route through service.
4. Gradually replace `useSearch` usage, then delete it.
5. If needed, add `SupabaseSakeRepository` for caching/offline strategies.

Notes: This file documents design only; no runtime behavior changed yet.
