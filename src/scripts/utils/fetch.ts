/**
 * Fetches the document at the given URL and returns its text content.
 * @param url Document URL.
 * @returns Document text content.
 */
export const fetchDocument = (url: string) =>
  fetch(`/documents/${url}.md`).then((res) => res.text());
