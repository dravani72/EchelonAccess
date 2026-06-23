const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";
const configuredAppOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN?.replace(/\/$/, "") ?? "";

export const BASE_PATH = configuredBasePath === "/" ? "" : configuredBasePath;
export const APP_ORIGIN = configuredAppOrigin;

export function withBasePath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${normalizedPath}`;
}

export function getAppOrigin() {
  if (APP_ORIGIN) {
    return APP_ORIGIN;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}
