import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import slugify from "slugify";

const prisma = new PrismaClient();

function slug(text: string) {
  return slugify(text, { lower: true, strict: true });
}

async function main() {
  await prisma.deadlineReminder.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.searchLog.deleteMany();
  await prisma.application.deleteMany();
  await prisma.savedOpportunity.deleteMany();
  await prisma.opportunityTag.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.userLanguage.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.userInterest.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.authToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.interest.deleteMany();
  await prisma.platformSetting.deleteMany();

  const password = await bcrypt.hash("Password123!", 12);

  const skills = [
    "Python",
    "Django",
    "React",
    "SQL",
    "JavaScript",
    "TypeScript",
    "Excel",
    "Digital Marketing",
    "Accounting",
    "Leadership",
    "English",
    "Data Analysis",
  ];
  const interests = [
    "Artificial Intelligence",
    "Software Engineering",
    "Scholarships",
    "Entrepreneurship",
    "Public Health",
    "Climate",
    "Education",
  ];

  await prisma.skill.createMany({ data: skills.map((name) => ({ name })) });
  await prisma.interest.createMany({ data: interests.map((name) => ({ name })) });

  const orgs = await Promise.all(
    [
      {
        name: "University of Hargeisa",
        description: "SAMPLE organization. Leading public university serving students in Hargeisa.",
        location: "hargeisa",
        website: "https://www.uoh-edu.net",
        email: "info@uoh-sample.local",
      },
      {
        name: "Somaliland Tech Hub",
        description: "SAMPLE organization. Community space for technology training, internships and hackathons.",
        location: "hargeisa",
        website: "https://example.org/somaliland-tech-hub",
        email: "hello@techhub-sample.local",
      },
      {
        name: "Horn Innovation Lab",
        description: "SAMPLE organization. Regional innovation programmes, competitions and fellowships.",
        location: "international",
        website: "https://example.org/horn-innovation",
        email: "apply@horn-sample.local",
      },
      {
        name: "Hargeisa Career Center",
        description: "SAMPLE organization. Career services, internships and graduate job matching.",
        location: "hargeisa",
        website: "https://example.org/hcc",
        email: "careers@hcc-sample.local",
      },
      {
        name: "East Africa Scholarship Network",
        description: "SAMPLE organization. Curates scholarship information for students in the Horn of Africa.",
        location: "africa",
        website: "https://example.org/easn",
        email: "scholarships@easn-sample.local",
      },
    ].map((org) =>
      prisma.organization.create({
        data: {
          ...org,
          slug: slug(org.name),
          verified: true,
          status: "approved",
          isSample: true,
        },
      })
    )
  );

  const [uoh, techHub, horn, career, easn] = orgs;

  const admin = await prisma.user.create({
    data: {
      name: "HOH Admin",
      email: "admin@hoh.local",
      passwordHash: password,
      role: "admin",
      emailVerified: true,
      location: "hargeisa",
      profile: { create: {} },
    },
  });

  const student = await prisma.user.create({
    data: {
      name: "Amina Hassan",
      email: "student@hoh.local",
      passwordHash: password,
      role: "student",
      emailVerified: true,
      location: "hargeisa",
      profile: {
        create: {
          educationLevel: "bachelors",
          university: "University of Hargeisa",
          degree: "BSc Software Engineering",
          field: "Software Engineering",
          graduationYear: 2027,
          gpa: "3.6",
          careerGoals: "Become an AI engineer and contribute to technology growth in Hargeisa.",
          preferredLocations: JSON.stringify(["hargeisa", "remote", "international"]),
          preferredCategories: JSON.stringify(["internship", "scholarship", "hackathon", "course"]),
        },
      },
    },
  });

  const orgUser = await prisma.user.create({
    data: {
      name: "Tech Hub Manager",
      email: "org@hoh.local",
      passwordHash: password,
      role: "organization",
      emailVerified: true,
      organizationId: techHub.id,
      location: "hargeisa",
      profile: { create: {} },
    },
  });

  const python = await prisma.skill.findUniqueOrThrow({ where: { name: "Python" } });
  const django = await prisma.skill.findUniqueOrThrow({ where: { name: "Django" } });
  const react = await prisma.skill.findUniqueOrThrow({ where: { name: "React" } });
  const sql = await prisma.skill.findUniqueOrThrow({ where: { name: "SQL" } });
  const aiInterest = await prisma.interest.findUniqueOrThrow({ where: { name: "Artificial Intelligence" } });
  const seInterest = await prisma.interest.findUniqueOrThrow({ where: { name: "Software Engineering" } });

  await prisma.userSkill.createMany({
    data: [
      { userId: student.id, skillId: python.id },
      { userId: student.id, skillId: django.id },
      { userId: student.id, skillId: react.id },
      { userId: student.id, skillId: sql.id },
    ],
  });
  await prisma.userInterest.createMany({
    data: [
      { userId: student.id, interestId: aiInterest.id },
      { userId: student.id, interestId: seInterest.id },
    ],
  });
  await prisma.userLanguage.createMany({
    data: [
      { userId: student.id, language: "Somali", level: "native" },
      { userId: student.id, language: "English", level: "fluent" },
      { userId: student.id, language: "Arabic", level: "conversational" },
    ],
  });

  const opportunities = [
    {
      organizationId: techHub.id,
      title: "AI Engineering Internship",
      category: "internship",
      description:
        "SAMPLE DATA. A 12-week internship supporting applied AI projects for local organizations in Hargeisa. Interns will work with mentors on Python, data cleaning and simple machine learning prototypes. This listing is development sample data and is not a real opening.",
      requirements:
        "Currently enrolled in a Bachelor's programme in Software Engineering, Computer Science or a related field. Python required. IELTS is not required. Based in Hargeisa or able to attend hybrid sessions.",
      benefits: "Monthly stipend, mentorship, certificate, and a recommendation letter.",
      applicationProcess: "1) Prepare CV\n2) Submit through the official sample URL\n3) Complete a short screening task\n4) Interview",
      location: "hargeisa",
      opportunityType: "hybrid",
      fundingType: "paid",
      educationLevel: "bachelors",
      field: "Software Engineering",
      skills: ["Python", "Django", "SQL"],
      documents: ["CV", "Cover Letter", "Transcript"],
      deadline: "2026-09-25",
      featured: true,
      tags: ["AI", "internship", "Hargeisa"],
    },
    {
      organizationId: easn.id,
      title: "Fully Funded Software Engineering Scholarship 2026",
      category: "scholarship",
      description:
        "SAMPLE DATA. A fully funded Bachelor's/Master's pathway scholarship for students from Somaliland interested in software engineering. This is demonstration content only.",
      requirements: "Bachelor's students or recent graduates in Computer Science or Software Engineering. Strong academic record. English proficiency.",
      benefits: "Tuition coverage, monthly stipend, travel support.",
      applicationProcess: "Submit academic documents and a motivation letter through the official portal.",
      location: "international",
      opportunityType: "offline",
      fundingType: "fully_funded",
      educationLevel: "bachelors",
      field: "Software Engineering",
      skills: ["Python", "English"],
      documents: ["CV", "Transcript", "Passport", "Recommendation Letter"],
      deadline: "2026-10-15",
      featured: true,
      tags: ["scholarship", "fully-funded"],
    },
    {
      organizationId: horn.id,
      title: "Python Developer Internship",
      category: "internship",
      description:
        "SAMPLE DATA. Remote Python internship focused on backend APIs and data tooling. Not a real vacancy.",
      requirements: "Python and SQL. Django is an advantage. Diploma or Bachelor's.",
      benefits: "Certificate and stipend.",
      applicationProcess: "Apply with CV and GitHub profile.",
      location: "remote",
      opportunityType: "online",
      fundingType: "paid",
      educationLevel: "bachelors",
      field: "Computer Science",
      skills: ["Python", "Django", "SQL"],
      documents: ["CV"],
      deadline: "2026-09-20",
      featured: true,
      tags: ["python", "remote"],
    },
    {
      organizationId: career.id,
      title: "Graduate Software Engineer",
      category: "job",
      description: "SAMPLE DATA. Entry-level graduate software role supporting civic technology products in Hargeisa.",
      requirements: "Bachelor's in Software Engineering or related field. React and SQL preferred.",
      benefits: "Paid full-time role with training.",
      applicationProcess: "Apply with CV and cover letter.",
      location: "hargeisa",
      opportunityType: "offline",
      fundingType: "paid",
      educationLevel: "bachelors",
      field: "Software Engineering",
      skills: ["React", "SQL", "JavaScript"],
      documents: ["CV", "Cover Letter"],
      deadline: "2026-10-01",
      featured: false,
      tags: ["graduate", "job"],
    },
    {
      organizationId: techHub.id,
      title: "Machine Learning Course",
      category: "course",
      description: "SAMPLE DATA. Evening machine learning course for students who already know Python.",
      requirements: "Python basics. Laptop required.",
      benefits: "Certificate.",
      applicationProcess: "Register online. Limited seats.",
      location: "hargeisa",
      opportunityType: "hybrid",
      fundingType: "free",
      educationLevel: "diploma",
      field: "AI",
      skills: ["Python"],
      documents: ["CV"],
      deadline: "2026-09-30",
      featured: true,
      tags: ["AI", "course"],
    },
    {
      organizationId: horn.id,
      title: "AI Hackathon 2026",
      category: "hackathon",
      description: "SAMPLE DATA. 48-hour hackathon for teams building AI solutions for public services in Hargeisa.",
      requirements: "Teams of 2-5. Students and young professionals welcome.",
      benefits: "Prizes, mentorship, certificates.",
      applicationProcess: "Register your team before the deadline.",
      location: "hargeisa",
      opportunityType: "offline",
      fundingType: "free",
      educationLevel: "bachelors",
      field: "AI",
      skills: ["Python", "React"],
      documents: ["Team form"],
      deadline: "2026-09-18",
      featured: true,
      tags: ["hackathon", "AI"],
    },
    {
      organizationId: uoh.id,
      title: "Accounting Internship",
      category: "internship",
      description: "SAMPLE DATA. Finance internship supporting university finance operations.",
      requirements: "Diploma or Bachelor's in Accounting or Finance.",
      benefits: "Certificate and stipend.",
      applicationProcess: "Email CV and transcript.",
      location: "hargeisa",
      opportunityType: "offline",
      fundingType: "paid",
      educationLevel: "diploma",
      field: "Accounting",
      skills: ["Excel", "Accounting"],
      documents: ["CV", "Transcript"],
      deadline: "2026-10-12",
      featured: false,
      tags: ["finance"],
    },
    {
      organizationId: easn.id,
      title: "Partially Funded Master's Scholarship",
      category: "scholarship",
      description: "SAMPLE DATA. Partial tuition scholarship for Master's students in Business or Economics.",
      requirements: "Bachelor's degree. English proficiency. IELTS 6.5 preferred.",
      benefits: "Partial tuition coverage.",
      applicationProcess: "Submit degree certificate, transcript and motivation letter.",
      location: "africa",
      opportunityType: "offline",
      fundingType: "partially_funded",
      educationLevel: "masters",
      field: "Business",
      skills: ["English"],
      documents: ["CV", "Transcript", "Passport"],
      deadline: "2026-11-01",
      featured: false,
      tags: ["masters"],
    },
    {
      organizationId: career.id,
      title: "Digital Marketing Training",
      category: "training",
      description: "SAMPLE DATA. Practical digital marketing training for graduates seeking work in Hargeisa.",
      requirements: "High school diploma minimum. Laptop helpful.",
      benefits: "Certificate.",
      applicationProcess: "Register through the sample form.",
      location: "hargeisa",
      opportunityType: "offline",
      fundingType: "free",
      educationLevel: "high_school",
      field: "Business",
      skills: ["Digital Marketing"],
      documents: ["ID"],
      deadline: "2026-09-22",
      featured: false,
      tags: ["training"],
    },
    {
      organizationId: horn.id,
      title: "Youth Innovation Challenge",
      category: "competition",
      description: "SAMPLE DATA. Essay and prototype competition for social innovation ideas from Somaliland youth.",
      requirements: "Ages 18-30. Individual or team submissions.",
      benefits: "Seed grant and mentorship.",
      applicationProcess: "Submit a 3-page proposal.",
      location: "somaliland",
      opportunityType: "hybrid",
      fundingType: "paid",
      educationLevel: "diploma",
      field: "Social Sciences",
      skills: ["Leadership"],
      documents: ["Proposal", "CV"],
      deadline: "2026-10-08",
      featured: false,
      tags: ["competition"],
    },
    {
      organizationId: techHub.id,
      title: "Cybersecurity Fundamentals Course",
      category: "course",
      description: "SAMPLE DATA. Introductory cybersecurity course covering networking basics and safe practices.",
      requirements: "Interest in IT. No prior job experience required.",
      benefits: "Certificate.",
      applicationProcess: "Complete the registration form.",
      location: "hargeisa",
      opportunityType: "online",
      fundingType: "free",
      educationLevel: "diploma",
      field: "Computer Science",
      skills: ["Networking"],
      documents: ["ID"],
      deadline: "2026-10-20",
      featured: false,
      tags: ["cybersecurity"],
    },
    {
      organizationId: career.id,
      title: "NGO Programme Internship",
      category: "internship",
      description: "SAMPLE DATA. Programme support internship with a local NGO partner. Unpaid but certificated.",
      requirements: "Bachelor's in Social Sciences, Education or related field.",
      benefits: "Certificate and reference letter.",
      applicationProcess: "Apply with CV and cover letter.",
      location: "hargeisa",
      opportunityType: "offline",
      fundingType: "unpaid",
      educationLevel: "bachelors",
      field: "Social Sciences",
      skills: ["Leadership", "English"],
      documents: ["CV", "Cover Letter"],
      deadline: "2026-09-28",
      featured: false,
      tags: ["ngo"],
    },
    {
      organizationId: easn.id,
      title: "Expired Sample Scholarship",
      category: "scholarship",
      description: "SAMPLE DATA. This opportunity is intentionally expired to test archive behaviour.",
      requirements: "N/A",
      benefits: "N/A",
      applicationProcess: "Closed.",
      location: "international",
      opportunityType: "online",
      fundingType: "fully_funded",
      educationLevel: "masters",
      field: "Education",
      skills: ["English"],
      documents: ["CV"],
      deadline: "2026-08-01",
      featured: false,
      tags: ["expired"],
      status: "expired",
    },
  ];

  for (const item of opportunities) {
    await prisma.opportunity.create({
      data: {
        organizationId: item.organizationId,
        title: item.title,
        slug: slug(item.title),
        category: item.category,
        description: item.description,
        requirements: item.requirements,
        benefits: item.benefits,
        applicationProcess: item.applicationProcess,
        requiredDocuments: JSON.stringify(item.documents),
        importantDates: JSON.stringify({ opening: "2026-08-15", deadline: item.deadline }),
        location: item.location,
        opportunityType: item.opportunityType,
        fundingType: item.fundingType,
        educationLevel: item.educationLevel,
        field: item.field,
        skills: JSON.stringify(item.skills),
        openingDate: new Date("2026-08-15"),
        deadline: new Date(`${item.deadline}T23:59:00.000Z`),
        applicationUrl: "https://example.org/sample-application",
        applicationMode: "external",
        contactEmail: "sample@hoh.local",
        status: item.status ?? "published",
        featured: item.featured,
        verified: true,
        isSample: true,
        tags: { create: item.tags.map((tag) => ({ tag })) },
      },
    });
  }

  const intern = await prisma.opportunity.findUniqueOrThrow({ where: { slug: "ai-engineering-internship" } });
  await prisma.savedOpportunity.create({ data: { userId: student.id, opportunityId: intern.id } });
  await prisma.application.create({
    data: {
      userId: student.id,
      opportunityId: intern.id,
      status: "applied",
      appliedAt: new Date("2026-09-10"),
      notes: "Submitted CV and cover letter.",
    },
  });
  await prisma.notification.create({
    data: {
      userId: student.id,
      title: "Welcome to Hargeisa Opportunity Hub",
      message: "Complete your profile to receive better recommendations.",
      type: "system",
      link: "/profile",
    },
  });

  await prisma.platformSetting.createMany({
    data: [
      { key: "ai_recommendations_enabled", value: "true" },
      { key: "maintenance_mode", value: "false" },
    ],
  });

  console.log("Seed complete.");
  console.log("Demo accounts (password: Password123!):");
  console.log("  admin@hoh.local");
  console.log("  student@hoh.local");
  console.log("  org@hoh.local");
  void admin;
  void orgUser;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
