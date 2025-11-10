#!/usr/bin/env node

/**
 * 数据库重置脚本
 * 删除并重新创建数据库
 */

const { Client } = require('pg');
const path = require('path');
const { execSync } = require('child_process');

// 从 .env 文件加载配置
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 解析 DATABASE_URL
function parseDatabaseUrl(url) {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5],
  };
}

const config = parseDatabaseUrl(process.env.DATABASE_URL);

async function resetDatabase() {
  // 连接到 postgres 默认数据库
  const client = new Client({
    ...config,
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');

    // 断开所有到目标数据库的连接
    console.log(`📋 Terminating all connections to '${config.database}'...`);
    await client.query(
      `
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid();
    `,
      [config.database]
    );

    // 删除数据库
    console.log(`📋 Dropping database '${config.database}'...`);
    await client.query(`DROP DATABASE IF EXISTS ${config.database}`);
    console.log(`✅ Database '${config.database}' dropped`);

    // 重新创建数据库
    console.log(`📋 Creating database '${config.database}'...`);
    await client.query(`CREATE DATABASE ${config.database}`);
    console.log(`✅ Database '${config.database}' created`);
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🚀 Starting database reset...\n');
  console.log('⚠️  WARNING: This will DELETE ALL DATA in the database!');
  console.log('⚠️  Database:', config.database);
  console.log('');

  try {
    await resetDatabase();

    // 运行初始化脚本
    console.log('\n📋 Running initialization script...\n');
    execSync('node scripts/init-db.js', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });

    console.log('\n🎉 Database reset completed successfully!');
  } catch (error) {
    console.error('\n❌ Database reset failed!');
    process.exit(1);
  }
}

// 运行脚本
main();
