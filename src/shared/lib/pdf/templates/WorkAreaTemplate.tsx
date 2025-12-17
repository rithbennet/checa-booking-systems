import path from "node:path";
import {
	Document,
	Image,
	Page,
	StyleSheet,
	Text,
	View,
} from "@react-pdf/renderer";
import { facilityConfig } from "@/shared/lib/pdf/config/facility-config";

// Register fonts if needed (using default Helvetica here, but recommended to register a font family for Bold/Italics if precise matching is needed)
// Font.register({ family: 'OpenSans', src: '...' });

// Get file system path for images
const getImagePath = (imageName: string) => {
	return path.join(process.cwd(), "public", "images", imageName);
};

const styles = StyleSheet.create({
	page: {
		paddingTop: 30,
		paddingBottom: 40,
		paddingHorizontal: 40,
		fontFamily: "Helvetica",
		fontSize: 10,
		lineHeight: 1.3,
		color: "#000000",
	},
	// Header Section (Page 1)
	headerContainer: {
		flexDirection: "row",
		marginBottom: 30,
	},
	logoContainer: {
		width: "30%",
	},
	logo: {
		width: 120,
		height: "auto",
	},
	addressContainer: {
		width: "70%",
		alignItems: "flex-end",
		textAlign: "right",
	},
	addressTitle: {
		fontSize: 9,
		fontWeight: "bold", // Helvetica-Bold
	},
	addressText: {
		fontSize: 9,
	},
	// Letter Body
	recipientBlock: {
		marginBottom: 20,
	},
	refBlock: {
		marginTop: 10,
		marginBottom: 10,
	},
	title: {
		fontSize: 11,
		fontWeight: "bold",
		marginTop: 15,
		marginBottom: 15,
		textTransform: "uppercase",
	},
	paragraph: {
		marginBottom: 10,
		textAlign: "justify",
		fontSize: 10,
	},
	// Key-Value List (Name, Faculty, etc.)
	infoTable: {
		marginVertical: 10,
		paddingLeft: 0,
	},
	infoRow: {
		flexDirection: "row",
		marginBottom: 2,
	},
	infoLabel: {
		width: 80,
		fontSize: 10,
	},
	infoSeparator: {
		width: 10,
		fontSize: 10,
	},
	infoValue: {
		flex: 1,
		fontSize: 10,
	},
	// Signature Section
	signatureBlock: {
		marginTop: 30,
		marginBottom: 20,
	},
	signatureImage: {
		width: 100,
		height: 40,
		marginBottom: 5,
	},
	signerName: {
		fontSize: 9,
		fontWeight: "bold",
		color: "#1a365d", // Dark blueish tone from screenshot
		textTransform: "uppercase",
	},
	signerTitle: {
		fontSize: 8,
		color: "#1a365d",
	},
	ccBlock: {
		marginTop: 10,
		fontSize: 9,
	},
	// Appendix Styles
	appendixHeader: {
		alignItems: "center",
		marginBottom: 20,
	},
	appendixTitle: {
		fontSize: 11,
		fontWeight: "bold",
		marginBottom: 5,
	},
	appendixSubTitle: {
		fontSize: 14,
		fontWeight: "bold",
		marginBottom: 5,
	},
	centerLogo: {
		width: 140,
		height: "auto",
		marginVertical: 10,
	},
	instituteHeader: {
		fontSize: 9,
		fontWeight: "bold",
		textAlign: "center",
		marginBottom: 2,
	},
	sectionTitle: {
		fontSize: 10,
		fontWeight: "bold",
		marginTop: 15,
		marginBottom: 5,
	},
	bold: {
		fontWeight: "bold",
		fontFamily: "Helvetica-Bold",
	},
	listItem: {
		flexDirection: "row",
		marginBottom: 4,
		paddingLeft: 5,
	},
	bullet: {
		width: 15,
		fontSize: 10,
	},
	listContent: {
		flex: 1,
		fontSize: 10,
		textAlign: "justify",
	},
	subListItem: {
		flexDirection: "row",
		marginBottom: 2,
		paddingLeft: 25,
	},
	subBullet: {
		width: 15,
		fontSize: 10,
	},
	footerRight: {
		position: "absolute",
		bottom: 30,
		right: 40,
		fontSize: 9,
	},
	// Form inputs on last page
	signatureLine: {
		borderBottomWidth: 1,
		borderBottomColor: "#000",
		width: 200,
		marginHorizontal: 5,
		marginBottom: -2,
	},
	signatureRow: {
		flexDirection: "row",
		alignItems: "flex-end",
		marginTop: 20,
		marginBottom: 20,
	},
});

