/**
 * Terms of Reference (TOR) / Service Form Template
 * Generates a service agreement document for equipment usage
 */

import {
    Document,
    Image,
    Page,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";
import {
    styles as baseStyles,
    formatDate,
    pdfColors,
} from "@/shared/lib/pdf/pdf-styles";

// TOR-specific styles
const torStyles = StyleSheet.create({
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: pdfColors.primary,
    },
    headerLeft: {
        width: "30%",
    },
    headerCenter: {
        width: "40%",
        alignItems: "center",
    },
    headerRight: {
        width: "30%",
        alignItems: "flex-end",
    },
    logo: {
        width: 80,
        height: 40,
        marginBottom: 5,
    },
    documentTitle: {
        fontSize: 16,
        fontWeight: 700,
        color: pdfColors.primary,
        textAlign: "center",
        marginBottom: 5,
    },
    documentSubtitle: {
        fontSize: 11,
        fontWeight: 700,
        color: pdfColors.secondary,
        textAlign: "center",
        marginBottom: 3,
    },
    refNo: {
        fontSize: 9,
        color: pdfColors.secondary,
    },
    equipmentTitle: {
        fontSize: 14,
        fontWeight: 700,
        color: pdfColors.primary,
        textAlign: "center",
        marginTop: 20,
        marginBottom: 5,
        paddingVertical: 10,
        backgroundColor: pdfColors.lightBg,
        borderRadius: 4,
    },
    equipmentSubtitle: {
        fontSize: 10,
        color: pdfColors.secondary,
        textAlign: "center",
        marginBottom: 20,
    },
    sectionBox: {
        marginBottom: 15,
        padding: 12,
        borderWidth: 1,
        borderColor: pdfColors.border,
        borderRadius: 4,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 700,
        color: pdfColors.primary,
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: pdfColors.border,
    },
    sectionText: {
        fontSize: 10,
        lineHeight: 1.6,
        color: pdfColors.black,
        marginBottom: 8,
    },
    bulletPoint: {
        flexDirection: "row",
        marginBottom: 6,
        paddingLeft: 10,
    },
    bullet: {
        width: 15,
        fontSize: 10,
        color: pdfColors.secondary,
    },
    bulletText: {
        flex: 1,
        fontSize: 10,
        lineHeight: 1.5,
        color: pdfColors.black,
    },
    userInfoSection: {
        flexDirection: "row",
        marginBottom: 20,
    },
    userInfoBox: {
        flex: 1,
        padding: 12,
        backgroundColor: pdfColors.lightBg,
        borderRadius: 4,
        marginRight: 10,
    },
    userInfoBoxLast: {
        flex: 1,
        padding: 12,
        backgroundColor: pdfColors.lightBg,
        borderRadius: 4,
    },
    userInfoLabel: {
        fontSize: 8,
        fontWeight: 700,
        color: pdfColors.secondary,
        marginBottom: 3,
    },
    userInfoValue: {
        fontSize: 10,
        color: pdfColors.black,
    },
    acknowledgementBox: {
        marginTop: 20,
        padding: 15,
        borderWidth: 2,
        borderColor: pdfColors.primary,
        borderRadius: 4,
        backgroundColor: "#f8fafc",
    },
    acknowledgementTitle: {
        fontSize: 11,
        fontWeight: 700,
        color: pdfColors.primary,
        marginBottom: 10,
        textAlign: "center",
    },
    acknowledgementText: {
        fontSize: 10,
        lineHeight: 1.6,
        color: pdfColors.black,
        marginBottom: 10,
    },
    checkboxRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 8,
        paddingLeft: 10,
    },
    checkbox: {
        width: 12,
        height: 12,
        borderWidth: 1,
        borderColor: pdfColors.black,
        marginRight: 8,
        marginTop: 2,
    },
    checkboxText: {
        flex: 1,
        fontSize: 9,
        lineHeight: 1.5,
        color: pdfColors.black,
    },
    signatureSection: {
        marginTop: 30,
    },
    signatureRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    signatureBox: {
        width: "45%",
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: pdfColors.black,
        marginTop: 50,
        marginBottom: 5,
    },
    signatureLabel: {
        fontSize: 9,
        color: pdfColors.secondary,
        marginBottom: 3,
    },
    signatureUnderline: {
        borderBottomWidth: 1,
        borderBottomColor: pdfColors.black,
        marginTop: 25,
        marginBottom: 5,
    },
    statusSection: {
        marginTop: 30,
        padding: 12,
        backgroundColor: pdfColors.lightBg,
        borderRadius: 4,
    },
    statusTitle: {
        fontSize: 10,
        fontWeight: 700,
        color: pdfColors.primary,
        marginBottom: 8,
    },
    statusText: {
        fontSize: 10,
        color: pdfColors.black,
    },
    statusOptions: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 5,
    },
    statusOption: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 15,
        marginBottom: 5,
    },
    statusCircle: {
        width: 12,
        height: 12,
        borderWidth: 1,
        borderColor: pdfColors.black,
        borderRadius: 6,
        marginRight: 5,
    },
    statusOptionText: {
        fontSize: 9,
        color: pdfColors.black,
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: "center",
        fontSize: 8,
        color: pdfColors.secondary,
        borderTopWidth: 1,
        borderTopColor: pdfColors.border,
        paddingTop: 10,
    },
});

