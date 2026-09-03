/**
 * SOIS — Database Seed (Phase 6 demo data)
 *
 * Seeds the Maharashtra demo dataset required by PHASE-CHECKLIST.md:
 *   TrainingProvider x6, Trainee x50, TrainingRecord x50, Employer x10,
 *   EmploymentRecord x20 (confidence 20-87), FollowUp x30, SkillGap x5,
 *   spread across Pune / Mumbai / Nagpur districts.
 *
 * Also seeds the authentication users (gov/admin/trainee/employer) and links
 * the demo trainee/employer accounts to their records.
 *
 * Runs via `prisma db seed` (ts-node) or `npm run seed`.
 */
import {
  PrismaClient,
  Prisma,
  Role,
  TrainingStatus,
  SourceSystem,
  EmploymentType,
  VerificationStatus,
  Channel,
  FollowUpStatus,
  GapType,
  type Trainee,
  type TrainingProvider,
  type Employer,
  type EmploymentRecord,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

// Maharashtra demo districts (id: popularity for the seed)
const DISTRICTS = {
  PUNE: 27,
  MUMBAI: 2,
  NAGPUR: 1,
};

const PROVIDERS: Array<{
  name: string;
  type: string;
  district_id: number;
  state: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  validated: boolean;
}> = [
  {
    name: 'Maharashtra Skill Academy',
    type: 'govt',
    district_id: DISTRICTS.PUNE,
    state: 'MH',
    contact_person: 'Prakash Joshi',
    contact_phone: '9822011223',
    contact_email: 'contact@msa.gov.in',
    validated: true,
  },
  {
    name: 'Pune ITI Training Hub',
    type: 'govt',
    district_id: DISTRICTS.PUNE,
    state: 'MH',
    contact_person: 'Sneha Kulkarni',
    contact_phone: '9823012334',
    contact_email: 'pune@iti.gov.in',
    validated: true,
  },
  {
    name: 'Mumbai Vocational Centre',
    type: 'private',
    district_id: DISTRICTS.MUMBAI,
    state: 'MH',
    contact_person: 'Arjun Mehta',
    contact_phone: '9824044556',
    contact_email: 'info@mvc.co.in',
    validated: true,
  },
  {
    name: 'Nagpur Industrial Training Co',
    type: 'private',
    district_id: DISTRICTS.NAGPUR,
    state: 'MH',
    contact_person: 'Rekha Deshmukh',
    contact_phone: '9825055667',
    contact_email: 'nagpur@itc.co.in',
    validated: false,
  },
  {
    name: 'Western Maharashtra Agro Skills',
    type: 'NGO',
    district_id: DISTRICTS.PUNE,
    state: 'MH',
    contact_person: 'Vilas Patil',
    contact_phone: '9827606778',
    contact_email: 'wmas@ngo.in',
    validated: true,
  },
  {
    name: 'Konnect Digital Training',
    type: 'private',
    district_id: DISTRICTS.MUMBAI,
    state: 'MH',
    contact_person: 'Neha Shah',
    contact_phone: '9828077889',
    contact_email: 'neha@konnect.in',
    validated: true,
  },
];

// First names x last names, cycled to build 50 unique trainees.
const FIRST_NAMES = [
  'Rahul',
  'Priya',
  'Amit',
  'Sneha',
  'Vikram',
  'Pooja',
  'Rohan',
  'Kavita',
  'Suresh',
  'Neha',
  'Aakash',
  'Divya',
  'Manish',
  'Anita',
  'Nitin',
  'Meena',
  'Sanjay',
  'Ritu',
  'Deepak',
  'Shweta',
  'Rajesh',
  'Pallavi',
  'Gaurav',
  'Nidhi',
  'Ashok',
  'Kiran',
  'Harish',
  'Vandana',
  'Sachin',
  'Rashmi',
  'Vivek',
  'Sunita',
  'Pranav',
  'Seema',
  'Omkar',
  'Jyoti',
  'Nikhil',
  'Sonal',
  'Amar',
  'Prachi',
  'Kunal',
  'Radhika',
  'Tejas',
  'Mrunal',
  'Aditya',
  'Sakshi',
  'Mayur',
  'Anjali',
];

const LAST_NAMES = [
  'Sharma',
  'Patil',
  'Verma',
  'Kulkarni',
  'Rao',
  'Joshi',
  'Gupta',
  'Deshmukh',
  'Mehta',
  'Chavan',
  'Singh',
  'More',
  'Yadav',
  'Gaikwad',
  'Pawar',
  'Kadam',
  'Nair',
  'Sawant',
  'Thakur',
  'Jadhav',
  'Bhosale',
  'Shinde',
  'Naik',
  'Wagh',
];

const SECTORS = [
  { sector: 'IT / ITES', job_role: 'Software Tester', nsqf_level: 6 },
  { sector: 'Finance', job_role: 'Accounts Assistant', nsqf_level: 5 },
  { sector: 'Retail', job_role: 'Sales Associate', nsqf_level: 4 },
  { sector: 'Healthcare', job_role: 'Patient Care Assistant', nsqf_level: 5 },
  { sector: 'Logistics', job_role: 'Delivery Executive', nsqf_level: 4 },
  { sector: 'Agriculture', job_role: 'Farm Technician', nsqf_level: 4 },
];

const EMPLOYERS: Array<{
  name: string;
  udyam_number: string;
  industry: string;
  district_id: number;
  state: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
}> = [
  {
    name: 'TechNova Solutions',
    udyam_number: 'UDYAM-MH-07-0001234',
    industry: 'IT Services',
    district_id: DISTRICTS.PUNE,
    state: 'MH',
    contact_person: 'Rohan Divekar',
    contact_phone: '9829023456',
    contact_email: 'hr@technova.in',
  },
  {
    name: 'FinEdge Pvt Ltd',
    udyam_number: 'UDYAM-MH-07-0001235',
    industry: 'BFSI',
    district_id: DISTRICTS.MUMBAI,
    state: 'MH',
    contact_person: 'Karan Malhotra',
    contact_phone: '9821034567',
    contact_email: 'hr@finedge.in',
  },
  {
    name: 'RetailMax Stores',
    udyam_number: 'UDYAM-MH-07-0001236',
    industry: 'Retail',
    district_id: DISTRICTS.MUMBAI,
    state: 'MH',
    contact_person: 'Simran Kaur',
    contact_phone: '9822045678',
    contact_email: 'jobs@retailmax.in',
  },
  {
    name: 'CareFirst Clinics',
    udyam_number: 'UDYAM-MH-07-0001237',
    industry: 'Healthcare',
    district_id: DISTRICTS.PUNE,
    state: 'MH',
    contact_person: 'Dr. Anil Rao',
    contact_phone: '9823056789',
    contact_email: 'admin@carefirst.in',
  },
  {
    name: 'SwiftLog Logistics',
    udyam_number: 'UDYAM-MH-07-0001238',
    industry: 'Logistics',
    district_id: DISTRICTS.NAGPUR,
    state: 'MH',
    contact_person: 'Vimal Bohra',
    contact_phone: '9824067890',
    contact_email: 'ops@swiftlog.in',
  },
  {
    name: 'AgroNurture Pvt Ltd',
    udyam_number: 'UDYAM-MH-07-0001239',
    industry: 'Agri-Business',
    district_id: DISTRICTS.PUNE,
    state: 'MH',
    contact_person: 'Suresh Khandagale',
    contact_phone: '9825078901',
    contact_email: 'contact@agronurture.in',
  },
  {
    name: 'CityMall Chains',
    udyam_number: 'UDYAM-MH-07-0001240',
    industry: 'Retail',
    district_id: DISTRICTS.NAGPUR,
    state: 'MH',
    contact_person: 'Farhan Sheikh',
    contact_phone: '9826089012',
    contact_email: 'hr@citymall.in',
  },
  {
    name: 'MediCare Group',
    udyam_number: 'UDYAM-MH-07-0001241',
    industry: 'Healthcare',
    district_id: DISTRICTS.MUMBAI,
    state: 'MH',
    contact_person: 'Poonam Bansal',
    contact_phone: '9827090123',
    contact_email: 'careers@medicare.in',
  },
  {
    name: 'DataWorks Analytics',
    udyam_number: 'UDYAM-MH-07-0001242',
    industry: 'IT Services',
    district_id: DISTRICTS.PUNE,
    state: 'MH',
    contact_person: 'Ishaan Kapoor',
    contact_phone: '9828012345',
    contact_email: 'talent@dataworks.in',
  },
  {
    name: 'SupplyChainHub',
    udyam_number: 'UDYAM-MH-07-0001243',
    industry: 'Logistics',
    district_id: DISTRICTS.NAGPUR,
    state: 'MH',
    contact_person: 'Deepali Raut',
    contact_phone: '9829021456',
    contact_email: 'hr@supplyhub.in',
  },
];

// Pseudo-random but deterministic index helper (seeded by iteration).
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function upsertUser(
  email: string,
  role: Role,
  password: string,
  extra: Record<string, unknown> = {},
) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  return prisma.user.upsert({
    where: { email },
    update: { role, ...extra },
    create: { email, role, password_hash: passwordHash, ...extra },
  });
}

