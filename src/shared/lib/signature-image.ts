"use client";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_SOURCE_DIMENSION = 4000;
const OUTPUT_MAX_WIDTH = 1200;
const OUTPUT_MAX_HEIGHT = 480;
const MIN_CONTENT_WIDTH = 80;
const MIN_CONTENT_HEIGHT = 24;
const MIN_ASPECT_RATIO = 0.75;
const MAX_ASPECT_RATIO = 12;
const ALPHA_THRESHOLD = 16;
const WHITE_THRESHOLD = 245;
const TRIM_PADDING = 6;

const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function isBackgroundPixel(
	r: number,
	g: number,
	b: number,
	a: number,
): boolean {
	return (
		a < ALPHA_THRESHOLD ||
		(r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD)
	);
}

function loadImage(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const objectUrl = URL.createObjectURL(file);
		const image = new Image();

		image.onload = () => {
			URL.revokeObjectURL(objectUrl);
			resolve(image);
		};

		image.onerror = () => {
			URL.revokeObjectURL(objectUrl);
			reject(new Error("Failed to read the signature image"));
		};

		image.src = objectUrl;
	});
}

function canvasToBlob(
	canvas: HTMLCanvasElement,
	type: string,
	quality?: number,
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (!blob) {
					reject(new Error("Failed to process the signature image"));
					return;
				}

				resolve(blob);
			},
			type,
			quality,
		);
	});
}

function validateSignatureFile(file: File) {
	if (!SUPPORTED_TYPES.has(file.type)) {
		throw new Error("Please select a JPEG, PNG, or WebP image");
	}

	if (file.size > MAX_FILE_SIZE_BYTES) {
		throw new Error("Image size must be less than 2MB");
	}
}

export async function prepareSignatureImage(file: File): Promise<File> {
	validateSignatureFile(file);

	const image = await loadImage(file);

	if (
		image.width > MAX_SOURCE_DIMENSION ||
		image.height > MAX_SOURCE_DIMENSION
	) {
		throw new Error(
			"Image dimensions are too large. Please upload an image under 4000px on each side",
		);
	}

	const sourceCanvas = document.createElement("canvas");
	sourceCanvas.width = image.width;
	sourceCanvas.height = image.height;

	const sourceContext = sourceCanvas.getContext("2d");
	if (!sourceContext) {
		throw new Error("Image processing is not supported in this browser");
	}

	sourceContext.drawImage(image, 0, 0);
	const { data, width, height } = sourceContext.getImageData(
		0,
		0,
		sourceCanvas.width,
		sourceCanvas.height,
	);

	let minX = width;
	let minY = height;
	let maxX = -1;
	let maxY = -1;

	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			const index = (y * width + x) * 4;
			const r = data[index] ?? 0;
			const g = data[index + 1] ?? 0;
			const b = data[index + 2] ?? 0;
			const a = data[index + 3] ?? 0;

			if (isBackgroundPixel(r, g, b, a)) {
				continue;
			}

			if (x < minX) minX = x;
			if (y < minY) minY = y;
			if (x > maxX) maxX = x;
			if (y > maxY) maxY = y;
		}
	}

	if (maxX === -1 || maxY === -1) {
		throw new Error(
			"The uploaded image looks blank. Please upload a clearer signature or stamp",
		);
	}

	const cropLeft = Math.max(0, minX - TRIM_PADDING);
	const cropTop = Math.max(0, minY - TRIM_PADDING);
	const cropRight = Math.min(width - 1, maxX + TRIM_PADDING);
	const cropBottom = Math.min(height - 1, maxY + TRIM_PADDING);
	const croppedWidth = cropRight - cropLeft + 1;
	const croppedHeight = cropBottom - cropTop + 1;

	if (croppedWidth < MIN_CONTENT_WIDTH || croppedHeight < MIN_CONTENT_HEIGHT) {
		throw new Error(
			"The signature content is too small. Please upload a closer crop",
		);
	}

	const aspectRatio = croppedWidth / croppedHeight;
	if (aspectRatio < MIN_ASPECT_RATIO || aspectRatio > MAX_ASPECT_RATIO) {
		throw new Error(
			"Please upload a horizontally cropped signature or stamp without large empty margins",
		);
	}

	const scale = Math.min(
		1,
		OUTPUT_MAX_WIDTH / croppedWidth,
		OUTPUT_MAX_HEIGHT / croppedHeight,
	);
	const outputWidth = Math.max(1, Math.round(croppedWidth * scale));
	const outputHeight = Math.max(1, Math.round(croppedHeight * scale));

	const outputCanvas = document.createElement("canvas");
	outputCanvas.width = outputWidth;
	outputCanvas.height = outputHeight;

	const outputContext = outputCanvas.getContext("2d");
	if (!outputContext) {
		throw new Error("Image processing is not supported in this browser");
	}

	outputContext.drawImage(
		sourceCanvas,
		cropLeft,
		cropTop,
		croppedWidth,
		croppedHeight,
		0,
		0,
		outputWidth,
		outputHeight,
	);

	const blob = await canvasToBlob(outputCanvas, "image/png");
	if (blob.size > MAX_FILE_SIZE_BYTES) {
		throw new Error(
			"Processed signature image is still too large. Please upload a smaller image",
		);
	}

	const baseName = file.name.replace(/\.[^.]+$/, "");

	return new File([blob], `${baseName}-trimmed.png`, {
		type: "image/png",
		lastModified: Date.now(),
	});
}
