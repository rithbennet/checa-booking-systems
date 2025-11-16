## Seeded user accounts (development)

The following user accounts are created by the project's Prisma seed script (`prisma/seed.ts`). These accounts are intended for local development and testing.

> All seeded accounts use the shared password: `Password123!` unless otherwise noted.

### Accounts

- **Admin User**
  - Email: `admin@checa.utm.my`
  - Password: `Password123!`
  - Name: Admin User
  - Role / userType: `lab_administrator`
  - Academic type: `staff`
  - Identifiers: `UTM: kuala_lumpur`, `userIdentifier: ADM001`
  - Relations: `faculty: MJIIT`, `department: MJIIT Chemical Engineering`, `ikohza: ChECA iKohza`
  - Notes: This account is created first and is used as the approving admin for other seeded users.

- **Lab Admin User**
  - Email: `labadmin@checa.utm.my`
  - Password: `Password123!`
  - Name: Lab Admin User
  - Role / userType: `lab_administrator`
  - Academic type: `staff`
  - Identifiers: `userIdentifier: LAB001`, `phone: +60123456789`
  - Relations: `faculty: MJIIT`, `department: MJIIT Chemical Engineering`, `ikohza: ChECA iKohza`

- **ChECA iKohza**
  - Email: `ikohza@checa.utm.my`
  - Password: `Password123!`
  - Name: ChECA iKohza
  - Role / userType: `mjiit_member`
  - Academic type: `staff`
  - Identifiers: `userIdentifier: IKH001`
  - Relations: `faculty: MJIIT`, `department: MJIIT Chemical Engineering`, `ikohza: ChECA iKohza`

- **UTM Member**
  - Email: `utm.member@utm.my`
  - Password: `Password123!`
  - Name: UTM Member (Ahmad Faiz)
  - Role / userType: `utm_member`
  - Academic type: `student`
  - Identifiers: `userIdentifier: MKE201234`, `supervisorName: Dr. Siti Aminah`, `phone: +60123456789`
  - Relations: `faculty: Faculty of Engineering (FKE)`, `department: Department of Chemical Engineering (JKK)`

- **External Member**
  - Email: `external@example.com`
  - Password: `Password123!`
  - Name: External Member (Michael Johnson)
  - Role / userType: `external_member`
  - Academic type: `none`
  - Identifiers: `company: PETRONAS Research Sdn Bhd`, `companyBranch: Headquarters`, `phone: +60387654321`
  - Notes: Mapped to the seeded company and company branch.
