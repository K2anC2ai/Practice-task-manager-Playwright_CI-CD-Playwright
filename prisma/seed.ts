import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ลบ test user เดิมออกก่อน (idempotent seed)
  await prisma.task.deleteMany({ where: { user: { email: 'test@taskmanager.dev' } } });
  await prisma.user.deleteMany({ where: { email: 'test@taskmanager.dev' } });

  const hashed = await bcrypt.hash('Test@1234', 10);

  const user = await prisma.user.create({
    data: {
      email: 'test@taskmanager.dev',
      name: 'Test User',
      password: hashed,
      tasks: {
        create: [
          {
            title: 'Setup CI/CD pipeline',
            description: 'Configure GitHub Actions for automated testing',
            priority: 'HIGH',
            status: 'IN_PROGRESS',
          },
          {
            title: 'Write E2E tests',
            description: 'Add Playwright tests for all user flows',
            priority: 'HIGH',
            status: 'TODO',
          },
          {
            title: 'Update documentation',
            priority: 'LOW',
            status: 'DONE',
          },
          {
            title: 'Code review session',
            priority: 'MEDIUM',
            status: 'TODO',
            dueDate: new Date('2025-12-31'),
          },
        ],
      },
    },
  });

  console.log(`✅ Seeded: ${user.email} with 4 tasks`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