export interface WorkAreaTemplateProps {
	studentName: string;
	faculty: string;
	supervisorName: string;
	duration: string;
	refNo: string;
	startDate: Date;
	endDate: Date;
	department?: string | null;
	purpose?: string | null;
	address?: string;
	dateStr?: string;
}

const BulletItem = ({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) => (
	<View style={styles.listItem}>
		<Text style={styles.bullet}>{label}</Text>
		<Text style={styles.listContent}>{children}</Text>
	</View>
);

const SubBulletItem = ({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) => (
	<View style={styles.subListItem}>
		<Text style={styles.subBullet}>{label}</Text>
		<Text style={styles.listContent}>{children}</Text>
	</View>
);

export function WorkAreaTemplate({
	studentName,
	faculty,
	supervisorName,
	duration,
	refNo,
	startDate,
	endDate,
	department,
	purpose,
	address,
	dateStr,
}: WorkAreaTemplateProps) {
	// Compute display date: use dateStr if provided, otherwise compute from startDate/endDate, or fallback to current date
	let displayDate: string;
	if (dateStr) {
		displayDate = dateStr;
	} else if (startDate && endDate) {
		const startStr = startDate.toLocaleDateString();
		const endStr = endDate.toLocaleDateString();
		displayDate = `${startStr} - ${endStr}`;
	} else if (startDate) {
		displayDate = startDate.toLocaleDateString();
	} else {
		displayDate = new Date().toLocaleDateString();
	}
	const config = facilityConfig.workArea;
	const displayAddress = address || config.address.university;

	return (
		<Document>
			{/* ================= PAGE 1: APPROVAL LETTER ================= */}
			<Page size="A4" style={styles.page}>
				{/* Header */}
				<View style={styles.headerContainer}>
					<View style={styles.logoContainer}>
						<Image src={getImagePath(config.logos.main)} style={styles.logo} />
					</View>
					<View style={styles.addressContainer}>
						<Text style={styles.addressTitle}>{config.address.title}</Text>
						<Text style={styles.addressText}>{config.address.institute}</Text>
						<Text style={styles.addressText}>{config.address.university}</Text>
						<Text style={styles.addressText}>{config.address.street}</Text>
						<Text style={styles.addressText}>{config.address.city}</Text>
						<Text style={styles.addressText}>{config.address.email}</Text>
					</View>
				</View>

				{/* Recipient Details */}
				<View style={styles.recipientBlock}>
					<Text>{studentName}</Text>
					<Text>{supervisorName}</Text>
					<Text>{displayAddress}</Text>
					<Text>{displayDate}</Text>
					<Text style={styles.refBlock}>Ref No : {refNo}</Text>
					<Text style={{ marginTop: 10 }}>
						Mr/Ms/Mrs/Dr/Prof/ (choose the appropriate salutation)
					</Text>
				</View>

				{/* Title */}
				<Text style={styles.title}>
					APPROVAL OF WORKING AREA IN CHECA IKOHZA
				</Text>

				{/* Body Paragraph 1 */}
				<Text style={styles.paragraph}>
					Referring to the matters above, your application to utilize the
					working area in ChECA iKohza has been approved. Your details are as
					follow
				</Text>

				{/* Details Grid (Aligned Colons) */}
				<View style={styles.infoTable}>
					<View style={styles.infoRow}>
						<Text style={styles.infoLabel}>Name</Text>
						<Text style={styles.infoSeparator}>:</Text>
						<Text style={styles.infoValue}>{studentName}</Text>
					</View>
					<View style={styles.infoRow}>
						<Text style={styles.infoLabel}>Faculty</Text>
						<Text style={styles.infoSeparator}>:</Text>
						<Text style={styles.infoValue}>{faculty}</Text>
					</View>
					{department && (
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>Department</Text>
							<Text style={styles.infoSeparator}>:</Text>
							<Text style={styles.infoValue}>{department}</Text>
						</View>
					)}
					<View style={styles.infoRow}>
						<Text style={styles.infoLabel}>Supervisor</Text>
						<Text style={styles.infoSeparator}>:</Text>
						<Text style={styles.infoValue}>{supervisorName}</Text>
					</View>
					<View style={styles.infoRow}>
						<Text style={styles.infoLabel}>Duration</Text>
						<Text style={styles.infoSeparator}>:</Text>
						<Text style={styles.infoValue}>{duration}</Text>
					</View>
					{purpose && (
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>Purpose</Text>
							<Text style={styles.infoSeparator}>:</Text>
							<Text style={styles.infoValue}>{purpose}</Text>
						</View>
					)}
				</View>

				{/* Numbered Paragraphs */}
				<View style={{ flexDirection: "row", marginBottom: 10 }}>
					<Text style={{ width: 15 }}>2.</Text>
					<Text style={{ flex: 1, textAlign: "justify" }}>
						Attached together is the agreement (Appendix A) that need to be
						signed by you and your supervisor. It is{" "}
						<Text style={styles.bold}>compulsory</Text> for you to complete the
						agreement and returned it to us{" "}
						<Text style={styles.bold}>before</Text> utilizing the working area.
						Failure in doing so will cause this approval to be retracted.
					</Text>
				</View>

				<View style={{ flexDirection: "row", marginBottom: 10 }}>
					<Text style={{ width: 15 }}>3.</Text>
					<Text style={{ flex: 1, textAlign: "justify" }}>
						This approval is only valid within the stipulated time. If extension
						is needed, new application must be made through the same procedure.
					</Text>
				</View>

				<Text style={styles.paragraph}>
					Please comply with the rules and regulations
				</Text>

				<Text style={{ marginTop: 10 }}>Regards</Text>

				{/* Signature */}
				<View style={styles.signatureBlock}>
					<Image
						src={getImagePath(config.signature.signatureImage)}
						style={styles.signatureImage}
					/>
					<Text style={styles.signerName}>{config.signature.name}</Text>
					<Text style={styles.signerTitle}>{config.signature.department}</Text>
					<Text style={styles.signerTitle}>{config.signature.institute},</Text>
					<Text style={styles.signerTitle}>{config.signature.university},</Text>
					<Text style={styles.signerTitle}>{config.signature.address}.</Text>
				</View>

				{/* CC */}
				<View style={styles.ccBlock}>
					<Text>c.c : {config.ccRecipients[0]}</Text>
					<Text style={{ marginLeft: 18 }}>: {config.ccRecipients[1]}</Text>
				</View>
			</Page>

			{/* ================= PAGE 2: APPENDIX A (General) ================= */}
			<Page size="A4" style={styles.page}>
				<View style={styles.appendixHeader}>
					<Text style={styles.appendixTitle}>Appendix A</Text>
					<Text style={styles.appendixSubTitle}>
						Laboratory Usage Agreement
					</Text>
					<Image
						src={getImagePath(config.logos.big)}
						style={styles.centerLogo}
					/>
					<Text style={styles.instituteHeader}>
						{config.signature.department}
					</Text>
					<Text style={styles.instituteHeader}>{config.address.institute}</Text>
				</View>

				<Text style={styles.sectionTitle}>General</Text>
				<BulletItem label="•">
					Before any laboratory work is undertaken
				</BulletItem>
				<SubBulletItem label="[ ]">
					You should have arranged a lab induction. An induction is mandatory
					for the use of any of the research labs.
				</SubBulletItem>
				<SubBulletItem label="[ ]">
					You should inform the person in charge the date that you want to begin
					the experimental work
				</SubBulletItem>

				<BulletItem label="•">
					Food and drinks are <Text style={styles.bold}>NOT ALLOWED</Text> to be
					consumed or brought into the laboratory
				</BulletItem>
				<BulletItem label="•">
					All lab users should allow enough time to complete work within
					laboratory opening hours (8.00 am to 5.00 pm). The lab facilities
					cannot be used out of hours without permission and agreement from the
					head of the laboratory. Failure to co-operate with this policy will
					result in access being revoked.
				</BulletItem>
				<BulletItem label="•">NO access card will be given</BulletItem>
				<BulletItem label="•">
					NO chemicals are provided. User must purchase or bring their own
					chemicals for their project. Analytical equipment such as FTIR,
					UV-VIS, BET, HPLC is <Text style={styles.bold}>NOT</Text> allowed.
				</BulletItem>
				<BulletItem label="•">
					Guest/visitors are <Text style={styles.bold}>PROHIBITED</Text> from
					taking/removing/modifying/damaging any facilities including equipment
					and materials.
				</BulletItem>

				<Text style={styles.sectionTitle}>
					Personal Protective Equipment & Clothing
				</Text>
				<BulletItem label="•">
					Laboratory coats should be always worn within the laboratory
				</BulletItem>
				<BulletItem label="•">
					Sensible footwear should be worn. Open-toe shoes are not permissible.
				</BulletItem>
				<BulletItem label="•">
					Long hair and/or headscarves should be tucked away or secured to
					ensure they cannot be caught in machinery, open flames or contaminated
					with chemicals
				</BulletItem>
				<BulletItem label="•">
					Do not leave coats/ bags in the aisles or on the benches; make sure
					they are tucked away.
				</BulletItem>

				<Text style={styles.sectionTitle}>
					Chemical Handling, Storage & Cleaning
				</Text>
				<BulletItem label="•">
					ALL samples/reagents need to be clearly labelled with you name and
					date and what the sample actually is or contains. They should also
					have an expiry date and any appropriate hazard information detailed.
					This includes samples stored within fridges and freezers.
				</BulletItem>
				<BulletItem label="•">
					Do not use glassware storage of sample. They are in constant need and
					sample should be stored in a glass bottle, plastic container, or any
					appropriate storage container.
				</BulletItem>

				<Text style={styles.footerRight}>Page 1 of 5</Text>
			</Page>

			{/* ================= PAGE 3: APPENDIX A (Facilities) ================= */}
			<Page size="A4" style={styles.page}>
				<Text style={[styles.appendixTitle, { marginBottom: 15 }]}>
					Appendix A
				</Text>

				<BulletItem label="•">
					Cleaning of glassware should be done promptly and to the required
					standard is to wash with detergent until all the stain is removed,
					rinse with tap water until no residue and rinse with deionized water
					for final rinse. Dry the glassware on drying rack, oven or which ever
					is appropriate.
				</BulletItem>
				<BulletItem label="•">
					Any spillages need to be cleared up immediately. Ask the laboratory
					staff if you are unsure.
				</BulletItem>
				<BulletItem label="•">
					Broken glass or sharp items should not be put into the general waste
					bins. There are dedicated bins available for this purpose.
				</BulletItem>
				<BulletItem label="•">
					Please dispose the waste chemical according to the waste
					classification. Please ask the laboratory staff if you are unsure.
				</BulletItem>
				<BulletItem label="•">
					All working areas including Fume hood should be left clean and empty
					after use. <Text style={styles.bold}>DO NOT</Text> store anything in
					fume hood area.
				</BulletItem>

				<Text style={styles.sectionTitle}>Use of lab facilities</Text>
				<BulletItem label="•">
					Training will be provided for any facilities that you need to use.{" "}
					<Text style={styles.bold}>
						Please write your information in the logbook provided every time you
						use the facilities.
					</Text>
				</BulletItem>
				<BulletItem label="•">
					Facilities should be left in a clean and good condition for the next
					user. Report any problems, damage, breakages or unusual result and/or
					behaviour to a member of laboratory staff.
				</BulletItem>
				<BulletItem label="•">
					If you need to leave an experiment running or a piece of equipment on
					overnight, please leave a note with details of your name, phone number
					and duration. Please place this information onto/near you experiment
				</BulletItem>
				<BulletItem label="•">
					Facilities that can be used are
					{"\n"}
					{"    "}- Oven
					{"\n"}
					{"    "}- Hot plate stirrer
					{"\n"}
					{"    "}- Centrifuge
					{"\n"}
					{"    "}- pH meter
					{"\n"}
					{"    "}- Rotary evaporator
					{"\n"}
					{"    "}- Bath sonicator
					{"\n"}
					{"    "}- Refrigerator
					{"\n"}
					{"    "}- Furnace
					{"\n"}
					{"    "}- Homogenizer
					{"\n"}
					{"    "}- Water bath
					{"\n"}
					{"    "}- Overhead stirrer
					{"\n"}
					{"    "}- Deionized water
					{"\n"}
					{"    "}- Weighing balance
					{"\n"}
					{"    "}- Fume hood
					{"\n"}
					{"    "}- Deep freezer
					{"\n"}
					{"    "}- Glassware
				</BulletItem>
				<BulletItem label="•">
					Glassware <Text style={styles.bold}>CANNOT</Text> be removed from the
					lab. The usage of glassware is limited within the lab only
				</BulletItem>
				<BulletItem label="•">
					Horn/probe sonicator is <Text style={styles.bold}>NOT</Text> allowed
					due to the wear and tear of the probe tip. Supervisor{" "}
					<Text style={styles.bold}>MUST</Text> provide their own tip if the
					usage is necessary. Please consult the laboratory member if the usage
					is needed. Analytical equipment is{" "}
					<Text style={styles.bold}>NOT</Text> allowed.
				</BulletItem>
				<Text style={{ fontSize: 10, marginTop: 5 }}>
					Details laboratory rules and regulations are provided in following
					section
				</Text>

				<Text style={styles.footerRight}>Page 2 of 5</Text>
			</Page>

			{/* ================= PAGE 4: APPENDIX A (Rules A) ================= */}
			<Page size="A4" style={styles.page}>
				<Text style={styles.appendixTitle}>Appendix A</Text>

				<View style={{ alignItems: "center", marginBottom: 15 }}>
					<Text style={{ fontSize: 14, fontWeight: "bold" }}>
						{config.address.title}
					</Text>
					<Text style={{ fontSize: 14, fontWeight: "bold" }}>
						Lab Rules and Regulations
					</Text>
				</View>

				<Text style={styles.paragraph}>
					This document is describing the rules and regulations for working in
					{config.address.title} ({config.address.institute}). All students,
					researchers, technicians are advised to read through them carefully
					and sign at the end of this document to indicate your acceptance.
				</Text>

				<Text style={styles.sectionTitle}>A. LAB REGULATION & SAFETY</Text>

				<BulletItem label="1.">
					UTM general regulations are applicable to the lab such as:
					{"\n"}
					{"    "}i. No smoking area
					{"\n"}
					{"    "}ii. Proper attire
					{"\n"}
					{"    "}iii. Guest/visitors are{" "}
					<Text style={styles.bold}>PROHIBITED</Text> from
					taking/removing/modifying/damaging any facilities including equipment
					and materials
				</BulletItem>
				<BulletItem label="2.">Never work alone in the laboratory</BulletItem>
				<BulletItem label="3.">
					Do not touch any equipment, chemicals, or other materials in the
					laboratory area before ask permission
				</BulletItem>
				<BulletItem label="4.">
					Perform only those experiments authorized by your supervisor.
					Carefully follow all instructions, both written and oral
				</BulletItem>
				<BulletItem label="5.">
					Do not eat food, drink beverages or chew gum in the experimental area.
				</BulletItem>
				<BulletItem label="6.">
					Be prepared for your work in the laboratory. Understand all procedures
					before begin your experiments
				</BulletItem>
				<BulletItem label="7.">
					Work area should be kept clean and tidy at all times
				</BulletItem>
				<BulletItem label="8.">
					Be alert and proceed with caution at all times in the laboratory.
					Notify the academic staff immediately of any unsafe conditions you
					observe
				</BulletItem>
				<BulletItem label="9.">
					Dispose of all chemical waste properly. Never throw unsafe chemicals
					down the drain. Check with academic staff for disposal of chemicals
					and solutions
				</BulletItem>
				<BulletItem label="10.">
					Label and equipment instructions must be read carefully before use.
					Set up and use the equipment as directed properly by academic staff
				</BulletItem>
				<BulletItem label="11.">
					Keep hands away from face, eyes, mouth and body while using chemicals
					or lab equipment. Wash your hands with soap and water after performing
					all experiments
				</BulletItem>
				<BulletItem label="12.">
					Experiments <Text style={styles.bold}>MUST</Text> be personally
					monitored at all times. <Text style={styles.bold}>DO NOT</Text> wander
					around the room, distract other students, startle other students or
					interfere with the laboratory experiments of others.
				</BulletItem>
				<BulletItem label="13.">
					Know the locations and operating procedures of all safety equipment
					including: first aid kit(s), and fire extinguisher. Know where the
					fire alarm and the exits are located
				</BulletItem>
				<BulletItem label="14.">
					Know what to do if there is a fire drill during a laboratory period;
					containers must be closed and any electrical equipment turned off
				</BulletItem>
				<BulletItem label="15.">
					Any time chemicals, heat or glassware are used, students will wear the
					proper PPE
				</BulletItem>
				<BulletItem label="16.">
					Contact lenses is <Text style={styles.bold}>NOT</Text> encourage to be
					worn
				</BulletItem>
				<BulletItem label="17.">
					Dress properly during laboratory activities. Long hair, dangling
					jewelry and loose or baggy clothing are a hazard in the laboratory.
					Long hair must be
				</BulletItem>

				<Text style={styles.footerRight}>Page 3 of 5</Text>
			</Page>

			{/* ================= PAGE 5: APPENDIX A (Rules B, C, D) ================= */}
			<Page size="A4" style={styles.page}>
				<Text style={styles.appendixTitle}>Appendix A</Text>

				<Text style={{ marginBottom: 15 }}>
					tied back, and dangling jewelry and baggy clothing must be secured.
					Shoes must completely cover the foot. No sandals allowed on lab days
				</Text>
				<BulletItem label="18.">
					A lab coat or smock should be worn during laboratory experiments.
				</BulletItem>

				<Text style={styles.sectionTitle}>
					B. REPORT ALL INCIDENTS AND INJURIES IMMEDIATELY
				</Text>
				<BulletItem label="19.">
					Report any accident (spill, breakage, etc) or injury (cut, burn, etc.)
					to the lab manager/lab head immediately, no mater how trivial it
					seems. <Text style={styles.bold}>DO NOT PANIC</Text>
				</BulletItem>
				<BulletItem label="20.">
					If you or lab partner is hurt, immediately (and loudly) yell out the
					lab manager name to get his/her attention.{" "}
					<Text style={styles.bold}>DO NOT PANIC</Text>
				</BulletItem>
				<BulletItem label="21.">
					If a chemical should splash in your eye(s) or on your skin,
					immediately flush with running water for at least 20 minutes.
					Immediately (and loudly) yell out the lab manager name to get his/her
					attention.
				</BulletItem>

				<Text style={styles.sectionTitle}>C. HANDLING CHEMICALS</Text>
				<BulletItem label="22.">
					All chemicals in the laboratory are to be considered dangerous. Avoid
					handling chemicals with fingers. Always use the appropriate apparatus.
					When making an observation, keep the safe distance.{" "}
					<Text style={styles.bold}>DO NOT</Text> taste, or smell any chemicals
				</BulletItem>
				<BulletItem label="23.">
					Name and amount of chemicals used and added need to be recorded.
				</BulletItem>
				<BulletItem label="24.">
					Check the label on all chemicals bottles twice before removing any of
					the contents. Take only as much chemical as you need and record it
					into logbook
				</BulletItem>
				<BulletItem label="25.">
					Never return unused chemicals to their original container
				</BulletItem>
				<BulletItem label="26.">
					Never remove chemicals or other materials from the laboratory area
					without permission.
				</BulletItem>
				<BulletItem label="27.">
					Read or refer to the Safety Data Sheet (SDS) for further information
				</BulletItem>

				<Text style={styles.sectionTitle}>
					D. PRESSURIZED GAS CYLINDARS AND BOTTLES
				</Text>
				<BulletItem label="28.">
					Pressurized gas cylinders may only be transported with the protective
					cap screwed shut and using special transportation trolleys. When in
					operation, they must be secured so that they cannot tip over and be
					kept away from sources of heat. Pressure-reducing valves must be
					attached or exchanged only by an expert. Gas cylinders whose valves
					cannot be opened by hand must be appropriately labelled and removed
					from used.
				</BulletItem>
				<BulletItem label="29.">
					Gas cylinders and bottles containing poisonous, highly toxic or
					carcinogenic gases, in so far as they have to be kept in the
					laboratory, must be stored so that ny escaping gas is removed
					continuously, e/g either by being kept in a fume chamber or special
					gas cylinder cabinet. The smallest possible amount of these gases
					should be kept for use at any one time.
				</BulletItem>
				<BulletItem label="30.">
					Gas cylinders and bottles may only be kept in laboratories for the
					purpose of drawing off has or immediately before a change of cylinder
					is to be carried out. Storage of cylinders in the laboratory is not
					permitted. Gas cylinders are not allowed to be kept in the corridor
					areas.
				</BulletItem>

				<Text style={styles.footerRight}>Page 4 of 5</Text>
			</Page>

			{/* ================= PAGE 6: APPENDIX A (Rules E + Sign) ================= */}
			<Page size="A4" style={styles.page}>
				<Text style={styles.appendixTitle}>Appendix A</Text>

				<BulletItem label="31.">
					A series of dangers can arise with the use of liquid nitrogen or
					liquid helium if they are not handled correctly. Notice should be
					taken of the internal documents “Operating rules for helium recovery
					plant and liquid helium containers”, the guidelines issued by the
					company Linde for the handling of liquid nitrogen and helium.
				</BulletItem>
				<BulletItem label="32.">
					Spraying of cryogenic liquid risk of burns, danger for the eyes,
					reduced oxygen level in the surrounding air due to evaporating
					nitrogen.
				</BulletItem>
				<BulletItem label="33.">Risk of suffocation</BulletItem>
				<BulletItem label="34.">
					Incorrect handling of cryogenic containers (i.e storage vessels for
					liquid nitrogen, liquid helium and cryostats) cause risk of fire or
					explosion.
				</BulletItem>
				<BulletItem label="35.">
					Protective measures to be taken: weak protective gloves, wear goggles,
					provide good ventilation, do not leave container open, avoid contact
					with organic substances (including wood and paper)
				</BulletItem>

				<Text style={styles.sectionTitle}>
					E. INSTRUMENT/EQUIPMENT/APPARATUS
				</Text>
				<BulletItem label="36.">
					Instrument/equipment may only be used for the purpose for which is
					constructed and only applicable for{" "}
					<Text style={styles.bold}>WELL-TRAINED</Text> person
				</BulletItem>
				<BulletItem label="37.">
					Instrument/equipment which is left running overnight must have the
					requisite safety devices (e.g level regulator, water safety cut-out).
					Long-term experiments must be labelled as such and carried out in such
					a way that in accordance with careful and informed discretion any
					danger is excluded even outside normal working hours. The person
					responsible should be contactable by phone if necessary and his
					telephone number should be displayed on the outside of the laboratory
					door.
				</BulletItem>

				{/* Declaration */}
				<Text style={{ marginTop: 20, marginBottom: 20, fontWeight: "bold" }}>
					I have read, understood, and will work in accordance with the
					information given above:
				</Text>

				<View style={styles.signatureRow}>
					<Text style={{ marginRight: 5 }}>Signed:</Text>
					<View style={styles.signatureLine} />
					<Text style={{ marginRight: 5, marginLeft: 10 }}>Name:</Text>
					<View style={[styles.signatureLine, { width: 150 }]} />
				</View>

				<View style={styles.signatureRow}>
					<Text style={{ marginRight: 5 }}>
						Supervisor signature and stamp:
					</Text>
					<View style={styles.signatureLine} />
				</View>

				<View style={styles.signatureRow}>
					<Text style={{ marginRight: 5 }}>Date:</Text>
					<View style={styles.signatureLine} />
				</View>

				<Text style={{ marginTop: 20, marginBottom: 10 }}>
					Circle the appropriate status
				</Text>
				<Text style={{ marginBottom: 15 }}>
					Undergraduate/Masters/PhD/Postdoc/Staff/Intern/Other
				</Text>

				<View style={{ flexDirection: "row", alignItems: "flex-end" }}>
					<Text>If other, please state: </Text>
					<View style={[styles.signatureLine, { width: 150 }]} />
				</View>

				<Text style={styles.footerRight}>Page 5 of 5</Text>
			</Page>
		</Document>
	);
}
