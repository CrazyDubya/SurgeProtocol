SELECT c.id, c.handle, cf.primary_currency_balance 
FROM characters c 
LEFT JOIN character_finances cf ON c.id = cf.character_id
WHERE c.handle = 'test_handle';
