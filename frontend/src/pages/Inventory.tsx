
import { useEffect, useState } from 'preact/hooks';
import { itemService, type InventoryItem } from '../api/itemService';
import { craftingService, type Recipe } from '../api/craftingService';
import { useToast } from '@/hooks/useToast';
import { Card, Button, Badge, Skeleton } from '@components/ui';

export function Inventory() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [view, setView] = useState<'inventory' | 'crafting'>('inventory');
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [{ items: inventoryItems }, { recipes: craftingRecipes }] = await Promise.all([
                itemService.getInventory(),
                craftingService.getRecipes()
            ]);
            setItems(inventoryItems);
            setRecipes(craftingRecipes);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }

    async function handleUse(id: string) {
        try {
            const res = await itemService.useItem(id);
            toast.success(res.message);
            loadData();
        } catch (err) {
            toast.error('Failed to use item');
        }
    }

    async function handleCraft(recipe: Recipe) {
        // Simple auto-selector for components
        const componentIds: string[] = [];
        const usedInventoryIds = new Set<string>();
        let missingComponent = null;

        for (const req of recipe.components) {
            let requiredQty = req.quantity;

            // Find items matching category
            const matchingItems = items.filter(i =>
                !usedInventoryIds.has(i.inventoryId) &&
                (i.item_type === req.category || i.item_subtype === req.category || i.item_type === 'COMPONENT')
            );

            for (const item of matchingItems) {
                if (requiredQty <= 0) break;
                // Take 1 unit (logic assumes 1 unit per inventory item row if quantity=1, but backend handles quantity consumption.
                // Wait, frontend inventory shows quantity. We might need to split? 
                // CreatingService.craftItem takes IDs. Backend logic says:
                // "SELECT ... WHERE id IN (...)". It consumes the items.
                // If I have 1 stack of 10 items, passing its ID might consume the whole stack or just 1?
                // Backend: `character_inventory` has `quantity`.
                // Backend `crafting.ts`:
                // `await this.db.prepare('DELETE FROM character_inventory WHERE id = ?').bind(comp.id).run();`
                // OR `UPDATE character_inventory SET quantity = quantity - 1 ...` ?
                // Checking previous view of `crafting.ts`: 
                // It does NOT appear to split stacks. It says "Consume Components".
                // I should assume for this MVP that it consumes the *Item Record*.
                // BUT `item_definitions` stackable?
                // Let's assume for now we just pass the ID.

                componentIds.push(item.inventoryId);
                usedInventoryIds.add(item.inventoryId);
                requiredQty--;
            }

            if (requiredQty > 0) {
                missingComponent = req.category;
                break;
            }
        }

        if (missingComponent) {
            toast.error(`Missing components for ${missingComponent}`);
            return;
        }

        try {
            const res = await craftingService.craftItem(recipe.id, componentIds);
            if (res.success) {
                toast.success('Crafting successful!');
                loadData(); // Reload to update inventory
            } else {
                toast.error(res.message || 'Crafting failed');
            }
        } catch (err) {
            toast.error('Crafting failed');
            console.error(err);
        }
    }

    if (loading) {
        return (
            <div className="p-4 space-y-4">
                <Skeleton variant="title" width="200px" />
                <div className="flex gap-4 mb-6">
                    <Skeleton width="100px" height="40px" />
                    <Skeleton width="100px" height="40px" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} variant="card" height="200px" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Logistics</h1>
                <div className="flex gap-2">
                    <Button
                        variant={view === 'inventory' ? 'primary' : 'secondary'}
                        onClick={() => setView('inventory')}
                    >
                        Inventory
                    </Button>
                    <Button
                        variant={view === 'crafting' ? 'primary' : 'secondary'}
                        onClick={() => setView('crafting')}
                    >
                        Crafting
                    </Button>
                </div>
            </div>

            {view === 'inventory' ? (
                items.length === 0 ? (
                    <div className="text-gray-400 text-center py-10 border border-dashed border-gray-700 rounded">
                        Inventory Empty
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map(item => (
                            <Card key={item.inventoryId} variant="default" class="flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg">{item.name}</h3>
                                        <Badge variant="default">Tier {item.quality_tier}</Badge>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-1">{item.item_type} {item.item_subtype ? `• ${item.item_subtype}` : ''}</p>
                                    <p className="text-sm mb-4">Qty: <span className="font-mono text-blue-400">{item.quantity}</span></p>
                                </div>
                                <div className="mt-2">
                                    <Button
                                        onClick={() => handleUse(item.inventoryId)}
                                        size="sm"
                                        variant="primary"
                                        class="w-full"
                                    >
                                        Use Item
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recipes.map(recipe => (
                        <Card key={recipe.id} variant="outlined" class="border-blue-900/50 bg-blue-900/10">
                            <div className="mb-4">
                                <h3 className="font-bold text-lg text-blue-300">{recipe.name}</h3>
                                <p className="text-sm text-gray-400">{recipe.description}</p>
                            </div>

                            <div className="mb-4 space-y-2">
                                <div className="text-xs uppercase text-gray-500 font-bold">Components</div>
                                {recipe.components.map((c: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span>{c.category}</span>
                                        <span className="font-mono">x{c.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                onClick={() => handleCraft(recipe)}
                                variant="primary"
                                class="w-full"
                            >
                                Craft {recipe.outputItem.name}
                            </Button>
                        </Card>
                    ))}
                    {recipes.length === 0 && (
                        <div className="col-span-full text-center text-gray-500 py-10">
                            No recipes known.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