async function seedDemoData() {
  const existing = await prisma.trainee.count();
  if (existing > 0) {
    console.log('Demo data already present; skipping. (count=%d)', existing);
    return;
  }

  const rng = mulberry32(20260902);

  // 1. Training providers (x6)
  const providers: TrainingProvider[] = [];
  for (const p of PROVIDERS) {
    providers.push(
      await prisma.trainingProvider.create({
        data: {
          ...p,
          registration_number: `REG-MH-${String(providers.length + 1).padStart(4, '0')}`,
        },
      }),
    );
  }

  // 2. Trainees (x50)
  const trainees: Trainee[] = [];
  for (let i = 0; i < 50; i++) {
    const district =
      i % 3 === 0
        ? DISTRICTS.PUNE
        : i % 3 === 1
          ? DISTRICTS.MUMBAI
          : DISTRICTS.NAGPUR;
    const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i * 7) % LAST_NAMES.length]}`;
    trainees.push(
      await prisma.trainee.create({
        data: {
          name,
          phone: `9${String(Math.floor(rng() * 1000000000)).padStart(9, '0')}`,
          email: `trainee.demo${i}@example.in`,
          district_id: district,
          state: 'MH',
          consent_given: true,
          consent_version: '1.0',
          preferred_language: i % 2 === 0 ? 'hi' : 'en',
          preferred_channel: 'whatsapp',
          identity_status: 'canonical',
        },
      }),
    );
  }

  // 3. Training records (x50 — one per trainee)
  for (let i = 0; i < 50; i++) {
    const sector = SECTORS[i % SECTORS.length];
    const provider = providers[i % providers.length];
    const status: TrainingStatus =
      i % 4 === 3 ? 'enrolled' : i % 6 === 5 ? 'dropped' : 'completed';
    await prisma.trainingRecord.create({
      data: {
        trainee_id: trainees[i].id,
        provider_id: provider.id,
        sector: sector.sector,
        job_role: sector.job_role,
        nsqf_level: sector.nsqf_level,
        enrollment_date: new Date('2025-08-01'),
        completion_date: status === 'completed' ? new Date('2026-01-15') : null,
        certification_date:
          status === 'completed' ? new Date('2026-02-01') : null,
        certification_id: status === 'completed' ? `CERT-MH-${1000 + i}` : null,
        status,
        source_system: SourceSystem.sidh,
      },
    });
  }

  // 4. Employers (x10)
  const employers: Employer[] = [];
  for (const e of EMPLOYERS) {
    employers.push(await prisma.employer.create({ data: e }));
  }

  // 5. Employment records (x20, confidence 20-87)
  const employmentRecords: EmploymentRecord[] = [];
  for (let i = 0; i < 20; i++) {
    const trainee = trainees[i];
    const employer = employers[i % employers.length];
    const sector = SECTORS[i % SECTORS.length];
    // Vary verification + confidence so every level band appears.
    let status: VerificationStatus;
    let confidence: number;
    if (i < 5) {
      status = VerificationStatus.self_reported;
      confidence = 20;
    } else if (i < 10) {
      status = VerificationStatus.evidence_confirmed;
      confidence = 40 + Math.floor(rng() * 10); // 40-49
    } else if (i < 15) {
      status = VerificationStatus.employer_confirmed;
      confidence = Math.floor(rng() * 15) + 65; // 65-79
    } else {
      status = VerificationStatus.employer_confirmed;
      confidence = 80 + Math.floor(rng() * 8); // 80-87
    }
    const trainingRecord = await prisma.trainingRecord.findFirst({
      where: { trainee_id: trainee.id },
    });
    const employmentType: EmploymentType =
      i % 5 === 0
        ? EmploymentType.contract
        : i % 5 === 1
          ? EmploymentType.part_time
          : i % 5 === 2
            ? EmploymentType.self_employed
            : i % 5 === 3
              ? EmploymentType.apprenticeship
              : EmploymentType.full_time;

    employmentRecords.push(
      await prisma.employmentRecord.create({
        data: {
          trainee_id: trainee.id,
          training_id: trainingRecord?.id ?? null,
          employer_id: employer.id,
          job_role: sector.job_role,
          employment_type: employmentType,
          joining_date: new Date('2026-03-15'),
          current_salary: 12000 + i * 1500,
          salary_currency: 'INR',
          job_relevant_to_training: i % 2 === 0,
          verification_status: status,
          confidence_score: confidence,
          verification_date:
            status !== VerificationStatus.self_reported
              ? new Date('2026-05-01')
              : null,
          verified_by:
            status !== VerificationStatus.self_reported ? 'system-mock' : null,
          salary_verified: status === VerificationStatus.employer_confirmed,
        },
      }),
    );
  }

  // 6. Follow-ups (x30) — mix of scheduled/responded/unreachable across trainees
  const channels: Channel[] = [
    Channel.whatsapp,
    Channel.sms,
    Channel.phone,
    Channel.self_report,
  ];
  for (let i = 0; i < 30; i++) {
    const trainee = trainees[i % trainees.length];
    const employment = i < 20 ? employmentRecords[i] : null;
    const months = [3, 6, 12, 24][i % 4];
    const status: FollowUpStatus =
      i % 5 === 4 ? 'failed' : i % 3 === 2 ? 'scheduled' : 'responded';
    await prisma.followUp.create({
      data: {
        trainee_id: trainee.id,
        employment_id: employment?.id ?? null,
        follow_up_date: new Date('2026-09-01'),
        months_after_training: months,
        channel: channels[i % channels.length],
        status,
        questions: {
          working: 'Are you currently employed?',
          salary_update: 'Has your salary changed?',
        },
        responses:
          status === 'responded'
            ? {
                working: i % 2 === 0 ? 'yes' : 'no',
                same_employer: i % 2 === 0,
              }
            : Prisma.JsonNull,
        non_placement_reason:
          status === 'responded' && i % 2 === 1 ? 'not_found' : null,
        response_time_seconds: status === 'responded' ? 30 + i * 5 : null,
      },
    });
  }

  // 7. Skill gaps (x5)
  await prisma.skillGap.createMany({
    data: [
      {
        sector: 'IT / ITES',
        job_role: 'Software Tester',
        skill_name: 'Automation Testing (Selenium)',
        gap_type: GapType.employer_feedback,
        gap_description:
          'Employers report lack of automation testing exposure.',
        recommendation: 'Add Selenium + CI fundamentals to tester curriculum.',
        identified_date: new Date('2026-07-01'),
        source: 'employer_feedback',
      },
      {
        sector: 'Finance',
        job_role: 'Accounts Assistant',
        skill_name: 'Tally/GST Filing',
        gap_type: GapType.retention_analysis,
        gap_description:
          'Trainees without Tally certification show lower retention.',
        recommendation: 'Introduce Tally ERP9 certification module.',
        identified_date: new Date('2026-07-10'),
        source: 'follow_up_analysis',
      },
      {
        sector: 'Retail',
        job_role: 'Sales Associate',
        skill_name: 'Customer Relationship (CRM)',
        gap_type: GapType.employer_feedback,
        gap_description: 'CRM tool familiarity missing in most candidates.',
        recommendation: 'Add hands-on CRM simulation.',
        identified_date: new Date('2026-07-15'),
        source: 'employer_feedback',
      },
      {
        sector: 'Healthcare',
        job_role: 'Patient Care Assistant',
        skill_name: 'First Aid & CPR',
        gap_type: GapType.wage_analysis,
        gap_description:
          'Certified PCA earn higher wages but few are certified.',
        recommendation: 'Make First Aid/CPR certification mandatory.',
        identified_date: new Date('2026-07-20'),
        source: 'wage_analysis',
      },
      {
        sector: 'Logistics',
        job_role: 'Delivery Executive',
        skill_name: 'Digital Route Planning',
        gap_type: GapType.retention_analysis,
        gap_description:
          'Digital navigation skills correlate with retention >6 months.',
        recommendation: 'Add GPS route-planning lab component.',
        identified_date: new Date('2026-07-25'),
        source: 'retention_analysis',
      },
    ],
  });

  console.log(
    `Seeded Maharashtra demo data: providers=${providers.length}, trainees=${trainees.length}, training_records=50, employers=${employers.length}, employment_records=${employmentRecords.length}, follow_ups=30, skill_gaps=5`,
  );
}

async function main() {
  // Auth users first (kept for login flow).
  const gov = await upsertUser('gov@mh.gov.in', Role.government, 'gov123456');
  await upsertUser('admin@sois.in', Role.admin, 'admin123456');

  // Seed demo dataset (skip if present).
  const before = await prisma.trainee.count();
  await seedDemoData();

  if (before === 0) {
    const firstTrainee = await prisma.trainee.findFirst();
    const firstEmployer = await prisma.employer.findFirst();
    if (firstTrainee) {
      await upsertUser('trainee@sois.in', Role.trainee, 'trainee123456', {
        trainee_id: firstTrainee.id,
      });
    }
    if (firstEmployer) {
      await upsertUser('employer@sois.in', Role.employer, 'employer123456', {
        employer_id: firstEmployer.id,
      });
    }
  } else {
    await upsertUser('trainee@sois.in', Role.trainee, 'trainee123456');
    await upsertUser('employer@sois.in', Role.employer, 'employer123456');
  }

  console.log(
    `Seeded auth users: admin, government, trainee, employer (gov=${gov.email})`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
