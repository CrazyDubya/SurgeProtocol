/**
 * Surge Protocol - NPC Dialogue System
 *
 * Conditional dialogue trees with:
 * - Reputation-gated responses
 * - Skill check opportunities
 * - Quest/mission triggers
 * - Relationship tracking
 */

import { roll2d6, getAttributeModifier } from '../mechanics/dice';

// =============================================================================
// TYPES
// =============================================================================

export type ConditionType =
  | 'FACTION_REP'      // Requires faction reputation threshold
  | 'CHARACTER_TIER'   // Requires carrier tier
  | 'ITEM_POSSESSED'   // Requires specific item
  | 'QUEST_COMPLETE'   // Requires quest completion
  | 'QUEST_ACTIVE'     // Requires quest to be active
  | 'ATTRIBUTE_CHECK'  // Requires attribute value
  | 'SKILL_CHECK'      // Requires skill check success
  | 'TIME_OF_DAY'      // Requires specific time
  | 'FLAG_SET'         // Requires dialogue flag
  | 'CREDITS_MIN'      // Requires minimum credits
  | 'HUMANITY_MIN';    // Requires minimum humanity

export type EffectType =
  | 'SET_FLAG'         // Set a dialogue flag
  | 'GIVE_ITEM'        // Give item to player
  | 'TAKE_ITEM'        // Remove item from player
  | 'GIVE_CREDITS'     // Award credits
  | 'TAKE_CREDITS'     // Remove credits
  | 'MODIFY_REP'       // Change faction reputation
  | 'START_QUEST'      // Begin a quest
  | 'ADVANCE_QUEST'    // Progress quest stage
  | 'COMPLETE_QUEST'   // Mark quest complete
  | 'MODIFY_RELATION'  // Change NPC relationship
  | 'UNLOCK_VENDOR'    // Unlock vendor inventory
  | 'TRIGGER_EVENT';   // Trigger world event

export interface DialogueCondition {
  type: ConditionType;
  target?: string;      // Faction ID, item ID, quest ID, etc.
  value?: number;       // Threshold value
  comparison?: 'eq' | 'lt' | 'lte' | 'gt' | 'gte' | 'ne';
  attribute?: string;   // For attribute/skill checks
  difficulty?: number;  // TN for skill checks
}

export interface DialogueEffect {
  type: EffectType;
  target?: string;      // Item ID, faction ID, quest ID, etc.
  value?: number | string;
  hidden?: boolean;     // Don't show to player
}

export interface DialogueChoice {
  id: string;
  text: string;
  conditions?: DialogueCondition[];
  effects?: DialogueEffect[];
  nextNodeId?: string;  // null = end conversation
  skillCheck?: {
    attribute: string;
    difficulty: number;
    successNodeId: string;
    failureNodeId: string;
  };
  tooltip?: string;     // Hint about requirements
}

export interface DialogueNode {
  id: string;
  speaker: 'NPC' | 'PLAYER' | 'NARRATOR';
  speakerName?: string;
  text: string;
  mood?: 'neutral' | 'friendly' | 'hostile' | 'suspicious' | 'fearful' | 'amused';
  conditions?: DialogueCondition[];
  effects?: DialogueEffect[];
  choices?: DialogueChoice[];
  autoAdvance?: {
    delay?: number;     // ms before auto-advance
    nodeId: string;
  };
}

export interface DialogueTree {
  id: string;
  npcId: string;
  name: string;
  startNodeId: string;
  nodes: Map<string, DialogueNode>;
  globalConditions?: DialogueCondition[];
}

export interface DialogueState {
  treeId: string;
  currentNodeId: string;
  flags: Set<string>;
  visitedNodes: Set<string>;
  skillCheckResults: Map<string, boolean>;
}

export interface CharacterContext {
  characterId: string;
  tier: number;
  credits: number;
  humanity: number;
  attributes: Map<string, number>;
  skills: Map<string, number>;
  inventory: Set<string>;
  factionReps: Map<string, number>;
  completedQuests: Set<string>;
  activeQuests: Set<string>;
  dialogueFlags: Set<string>;
  npcRelations: Map<string, number>;
}

// =============================================================================
// DIALOGUE ENGINE
// =============================================================================

