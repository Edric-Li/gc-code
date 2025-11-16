const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setAdmin() {
  try {
    // 将 test@example.com 设置为管理员
    const user = await prisma.user.update({
      where: {
        email: 'test@example.com',
      },
      data: {
        role: 'ADMIN',
      },
    });

    console.log('✅ User updated successfully:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Display Name: ${user.displayName}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setAdmin();
