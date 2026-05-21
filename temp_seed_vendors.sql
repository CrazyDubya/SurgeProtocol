BEGIN TRANSACTION;

            INSERT INTO vendor_inventories (
                id, vendor_npc_id, location_id, vendor_type, 
                base_inventory, rotating_inventory, 
                created_at, updated_at
            ) VALUES (
                'null',
                '7e6e8605-f3fa-4371-9c64-030091dfe2aa',
                'null',
                'GENERAL',
                '[{"item_id":"rations","price":5,"stock":50},{"item_id":"water","price":2,"stock":50}]',
                '[]',
                datetime('now'), datetime('now')
            );
        

            UPDATE npc_definitions 
            SET vendor_inventory_id = 'null'
            WHERE id = '7e6e8605-f3fa-4371-9c64-030091dfe2aa';
        
COMMIT;