export class DialogueEngine {
  private trees: Map<string, DialogueTree> = new Map();

  /**
   * Register a dialogue tree.
   */
  registerTree(tree: DialogueTree): void {
    this.trees.set(tree.id, tree);
  }

  /**
   * Start a dialogue with an NPC.
   */
  startDialogue(
    treeId: string,
    context: CharacterContext
  ): { state: DialogueState; node: DialogueNode | null } {
    const tree = this.trees.get(treeId);
    if (!tree) {
      return { state: this.createEmptyState(treeId), node: null };
    }

    // Check global conditions
    if (tree.globalConditions && !this.checkConditions(tree.globalConditions, context)) {
      return { state: this.createEmptyState(treeId), node: null };
    }

    const state: DialogueState = {
      treeId,
      currentNodeId: tree.startNodeId,
      flags: new Set(),
      visitedNodes: new Set(),
      skillCheckResults: new Map(),
    };

    const node = this.getNode(tree, tree.startNodeId, context);
    if (node) {
      state.visitedNodes.add(node.id);
    }

    return { state, node };
  }

  /**
   * Select a dialogue choice.
   */
  selectChoice(
    state: DialogueState,
    choiceId: string,
    context: CharacterContext
  ): {
    state: DialogueState;
    node: DialogueNode | null;
    effects: DialogueEffect[];
    skillCheckResult?: { success: boolean; roll: number; target: number };
  } {
    const tree = this.trees.get(state.treeId);
    if (!tree) {
      return { state, node: null, effects: [] };
    }

    const currentNode = tree.nodes.get(state.currentNodeId);
    if (!currentNode?.choices) {
      return { state, node: null, effects: [] };
    }

    const choice = currentNode.choices.find(c => c.id === choiceId);
    if (!choice) {
      return { state, node: null, effects: [] };
    }

    // Check choice conditions
    if (choice.conditions && !this.checkConditions(choice.conditions, context)) {
      return { state, node: null, effects: [] };
    }

    const effects: DialogueEffect[] = [...(choice.effects || [])];
    let nextNodeId = choice.nextNodeId;
    let skillCheckResult: { success: boolean; roll: number; target: number } | undefined;

    // Handle skill check
    if (choice.skillCheck) {
      const attrValue = context.attributes.get(choice.skillCheck.attribute) || 10;
      const attrMod = getAttributeModifier(attrValue);
      const roll = roll2d6();
      const total = roll.total + attrMod;
      const success = total >= choice.skillCheck.difficulty;

      skillCheckResult = {
        success,
        roll: roll.total,
        target: choice.skillCheck.difficulty,
      };

      state.skillCheckResults.set(choiceId, success);
      nextNodeId = success ? choice.skillCheck.successNodeId : choice.skillCheck.failureNodeId;
    }

    // Apply choice effects
    for (const effect of choice.effects || []) {
      if (effect.type === 'SET_FLAG' && effect.target) {
        state.flags.add(effect.target);
      }
    }

    // Get next node
    let nextNode: DialogueNode | null = null;
    if (nextNodeId) {
      nextNode = this.getNode(tree, nextNodeId, context);
      if (nextNode) {
        state.currentNodeId = nextNodeId;
        state.visitedNodes.add(nextNodeId);

        // Apply node effects
        if (nextNode.effects) {
          effects.push(...nextNode.effects);
        }
      }
    }

    return { state, node: nextNode, effects, skillCheckResult };
  }

  /**
   * Get available choices for current node.
   */
  getAvailableChoices(
    state: DialogueState,
    context: CharacterContext
  ): DialogueChoice[] {
    const tree = this.trees.get(state.treeId);
    if (!tree) return [];

    const node = tree.nodes.get(state.currentNodeId);
    if (!node?.choices) return [];

    return node.choices.filter(choice => {
      if (!choice.conditions) return true;
      return this.checkConditions(choice.conditions, context);
    });
  }

  /**
   * Get a node, checking its conditions.
   */
  private getNode(
    tree: DialogueTree,
    nodeId: string,
    context: CharacterContext
  ): DialogueNode | null {
    const node = tree.nodes.get(nodeId);
    if (!node) return null;

    if (node.conditions && !this.checkConditions(node.conditions, context)) {
      return null;
    }

    return node;
  }

