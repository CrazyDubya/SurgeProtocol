
import { useEffect, useState } from 'preact/hooks';
import { craftingService, type Recipe } from '../api/craftingService';
import { itemService, type InventoryItem } from '../api/itemService';

export function Crafting() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [rRes, iRes] = await Promise.all([
                craftingService.getRecipes(),
                itemService.getInventory()
            ]);
            setRecipes(rRes.recipes);
            setInventory(iRes.items);
        } finally {
            setLoading(false);
        }
    }

    async function handleCraft(recipe: Recipe) {
        // ultra-simplified component selection: just pick first match
        // In real app, user selects components
        // const componentsToUse: string[] = [];

        // Check coverage
        // for (const req of recipe.components) {
        // logic to find inventory item matching req.category
        // placeholder
        // }

        // Since we can't easily auto-select without complex logic, we'll just alert for now
        console.log('Attempting to craft:', recipe.name);
        alert('Component selection UI not implemented in this MVP step.');
        // To actually test crafting, we'd need to mock or implement the selection modal
    }

    if (loading) return <div>Loading Fabrication...</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Fabricator</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h2 className="text-xl">Recipes</h2>
                    {recipes.map(r => (
                        <div key={r.id} className="border p-4 rounded bg-gray-800 hover:bg-gray-700 cursor-pointer" onClick={() => handleCraft(r)}>
                            <h3 className="font-bold text-lg text-blue-400">{r.name}</h3>
                            <p className="text-sm">{r.description}</p>
                            <div className="mt-2 text-xs text-gray-400">
                                Requires: Tier {r.requirements.tier} | Skill {r.requirements.skillLevel}
                            </div>
                        </div>
                    ))}
                </div>

                <div>
                    <h2 className="text-xl mb-4">Available Components</h2>
                    <div className="flex flex-wrap gap-2">
                        {inventory.filter(i => i.item_type === 'COMPONENT').map(i => (
                            <span key={i.inventoryId} className="bg-gray-700 px-2 py-1 rounded text-sm">
                                {i.name} (x{i.quantity})
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
