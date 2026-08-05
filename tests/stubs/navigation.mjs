export function redirect(url) {
  const err = new Error(`NEXT_REDIRECT:${url}`);
  err.digest = `NEXT_REDIRECT;${url}`;
  throw err;
}
export function notFound() {
  throw new Error("NEXT_NOT_FOUND");
}
