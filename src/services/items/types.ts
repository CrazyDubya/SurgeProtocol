
export interface ItemRow {
    id: string;
    code: string;
    name: string;
    description: string | null;
    item_type: string | null;
    item_subtype: string | null;
    rarity: string;
    quality_tier: number;
    base_price: number;
    weight_kg: number;
    required_tier: number;
    is_craftable: number;
    recipe_id: string | null;
    is_component: number;
    component_categories: string | null;
    manufacturer: string | null;
    passive_effects: string | null;
    use_effects: string | null;
    equip_effects: string | null;
    required_attributes: string | null;
    required_skills: string | null;
}

export interface UseEffects {
    healing?: number;
    staminaRestore?: number;
    tempAttributeBonus?: { attribute: string; value: number; duration: number };
    tempSkillBonus?: { skill: string; value: number; duration: number };
    removeCondition?: string;
    addCondition?: { condition: string; duration: number };
    custom?: string;
}

export interface EquipEffects {
    attributeBonuses?: Record<string, number>;
    skillBonuses?: Record<string, number>;
    armorValue?: number;
    damage?: string;
    attackMod?: number;
    special?: string[];
}

export interface InventoryItem {
    inventoryId: string;
    item_definition_id: string;
    code: string;
    name: string;
    originalName: string;
    description: string | null;
    itemType: string | null;
    itemSubtype: string | null;
    rarity: string;
    quantity: number;
    weight: number;
    basePrice: number;
    equippedSlot: string | null;
    quickSlot: number | null;
    durability: number | null;
    charges: number | null;
    ammo: number | null;
    isDamaged: boolean;
    isBroken: boolean;
    isEquipped: boolean;
    isConsumable: boolean;
    passiveEffects: any;
    useEffects: UseEffects | null;
    equipEffects: EquipEffects | null;
}

export interface ArmorRow extends ItemRow {
    armor_style: string;
    armor_value: number;
    damage_reduction_flat: number;
    damage_reduction_percent: number;
    damage_type_resistances: string | null;
    damage_type_weaknesses: string | null;
    body_locations_covered: string | null;
    coverage_percentage: number;
    vital_protection: number;
    speed_penalty: number;
    agility_penalty: number;
    noise_level: number;
    swim_penalty: number;
    is_powered: number;
    power_consumption: number;
    environmental_protection: string | null;
    special_properties: string | null;
    concealment: number;
    equip_slot: string | null;
    icon_asset: string | null;
}

export interface WeaponRow extends ItemRow {
    weapon_class: string;
    weapon_type: string;
    damage_type: string;
    is_melee: number;
    is_ranged: number;
    is_throwable: number;
    is_smart_weapon: number;
    is_tech_weapon: number;
    base_damage_dice: string;
    base_damage_flat: number;
    damage_scaling_attribute_id: string | null;
    damage_scaling_factor: number;
    critical_multiplier: number;
    critical_threshold: number;
    armor_penetration: number;
    range_short_m: number;
    range_medium_m: number;
    range_long_m: number;
    range_penalty_medium: number;
    range_penalty_long: number;
    fire_modes: string | null;
    rate_of_fire: number;
    burst_size: number;
    auto_damage_bonus: number;
    ammo_type: string | null;
    magazine_size: number;
    reload_time_actions: number;
    chambered_round: number;
    equip_slot: string | null;
    icon_asset: string | null;
}

export interface ConsumableRow extends ItemRow {
    consumable_type: string;
    consumption_method: string;
    consumption_time_seconds: number;
    immediate_effects: string | null;
    over_time_effects: string | null;
    effect_duration_seconds: number;
    stacks_with_self: number;
    max_stacks: number;
    addiction_type_id: string | null;
    addiction_risk: number;
    addiction_severity_increase: number;
    overdose_threshold: number;
    overdose_effects: string | null;
    overdose_time_window_hours: number;
    detectable_in_blood: number;
    detection_window_hours: number;
    is_illegal: number;
    illegality_varies_by_location: number;
    icon_asset: string | null;
}

export interface CatalogFilters {
    type?: string;
    rarity?: string;
    maxTier?: number;
    search?: string;
}
