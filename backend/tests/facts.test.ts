import path from 'path';
import { PrismaClient } from '@prisma/client';

const testDbPath = path.resolve(__dirname, '../prisma/test.db');
process.env.DATABASE_URL = `file:${testDbPath}`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${testDbPath}`,
    },
  },
});

import { factsService } from '../src/services/facts';

describe('Facts Service', () => {
  beforeAll(async () => {
    await prisma.factSupplement.deleteMany();
    await prisma.factEntryTag.deleteMany();
    await prisma.factEntry.deleteMany();
    await prisma.tag.deleteMany();
  });

  afterAll(async () => {
    await prisma.factSupplement.deleteMany();
    await prisma.factEntryTag.deleteMany();
    await prisma.factEntry.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.$disconnect();
  });

  describe('Random fact when empty', () => {
    it('returns null when there are no entries', async () => {
      const result = await factsService.getRandomFact();
      expect(result).toBeNull();
    });
  });

  describe('Tag CRUD and sortOrder shift', () => {
    let tag1Id: number;
    let tag2Id: number;
    let tag3Id: number;

    it('creates tags with explicit and default sortOrder', async () => {
      const tag1 = await factsService.createTag({ name: 'Tech', color: '#1976d2', sortOrder: 0 });
      const tag2 = await factsService.createTag({ name: 'Life', color: '#388e3c', sortOrder: 1 });
      const tag3 = await factsService.createTag({ name: 'Idea', color: '#f57c00' }); // sortOrder should be 2

      tag1Id = tag1.id;
      tag2Id = tag2.id;
      tag3Id = tag3.id;

      expect(tag1.name).toBe('Tech');
      expect(tag2.name).toBe('Life');
      expect(tag3.name).toBe('Idea');
      expect(tag3.sortOrder).toBe(2);
    });

    it('gets all tags sorted by sortOrder', async () => {
      const tags = await factsService.getTags();
      expect(tags).toHaveLength(3);
      expect(tags[0]?.id).toBe(tag1Id);
      expect(tags[1]?.id).toBe(tag2Id);
      expect(tags[2]?.id).toBe(tag3Id);
    });

    it('updates tag and shifts sortOrder', async () => {
      // Move tag3 (sortOrder: 2) to 0, which should increment tag1 (0 -> 1) and tag2 (1 -> 2)
      const updatedTag3 = await factsService.updateTag(tag3Id, { sortOrder: 0 });
      expect(updatedTag3.sortOrder).toBe(0);

      const tags = await factsService.getTags();
      expect(tags[0]?.id).toBe(tag3Id);
      expect(tags[0]?.sortOrder).toBe(0);
      expect(tags[1]?.id).toBe(tag1Id);
      expect(tags[1]?.sortOrder).toBe(1);
      expect(tags[2]?.id).toBe(tag2Id);
      expect(tags[2]?.sortOrder).toBe(2);
    });

    it('deletes a tag', async () => {
      await factsService.deleteTag(tag3Id);
      const tags = await factsService.getTags();
      expect(tags).toHaveLength(2);
      expect(tags.find(t => t.id === tag3Id)).toBeUndefined();
    });
  });

  describe('FactEntry CRUD, tags, supplements, search and pagination', () => {
    let techTagId: number;
    let lifeTagId: number;
    let entryId: number;
    let supplementId: number;

    beforeAll(async () => {
      const tags = await factsService.getTags();
      const tech = tags.find(t => t.name === 'Tech');
      const life = tags.find(t => t.name === 'Life');
      techTagId = tech!.id;
      lifeTagId = life!.id;
    });

    it('creates a fact entry with tags', async () => {
      const entry = await factsService.createFact({
        title: 'TypeScript Tip',
        content: 'Use satisfies operator for type checking without widening',
        tagIds: [techTagId],
      });

      entryId = entry.id;
      expect(entry.title).toBe('TypeScript Tip');
      expect(entry.content).toBe('Use satisfies operator for type checking without widening');
      expect(entry.tags).toHaveLength(1);
      expect(entry.tags[0]?.id).toBe(techTagId);
      expect(entry.supplements).toHaveLength(0);
    });

    it('adds a supplement to the entry', async () => {
      const supplement = await factsService.createSupplement(
        entryId,
        'Introduced in TypeScript 4.9'
      );
      supplementId = supplement.id;

      expect(supplement.content).toBe('Introduced in TypeScript 4.9');
      expect(supplement.entryId).toBe(entryId);

      const facts = await factsService.getFacts();
      const target = facts.items.find(f => f.id === entryId);
      expect(target?.supplements).toHaveLength(1);
      expect(target?.supplements[0]?.content).toBe('Introduced in TypeScript 4.9');
    });

    it('deletes a supplement', async () => {
      await factsService.deleteSupplement(supplementId);
      const facts = await factsService.getFacts();
      const target = facts.items.find(f => f.id === entryId);
      expect(target?.supplements).toHaveLength(0);
    });

    it('updates a fact entry and replaces tags', async () => {
      const updated = await factsService.updateFact(entryId, {
        title: 'TypeScript & JavaScript Tip',
        tagIds: [techTagId, lifeTagId],
      });

      expect(updated.title).toBe('TypeScript & JavaScript Tip');
      expect(updated.tags).toHaveLength(2);
      const tagIds = updated.tags.map(t => t.id);
      expect(tagIds).toContain(techTagId);
      expect(tagIds).toContain(lifeTagId);
    });

    it('gets facts with search and tag filters', async () => {
      // Create second entry
      const entry2 = await factsService.createFact({
        title: 'Morning Routine',
        content: 'Drink water first thing after waking up',
        tagIds: [lifeTagId],
      });

      // Filter by search
      const searchResult = await factsService.getFacts({ search: 'Routine' });
      expect(searchResult.total).toBe(1);
      expect(searchResult.items[0]?.id).toBe(entry2.id);

      // Filter by tag
      const tagResult = await factsService.getFacts({ tags: `${techTagId}` });
      expect(tagResult.total).toBe(1);
      expect(tagResult.items[0]?.id).toBe(entryId);

      // Filter by tag array
      const tagArrayResult = await factsService.getFacts({ tags: [lifeTagId] });
      expect(tagArrayResult.total).toBe(2);

      // Pagination
      const pageResult = await factsService.getFacts({ page: 1, limit: 1 });
      expect(pageResult.total).toBe(2);
      expect(pageResult.items).toHaveLength(1);

      // Cleanup entry2
      await factsService.deleteFact(entry2.id);
    });

    it('gets a random fact entry', async () => {
      const randomFact = await factsService.getRandomFact();
      expect(randomFact).not.toBeNull();
      expect(randomFact?.id).toBe(entryId);
      expect(randomFact?.tags.length).toBeGreaterThan(0);
    });

    it('deletes a fact entry cascading supplements and entryTags without deleting tags', async () => {
      // Add supplement again
      await factsService.createSupplement(entryId, 'Will be cascade deleted');

      // Delete entry
      await factsService.deleteFact(entryId);

      const facts = await factsService.getFacts();
      expect(facts.items.find(f => f.id === entryId)).toBeUndefined();

      // Check cascade deletion
      const supplements = await prisma.factSupplement.findMany({ where: { entryId } });
      expect(supplements).toHaveLength(0);

      const entryTags = await prisma.factEntryTag.findMany({ where: { entryId } });
      expect(entryTags).toHaveLength(0);

      // Verify tags still exist
      const tags = await factsService.getTags();
      expect(tags.find(t => t.id === techTagId)).toBeDefined();
    });
  });

  describe('Facts API Routes', () => {
    const express = require('express');
    const request = require('supertest');
    const factsRouter = require('../src/routes/facts').default;

    const app = express();
    app.use(express.json());
    app.use('/api/facts', factsRouter);

    let tagId: number;
    let factId: number;
    let supplementId: number;

    it('POST /api/facts/tags creates a tag', async () => {
      const res = await request(app)
        .post('/api/facts/tags')
        .send({ name: 'API Tag', color: '#ff5722' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('API Tag');
      tagId = res.body.id;
    });

    it('GET /api/facts/tags retrieves all tags', async () => {
      const res = await request(app).get('/api/facts/tags');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((t: any) => t.id === tagId)).toBe(true);
    });

    it('PUT /api/facts/tags/:id updates a tag', async () => {
      const res = await request(app)
        .put(`/api/facts/tags/${tagId}`)
        .send({ name: 'Updated API Tag' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated API Tag');
    });

    it('POST /api/facts creates a fact entry', async () => {
      const res = await request(app)
        .post('/api/facts')
        .send({
          title: 'API Fact',
          content: 'Fact content via API',
          tagIds: [tagId],
        });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('API Fact');
      expect(res.body.tags).toHaveLength(1);
      factId = res.body.id;
    });

    it('GET /api/facts/random retrieves a random fact', async () => {
      const res = await request(app).get('/api/facts/random');
      expect(res.status).toBe(200);
      expect(res.body).not.toBeNull();
      expect(res.body.id).toBe(factId);
    });

    it('GET /api/facts retrieves facts with query params', async () => {
      const res = await request(app).get(`/api/facts?search=API&tags=${tagId}`);
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.items[0].id).toBe(factId);
    });

    it('POST /api/facts/:id/supplements adds a supplement', async () => {
      const res = await request(app)
        .post(`/api/facts/${factId}/supplements`)
        .send({ content: 'Supplement via API' });
      expect(res.status).toBe(200);
      expect(res.body.content).toBe('Supplement via API');
      supplementId = res.body.id;
    });

    it('DELETE /api/facts/supplements/:id deletes a supplement', async () => {
      const res = await request(app).delete(`/api/facts/supplements/${supplementId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('PUT /api/facts/:id updates a fact entry', async () => {
      const res = await request(app)
        .put(`/api/facts/${factId}`)
        .send({ title: 'Updated API Fact' });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated API Fact');
    });

    it('DELETE /api/facts/:id deletes a fact entry', async () => {
      const res = await request(app).delete(`/api/facts/${factId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('DELETE /api/facts/tags/:id deletes a tag', async () => {
      const res = await request(app).delete(`/api/facts/tags/${tagId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
