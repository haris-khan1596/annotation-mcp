// Result Type Pattern for Error Handling

export type Success<T> = { success: true; data: T };
export type Failure<E> = { success: false; error: E };
export type Result<T, E> = Success<T> | Failure<E>;

// Helper functions for creating results
export function success<T>(data: T): Success<T> {
  return { success: true, data };
}

export function failure<E>(error: E): Failure<E> {
  return { success: false, error };
}
