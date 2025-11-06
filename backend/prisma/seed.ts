import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create Admin User
  const hashedPassword = await bcrypt.hash('Admin@1234', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@voch.com' },
    update: {},
    create: {
      email: 'admin@voch.com',
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: true,
      profile: {
        create: {
          bio: 'VOCH Platform Administrator',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        },
      },
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create Moderator User
  const moderator = await prisma.user.upsert({
    where: { email: 'moderator@voch.com' },
    update: {},
    create: {
      email: 'moderator@voch.com',
      username: 'moderator',
      password: hashedPassword,
      role: 'MODERATOR',
      emailVerified: true,
      profile: {
        create: {
          bio: 'Content Moderator for VOCH',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=moderator',
        },
      },
    },
  });

  console.log('✅ Created moderator user:', moderator.email);

  // Create Regular Users
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@voch.com' },
    update: {},
    create: {
      email: 'user1@voch.com',
      username: 'rajesh_kumar',
      password: await bcrypt.hash('User@1234', 10),
      role: 'USER',
      emailVerified: true,
      profile: {
        create: {
          bio: 'Tech enthusiast and software developer from Bangalore',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh',
        },
      },
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@voch.com' },
    update: {},
    create: {
      email: 'user2@voch.com',
      username: 'priya_sharma',
      password: await bcrypt.hash('User@1234', 10),
      role: 'USER',
      emailVerified: true,
      profile: {
        create: {
          bio: 'Digital marketer and content creator',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
        },
      },
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'user3@voch.com' },
    update: {},
    create: {
      email: 'user3@voch.com',
      username: 'amit_verma',
      password: await bcrypt.hash('User@1234', 10),
      role: 'USER',
      emailVerified: true,
      profile: {
        create: {
          bio: 'Environmental activist and educator',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amit',
        },
      },
    },
  });

  console.log('✅ Created regular users');

  // Create Posts
  const post1 = await prisma.post.create({
    data: {
      title: 'Welcome to VOCH Platform',
      content: `Welcome to VOCH - Voice of Change! This platform is dedicated to empowering citizens to raise their voices on important issues. Share your thoughts, engage in meaningful discussions, and be part of the change you want to see.`,
      status: 'PUBLISHED',
      category: 'ANNOUNCEMENT',
      userId: admin.id,
      tags: ['welcome', 'announcement', 'community'],
      metadata: {
        featured: true,
        pinned: true,
      },
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'Community Guidelines',
      content: `Please follow these community guidelines:\n\n1. Be respectful and civil\n2. No hate speech or harassment\n3. Share factual information\n4. Report inappropriate content\n5. Engage in constructive discussions\n\nTogether, we can build a positive community!`,
      status: 'PUBLISHED',
      category: 'GENERAL',
      userId: admin.id,
      tags: ['guidelines', 'community', 'rules'],
    },
  });

  const post3 = await prisma.post.create({
    data: {
      title: 'The Future of Clean Energy in India',
      content: `India is making significant strides in renewable energy. With ambitious solar and wind energy targets, the country aims to achieve 500 GW of renewable energy capacity by 2030. What are your thoughts on this transition?`,
      status: 'PUBLISHED',
      category: 'ENVIRONMENT',
      userId: user3.id,
      tags: ['environment', 'energy', 'sustainability'],
    },
  });

  const post4 = await prisma.post.create({
    data: {
      title: 'Digital India: Progress and Challenges',
      content: `The Digital India initiative has transformed how we access government services. However, digital divide and cyber security remain major concerns. How can we make digital services more inclusive?`,
      status: 'PUBLISHED',
      category: 'TECHNOLOGY',
      userId: user1.id,
      tags: ['technology', 'digital', 'government'],
    },
  });

  const post5 = await prisma.post.create({
    data: {
      title: 'Draft: Improving Public Transportation',
      content: `Working on ideas to improve public transportation in urban areas...`,
      status: 'DRAFT',
      category: 'INFRASTRUCTURE',
      userId: user2.id,
      tags: ['transport', 'urban', 'infrastructure'],
    },
  });

  console.log('✅ Created sample posts');

  // Create Comments
  await prisma.comment.create({
    data: {
      content: 'Excited to be part of this community!',
      userId: user1.id,
      postId: post1.id,
      status: 'APPROVED',
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Great initiative! Looking forward to meaningful discussions.',
      userId: user2.id,
      postId: post1.id,
      status: 'APPROVED',
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Solar energy is the future! India has amazing potential with 300+ sunny days.',
      userId: user1.id,
      postId: post3.id,
      status: 'APPROVED',
    },
  });

  const parentComment = await prisma.comment.create({
    data: {
      content: 'We also need to focus on energy storage solutions.',
      userId: user2.id,
      postId: post3.id,
      status: 'APPROVED',
    },
  });

  // Create Reply
  await prisma.comment.create({
    data: {
      content: 'Absolutely! Battery technology is crucial for renewable energy adoption.',
      userId: user3.id,
      postId: post3.id,
      parentId: parentComment.id,
      status: 'APPROVED',
    },
  });

  console.log('✅ Created sample comments');

  // Create Votes
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, postId: post1.id, voteType: 'UPVOTE' },
      { userId: user2.id, postId: post1.id, voteType: 'UPVOTE' },
      { userId: user3.id, postId: post1.id, voteType: 'UPVOTE' },
      { userId: user1.id, postId: post3.id, voteType: 'UPVOTE' },
      { userId: user2.id, postId: post3.id, voteType: 'UPVOTE' },
      { userId: user2.id, postId: post4.id, voteType: 'UPVOTE' },
    ],
  });

  console.log('✅ Created sample votes');

  // Create Bookmarks
  await prisma.bookmark.createMany({
    data: [
      { userId: user1.id, postId: post2.id },
      { userId: user2.id, postId: post3.id },
      { userId: user3.id, postId: post4.id },
    ],
  });

  console.log('✅ Created sample bookmarks');

  console.log('\n✅ Database seeded successfully!');
  console.log('\n🔑 Login Credentials:');
  console.log('Admin: admin@voch.com / Admin@1234');
  console.log('Moderator: moderator@voch.com / Admin@1234');
  console.log('User: user1@voch.com / User@1234');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
