/**
 * Work Area Approval Template
 * Generates a formal approval letter with laboratory usage agreement (Appendix A)
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

// Work Area specific styles
const workAreaStyles = StyleSheet.create({
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 25,
        paddingBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: pdfColors.primary,
    },
    headerLeft: {
        width: "35%",
    },
    headerRight: {
        width: "60%",
        alignItems: "flex-end",
        textAlign: "right",
    },
    logo: {
        width: 100,
        height: 50,
        marginBottom: 5,
    },
    instituteName: {
        fontSize: 12,
        fontWeight: 700,
        color: pdfColors.primary,
        marginBottom: 2,
    },
    instituteUnit: {
        fontSize: 10,
        fontWeight: 700,
        color: pdfColors.secondary,
        marginBottom: 4,
    },
    addressText: {
        fontSize: 8,
        color: pdfColors.secondary,
        marginBottom: 1,
    },
    refDate: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    refNo: {
        fontSize: 10,
        color: pdfColors.secondary,
    },
    dateText: {
        fontSize: 10,
        color: pdfColors.black,
    },
    letterTitle: {
        fontSize: 14,
        fontWeight: 700,
        color: pdfColors.primary,
        textAlign: "center",
        marginBottom: 20,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: pdfColors.border,
        textDecoration: "underline",
    },
    salutation: {
        fontSize: 10,
        marginBottom: 15,
    },
    bodyText: {
        fontSize: 10,
        lineHeight: 1.7,
        marginBottom: 12,
        textAlign: "justify",
    },
    detailsSection: {
        marginVertical: 15,
        paddingLeft: 15,
    },
    detailRow: {
        flexDirection: "row",
        marginBottom: 6,
    },
    detailLabel: {
        width: 120,
        fontSize: 10,
        fontWeight: 700,
        color: pdfColors.secondary,
    },
    detailValue: {
        flex: 1,
        fontSize: 10,
        color: pdfColors.black,
    },
    signatureSection: {
        marginTop: 40,
    },
    thankYou: {
        fontSize: 10,
        marginBottom: 30,
    },
    signatureBlock: {
        width: "50%",
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: pdfColors.black,
        marginTop: 60,
        marginBottom: 5,
    },
    signatureName: {
        fontSize: 10,
        fontWeight: 700,
        color: pdfColors.black,
    },
    signatureTitle: {
        fontSize: 9,
        color: pdfColors.secondary,
        marginTop: 2,
    },
    ccSection: {
        marginTop: 30,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: pdfColors.border,
    },
    ccText: {
        fontSize: 9,
        color: pdfColors.secondary,
    },
    // Appendix styles
    appendixTitle: {
        fontSize: 16,
        fontWeight: 700,
        color: pdfColors.primary,
        textAlign: "center",
        marginBottom: 5,
    },
    appendixSubtitle: {
        fontSize: 12,
        fontWeight: 700,
        color: pdfColors.secondary,
        textAlign: "center",
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 11,
        fontWeight: 700,
        color: pdfColors.primary,
        marginTop: 15,
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: pdfColors.border,
    },
    ruleText: {
        fontSize: 9,
        lineHeight: 1.6,
        marginBottom: 4,
        paddingLeft: 15,
    },
    ruleNumber: {
        fontSize: 9,
        fontWeight: 700,
        color: pdfColors.secondary,
        marginRight: 5,
    },
    agreementBox: {
        marginTop: 25,
        padding: 15,
        borderWidth: 1,
        borderColor: pdfColors.border,
        borderRadius: 4,
        backgroundColor: pdfColors.lightBg,
    },
    agreementTitle: {
        fontSize: 10,
        fontWeight: 700,
        color: pdfColors.primary,
        marginBottom: 10,
        textAlign: "center",
    },
    agreementText: {
        fontSize: 9,
        lineHeight: 1.5,
        marginBottom: 15,
    },
    agreementSignatures: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
    },
    agreementSignatureBox: {
        width: "45%",
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

// Lab rules constants
const LAB_RULES = {
    general: [
        "No food or drinks are allowed in the laboratory at any time.",
        "Keep the laboratory clean and tidy at all times.",
        "Report any accidents, injuries, or equipment damage immediately to the lab administrator.",
        "Do not work alone in the laboratory outside of normal working hours without prior approval.",
        "All personal belongings must be stored in designated areas.",
        "Mobile phones must be kept on silent mode during laboratory work.",
        "Photography and video recording are prohibited without prior written permission.",
        "All visitors must be accompanied by authorized personnel.",
        "Laboratory equipment must not be removed without written authorization.",
        "Users must sign the attendance log upon entering and leaving the laboratory.",
    ],
    ppe: [
        "Appropriate personal protective equipment (PPE) must be worn at all times.",
        "Lab coats must be worn and buttoned when working in the laboratory.",
        "Safety glasses or goggles must be worn when handling chemicals or operating equipment.",
        "Closed-toe shoes must be worn at all times. Sandals and open-toe footwear are prohibited.",
        "Gloves must be worn when handling chemicals or biological materials.",
        "Long hair must be tied back when working with equipment or chemicals.",
        "Remove all PPE before leaving the laboratory area.",
    ],
    chemicals: [
        "All chemicals must be properly labeled and stored according to compatibility guidelines.",
        "Material Safety Data Sheets (MSDS) must be reviewed before handling any chemical.",
        "Chemical waste must be disposed of in designated containers only.",
        "Fume hoods must be used when working with volatile or hazardous chemicals.",
        "Never pipette by mouth. Always use mechanical pipetting devices.",
        "Wash hands thoroughly after handling chemicals and before leaving the laboratory.",
        "Report any chemical spills immediately and follow proper cleanup procedures.",
        "Do not mix chemicals unless specifically instructed to do so.",
    ],
    emergency: [
        "Know the location of all emergency exits, fire extinguishers, and safety equipment.",
        "In case of fire, activate the fire alarm and evacuate immediately.",
        "Know the location and use of the emergency eyewash station and safety shower.",
        "In case of chemical exposure, follow the appropriate first aid procedures.",
        "Emergency contact numbers must be displayed prominently in the laboratory.",
    ],
};

// Types
export interface WorkAreaTemplateProps {
    studentName: string;
    faculty: string;
    department?: string;
    supervisorName: string;
    duration: string;
    startDate: Date | string;
    endDate: Date | string;
    refNo: string;
    approverName?: string;
    approverTitle?: string;
    purpose?: string;
}

export function WorkAreaTemplate({
    studentName,
    faculty,
    department,
    supervisorName,
    duration,
    startDate,
    endDate,
    refNo,
    approverName = "Assoc. Prof. Dr. Mohd Firdaus Abd Wahab",
    approverTitle = "Head, ChECA iKohza",
    purpose,
}: WorkAreaTemplateProps) {
    const currentDate = formatDate(new Date());

    return (
        <Document>
            {/* Page 1: Approval Letter */}
            <Page size="A4" style={baseStyles.page}>
                {/* Header */}
                <View style={workAreaStyles.header}>
                    <View style={workAreaStyles.headerLeft}>
                        <Image src="/images/checa-logo.png" style={workAreaStyles.logo} />
                    </View>
                    <View style={workAreaStyles.headerRight}>
                        <Text style={workAreaStyles.instituteName}>ChECA iKohza</Text>
                        <Text style={workAreaStyles.instituteUnit}>
                            Chemical Engineering & Clean Air
                        </Text>
                        <Text style={workAreaStyles.addressText}>
                            Malaysia-Japan International Institute of Technology
                        </Text>
                        <Text style={workAreaStyles.addressText}>
                            Universiti Teknologi Malaysia
                        </Text>
                        <Text style={workAreaStyles.addressText}>
                            Jalan Sultan Yahya Petra, 54100 Kuala Lumpur
                        </Text>
                        <Text style={workAreaStyles.addressText}>
                            Tel: +603-2203 1555 | Email: checa@utm.my
                        </Text>
                    </View>
                </View>

                {/* Reference and Date */}
                <View style={workAreaStyles.refDate}>
                    <Text style={workAreaStyles.refNo}>Ref: {refNo}</Text>
                    <Text style={workAreaStyles.dateText}>{currentDate}</Text>
                </View>

                {/* Letter Title */}
                <Text style={workAreaStyles.letterTitle}>APPROVAL OF WORKING AREA</Text>

                {/* Salutation */}
                <Text style={workAreaStyles.salutation}>Dear {studentName},</Text>

                {/* Body */}
                <Text style={workAreaStyles.bodyText}>
                    With reference to your application for laboratory working space at
                    ChECA iKohza, we are pleased to inform you that your request has been
                    approved. The details of your approval are as follows:
                </Text>

                {/* Details Section */}
                <View style={workAreaStyles.detailsSection}>
                    <View style={workAreaStyles.detailRow}>
                        <Text style={workAreaStyles.detailLabel}>Name:</Text>
                        <Text style={workAreaStyles.detailValue}>{studentName}</Text>
                    </View>
                    <View style={workAreaStyles.detailRow}>
                        <Text style={workAreaStyles.detailLabel}>Faculty:</Text>
                        <Text style={workAreaStyles.detailValue}>{faculty}</Text>
                    </View>
                    {department && (
                        <View style={workAreaStyles.detailRow}>
                            <Text style={workAreaStyles.detailLabel}>Department:</Text>
                            <Text style={workAreaStyles.detailValue}>{department}</Text>
                        </View>
                    )}
                    <View style={workAreaStyles.detailRow}>
                        <Text style={workAreaStyles.detailLabel}>Supervisor:</Text>
                        <Text style={workAreaStyles.detailValue}>{supervisorName}</Text>
                    </View>
                    <View style={workAreaStyles.detailRow}>
                        <Text style={workAreaStyles.detailLabel}>Duration:</Text>
                        <Text style={workAreaStyles.detailValue}>{duration}</Text>
                    </View>
                    <View style={workAreaStyles.detailRow}>
                        <Text style={workAreaStyles.detailLabel}>Period:</Text>
                        <Text style={workAreaStyles.detailValue}>
                            {formatDate(startDate)} to {formatDate(endDate)}
                        </Text>
                    </View>
                    {purpose && (
                        <View style={workAreaStyles.detailRow}>
                            <Text style={workAreaStyles.detailLabel}>Purpose:</Text>
                            <Text style={workAreaStyles.detailValue}>{purpose}</Text>
                        </View>
                    )}
                </View>

                <Text style={workAreaStyles.bodyText}>
                    Attached together with this letter is the laboratory usage agreement
                    (Appendix A) which outlines the rules and regulations that must be
                    adhered to during your time at the ChECA laboratory. Please read,
                    understand, and sign the agreement before commencing work.
                </Text>

                <Text style={workAreaStyles.bodyText}>
                    Your cooperation in maintaining a safe and productive laboratory
                    environment is greatly appreciated. Should you have any questions or
                    concerns, please do not hesitate to contact the laboratory
                    administrator.
                </Text>

                {/* Signature Section */}
                <View style={workAreaStyles.signatureSection}>
                    <Text style={workAreaStyles.thankYou}>
                        Thank you for your cooperation.
                    </Text>
                    <View style={workAreaStyles.signatureBlock}>
                        <View style={workAreaStyles.signatureLine} />
                        <Text style={workAreaStyles.signatureName}>{approverName}</Text>
                        <Text style={workAreaStyles.signatureTitle}>{approverTitle}</Text>
                        <Text style={workAreaStyles.signatureTitle}>
                            Malaysia-Japan International Institute of Technology
                        </Text>
                    </View>
                </View>

                {/* CC Section */}
                <View style={workAreaStyles.ccSection}>
                    <Text style={workAreaStyles.ccText}>
                        c.c: Supervisor ({supervisorName})
                    </Text>
                    <Text style={workAreaStyles.ccText}>Laboratory Administrator</Text>
                </View>

                {/* Footer */}
                <View fixed style={workAreaStyles.footer}>
                    <Text>Page 1 | Approval Letter</Text>
                </View>
            </Page>

            {/* Page 2+: Appendix A - Laboratory Usage Agreement */}
            <Page size="A4" style={baseStyles.page}>
                <Text style={workAreaStyles.appendixTitle}>APPENDIX A</Text>
                <Text style={workAreaStyles.appendixSubtitle}>
                    LABORATORY USAGE AGREEMENT
                </Text>

                {/* General Rules */}
                <Text style={workAreaStyles.sectionHeader}>
                    1. GENERAL LABORATORY RULES
                </Text>
                {LAB_RULES.general.map((rule, ruleIndex) => (
                    <Text key={`general-${rule.slice(0, 20).replace(/\s/g, "-")}`} style={workAreaStyles.ruleText}>
                        <Text style={workAreaStyles.ruleNumber}>1.{ruleIndex + 1}</Text> {rule}
                    </Text>
                ))}

                {/* PPE Rules */}
                <Text style={workAreaStyles.sectionHeader}>
                    2. PERSONAL PROTECTIVE EQUIPMENT (PPE)
                </Text>
                {LAB_RULES.ppe.map((rule, ruleIndex) => (
                    <Text key={`ppe-${rule.slice(0, 20).replace(/\s/g, "-")}`} style={workAreaStyles.ruleText}>
                        <Text style={workAreaStyles.ruleNumber}>2.{ruleIndex + 1}</Text> {rule}
                    </Text>
                ))}

                {/* Footer */}
                <View fixed style={workAreaStyles.footer}>
                    <Text>Page 2 | Appendix A - Laboratory Usage Agreement</Text>
                </View>
            </Page>

            {/* Page 3: Chemical Safety & Emergency + Agreement */}
            <Page size="A4" style={baseStyles.page}>
                {/* Chemical Safety Rules */}
                <Text style={workAreaStyles.sectionHeader}>3. CHEMICAL SAFETY</Text>
                {LAB_RULES.chemicals.map((rule, ruleIndex) => (
                    <Text key={`chemical-${rule.slice(0, 20).replace(/\s/g, "-")}`} style={workAreaStyles.ruleText}>
                        <Text style={workAreaStyles.ruleNumber}>3.{ruleIndex + 1}</Text> {rule}
                    </Text>
                ))}

                {/* Emergency Procedures */}
                <Text style={workAreaStyles.sectionHeader}>
                    4. EMERGENCY PROCEDURES
                </Text>
                {LAB_RULES.emergency.map((rule, ruleIndex) => (
                    <Text key={`emergency-${rule.slice(0, 20).replace(/\s/g, "-")}`} style={workAreaStyles.ruleText}>
                        <Text style={workAreaStyles.ruleNumber}>4.{ruleIndex + 1}</Text> {rule}
                    </Text>
                ))}

                {/* Agreement Box */}
                <View style={workAreaStyles.agreementBox}>
                    <Text style={workAreaStyles.agreementTitle}>
                        DECLARATION & AGREEMENT
                    </Text>
                    <Text style={workAreaStyles.agreementText}>
                        I, the undersigned, hereby declare that I have read, understood, and
                        agree to comply with all the rules and regulations outlined in this
                        Laboratory Usage Agreement. I understand that failure to comply with
                        these rules may result in the revocation of my laboratory access
                        privileges and/or disciplinary action.
                    </Text>

                    <View style={workAreaStyles.agreementSignatures}>
                        {/* User Signature */}
                        <View style={workAreaStyles.agreementSignatureBox}>
                            <View style={workAreaStyles.signatureLine} />
                            <Text style={{ fontSize: 8, color: pdfColors.secondary }}>
                                Signature
                            </Text>
                            <View style={[workAreaStyles.signatureLine, { marginTop: 25 }]} />
                            <Text style={{ fontSize: 8, color: pdfColors.secondary }}>
                                Name: {studentName}
                            </Text>
                            <View style={[workAreaStyles.signatureLine, { marginTop: 25 }]} />
                            <Text style={{ fontSize: 8, color: pdfColors.secondary }}>
                                Date
                            </Text>
                        </View>

                        {/* Witness Signature */}
                        <View style={workAreaStyles.agreementSignatureBox}>
                            <View style={workAreaStyles.signatureLine} />
                            <Text style={{ fontSize: 8, color: pdfColors.secondary }}>
                                Witnessed by (Supervisor)
                            </Text>
                            <View style={[workAreaStyles.signatureLine, { marginTop: 25 }]} />
                            <Text style={{ fontSize: 8, color: pdfColors.secondary }}>
                                Name: {supervisorName}
                            </Text>
                            <View style={[workAreaStyles.signatureLine, { marginTop: 25 }]} />
                            <Text style={{ fontSize: 8, color: pdfColors.secondary }}>
                                Date
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View fixed style={workAreaStyles.footer}>
                    <Text>Page 3 | Appendix A - Laboratory Usage Agreement</Text>
                </View>
            </Page>
        </Document>
    );
}