  /**
   * Check if all conditions are met.
   */
  private checkConditions(
    conditions: DialogueCondition[],
    context: CharacterContext
  ): boolean {
    return conditions.every(cond => this.checkCondition(cond, context));
  }

  /**
   * Check a single condition.
   */
  private checkCondition(
    condition: DialogueCondition,
    context: CharacterContext
  ): boolean {
    const compare = (actual: number, target: number, op = condition.comparison || 'gte'): boolean => {
      switch (op) {
        case 'eq': return actual === target;
        case 'ne': return actual !== target;
        case 'lt': return actual < target;
        case 'lte': return actual <= target;
        case 'gt': return actual > target;
        case 'gte': return actual >= target;
        default: return actual >= target;
      }
    };

    switch (condition.type) {
      case 'FACTION_REP':
        if (!condition.target || condition.value === undefined) return true;
        return compare(context.factionReps.get(condition.target) || 0, condition.value);

      case 'CHARACTER_TIER':
        if (condition.value === undefined) return true;
        return compare(context.tier, condition.value);

      case 'ITEM_POSSESSED':
        if (!condition.target) return true;
        return context.inventory.has(condition.target);

      case 'QUEST_COMPLETE':
        if (!condition.target) return true;
        return context.completedQuests.has(condition.target);

      case 'QUEST_ACTIVE':
        if (!condition.target) return true;
        return context.activeQuests.has(condition.target);

      case 'ATTRIBUTE_CHECK':
        if (!condition.attribute || condition.value === undefined) return true;
        return compare(context.attributes.get(condition.attribute) || 10, condition.value);

      case 'CREDITS_MIN':
        if (condition.value === undefined) return true;
        return compare(context.credits, condition.value);

      case 'HUMANITY_MIN':
        if (condition.value === undefined) return true;
        return compare(context.humanity, condition.value);

      case 'FLAG_SET':
        if (!condition.target) return true;
        return context.dialogueFlags.has(condition.target);

      default:
        return true;
    }
  }

  private createEmptyState(treeId: string): DialogueState {
    return {
      treeId,
      currentNodeId: '',
      flags: new Set(),
      visitedNodes: new Set(),
      skillCheckResults: new Map(),
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a simple linear dialogue.
 */
export function createLinearDialogue(
  id: string,
  npcId: string,
  name: string,
  lines: Array<{ text: string; speaker?: 'NPC' | 'PLAYER' }>
): DialogueTree {
  const nodes = new Map<string, DialogueNode>();

  lines.forEach((line, index) => {
    const nodeId = `node_${index}`;
    const isLast = index === lines.length - 1;

    nodes.set(nodeId, {
      id: nodeId,
      speaker: line.speaker || 'NPC',
      text: line.text,
      choices: isLast ? undefined : [{
        id: 'continue',
        text: '[Continue]',
        nextNodeId: `node_${index + 1}`,
      }],
    });
  });

  return {
    id,
    npcId,
    name,
    startNodeId: 'node_0',
    nodes,
  };
}

/**
 * Create a branching dialogue with choices.
 */
export function createBranchingDialogue(
  id: string,
  npcId: string,
  name: string,
  rootText: string,
  branches: Array<{
    choiceText: string;
    responseText: string;
    effects?: DialogueEffect[];
  }>
): DialogueTree {
  const nodes = new Map<string, DialogueNode>();

  // Root node
  nodes.set('root', {
    id: 'root',
    speaker: 'NPC',
    text: rootText,
    choices: branches.map((branch, index) => ({
      id: `choice_${index}`,
      text: branch.choiceText,
      nextNodeId: `response_${index}`,
      effects: branch.effects,
    })),
  });

  // Response nodes
  branches.forEach((branch, index) => {
    nodes.set(`response_${index}`, {
      id: `response_${index}`,
      speaker: 'NPC',
      text: branch.responseText,
    });
  });

  return {
    id,
    npcId,
    name,
    startNodeId: 'root',
    nodes,
  };
}

// Singleton dialogue engine
export const dialogueEngine = new DialogueEngine();
