import { Hono } from 'hono';
import { VehicleService } from '../../services/vehicle';
import { authMiddleware, type AuthVariables } from '../../middleware/auth';
import type { D1Database, KVNamespace } from '@cloudflare/workers-types';

type Bindings = {
  DB: D1Database;
  CACCHE: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// Helper to get service
const getService = (c: any) => new VehicleService({ db: c.env.DB });

// Public routes
app.get('/definitions', async (c) => {
  const service = getService(c);
  const vehicles = await service.getVehicleDefinitions();
  return c.json({ success: true, data: vehicles });
});

app.get('/definitions/:id', async (c) => {
  const service = getService(c);
  const vehicle = await service.getVehicleDefinition(c.req.param('id'));

  if (!vehicle) {
    return c.json({ success: false, error: 'Vehicle definition not found' }, 404);
  }

  return c.json({ success: true, data: vehicle });
});

// Protected routes
app.use('/*', authMiddleware());

app.get('/my-vehicles', async (c) => {
  const characterId = c.get('characterId');
  if (!characterId) return c.json({ success: false, error: 'No character' }, 401);
  const service = getService(c);
  const vehicles = await service.getPlayerVehicles(characterId);
  return c.json({ success: true, data: vehicles });
});

app.get('/:id', async (c) => {
  const service = getService(c);
  const vehicle = await service.getVehicleDetails(c.req.param('id'));

  if (!vehicle) {
    return c.json({ success: false, error: 'Vehicle not found' }, 404);
  }

  const characterId = c.get('characterId');
  if (vehicle.character_id !== characterId) {
    return c.json({ success: false, error: 'Unauthorized access to vehicle' }, 403);
  }

  return c.json({ success: true, data: vehicle });
});

app.post('/purchase', async (c) => {
  const characterId = c.get('characterId') as string;
  const body = await c.req.json();
  const { vehicleDefinitionId, colorPrimary, colorSecondary } = body;

  if (!vehicleDefinitionId) {
    return c.json({ success: false, error: 'Missing vehicleDefinitionId' }, 400);
  }

  const service = getService(c);
  const result = await service.purchaseVehicle(characterId, vehicleDefinitionId, colorPrimary, colorSecondary);

  if (!result.success) {
    return c.json({ success: false, error: result.message }, 400);
  }

  return c.json({ success: true, data: { vehicleId: result.vehicleId, message: result.message } });
});

app.patch('/:id', async (c) => {
  const characterId = c.get('characterId');
  const vehicleId = c.req.param('id');
  const body = await c.req.json();

  // Validate ownership first
  const service = getService(c);
  const vehicle = await service.getVehicleDetails(vehicleId);

  if (!vehicle || vehicle.character_id !== characterId) {
    return c.json({ success: false, error: 'Vehicle not found or unauthorized' }, 403);
  }

  await service.updateVehicle(vehicleId, body);
  return c.json({ success: true, message: 'Vehicle updated' });
});

export const vehicleRoutes = app;
