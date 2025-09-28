# Search Feature - Migration Guide (Server Actions/RSC first)

- Web(default): `features (useSearch) → app/actions/search.ts → services(SakeService) → repositories(SakenowaSakeRepository) → lib(sakenowaApi)`
- Future Mobile/BFF: `features → HttpSakeRepository(ApiClient) → /api/v1/sakes/* → services → repositories → lib`

## Current State

- `useSearch` calls Server Action (`searchSakesAction`) and no longer uses `/api/search`
- Menu scan flow also uses the same Server Action

## Next (when mobile starts)

1. Add BFF routes under `app/api/v1/sakes/*` with zod-validated `ApiResponse<T>`
2. Introduce HTTPベースのリポジトリを Provider 経由で接続（必要に応じて）
3. Keep Web on Server Actions/RSC where it wins; use BFF for mobile/shared

Notes: This feature uses server-side domain service; client holds minimal state only.