// Equipment-specific TOR content
interface EquipmentTorContent {
    title: string;
    terms: string[];
}

const DEFAULT_TOR: EquipmentTorContent = {
    title: "Laboratory Equipment",
    terms: [
        "Read and understand the equipment operating manual before use.",
        "Check equipment condition before starting operation.",
        "Follow all safety guidelines and standard operating procedures.",
        "Report any malfunction or abnormal operation immediately.",
        "Clean the equipment after use as per guidelines.",
        "Log all equipment usage in the designated logbook.",
    ],
};

const EQUIPMENT_TOR: Record<string, EquipmentTorContent> = {
    "ftir-atr": {
        title: "FTIR-ATR Spectrometer",
        terms: [
            "Clean the ATR crystal before and after each measurement using appropriate solvents.",
            "Apply even pressure when placing samples on the ATR crystal.",
            "Do not use corrosive or abrasive samples that may damage the crystal.",
            "Allow the instrument to warm up for at least 15 minutes before measurements.",
            "Record background spectrum before each sample measurement session.",
            "Report any unusual instrument behavior or error messages immediately.",
        ],
    },
    "ftir-kbr": {
        title: "FTIR-KBr Spectrometer",
        terms: [
            "Prepare KBr pellets in a clean, dry environment to avoid moisture contamination.",
            "Use the correct KBr to sample ratio as specified in the protocol.",
            "Handle KBr pellets carefully to avoid fingerprint contamination.",
            "Store unused KBr in a desiccator to prevent moisture absorption.",
            "Clean the pellet holder after each use.",
            "Dispose of used KBr pellets in the designated waste container.",
        ],
    },
    "uv-vis": {
        title: "UV-Vis Spectrophotometer",
        terms: [
            "Use appropriate cuvettes for the measurement wavelength range.",
            "Handle cuvettes by the frosted sides only to avoid fingerprint contamination.",
            "Rinse cuvettes with the sample solution before final measurement.",
            "Run baseline correction with the appropriate blank solution.",
            "Do not exceed the maximum absorbance limit of the instrument.",
            "Clean cuvettes thoroughly after use with appropriate solvents.",
        ],
    },
    bet: {
        title: "BET Surface Area Analyzer",
        terms: [
            "Properly degas samples according to the specified protocol before analysis.",
            "Use the correct sample tube size for the amount of sample.",
            "Record the exact sample mass used for analysis.",
            "Monitor liquid nitrogen levels throughout the analysis.",
            "Do not interrupt the analysis once started.",
            "Clean sample tubes thoroughly before reuse.",
        ],
    },
    hplc: {
        title: "HPLC System",
        terms: [
            "Filter all mobile phases and samples through appropriate filters before use.",
            "Prime the system with mobile phase before connecting the column.",
            "Follow proper column equilibration procedures.",
            "Monitor system pressure throughout the run.",
            "Flush the system with appropriate solvents after use.",
            "Store columns according to manufacturer recommendations.",
        ],
    },
};

