/**
 * UploadThing Route Handler
 *
 * Exposes GET and POST handlers for UploadThing file uploads.
 */

import { createRouteHandler } from "uploadthing/next";
import { fileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
	router: fileRouter,
});
