import type { PageAnnotations } from "./types";

// Drawings are kept in this browser, per book, until the server stores them.
const key = (bookId: string) => `riwaq-bag:${bookId}`;

export function loadAnnotations(bookId: string): PageAnnotations {
  try {
    return JSON.parse(localStorage.getItem(key(bookId)) ?? "{}");
  } catch {
    return {};
  }
}

export function saveAnnotations(bookId: string, annotations: PageAnnotations) {
  try {
    localStorage.setItem(key(bookId), JSON.stringify(annotations));
    return true;
  } catch {
    return false;
  }
}

export function deleteAnnotations(bookId: string) {
  try {
    localStorage.removeItem(key(bookId));
  } catch {
    // Nothing to clean up.
  }
}

// The book's notebook (HTML from the notebook editor).
const notebookKey = (bookId: string) => `riwaq-bag:${bookId}:notebook`;

export function loadNotebook(bookId: string) {
  try {
    return localStorage.getItem(notebookKey(bookId)) ?? "";
  } catch {
    return "";
  }
}

export function saveNotebook(bookId: string, html: string) {
  try {
    localStorage.setItem(notebookKey(bookId), html);
    return true;
  } catch {
    return false;
  }
}

export function deleteNotebook(bookId: string) {
  try {
    localStorage.removeItem(notebookKey(bookId));
  } catch {
    // Nothing to clean up.
  }
}