// Types
export interface TORTemplateProps {
    equipmentName?: string;
    equipmentCode?: string;
    userName: string;
    userEmail?: string;
    userFaculty?: string;
    supervisorName: string;
    supervisorEmail?: string;
    refNo?: string;
    date?: Date | string;
}

export function TORTemplate({
    equipmentCode,
    userName,
    userEmail,
    userFaculty,
    supervisorName,
    supervisorEmail,
    refNo,
    date = new Date(),
}: TORTemplateProps) {
    // Get equipment-specific terms - guaranteed to have default fallback
    const normalizedCode =
        equipmentCode?.toLowerCase().replace(/[_\s]/g, "-") ?? "default";
    const equipmentTor = EQUIPMENT_TOR[normalizedCode] ?? DEFAULT_TOR;

    return (
        <Document>
            <Page size="A4" style={baseStyles.page}>
                {/* Header */}
                <View style={torStyles.header}>
                    <View style={torStyles.headerLeft}>
                        <Image src="/images/utm-logo.png" style={torStyles.logo} />
                    </View>
                    <View style={torStyles.headerCenter}>
                        <Text style={torStyles.documentTitle}>
                            TERMS OF REFERENCE (TOR)
                        </Text>
                        <Text style={torStyles.documentSubtitle}>
                            ChECA iKohza Laboratory
                        </Text>
                    </View>
                    <View style={torStyles.headerRight}>
                        <Image src="/images/checa-logo.png" style={torStyles.logo} />
                    </View>
                </View>

                {/* Reference Number */}
                {refNo && (
                    <Text
                        style={[torStyles.refNo, { textAlign: "right", marginBottom: 10 }]}
                    >
                        Ref: {refNo} | Date: {formatDate(date)}
                    </Text>
                )}

                {/* Equipment Title */}
                <Text style={torStyles.equipmentTitle}>{equipmentTor.title}</Text>
                <Text style={torStyles.equipmentSubtitle}>
                    [SPECIFIC ACCORDING TO THE EQUIPMENT]
                </Text>

                {/* User Information Section */}
                <View style={torStyles.userInfoSection}>
                    <View style={torStyles.userInfoBox}>
                        <Text style={torStyles.userInfoLabel}>USER NAME</Text>
                        <Text style={torStyles.userInfoValue}>{userName}</Text>
                        {userEmail && (
                            <>
                                <Text style={[torStyles.userInfoLabel, { marginTop: 8 }]}>
                                    EMAIL
                                </Text>
                                <Text style={torStyles.userInfoValue}>{userEmail}</Text>
                            </>
                        )}
                        {userFaculty && (
                            <>
                                <Text style={[torStyles.userInfoLabel, { marginTop: 8 }]}>
                                    FACULTY
                                </Text>
                                <Text style={torStyles.userInfoValue}>{userFaculty}</Text>
                            </>
                        )}
                    </View>
                    <View style={torStyles.userInfoBoxLast}>
                        <Text style={torStyles.userInfoLabel}>SUPERVISOR NAME</Text>
                        <Text style={torStyles.userInfoValue}>{supervisorName}</Text>
                        {supervisorEmail && (
                            <>
                                <Text style={[torStyles.userInfoLabel, { marginTop: 8 }]}>
                                    SUPERVISOR EMAIL
                                </Text>
                                <Text style={torStyles.userInfoValue}>{supervisorEmail}</Text>
                            </>
                        )}
                    </View>
                </View>

                {/* Terms Section */}
                <View style={torStyles.sectionBox}>
                    <Text style={torStyles.sectionTitle}>
                        TERMS AND CONDITIONS OF USE
                    </Text>
                    <Text style={torStyles.sectionText}>
                        The following terms and conditions must be adhered to when using the{" "}
                        {equipmentTor.title}:
                    </Text>
                    {equipmentTor.terms.map((term, idx) => (
                        <View
                            key={`term-${term.substring(0, 20)}-${idx}`}
                            style={torStyles.bulletPoint}
                        >
                            <Text style={torStyles.bullet}>{idx + 1}.</Text>
                            <Text style={torStyles.bulletText}>{term}</Text>
                        </View>
                    ))}
                </View>

                {/* Acknowledgement Box */}
                <View style={torStyles.acknowledgementBox}>
                    <Text style={torStyles.acknowledgementTitle}>
                        ACKNOWLEDGEMENT & DECLARATION
                    </Text>
                    <Text style={torStyles.acknowledgementText}>
                        I have read, understood, and will work in accordance with the terms
                        and conditions stated above. I acknowledge that failure to comply
                        with these terms may result in restricted access to equipment and/or
                        disciplinary action.
                    </Text>

                    <View style={torStyles.checkboxRow}>
                        <View style={torStyles.checkbox} />
                        <Text style={torStyles.checkboxText}>
                            I have received proper training for this equipment
                        </Text>
                    </View>
                    <View style={torStyles.checkboxRow}>
                        <View style={torStyles.checkbox} />
                        <Text style={torStyles.checkboxText}>
                            I understand the safety hazards associated with this equipment
                        </Text>
                    </View>
                    <View style={torStyles.checkboxRow}>
                        <View style={torStyles.checkbox} />
                        <Text style={torStyles.checkboxText}>
                            I agree to report any equipment malfunction immediately
                        </Text>
                    </View>
                </View>

                {/* Signatures Section */}
                <View style={torStyles.signatureSection}>
                    <View style={torStyles.signatureRow}>
                        {/* User Signature */}
                        <View style={torStyles.signatureBox}>
                            <Text style={torStyles.signatureLabel}>User Signature:</Text>
                            <View style={torStyles.signatureLine} />
                            <Text style={torStyles.signatureLabel}>
                                Signed: _________________
                            </Text>
                            <View style={torStyles.signatureUnderline} />
                            <Text style={torStyles.signatureLabel}>Name: {userName}</Text>
                            <View style={torStyles.signatureUnderline} />
                            <Text style={torStyles.signatureLabel}>
                                Date: _________________
                            </Text>
                        </View>

                        {/* Supervisor Signature */}
                        <View style={torStyles.signatureBox}>
                            <Text style={torStyles.signatureLabel}>
                                Supervisor Signature:
                            </Text>
                            <View style={torStyles.signatureLine} />
                            <Text style={torStyles.signatureLabel}>
                                Signed: _________________
                            </Text>
                            <View style={torStyles.signatureUnderline} />
                            <Text style={torStyles.signatureLabel}>
                                Name: {supervisorName}
                            </Text>
                            <View style={torStyles.signatureUnderline} />
                            <Text style={torStyles.signatureLabel}>
                                Date: _________________
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Status Section */}
                <View style={torStyles.statusSection}>
                    <Text style={torStyles.statusTitle}>Circle appropriate status:</Text>
                    <View style={torStyles.statusOptions}>
                        <View style={torStyles.statusOption}>
                            <View style={torStyles.statusCircle} />
                            <Text style={torStyles.statusOptionText}>Undergraduate</Text>
                        </View>
                        <View style={torStyles.statusOption}>
                            <View style={torStyles.statusCircle} />
                            <Text style={torStyles.statusOptionText}>Masters</Text>
                        </View>
                        <View style={torStyles.statusOption}>
                            <View style={torStyles.statusCircle} />
                            <Text style={torStyles.statusOptionText}>PhD</Text>
                        </View>
                        <View style={torStyles.statusOption}>
                            <View style={torStyles.statusCircle} />
                            <Text style={torStyles.statusOptionText}>Staff</Text>
                        </View>
                        <View style={torStyles.statusOption}>
                            <View style={torStyles.statusCircle} />
                            <Text style={torStyles.statusOptionText}>External</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View fixed style={torStyles.footer}>
                    <Text>
                        Terms of Reference | ChECA iKohza | MJIIT | Universiti Teknologi
                        Malaysia
                    </Text>
                    <Text>
                        This form must be signed and returned before equipment access is
                        granted.
                    </Text>
                </View>
            </Page>
        </Document>
    );
}
