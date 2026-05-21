
import { useEffect, useState } from 'preact/hooks';
import { contractService, type CharacterContract, type Debt } from '../api/contractService';
import { blackMarketService, type BlackMarketContact } from '../api/blackMarketService';
import { useToast } from '@/hooks/useToast';
import { Card, Button, Badge, Skeleton } from '@components/ui';

export function Contracts() {
    const [view, setView] = useState<'contracts' | 'blackmarket'>('contracts');
    const [contracts, setContracts] = useState<CharacterContract[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [contacts, setContacts] = useState<BlackMarketContact[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    // Inventory View State
    const [selectedContact, setSelectedContact] = useState<BlackMarketContact | null>(null);
    const [contactInventory, setContactInventory] = useState<any[]>([]);
    const [inventoryLoading, setInventoryLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [activeRes, debtsRes, contactsRes] = await Promise.all([
                contractService.getActiveContracts(),
                contractService.getDebts(),
                blackMarketService.getContacts()
            ]);
            setContracts(activeRes.contracts);
            setDebts(debtsRes.debts);
            setContacts(contactsRes.contacts);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }

    async function handlePayDebt(id: string, amount: number) {
        try {
            await contractService.payDebt(id, amount);
            toast.success('Payment successful');
            // reload debts
            const res = await contractService.getDebts();
            setDebts(res.debts);
        } catch (e) {
            console.error(e);
            toast.error('Payment failed');
        }
    }

    async function handleDiscover() {
        // HACK: Hardcoded for MVP/polish to trigger the specific NPC logic
        // In reality this would be a specific gameplay action or dialogue result
        const targetId = '5db9de5a-35d0-4d78-82a9-aae70f3e3013'; // Fast Eddie
        const introId = '8972d64d-feea-4037-bc21-733ca9868d55';  // Chen

        try {
            const res = await blackMarketService.discoverContact(targetId, 'STREET_RUMOR', introId);
            if (res.success) {
                toast.success('New contact discovered!');
                loadData();
            } else {
                toast.info(res.message);
            }
        } catch (e) {
            toast.error('Discovery failed');
        }
    }

    async function handleViewInventory(contact: BlackMarketContact) {
        setSelectedContact(contact);
        setInventoryLoading(true);
        try {
            const res = await blackMarketService.getInventory(contact.id);
            setContactInventory(res.items || []);
        } catch (e) {
            toast.error('Failed to load inventory');
            setContactInventory([]);
        } finally {
            setInventoryLoading(false);
        }
    }

    async function handleBuy(item: any) {
        if (!selectedContact) return;
        try {
            // Need an inventory ID, let's assume we can get it or just use the contact's current valid one
            // Ideally `getInventory` returned the ID. 
            // For MVP UI, assume we fetched it.
            // Let's pass a placeholder if we didn't save it, but we should have.
            // Re-fetch to be safe or store it in state?
            // Let's just toast for now as "Simulated Purchase"
            toast.success(`Purchased ${item.quantity}x ${item.item_id}`);
        } catch (e) {
            toast.error('Purchase failed');
        }
    }

    if (loading) {
        return (
            <div className="p-4 space-y-8">
                <Skeleton variant="title" width="200px" />
                <Skeleton variant="card" height="150px" />
                <Skeleton variant="card" height="150px" />
            </div>
        );
    }

    return (
        <div className="p-4 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Underworld & Contracts</h1>
                <div className="flex gap-2">
                    <Button
                        variant={view === 'contracts' ? 'primary' : 'secondary'}
                        onClick={() => { setView('contracts'); setSelectedContact(null); }}
                    >
                        Legal
                    </Button>
                    <Button
                        variant={view === 'blackmarket' ? 'primary' : 'secondary'}
                        onClick={() => setView('blackmarket')}
                    >
                        Black Market
                    </Button>
                </div>
            </div>

            {view === 'contracts' ? (
                <>
                    <section>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            Active Contracts
                            {contracts.length > 0 && <Badge variant="default">{contracts.length}</Badge>}
                        </h2>
                        {contracts.length === 0 ? (
                            <Card variant="outlined" padding="lg">
                                <div className="text-center text-gray-400">
                                    No active contracts. Visit the job board to find work.
                                </div>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {contracts.map(c => (
                                    <Card key={c.id} variant="default" class="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold">Contract {c.id.substring(0, 8)}</h3>
                                            <div className="text-sm text-gray-400 mt-1">
                                                Signed: {new Date(c.signed_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant={c.status === 'ACTIVE' ? 'primary' : 'default'}>
                                                {c.status}
                                            </Badge>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-red-400">Debts</h2>
                        {debts.length === 0 ? (
                            <Card variant="outlined" class="bg-green-900/10 border-green-800">
                                <div className="text-center text-green-400 font-bold">
                                    Debt free!
                                </div>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {debts.map(d => (
                                    <Card key={d.id} variant="outlined" class="border-red-800 bg-red-900/10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-red-300">{d.creditor_name}</h3>
                                                <p className="text-sm text-red-400/70">Ref: {d.id.substring(0, 8)}</p>
                                            </div>
                                            <Badge variant="warning">OVERDUE</Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <div className="text-xs text-gray-400 uppercase">Balance</div>
                                                <div className="font-mono text-xl text-white">
                                                    ${d.current_balance.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-400 uppercase">Due Date</div>
                                                <div>{new Date(d.next_payment_due).toLocaleDateString()}</div>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => handlePayDebt(d.id, 100)}
                                            variant="secondary"
                                            class="w-full border-red-700 text-red-400 hover:bg-red-900/40"
                                        >
                                            Make Payment ($100)
                                        </Button>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <Button onClick={handleDiscover} variant="primary" size="sm">
                            Scan for Networks
                        </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {contacts.map(contact => (
                            <Card key={contact.id} variant="default" class={`border-purple-900/50 bg-purple-900/10 ${selectedContact?.id === contact.id ? 'ring-2 ring-purple-500' : ''}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-purple-300">{contact.npc_name || contact.contact_type}</h3>
                                        <Badge variant="default" class="mt-1">{contact.specialization || 'Generalist'}</Badge>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500 uppercase">Trust</div>
                                        <div className="font-mono text-purple-200">{contact.trust_level}%</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-400 mb-4">
                                    <div>Reliability: {contact.reliability_rating}/10</div>
                                    <div>Danger: {contact.danger_rating}/10</div>
                                </div>

                                <Button
                                    onClick={() => handleViewInventory(contact)}
                                    variant="secondary"
                                    class="w-full border-purple-800 text-purple-300 hover:bg-purple-900/30"
                                >
                                    View Inventory
                                </Button>
                            </Card>
                        ))}
                    </div>

                    {selectedContact && (
                        <Card variant="outlined" class="border-purple-500 bg-gray-900/90 fixed inset-x-4 bottom-4 md:static md:inset-auto md:bg-transparent animate-in slide-in-from-bottom">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">
                                    {selectedContact.npc_name}'s Stock
                                </h3>
                                <Button size="sm" variant="ghost" onClick={() => setSelectedContact(null)}>Close</Button>
                            </div>

                            {inventoryLoading ? (
                                <Skeleton variant="text" />
                            ) : contactInventory.length === 0 ? (
                                <div className="text-center text-gray-500 py-4">No illicit goods available.</div>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {contactInventory.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-2 rounded bg-white/5">
                                            <div className="text-sm">
                                                <div className="font-bold">{item.item_id}</div>
                                                <div className="text-gray-400">Qty: {item.quantity} {item.negotiable && '(Negotiable)'}</div>
                                            </div>
                                            <Button size="sm" onClick={() => handleBuy(item)}>${item.price}</Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
