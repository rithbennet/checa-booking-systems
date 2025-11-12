"use client";

import { format } from "date-fns";
import { cn } from "@/shared/lib/utils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/shadcn/select";

interface MonthYearPickerProps {
	value?: Date;
	onChange: (date: Date) => void;
	disabled?: boolean;
	id?: string;
	className?: string;
}

export function MonthYearPicker({
	value,
	onChange,
	disabled,
	id,
	className,
}: MonthYearPickerProps) {
	const selectedDate = value || new Date();

	// Generate month options (static, never changes)
	const months = Array.from({ length: 12 }, (_, i) => {
		const date = new Date(2024, i, 1);
		return {
			value: i.toString(),
			label: format(date, "MMMM"),
		};
	});

	// Generate year options (current year and next 2 years)
	// Note: Recalculates current year on each render (fast operation)
	const currentYear = new Date().getFullYear();
	const years = Array.from({ length: 3 }, (_, i) => {
		const year = currentYear + i;
		return {
			value: year.toString(),
			label: year.toString(),
		};
	});

	const selectedMonth = selectedDate.getMonth().toString();
	const selectedYear = selectedDate.getFullYear().toString();

	const handleMonthChange = (month: string) => {
		const newDate = new Date(
			parseInt(selectedYear, 10),
			parseInt(month, 10),
			1,
		);
		onChange(newDate);
	};

	const handleYearChange = (year: string) => {
		const newDate = new Date(
			parseInt(year, 10),
			parseInt(selectedMonth, 10),
			1,
		);
		onChange(newDate);
	};

	return (
		<div className={cn("flex gap-2", className)}>
			<Select
				disabled={disabled}
				onValueChange={handleMonthChange}
				value={selectedMonth}
			>
				<SelectTrigger
					className="w-[140px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
					id={id ? `${id}-month` : undefined}
				>
					<SelectValue placeholder="Month" />
				</SelectTrigger>
				<SelectContent>
					{months.map((month) => (
						<SelectItem key={month.value} value={month.value}>
							{month.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Select
				disabled={disabled}
				onValueChange={handleYearChange}
				value={selectedYear}
			>
				<SelectTrigger
					className="w-[100px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
					id={id ? `${id}-year` : undefined}
				>
					<SelectValue placeholder="Year" />
				</SelectTrigger>
				<SelectContent>
					{years.map((year) => (
						<SelectItem key={year.value} value={year.value}>
							{year.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
