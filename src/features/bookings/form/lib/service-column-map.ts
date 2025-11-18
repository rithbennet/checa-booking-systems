/**
 * Service column mapping - defines which fields to show for each service category
 */

export const serviceColumnMap = {
	ftir_atr: [
		"sampleDetails",
		"sampleType",
		"sampleHazard",
		"testingMethod",
		"samplePreparation",
		"notes",
	],
	ftir_kbr: [
		"sampleDetails",
		"sampleType",
		"sampleHazard",
		"testingMethod",
		"samplePreparation",
		"notes",
	],
	uv_vis_absorbance: ["sampleType", "testingMethod", "wavelength", "notes"],
	uv_vis_reflectance: ["sampleType", "testingMethod", "wavelength", "notes"],
	bet_analysis: ["sampleType", "samplePreparation", "degasConditions", "notes"],
	hplc_pda: [
		"sampleType",
		"testingMethod",
		"solventSystem",
		"solvents",
		"solventComposition",
		"columnType",
		"flowRate",
		"wavelength",
		"expectedRetentionTime",
		"samplePreparation",
		"notes",
	],
} as const;

export type ServiceCategory = keyof typeof serviceColumnMap;

export function getFieldsForService(
	category: ServiceCategory,
): readonly string[] {
	return serviceColumnMap[category] || [];
}

export function hasField(
	category: ServiceCategory,
	fieldName: string,
): boolean {
	return getFieldsForService(category).includes(fieldName);
}
