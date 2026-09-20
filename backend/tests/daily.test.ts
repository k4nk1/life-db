import { dailyService } from '../src/services/daily';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Daily Service', () => {
  let typeId: number;
  let subtypeId: number;
  let actionId: number;

  beforeAll(async () => {
    // Clear DB
    await prisma.action.deleteMany();
    await prisma.dailyRecord.deleteMany();
    await prisma.actionSubtype.deleteMany();
    await prisma.actionType.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates an action type', async () => {
    const type = await dailyService.createType({ name: 'Work', color: '#FF0000', sortOrder: 0 });
    typeId = type.id;
    expect(type.name).toBe('Work');
  });

  it('updates an action type and shifts sortOrder', async () => {
    const type2 = await dailyService.createType({ name: 'Study', color: '#00FF00', sortOrder: 1 });
    
    // update sortOrder of Work to 1
    await dailyService.updateType(typeId, { sortOrder: 1 });
    
    const updatedType2 = await prisma.actionType.findUnique({ where: { id: type2.id } });
    expect(updatedType2?.sortOrder).toBe(0); // study should be shifted up (to 0)
    
    // clean up type2
    await dailyService.deleteType(type2.id);
  });

  it('creates an action subtype', async () => {
    const subtype = await dailyService.createSubtype({ name: 'Development', typeId, sortOrder: 0 });
    subtypeId = subtype.id;
    expect(subtype.name).toBe('Development');
  });

  it('gets types including subtypes', async () => {
    const types = await dailyService.getTypes();
    expect(types.length).toBeGreaterThan(0);
    expect(types[0]?.subtypes?.length).toBe(1);
  });

  it('updates a daily record', async () => {
    const date = '2023-10-01';
    const record = await dailyService.updateRecord(date, { goal: 'Be productive', reflection: 'Good day' });
    expect(record.goal).toBe('Be productive');
  });

  it('creates an action for a record', async () => {
    const date = '2023-10-01';
    const action = await dailyService.createAction(date, {
      subtypeId,
      startMinutes: 600, // 10:00
      endMinutes: 660, // 11:00
      detail: 'Coding',
    });
    actionId = action.id;
    expect(action.detail).toBe('Coding');
  });

  it('gets a daily record with actions', async () => {
    const date = '2023-10-01';
    const record = await dailyService.getRecord(date);
    expect(record.actions?.length).toBe(1);
    expect(record.actions?.[0]?.id).toBe(actionId);
  });

  it('gets stats', async () => {
    const statsType = await dailyService.getStats('2023-10-01', '2023-10-01', 'type');
    expect(statsType.length).toBe(1);
    expect(statsType[0]?.totalMinutes).toBe(60);

    const statsSubtype = await dailyService.getStats('2023-10-01', '2023-10-01', 'subtype');
    expect(statsSubtype.length).toBe(1);
    expect(statsSubtype[0]?.totalMinutes).toBe(60);
  });

  it('updates an action', async () => {
    const updated = await dailyService.updateAction(actionId, { detail: 'Testing' });
    expect(updated.detail).toBe('Testing');
  });

  it('deletes an action', async () => {
    await dailyService.deleteAction(actionId);
    const date = '2023-10-01';
    const record = await dailyService.getRecord(date);
    expect(record.actions.length).toBe(0);
  });

  it('deletes an action subtype', async () => {
    await dailyService.deleteSubtype(subtypeId);
    const subtypes = await prisma.actionSubtype.findMany();
    expect(subtypes.length).toBe(0);
  });

  it('deletes an action type', async () => {
    await dailyService.deleteType(typeId);
    const types = await prisma.actionType.findMany();
    expect(types.length).toBe(0);
  });
});
