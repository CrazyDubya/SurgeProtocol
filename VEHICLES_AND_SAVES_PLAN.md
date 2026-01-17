# Vehicles & Save System Implementation Plan

## Overview
Two major systems to implement:
1. **Vehicles** - Core to delivery gameplay (courier game)
2. **Save/Load** - Persistence between sessions

---

## Day 1: Vehicle System Foundation

### Goals
- Create vehicle API routes (`/api/vehicles`)
- Seed vehicle definitions data
- Implement character vehicle CRUD
- Add vehicle selection for active vehicle

### Tasks
1. **Create `/src/api/vehicles/index.ts`**
   - `GET /vehicles/catalog` - Browse vehicle definitions
   - `GET /vehicles/catalog/:id` - Vehicle details
   - `GET /vehicles/owned` - Character's vehicles
   - `POST /vehicles/purchase` - Buy a vehicle
   - `POST /vehicles/:id/select` - Set active vehicle
   - `PATCH /vehicles/:id` - Customize vehicle (name, colors)
   - `POST /vehicles/:id/refuel` - Refuel vehicle
   - `POST /vehicles/:id/repair` - Repair damaged vehicle

2. **Seed vehicle definitions**
   - Add to migrations or seed data
   - Cover: bikes, cars, trucks, vans (delivery-focused)

3. **Add types to `/src/db/types.ts`**
   - VehicleDefinition interface
   - CharacterVehicle interface

4. **Register routes in `/src/index.ts`**

### Tests to Write
- `tests/integration/vehicle.test.ts`
  - List catalog
  - Purchase vehicle
  - Select active vehicle
  - Refuel/repair

---

## Day 2: Vehicle-Mission Integration

### Goals
- Vehicles affect mission availability
- Vehicles affect mission performance
- Track vehicle stats per mission

### Tasks
1. **Modify mission acceptance**
   - Check vehicle cargo capacity vs. mission cargo
   - Check vehicle class requirements
   - Apply vehicle bonuses to mission

2. **Add vehicle modifiers to missions**
   - Speed affects time calculations
   - Handling affects navigation checks
   - Cargo capacity limits mission types

3. **Track vehicle usage**
   - Update odometer_km on mission complete
   - Update total_deliveries counter
   - Apply wear/damage from complications

4. **Add to character state**
   - `active_vehicle_id` field on characters table (migration)
   - Return active vehicle in character API

### Tests
- Mission acceptance with/without vehicle
- Mission bonuses from vehicle stats
- Vehicle wear tracking

---

## Day 3: Save System Core

### Goals
- Create save API routes (`/api/saves`)
- Implement save game creation
- Basic save metadata

### Tasks
1. **Create `/src/api/saves/index.ts`**
   - `GET /saves` - List player's saves
   - `POST /saves` - Create new save
   - `GET /saves/:id` - Get save details
   - `DELETE /saves/:id` - Delete save
   - `POST /saves/:id/rename` - Rename save

2. **Save metadata collection**
   - Capture character state snapshot
   - Store location, tier, rating
   - Generate thumbnail placeholder

3. **Add types**
   - SaveGame interface
   - SaveDataChunk interface

4. **Save slots system**
   - 10 manual slots + auto-save slot
   - Quicksave slot

### Tests
- Create save
- List saves
- Delete save
- Save slot limits

---

## Day 4: Save Data Serialization

### Goals
- Serialize full character state
- Chunk-based storage for large data
- Compression for efficiency

### Tasks
1. **Create save data serializer**
   - `/src/game/saves/serializer.ts`
   - Character core data chunk
   - Inventory chunk
   - Mission state chunk
   - Reputation chunk
   - Skills/abilities chunk

2. **Implement chunk storage**
   - Split large saves into chunks
   - Store in save_data_chunks table
   - Track dependencies between chunks

3. **Data integrity**
   - Calculate checksums
   - Validate on save
   - Mark corrupted saves

4. **Auto-save system**
   - Trigger on mission complete
   - Trigger on tier-up
   - Configurable frequency

### Tests
- Serialize/deserialize roundtrip
- Chunk splitting
- Checksum validation

---

## Day 5: Load System & Checkpoints

### Goals
- Implement load game
- Checkpoint system for missions
- Handle edge cases

### Tasks
1. **Load game flow**
   - Validate save integrity
   - Deserialize chunks
   - Restore character state
   - Restore world state

