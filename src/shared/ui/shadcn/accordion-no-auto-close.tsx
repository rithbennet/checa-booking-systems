"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/shared/lib/utils";

function AccordionNoAutoClose({
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
	return (
		<AccordionPrimitive.Root data-slot="accordion-no-auto-close" {...props} />
	);
}

function AccordionItemNoAutoClose({
	className,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
	return (
		<AccordionPrimitive.Item
			className={cn("border-b last:border-b-0", className)}
			data-slot="accordion-item-no-auto-close"
			{...props}
		/>
	);
}

function AccordionTriggerNoAutoClose({
	className,
	children,
	onClick,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
	return (
		<AccordionPrimitive.Header className="flex">
			<AccordionPrimitive.Trigger
				className={cn(
					"flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left font-medium text-sm outline-none transition-all hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
					className,
				)}
				data-slot="accordion-trigger-no-auto-close"
				onClick={(e) => {
					// Only toggle if clicking directly on the trigger, not on interactive children
					const target = e.target as HTMLElement;
					const trigger = e.currentTarget as HTMLElement;

					// Check if click originated from within accordion content (not trigger)
					const accordionContent = target.closest(
						"[data-slot='accordion-content-no-auto-close']",
					);
					if (accordionContent) {
						e.stopPropagation();
						onClick?.(e);
						return;
					}

					// Check if click is on an interactive element that's NOT the trigger itself
					// The trigger itself is a button, so we need to check if the target is a child button
					const isChildButton =
						target.tagName === "BUTTON" &&
						target !== trigger &&
						trigger.contains(target);
					const isInput =
						target.tagName === "INPUT" ||
						(target.closest("input") && target.closest("input") !== trigger);
					const isSelect =
						target.tagName === "SELECT" ||
						(target.closest("select") && target.closest("select") !== trigger);
					const isCombobox =
						target.closest("[role='combobox']") &&
						target.closest("[role='combobox']") !== trigger;
					const isOption = target.closest("[role='option']");
					const isTextarea =
						target.tagName === "TEXTAREA" ||
						(target.closest("textarea") &&
							target.closest("textarea") !== trigger);
					const isLabel = target.tagName === "LABEL";

					// Check for checkbox (Radix UI checkbox renders as button with data-slot)
					const isCheckbox =
						target.closest("[data-slot='checkbox']") ||
						target.closest("[role='checkbox']");

					// Check for popover trigger (date picker buttons, etc.)
					const isPopoverTrigger = target.closest(
						"[data-slot='popover-trigger']",
					);

					// Check for popover content (calendar, select dropdowns, etc.)
					const isPopoverContent =
						target.closest("[data-slot='popover-content']") ||
						target.closest("[role='dialog']");

					// Check for calendar buttons
					const isCalendarButton =
						target.closest("[data-slot='calendar']") ||
						target.hasAttribute("data-day");

					// Don't toggle if clicking on form elements or child buttons
					// Stop propagation to prevent accordion toggle, but don't prevent default
					// so the interactive element's handler can still run
					if (
						isChildButton ||
						isInput ||
						isSelect ||
						isCombobox ||
						isOption ||
						isTextarea ||
						isLabel ||
						isCheckbox ||
						isPopoverTrigger ||
						isPopoverContent ||
						isCalendarButton
					) {
						e.stopPropagation();
						// Still call the original onClick if provided, but stop propagation
						onClick?.(e);
						return;
					}
					// Allow the default toggle behavior
					onClick?.(e);
				}}
				{...props}
			>
				{children}
				<ChevronDownIcon className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200" />
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	);
}

function AccordionContentNoAutoClose({
	className,
	children,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
	return (
		<AccordionPrimitive.Content
			className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
			data-slot="accordion-content-no-auto-close"
			onClick={(e) => {
				// Stop all clicks inside content from bubbling up to trigger
				// This prevents accordion from closing when clicking interactive elements
				e.stopPropagation();
			}}
			onPointerDown={(e) => {
				// Also stop pointer events (Radix UI components often use pointer events)
				e.stopPropagation();
			}}
			{...props}
		>
			<div className={cn("pt-0 pb-4", className)}>{children}</div>
		</AccordionPrimitive.Content>
	);
}

export {
	AccordionNoAutoClose,
	AccordionItemNoAutoClose,
	AccordionTriggerNoAutoClose,
	AccordionContentNoAutoClose,
};
