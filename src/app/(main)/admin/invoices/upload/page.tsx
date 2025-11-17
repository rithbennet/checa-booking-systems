"use client";

import { FileText, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import { Textarea } from "@/shared/ui/shadcn/textarea";

export default function UploadInvoice() {
	// Example booking details (replace with real data as needed)
	const booking = {
		id: "BK1234",
		customerName: "Dr. Jane Smith",
		totalAmount: 1200.0,
	};

	const [file, setFile] = useState<File | null>(null);
	const [notes, setNotes] = useState("");
	const [error, setError] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFile = (file: File) => {
		if (file.type !== "application/pdf") {
			setError("Only PDF files are accepted.");
			setFile(null);
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			setError("File size must be 5MB or less.");
			setFile(null);
			return;
		}
		setError("");
		setFile(file);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const selectedFile = e.target.files[0];
			if (selectedFile) handleFile(selectedFile);
		}
	};

	const handleUpload = () => {
		// Implement upload logic here
		alert("Invoice uploaded!");
	};

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="mx-auto max-w-4xl">
				<h1 className="mb-8 font-bold text-2xl text-gray-900">
					Upload Invoice
				</h1>
				<div className="flex flex-col gap-8 md:flex-row">
					{/* Booking Details Card */}
					<div className="md:w-1/3">
						<Card>
							<CardHeader>
								<CardTitle>Booking Details</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div>
										<span className="text-gray-500 text-xs">Booking ID</span>
										<div className="font-medium text-gray-800">
											{booking.id}
										</div>
									</div>
									<div>
										<span className="text-gray-500 text-xs">Customer Name</span>
										<div className="font-medium text-gray-800">
											{booking.customerName}
										</div>
									</div>
									<div>
										<span className="text-gray-500 text-xs">Total Amount</span>
										<div className="font-medium text-green-700">
											RM {booking.totalAmount.toFixed(2)}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Upload Area */}
					<div className="flex flex-col gap-6 md:w-2/3">
						<button
							className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white p-8 transition-colors ${error ? "border-red-500" : "border-gray-300 hover:border-indigo-500"}`}
							onClick={() => fileInputRef.current?.click()}
							onDragOver={(e) => e.preventDefault()}
							type="button"
						>
							<UploadCloud className="mb-4 h-12 w-12 text-indigo-500" />
							<div className="mb-2 font-medium text-gray-700 text-lg">
								Drag & Drop file here or click to upload
							</div>
							{file ? (
								<div className="mt-2 flex items-center gap-2">
									<FileText className="h-5 w-5 text-green-600" />
									<span className="text-green-700 text-sm">{file.name}</span>
								</div>
							) : null}
							<input
								accept="application/pdf"
								className="hidden"
								onChange={handleFileChange}
								ref={fileInputRef}
								type="file"
							/>
							<div className="mt-4 text-gray-500 text-xs">
								Accepted formats: <span className="font-medium">PDF only</span>,
								Max size: <span className="font-medium">5MB</span>
							</div>
							{error && (
								<div className="mt-2 text-red-600 text-xs">{error}</div>
							)}
						</button>

						{/* Processing Notes */}
						<div>
							<label
								className="mb-1 block font-medium text-gray-700 text-sm"
								htmlFor="notes"
							>
								Processing Notes{" "}
								<span className="text-gray-400 text-xs">(optional)</span>
							</label>
							<Textarea
								className="min-h-20 resize-none"
								id="notes"
								onChange={(e) => setNotes(e.target.value)}
								placeholder="Add any notes for the finance team..."
								value={notes}
							/>
						</div>

						<Button
							className="mt-2 w-full py-6 text-lg"
							disabled={!file || !!error}
							onClick={handleUpload}
						>
							Confirm and Upload Invoice
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
