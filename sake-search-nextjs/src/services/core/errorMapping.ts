// 共通のリポジトリエラーマッピングユーティリティ
// Supabase/PostgREST/ApiClient 由来のエラーをドメイン固有の ServiceError に正規化する

export interface ErrorMessages {
  defaultMessage: string;
  invalidInputMessage?: string; // 400
  unauthorizedMessage?: string; // 401
  forbiddenMessage?: string; // 403
  notFoundMessage?: string; // 404
  conflictMessage?: string; // 409 or 23505
  tooManyRequestsMessage?: string; // 429
  serverErrorMessage?: string; // 500
}

// ApiClientError 互換の最小型（型循環回避のためここで再定義）
type ApiClientLikeError = {
  statusCode?: number;
  response?: { error?: string };
};

// PostgREST/Supabase のエラー最小型
type PostgrestLikeError = {
  code?: string; // 例: '23505', 'PGRST116'
  details?: string;
  hint?: string;
  message?: string;
  status?: number;
};

export function mapToServiceError<T extends Error>(
  error: unknown,
  ServiceErrorCtor: new (message: string, originalError?: unknown) => T,
  messages: ErrorMessages
): T {
  if (error instanceof ServiceErrorCtor) return error;

  // ApiClientError 互換
  if (isApiClientError(error)) {
    const status = error.statusCode;
    return new ServiceErrorCtor(
      pickMessageByStatus(status, messages, error.response?.error),
      error
    );
  }

  // PostgREST/Supabase 互換
  if (isPostgrestError(error)) {
    // Postgres unique violation
    if (error.code === '23505') {
      return new ServiceErrorCtor(messages.conflictMessage || 'リソースが競合しています', error);
    }
    // no rows / not found（.single() など）
    if (error.code === 'PGRST116' || error.status === 404) {
      return new ServiceErrorCtor(messages.notFoundMessage || messages.defaultMessage, error);
    }
    // その他は status 優先
    if (typeof error.status === 'number') {
      return new ServiceErrorCtor(pickMessageByStatus(error.status, messages, error.message), error);
    }
    // メッセージがあれば活かす
    if (error.message) {
      return new ServiceErrorCtor(error.message, error);
    }
  }

  // 不明なエラー
  return new ServiceErrorCtor(messages.defaultMessage, error);
}

function isApiClientError(e: unknown): e is ApiClientLikeError {
  return !!e && typeof e === 'object' && 'statusCode' in (e as object);
}

function isPostgrestError(e: unknown): e is PostgrestLikeError {
  return !!e && typeof e === 'object' && ('code' in (e as object) || 'status' in (e as object));
}

function pickMessageByStatus(status: number | undefined, messages: ErrorMessages, fallback?: string): string {
  switch (status) {
    case 400:
      return messages.invalidInputMessage || messages.defaultMessage;
    case 401:
      return messages.unauthorizedMessage || messages.defaultMessage;
    case 403:
      return messages.forbiddenMessage || messages.defaultMessage;
    case 404:
      return messages.notFoundMessage || messages.defaultMessage;
    case 409:
      return messages.conflictMessage || messages.defaultMessage;
    case 429:
      return messages.tooManyRequestsMessage || messages.defaultMessage;
    case 500:
      return messages.serverErrorMessage || messages.defaultMessage;
    default:
      return fallback || messages.defaultMessage;
  }
}

