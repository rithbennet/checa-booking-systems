/**
 * UploadThing Server-Side API
 *
 * Provides UTApi instance for server-side file operations like
 * uploading generated PDFs, deleting files, etc.
 */

import { UTApi } from "uploadthing/server";

export const utapi = new UTApi();
