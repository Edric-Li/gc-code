#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 使用 Node.js 连接 PostgreSQL 并初始化数据库表
 */

const { Client } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

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

async function createDatabase() {
  // 先连接到 postgres 默认数据库
  const defaultClient = new Client({
    ...config,
    database: 'postgres',
  });

  try {
    await defaultClient.connect();
    console.log('✅ Connected to PostgreSQL server');

    // 检查数据库是否存在
    const result = await defaultClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      config.database,
    ]);

    if (result.rows.length === 0) {
      await defaultClient.query(`CREATE DATABASE ${config.database}`);
      console.log(`✅ Database '${config.database}' created`);
    } else {
      console.log(`ℹ️  Database '${config.database}' already exists`);
    }
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  } finally {
    await defaultClient.end();
  }
}

async function initializeTables() {
  const client = new Client(config);

  try {
    await client.connect();
    console.log(`✅ Connected to database '${config.database}'`);

    // 开始事务
    await client.query('BEGIN');

    // 创建枚举类型
    console.log('📋 Creating enum types...');
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "OAuthProvider" AS ENUM ('AZURE_AD', 'GOOGLE', 'GITHUB', 'MICROSOFT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ Enum types created');

    // 创建用户表
    console.log('📋 Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        display_name VARCHAR(255),
        avatar_url VARCHAR(500),
        role "Role" DEFAULT 'USER' NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        last_login_at TIMESTAMP(3)
      );
    `);
    console.log('✅ Users table created');

    // 创建 OAuth 账号表
    console.log('📋 Creating oauth_accounts table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS oauth_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        provider "OAuthProvider" NOT NULL,
        provider_id VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        display_name VARCHAR(255),
        avatar_url VARCHAR(500),
        access_token TEXT,
        refresh_token TEXT,
        expires_at TIMESTAMP(3),
        created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        CONSTRAINT oauth_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT oauth_accounts_user_id_provider_key UNIQUE (user_id, provider),
        CONSTRAINT oauth_accounts_provider_provider_id_key UNIQUE (provider, provider_id)
      );
    `);
    console.log('✅ OAuth accounts table created');

    // 创建索引
    console.log('📋 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider);
    `);
    console.log('✅ Indexes created');

    // 创建触发器函数
    console.log('📋 Creating triggers...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // 为 users 表创建触发器
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // 为 oauth_accounts 表创建触发器
    await client.query(`
      DROP TRIGGER IF EXISTS update_oauth_accounts_updated_at ON oauth_accounts;
      CREATE TRIGGER update_oauth_accounts_updated_at
        BEFORE UPDATE ON oauth_accounts
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Triggers created');

    // 创建默认管理员账号
    console.log('📋 Creating default admin user...');
    const passwordHash = await bcrypt.hash('admin123', 10);

    const adminResult = await client.query(
      `INSERT INTO users (username, email, password_hash, display_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (username) DO NOTHING
       RETURNING id`,
      ['admin', 'admin@gccode.cn', passwordHash, 'System Administrator', 'ADMIN', true]
    );

    if (adminResult.rows.length > 0) {
      console.log('✅ Default admin user created');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   ⚠️  PLEASE CHANGE THE PASSWORD IN PRODUCTION!');
    } else {
      console.log('ℹ️  Default admin user already exists');
    }

    // 提交事务
    await client.query('COMMIT');
    console.log('\n🎉 Database initialization completed successfully!');

    // 显示统计信息
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`\n📊 Statistics:`);
    console.log(`   Users: ${userCount.rows[0].count}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error initializing database:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🚀 Starting database initialization...\n');

  try {
    await createDatabase();
    await initializeTables();
  } catch (error) {
    console.error('\n❌ Database initialization failed!');
    process.exit(1);
  }
}

// 运行脚本
main();
