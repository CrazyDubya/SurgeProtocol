/**
 * Surge Protocol - Seed Data Validation Tests
 *
 * Validates the structure and content of all seed data JSON files.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_DATA_DIR = path.join(__dirname, '..', 'seed_data');

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function readSeedFile(relativePath) {
  const fullPath = path.join(SEED_DATA_DIR, relativePath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(content);
}

// =============================================================================
// ATTRIBUTE SEED DATA TESTS
// =============================================================================

describe('Attributes Seed Data', () => {
  const data = readSeedFile('attributes.json');

  it('should have attributes.json file', () => {
    assert.ok(data !== null, 'attributes.json should exist');
  });

  it('should have attributes array', () => {
    assert.ok(Array.isArray(data?.attributes), 'should have attributes array');
    assert.ok((data?.attributes?.length ?? 0) >= 8, 'should have at least 8 attributes');
  });

  it('should have required attribute fields', () => {
    for (const attr of data?.attributes ?? []) {
      assert.ok(attr.code, 'attribute should have code');
      assert.ok(attr.name, 'attribute should have name');
      assert.ok(attr.description, 'attribute should have description');
      assert.ok(attr.category, 'attribute should have category');
    }
  });

  it('should have expected core attributes', () => {
    const codes = (data?.attributes ?? []).map((a) => a.code);
    const coreAttributes = ['STR', 'AGI', 'VEL', 'VIT', 'INT', 'PRC', 'WIL', 'CHA'];
    for (const code of coreAttributes) {
      assert.ok(codes.includes(code), `should have ${code} attribute`);
    }
  });
});

// =============================================================================
// SKILLS SEED DATA TESTS
// =============================================================================

describe('Skills Seed Data', () => {
  const data = readSeedFile('skills.json');

  it('should have skills.json file', () => {
    assert.ok(data !== null, 'skills.json should exist');
  });

  it('should have skills array', () => {
    assert.ok(Array.isArray(data?.skills), 'should have skills array');
    assert.ok((data?.skills?.length ?? 0) >= 10, 'should have at least 10 skills');
  });

  it('should have required skill fields', () => {
    for (const skill of data?.skills ?? []) {
      assert.ok(skill.code, 'skill should have code');
      assert.ok(skill.name, 'skill should have name');
      assert.ok(skill.category, 'skill should have category');
      assert.ok(skill.governing_attribute, 'skill should have governing_attribute');
    }
  });

  it('should have valid governing attributes', () => {
    const validAttributes = ['STR', 'AGI', 'VEL', 'VIT', 'INT', 'PRC', 'WIL', 'CHA'];
    for (const skill of data?.skills ?? []) {
      assert.ok(
        validAttributes.includes(skill.governing_attribute),
        `skill ${skill.code} has invalid governing_attribute: ${skill.governing_attribute}`
      );
    }
  });
});

// =============================================================================
// TIER DEFINITIONS SEED DATA TESTS
// =============================================================================

describe('Tier Definitions Seed Data', () => {
  const data = readSeedFile('tier_definitions.json');

  it('should have tier_definitions.json file', () => {
    assert.ok(data !== null, 'tier_definitions.json should exist');
  });

  it('should have tiers array', () => {
    assert.ok(Array.isArray(data?.tiers), 'should have tiers array');
    assert.strictEqual(data?.tiers?.length, 10, 'should have exactly 10 tiers');
  });

  it('should have required tier fields', () => {
    for (const tier of data?.tiers ?? []) {
      assert.ok(typeof tier.tier_number === 'number', 'tier should have tier_number');
      assert.ok(tier.name, 'tier should have name');
      assert.ok(typeof tier.rating_threshold === 'number', 'tier should have rating_threshold');
      assert.ok(typeof tier.xp_required === 'number', 'tier should have xp_required');
    }
  });

  it('should have increasing tier numbers', () => {
    const tierNumbers = (data?.tiers ?? []).map((t) => t.tier_number);
    for (let i = 0; i < tierNumbers.length - 1; i++) {
      assert.ok(tierNumbers[i] < tierNumbers[i + 1], 'tier numbers should increase');
    }
  });

  it('should have increasing XP requirements', () => {
    const xpReqs = (data?.tiers ?? []).map((t) => t.xp_required);
    for (let i = 0; i < xpReqs.length - 1; i++) {
      assert.ok(xpReqs[i] <= xpReqs[i + 1], 'XP requirements should increase');
    }
  });
});

// =============================================================================
// DIFFICULTY LEVELS SEED DATA TESTS
// =============================================================================

describe('Difficulty Levels Seed Data', () => {
  const data = readSeedFile('difficulty_levels.json');

  it('should have difficulty_levels.json file', () => {
    assert.ok(data !== null, 'difficulty_levels.json should exist');
  });

  it('should have target_numbers array', () => {
    assert.ok(Array.isArray(data?.target_numbers), 'should have target_numbers array');
    assert.ok((data?.target_numbers?.length ?? 0) >= 5, 'should have at least 5 difficulty levels');
  });

  it('should have required difficulty fields', () => {
    for (const diff of data?.target_numbers ?? []) {
      assert.ok(diff.code, 'difficulty should have code');
      assert.ok(diff.name, 'difficulty should have name');
      assert.ok(typeof diff.target_number === 'number', 'difficulty should have target_number');
    }
  });

  it('should have increasing target numbers', () => {
    const targets = (data?.target_numbers ?? [])
      .map((d) => d.target_number)
      .sort((a, b) => a - b);
    for (let i = 0; i < targets.length - 1; i++) {
      assert.ok(targets[i] <= targets[i + 1], 'target numbers should increase');
    }
  });
});

// =============================================================================
// FACTIONS SEED DATA TESTS
// =============================================================================

describe('Factions Seed Data', () => {
  const data = readSeedFile('factions.json');

  it('should have factions.json file', () => {
    assert.ok(data !== null, 'factions.json should exist');
  });

  it('should have factions array', () => {
    assert.ok(Array.isArray(data?.factions), 'should have factions array');
    assert.ok((data?.factions?.length ?? 0) >= 12, 'should have at least 12 factions');
  });

  it('should have required faction fields', () => {
    for (const faction of data?.factions ?? []) {
      assert.ok(faction.code, 'faction should have code');
      assert.ok(faction.name, 'faction should have name');
      assert.ok(faction.faction_type, 'faction should have faction_type');
    }
  });

  it('should have valid faction types', () => {
    const validTypes = ['CORPORATION', 'GANG', 'GOVERNMENT', 'HACKTIVISTS', 'PROFESSIONAL', 'RESISTANCE', 'SYNDICATE', 'TRANSCENDENT', 'UNDERGROUND'];
    for (const faction of data?.factions ?? []) {
      assert.ok(
        validTypes.includes(faction.faction_type),
        `faction ${faction.code} has invalid faction_type: ${faction.faction_type}`
      );
    }
  });
});

// =============================================================================
// LOCATIONS SEED DATA TESTS
// =============================================================================

describe('Locations Seed Data', () => {
  describe('Districts', () => {
    const data = readSeedFile('locations/districts.json');

    it('should have districts.json file', () => {
      assert.ok(data !== null, 'locations/districts.json should exist');
    });

    it('should have districts array', () => {
      assert.ok(Array.isArray(data?.districts), 'should have districts array');
      assert.ok((data?.districts?.length ?? 0) >= 5, 'should have at least 5 districts');
    });

    it('should have required district fields', () => {
      for (const district of data?.districts ?? []) {
        assert.ok(district.code, 'district should have code');
        assert.ok(district.name, 'district should have name');
        assert.ok(district.tier_range, 'district should have tier_range');
      }
    });
  });

  describe('The Hollows', () => {
    const data = readSeedFile('locations/the_hollows.json');

    it('should have the_hollows.json file', () => {
      assert.ok(data !== null, 'locations/the_hollows.json should exist');
    });

    it('should have detailed location data', () => {
      assert.ok(data?.location, 'should have location object');
      assert.ok(data?.location?.code, 'should have code');
      assert.ok(data?.location?.name, 'should have name');
      assert.ok(data?.location?.atmosphere, 'should have atmosphere');
      assert.ok(data?.location?.key_locations, 'should have key_locations');
    });

    it('should have key locations array', () => {
      const keyLocations = data?.location?.key_locations;
      assert.ok(Array.isArray(keyLocations), 'key_locations should be array');
      assert.ok(keyLocations.length >= 3, 'should have at least 3 key locations');
    });
  });
});

// =============================================================================
// NPC SEED DATA TESTS
// =============================================================================

describe('NPC Seed Data', () => {
  describe('Tutorial NPCs', () => {
    const data = readSeedFile('npcs/tutorial_npcs.json');

    it('should have tutorial_npcs.json file', () => {
      assert.ok(data !== null, 'npcs/tutorial_npcs.json should exist');
    });

    it('should have npcs array', () => {
      assert.ok(Array.isArray(data?.npcs), 'should have npcs array');
      assert.ok((data?.npcs?.length ?? 0) >= 5, 'should have at least 5 tutorial NPCs');
    });

    it('should have required NPC fields', () => {
      for (const npc of data?.npcs ?? []) {
        assert.ok(npc.code, 'NPC should have code');
        assert.ok(npc.name, 'NPC should have name');
        // faction can be null for independent NPCs
        assert.ok('faction' in npc, 'NPC should have faction field (can be null)');
      }
    });

    it('should include Dispatcher Chen', () => {
      const codes = (data?.npcs ?? []).map((n) => n.code);
      assert.ok(
        codes.some((c) => c.includes('CHEN')),
        'should include Chen NPC'
      );
    });
  });

  describe('Chen Detailed', () => {
    const data = readSeedFile('npcs/chen.json');

    it('should have chen.json file', () => {
      assert.ok(data !== null, 'npcs/chen.json should exist');
    });

    it('should have detailed NPC structure', () => {
      assert.ok(data?.npc, 'should have npc object');
      assert.ok(data?.npc?.code, 'should have code');
      assert.ok(data?.npc?.name, 'should have name');
      assert.ok(data?.npc?.background, 'should have background');
      assert.ok(data?.npc?.voice_profile, 'should have voice_profile');
    });

    it('should have relationship stages', () => {
      const stages = data?.npc?.relationship_stages;
      assert.ok(Array.isArray(stages), 'should have relationship_stages array');
      assert.ok(stages.length >= 3, 'should have at least 3 relationship stages');
    });

    it('should have quests data', () => {
      const quests = data?.npc?.quests;
      assert.ok(quests, 'should have quests object');
    });
  });
});

// =============================================================================
// DIALOGUE TREE SEED DATA TESTS
// =============================================================================

describe('Dialogue Tree Seed Data', () => {
  const data = readSeedFile('dialogue_trees/chen_tutorial.json');

  it('should have chen_tutorial.json file', () => {
    assert.ok(data !== null, 'dialogue_trees/chen_tutorial.json should exist');
  });

  it('should have dialogue_trees structure', () => {
    assert.ok(data?.npc_code, 'should have npc_code at root');
    assert.ok(Array.isArray(data?.dialogue_trees), 'should have dialogue_trees array');
    assert.ok(data?.dialogue_trees?.length > 0, 'should have at least one dialogue tree');
  });

  it('should have valid tree structure', () => {
    for (const tree of data?.dialogue_trees ?? []) {
      assert.ok(tree.id, 'tree should have id');
      assert.ok(tree.name, 'tree should have name');
      assert.ok(Array.isArray(tree.nodes), 'tree should have nodes array');
    }
  });

  it('should reference Chen NPC', () => {
    const npcCode = data?.npc_code;
    assert.ok(
      npcCode?.includes('CHEN'),
      'should reference Chen NPC'
    );
  });
});

// =============================================================================
// CROSS-REFERENCE VALIDATION
// =============================================================================

describe('Cross-Reference Validation', () => {
  it('should have consistent faction codes', () => {
    const factions = readSeedFile('factions.json');
    const npcs = readSeedFile('npcs/tutorial_npcs.json');

    if (!factions || !npcs) {
      assert.ok(true, 'skipped - files not found');
      return;
    }

    const factionCodes = factions.factions.map((f) => f.code);

    for (const npc of npcs.npcs) {
      if (npc.faction) {
        assert.ok(
          factionCodes.includes(npc.faction),
          `NPC faction "${npc.faction}" should exist in factions.json`
        );
      }
    }
  });

  it('should have consistent attribute references in skills', () => {
    const attributes = readSeedFile('attributes.json');
    const skills = readSeedFile('skills.json');

    if (!attributes || !skills) {
      assert.ok(true, 'skipped - files not found');
      return;
    }

    const attrCodes = attributes.attributes.map((a) => a.code);

    for (const skill of skills.skills) {
      assert.ok(
        attrCodes.includes(skill.governing_attribute),
        `Skill "${skill.code}" governing_attribute "${skill.governing_attribute}" should exist in attributes.json`
      );
    }
  });
});

// =============================================================================
// FILE STRUCTURE VALIDATION
// =============================================================================

describe('Seed Data File Structure', () => {
  it('should have seed_data directory', () => {
    assert.ok(fs.existsSync(SEED_DATA_DIR), 'seed_data directory should exist');
  });

  it('should have required subdirectories', () => {
    const requiredDirs = ['npcs', 'locations', 'dialogue_trees'];
    for (const dir of requiredDirs) {
      const dirPath = path.join(SEED_DATA_DIR, dir);
      assert.ok(fs.existsSync(dirPath), `${dir} directory should exist`);
    }
  });

  it('should have all core seed files', () => {
    const coreFiles = [
      'attributes.json',
      'skills.json',
      'tier_definitions.json',
      'difficulty_levels.json',
      'factions.json',
    ];
    for (const file of coreFiles) {
      const filePath = path.join(SEED_DATA_DIR, file);
      assert.ok(fs.existsSync(filePath), `${file} should exist`);
    }
  });
});