2. **Checkpoint system**
   - Create checkpoint at mission start
   - Create checkpoint at key moments
   - Allow rollback on death/failure

3. **Handle conflicts**
   - Save version compatibility
   - Missing data recovery
   - Partial load fallbacks

4. **Session management**
   - Link saves to play sessions
   - Track playtime properly

### Tests
- Load save restores state
- Checkpoint creation
- Rollback to checkpoint
- Version compatibility

---

## Day 6: Integration Testing & Code Review

### Goals
- Full system integration tests
- Performance testing
- Code review and cleanup

### Tasks
1. **Integration tests**
   - Full mission flow with vehicle
   - Save → quit → load → continue
   - Edge cases (death, timeout, abandon)

2. **Performance review**
   - Save/load timing
   - Query optimization
   - Index verification

3. **Code review checklist**
   - [ ] Error handling complete
   - [ ] Input validation
   - [ ] SQL injection prevention
   - [ ] Type safety
   - [ ] Consistent patterns

4. **Fix any issues found**

### Tests
- End-to-end scenarios
- Stress tests
- Error recovery

---

## Day 7: Polish, Edge Cases, Documentation

### Goals
- Handle all edge cases
- Update documentation
- Final cleanup

### Tasks
1. **Edge cases**
   - Vehicle destroyed during mission
   - Save during combat
   - Load with missing vehicle
   - Corrupted save recovery

2. **Update documentation**
   - API documentation
   - Update DATABASE_USAGE_AUDIT.md
   - Add to IMPLEMENTATION_PLAN.md

3. **Cleanup**
   - Remove debug code
   - Consistent logging
   - Error messages

4. **Final commit and push**

---

## Schema Reference

### Vehicle Tables (from migration)
```sql
vehicle_definitions:
- id, code, name, manufacturer, model_year, description
- vehicle_class, vehicle_type, size_category, rarity
- top_speed_kmh, acceleration_0_100_seconds, handling_rating, braking_rating
- max_hull_points, armor_rating, damage_resistances
- passenger_capacity, cargo_capacity_kg, cargo_volume_liters
- fuel_capacity, fuel_consumption_per_km, range_km
- required_tier, required_skill_id, required_skill_level
- base_price, insurance_cost_monthly, maintenance_cost_monthly

character_vehicles:
- id, character_id, vehicle_definition_id, acquired_at
- custom_name, license_plate, vin, is_registered
- current_location_id, current_coordinates, current_hull_points, current_fuel
- odometer_km, is_damaged
- paint_color_primary, paint_color_secondary, installed_mods
- ownership_type, owned_outright, loan_id, insured
- corporate_issued, corporate_tracked, transponder_disabled
- total_deliveries, total_distance_km, accidents
```

### Save Tables (from migration)
```sql
save_games:
- id, player_id, created_at, updated_at
- save_name, save_type, save_slot, is_auto_save, is_quicksave
- character_id, character_name, character_tier, character_track
- playtime_seconds, story_progress_percent, main_arc_name, main_mission_name
- current_location_id, current_location_name, current_coordinates
- screenshot_asset, thumbnail_asset
- game_version, save_version, compatible_versions
- is_valid, is_corrupted, is_ironman, difficulty
- total_missions_completed, total_credits_earned, total_distance_km
- enemies_defeated, deaths
- cloud_synced, cloud_sync_at, cloud_id
- data_checksum, tamper_detected

save_data_chunks:
- id, save_id, chunk_type
- data (JSON), data_version, compressed, compressed_size_bytes, uncompressed_size_bytes
- checksum, is_valid
- depends_on_chunks, load_priority

checkpoints:
- id, save_id, created_at
- checkpoint_type, trigger_source, description
- location_id, coordinates
- critical_state (JSON)
- expires_at, is_persistent
- replay_possible, restore_count
```

---

## Success Criteria

### Vehicles
- [ ] Can browse and purchase vehicles
- [ ] Can select active vehicle
- [ ] Missions respect vehicle requirements
- [ ] Vehicle stats affect mission performance
- [ ] Vehicle wear/damage tracked

### Save System
- [ ] Can create manual saves (10 slots)
- [ ] Auto-save works on key events
- [ ] Quicksave/quickload works
- [ ] Load fully restores game state
- [ ] Corrupted saves detected and handled
- [ ] Checkpoints allow mission rollback
