export type NavigationHandler = (path: string) => void;

let routerNavigate: NavigationHandler | null = null;

/**
 * Registers the React Router navigate callback.
 */
export function setNavigateHandler(handler: NavigationHandler | null): void {
  routerNavigate = handler;
}

/**
 * Global navigation helper.
 * Uses React Router when mounted, falling back to History API in non-router contexts.
 */
export function navigateTo(path: string): void {
  if (routerNavigate) {
    routerNavigate(path);
  } else if (typeof window !== 'undefined') {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

export default navigateTo;
