export type NavigationState = {
  navigating: boolean;
  label?: string;
};

type Listener = (state: NavigationState) => void;

const listeners = new Set<Listener>();

let state: NavigationState = { navigating: false };

function emit() {
  for (const listener of listeners) {
    listener(state);
  }
}

/** Call as soon as the user clicks an internal route (before navigation completes). */
export function startNavigation(label?: string) {
  state = { navigating: true, label };
  emit();
}

/** Call when the new route has rendered (pathname changed). */
export function endNavigation() {
  state = { navigating: false, label: undefined };
  emit();
}

export function subscribeNavigation(listener: Listener) {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

export function isInternalHref(href: string | null): href is string {
  if (!href) return false;
  if (href.startsWith("#")) return false;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  if (href.startsWith("http://") || href.startsWith("https://")) return false;
  return href.startsWith("/");
}
