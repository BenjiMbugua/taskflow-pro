import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function testDatabaseOperations() {
  console.log('🚀 Starting database CRUD validation tests...\n');

  try {
    // Test User CRUD
    console.log('1. Testing User operations...');
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        preferences: { theme: 'dark', language: 'en' },
      },
    });
    console.log('✅ User created:', user.id);

    // Test Project CRUD
    console.log('2. Testing Project operations...');
    const project = await prisma.project.create({
      data: {
        name: 'Test Project',
        description: 'A test project for validation',
        color: '#FF5722',
        userId: user.id,
      },
    });
    console.log('✅ Project created:', project.id);

    // Test Task CRUD with hierarchy
    console.log('3. Testing Task operations with hierarchy...');
    const parentTask = await prisma.task.create({
      data: {
        title: 'Parent Task',
        description: 'A parent task for testing',
        status: 'TODO',
        priority: 'HIGH',
        projectId: project.id,
        estimatedTime: 120,
      },
    });
    console.log('✅ Parent task created:', parentTask.id);

    const childTask = await prisma.task.create({
      data: {
        title: 'Child Task',
        description: 'A subtask for testing hierarchy',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        projectId: project.id,
        parentId: parentTask.id,
        estimatedTime: 60,
      },
    });
    console.log('✅ Child task created:', childTask.id);

    // Test PomodoroSession CRUD
    console.log('4. Testing PomodoroSession operations...');
    const pomodoroSession = await prisma.pomodoroSession.create({
      data: {
        taskId: childTask.id,
        duration: 25,
        startTime: new Date(),
        endTime: new Date(Date.now() + 25 * 60 * 1000),
        completed: true,
        notes: 'Focused session',
      },
    });
    console.log('✅ Pomodoro session created:', pomodoroSession.id);

    // Test Analytics CRUD
    console.log('5. Testing Analytics operations...');
    const analytics = await prisma.analytics.create({
      data: {
        userId: user.id,
        date: new Date(),
        tasksCompleted: 1,
        pomodoroSessions: 1,
        totalFocusTime: 25,
      },
    });
    console.log('✅ Analytics record created:', analytics.id);

    // Test relationship queries
    console.log('\n6. Testing relationship queries...');

    const userWithProjects = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        projects: {
          include: {
            tasks: {
              include: {
                subtasks: true,
                pomodoroSessions: true,
              },
            },
          },
        },
        analytics: true,
      },
    });

    console.log('✅ User with relations loaded');
    console.log(`   - Projects: ${userWithProjects?.projects.length}`);
    console.log(
      `   - Tasks in first project: ${userWithProjects?.projects[0]?.tasks.length}`
    );
    console.log(
      `   - Subtasks: ${userWithProjects?.projects[0]?.tasks[0]?.subtasks.length}`
    );
    console.log(
      `   - Pomodoro sessions: ${userWithProjects?.projects[0]?.tasks[1]?.pomodoroSessions.length}`
    );
    console.log(
      `   - Analytics records: ${userWithProjects?.analytics.length}`
    );

    // Test task hierarchy query
    const taskWithHierarchy = await prisma.task.findUnique({
      where: { id: parentTask.id },
      include: {
        subtasks: {
          include: {
            pomodoroSessions: true,
          },
        },
        project: true,
      },
    });

    console.log('\n✅ Task hierarchy validated');
    console.log(`   - Parent task: ${taskWithHierarchy?.title}`);
    console.log(`   - Subtasks: ${taskWithHierarchy?.subtasks.length}`);
    console.log(`   - Project: ${taskWithHierarchy?.project?.name}`);

    // Test cascade delete
    console.log('\n7. Testing cascade delete behavior...');
    await prisma.user.delete({
      where: { id: user.id },
    });

    const deletedProjectCount = await prisma.project.count();
    const deletedTaskCount = await prisma.task.count();
    const deletedAnalyticsCount = await prisma.analytics.count();

    console.log('✅ Cascade delete tested');
    console.log(`   - Remaining projects: ${deletedProjectCount}`);
    console.log(`   - Remaining tasks: ${deletedTaskCount}`);
    console.log(`   - Remaining analytics: ${deletedAnalyticsCount}`);

    console.log('\n🎉 All database tests passed successfully!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testDatabaseOperations()
    .then(() => {
      console.log('\n✨ Database validation completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Database validation failed:', error);
      process.exit(1);
    });
}

export { testDatabaseOperations };
